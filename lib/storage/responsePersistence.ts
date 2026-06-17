import { db } from './sqlite';
import { getStoredJSON } from './mmkv';

/**
 * Tự động ĐIỀN dữ liệu server vào ĐÚNG BẢNG trong SQLite cục bộ.
 *
 * Mỗi response THÀNH CÔNG đi qua apiCall() đều được route theo URL tới (các) bảng tương
 * ứng và ghi bằng UPSERT (INSERT OR REPLACE):
 *   → nếu đã có bản ghi cùng id thì XOÁ CŨ, ÁP DỤNG MỚI.
 * Nhờ vậy DB luôn là "một nguồn sự thật" cập nhật theo server và app dùng được offline.
 *
 * Mục tiêu: VỚI MỌI API ĐƯỢC GỌI, toàn bộ data thực thể trong response được lưu NGAY
 * vào DB. Bảng phủ sóng (đối chiếu 68 API server):
 *   Products      ← get_list_products, get_products(+variants/+comments), get_user_listings,
 *                   add_product, update/{id}, search(product)
 *   Users         ← users/get_user_info, set_user_info, auth/me, login, signup,
 *                   change_info_after_signup, get_list_followed|following|blocks, search(user)
 *   Comments      ← get_comments_product, get_products(comments lồng)
 *   Orders+Items  ← order/get_list_purchases, get_purchase, create_order, edit_purchase
 *   Conversations ← conversation/get_list_conversation
 *   Messages      ← conversation/get_conversation, send_message
 *   Wallets+Users ← wallets/get_current_balance
 *   Transactions  ← wallets/get_balance_history
 *   News          ← News/list_news, News/{id}
 *
 * Các endpoint KHÔNG có bảng cục bộ tương ứng (categories, brands, rates, notifications,
 * ship_from/order_address, push_settings, saved_search) đã được lưu nguyên văn ở bảng
 * ServerResponseCache (xem serverResponseCache.ts) nên dữ liệu vẫn không mất.
 *
 * Nguyên tắc an toàn:
 *   - KHÔNG bao giờ ném lỗi ra ngoài (sẽ phá luồng gọi API) — mọi lỗi đều nuốt + log dev.
 *   - Phòng thủ FOREIGN KEY: đảm bảo hàng cha (Users/Products/Conversations) tồn tại trước.
 *   - Giữ lại trạng thái cục bộ chưa đồng bộ (is_liked/like_count/virtual_balance) khi
 *     server không trả về trường đó — tránh xoá nhầm dữ liệu đang chờ đồng bộ.
 */

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const nowISO = (): string => new Date().toISOString();

/** Lấy mảng thực thể từ payload: mảng thẳng, hoặc bọc trong items/list/data, hoặc 1 object. */
function asArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.list)) return payload.list;
    if (Array.isArray(payload.data)) return payload.data;
    return [payload];
  }
  return [];
}

/** Chuẩn hoá giá trị boolean-ish của server (true/1/'1') → 1/0; undefined → null (giữ nguyên cũ). */
function boolOrNull(v: any): number | null {
  if (v === undefined || v === null) return null;
  return v === true || v === 1 || v === '1' ? 1 : 0;
}

function numOrNull(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Mốc thời gian dạng epoch (ms) — chấp nhận số, chuỗi số, hoặc ISO; mặc định hiện tại. */
function toEpoch(v: any): number {
  if (v === undefined || v === null) return Date.now();
  if (typeof v === 'number') return v;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? Date.now() : t;
}

/** Lấy id người dùng đang đăng nhập (từ Zustand persist 'auth-storage' trong MMKV). */
function currentUserId(): string | null {
  try {
    const persisted = getStoredJSON<{ state?: { user?: { id?: string | number } } }>('auth-storage');
    const id = persisted?.state?.user?.id;
    return id !== undefined && id !== null ? String(id) : null;
  } catch {
    return null;
  }
}

// ─── FK guards ──────────────────────────────────────────────────────────────

/** Đảm bảo có hàng Users(id) tối thiểu để FK của Comments/Orders/Messages/… luôn resolve. */
function ensureUserRow(userId: string): void {
  if (!userId) return;
  db.runSync(
    `INSERT OR IGNORE INTO Users (id, username, full_name, fullname, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [String(userId), String(userId), 'Chiến sĩ', 'Chiến sĩ', 'soldier', nowISO()],
  );
}

/** Đảm bảo có hàng Products(id) tối thiểu để FK của Comments/Likes/OrderItems luôn resolve. */
function ensureProductRow(productId: string): void {
  if (!productId) return;
  db.runSync(
    `INSERT OR IGNORE INTO Products (id, title, created_at) VALUES (?, ?, ?)`,
    [String(productId), 'Sản phẩm', nowISO()],
  );
}

/** Đảm bảo có hàng Conversations(id) để FK của Messages/UserConversations luôn resolve. */
function ensureConversationRow(conversationId: string): void {
  if (!conversationId) return;
  db.runSync(
    `INSERT OR IGNORE INTO Conversations (id, time_last_update) VALUES (?, ?)`,
    [String(conversationId), Date.now()],
  );
}

// ─── Upserts (INSERT OR REPLACE = xoá cũ, áp dụng mới) ────────────────────────

/**
 * Ghi 1 sản phẩm. Dùng INSERT OR REPLACE nhưng GIỮ trạng thái cục bộ (is_liked, like_count)
 * khi server không trả các trường đó — tránh xoá nhầm lượt thích đang chờ đồng bộ.
 */
function upsertProduct(p: any): void {
  if (!p || p.id === undefined || p.id === null) return;
  const id = String(p.id);

  // Đọc trạng thái cục bộ TRƯỚC khi ghi đè: nếu server không trả like_count/is_liked
  // thì giữ nguyên giá trị cũ (tránh xoá nhầm lượt thích đang chờ đồng bộ).
  const existing = db.getFirstSync<{ is_liked: number; like_count: number }>(
    'SELECT is_liked, like_count FROM Products WHERE id = ?',
    [id],
  );
  const serverLike = numOrNull(p.like_count ?? p.like);
  const serverIsLiked = boolOrNull(p.is_liked);
  const likeCount = serverLike ?? existing?.like_count ?? 0;
  const isLiked = serverIsLiked ?? existing?.is_liked ?? 0;

  db.runSync(
    `INSERT OR REPLACE INTO Products
      (id, seller_id, category_id, brand_id, title, description, price, price_new,
       images, video, stock, is_stock, sold_count, rating,
       like_count, comment, is_liked, image_urls, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      p.seller_id != null ? String(p.seller_id) : '1',
      p.category_id != null ? String(p.category_id) : '1',
      p.brand_id != null ? String(p.brand_id) : 'b1',
      p.title || p.name || 'Không có tên',
      p.description || '',
      Number(p.price) || 0,
      Number(p.price_new) || 0,
      p.images || p.image || null,
      p.video || null,
      p.stock !== undefined ? p.stock : (p.is_stock ? 100 : 0),
      p.is_stock ? 1 : 0,
      p.sold_count || 0,
      p.rating || 5.0,
      likeCount,
      p.comment || p.comment_count || 0,
      isLiked,
      p.image_urls || null,
      p.created_at || nowISO(),
    ],
  );
}

/** Ghi 1 biến thể sản phẩm (size/màu/tồn kho). */
function upsertProductVariant(productId: string, v: any): void {
  if (!v || v.id === undefined || v.id === null) return;
  ensureProductRow(productId);
  db.runSync(
    `INSERT OR REPLACE INTO ProductVariants (id, product_id, size, color, stock)
     VALUES (?, ?, ?, ?, ?)`,
    [String(v.id), String(productId), v.size ?? null, v.color ?? null, numOrNull(v.stock) ?? 0],
  );
}

/**
 * Ghi 1 người dùng/hồ sơ. Email rỗng → null để tránh đụng UNIQUE.
 * GIỮ virtual_balance cục bộ khi server không trả (tránh xoá nhầm số dư đã đồng bộ riêng).
 */
function upsertUser(u: any): void {
  if (!u || u.id === undefined || u.id === null) return;
  const id = String(u.id);
  const email = u.email && String(u.email).trim() ? String(u.email) : null;

  const existing = db.getFirstSync<{ virtual_balance: number }>(
    'SELECT virtual_balance FROM Users WHERE id = ?',
    [id],
  );
  const serverBalance = numOrNull(u.virtual_balance ?? u.balance);
  const balance = serverBalance ?? existing?.virtual_balance ?? 0;

  db.runSync(
    `INSERT OR REPLACE INTO Users
      (id, username, full_name, fullname, avatar, rank, unit, virtual_balance,
       is_seller, phone, phonenumber, email, bio, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      u.username ?? u.name ?? null,
      u.full_name ?? u.fullname ?? u.name ?? null,
      u.fullname ?? u.full_name ?? null,
      u.avatar ?? null,
      u.rank ?? null,
      u.unit ?? null,
      balance,
      u.is_seller ? 1 : 0,
      u.phone ?? u.phonenumber ?? null,
      u.phonenumber ?? u.phone ?? null,
      email,
      u.bio ?? u.status ?? null,
      u.role ?? null,
      u.created_at ?? nowISO(),
    ],
  );
}

/**
 * Cập nhật tên/avatar của 1 user mà KHÔNG ghi đè các trường khác (dùng cho participant
 * hội thoại — chỉ có id/username/avatar, tránh clobber hồ sơ đầy đủ đã lưu trước đó).
 */
function touchUserProfile(u: any): void {
  const uid = u?.id != null ? String(u.id) : null;
  if (!uid) return;
  ensureUserRow(uid);
  const username = u.username ?? u.name ?? null;
  const fullName = u.full_name ?? u.fullname ?? u.name ?? null;
  const avatar = u.avatar ?? null;
  if (username || fullName || avatar) {
    db.runSync(
      `UPDATE Users SET
         username = COALESCE(?, username),
         full_name = COALESCE(?, full_name),
         fullname = COALESCE(?, fullname),
         avatar = COALESCE(?, avatar)
       WHERE id = ?`,
      [username, fullName, fullName, avatar, uid],
    );
  }
}

function upsertComment(c: any): void {
  if (!c || c.id === undefined || c.id === null) return;
  const productId = String(c.product_id ?? c.target_id ?? '');
  if (productId) ensureProductRow(productId);
  db.runSync(
    `INSERT OR REPLACE INTO Comments
      (id, target_id, product_id, user_id, user_name, content, sync_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(c.id),
      productId || null,
      productId || null,
      String(c.user_id ?? c.poster?.id ?? '0'),
      c.poster?.name ?? c.username ?? c.user_name ?? 'Đồng chí ẩn danh',
      c.content ?? '',
      'synced',
      c.created_at ?? nowISO(),
    ],
  );
}

/** Ghi 1 hoá đơn + các mặt hàng (OrderItems) của nó. */
function upsertOrder(o: any): void {
  if (!o || o.id === undefined || o.id === null) return;
  const id = String(o.id);
  const buyerId = o.buyer_id != null ? String(o.buyer_id) : null;
  const sellerId = o.seller_id != null ? String(o.seller_id) : null;
  if (buyerId) ensureUserRow(buyerId);
  if (sellerId) ensureUserRow(sellerId);

  const status = String(o.status ?? o.state ?? 'synced');

  // INSERT OR REPLACE xoá hàng Orders cũ → cascade xoá OrderItems cũ; ta ghi lại items ngay sau.
  db.runSync(
    `INSERT OR REPLACE INTO Orders
      (id, buyer_id, buyer_coordinates_x, buyer_coordinates_y, buyer_coordinates_description,
       seller_id, seller_coordinates_x, seller_coordinates_y, seller_coordinates_description,
       status, total_price, shipping_fee, sync_status, created_at, product_id, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      buyerId,
      numOrNull(o.buyer_coordinates_x) ?? 0,
      numOrNull(o.buyer_coordinates_y) ?? 0,
      o.buyer_coordinates_description ?? null,
      sellerId,
      numOrNull(o.seller_coordinates_x) ?? 0,
      numOrNull(o.seller_coordinates_y) ?? 0,
      o.seller_coordinates_description ?? null,
      status,
      numOrNull(o.total_price ?? o.total) ?? 0,
      numOrNull(o.shipping_fee ?? o.ship_fee) ?? 0,
      'synced',
      o.created_at ?? nowISO(),
      o.product_id != null ? String(o.product_id) : null,
      numOrNull(o.quantity),
    ],
  );

  const items = Array.isArray(o.items) ? o.items : [];
  items.forEach((it: any) => upsertOrderItem(id, it));
}

function upsertOrderItem(orderId: string, it: any): void {
  if (!it) return;
  const productId = it.product_id != null ? String(it.product_id) : null;
  if (productId) ensureProductRow(productId);
  const price = numOrNull(it.price) ?? 0;
  const quantity = numOrNull(it.quantity) ?? 1;
  const itemId = it.id != null
    ? String(it.id)
    : `oi_${orderId}_${productId ?? Math.random().toString(36).slice(2)}`;
  db.runSync(
    `INSERT OR REPLACE INTO OrderItems
      (id, order_id, product_id, variant_id, price, total_price, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      orderId,
      productId,
      it.variant_id != null ? String(it.variant_id) : null,
      price,
      numOrNull(it.total_price) ?? price * quantity,
      quantity,
    ],
  );
}

/** Ghi 1 cuộc hội thoại + thành viên + tin nhắn cuối/lồng (nếu server trả kèm). */
function upsertConversation(c: any): void {
  if (!c || c.id === undefined || c.id === null) return;
  const id = String(c.id);
  db.runSync(
    `INSERT OR REPLACE INTO Conversations (id, time_last_update) VALUES (?, ?)`,
    [id, toEpoch(c.time_last_update ?? c.updated_at)],
  );

  const participants = Array.isArray(c.participants) ? c.participants : [];
  participants.forEach((p: any) => {
    const uid = p?.id != null ? String(p.id) : null;
    if (!uid) return;
    touchUserProfile(p);
    db.runSync(
      'INSERT OR IGNORE INTO UserConversations (user_id, conversation_id) VALUES (?, ?)',
      [uid, id],
    );
  });

  if (c.last_message) upsertMessage(c.last_message, id);
  const msgs = Array.isArray(c.messages) ? c.messages : [];
  msgs.forEach((m: any) => upsertMessage(m, id));
}

function upsertMessage(m: any, fallbackConversationId?: string): void {
  if (!m || m.id === undefined || m.id === null) return;
  const conversationId = String(m.conversation_id ?? fallbackConversationId ?? '');
  if (conversationId) ensureConversationRow(conversationId);
  const senderId = m.sender_id != null
    ? String(m.sender_id)
    : (m.from_id != null ? String(m.from_id) : null);
  if (senderId) ensureUserRow(senderId);

  const createdAt = toEpoch(m.created_at);
  db.runSync(
    `INSERT OR REPLACE INTO Messages
      (id, conversation_id, sender_id, content, image_url, video_url, sync_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(m.id),
      conversationId || null,
      senderId,
      m.content ?? m.message ?? '',
      m.image_url ?? null,
      m.video_url ?? null,
      'synced',
      createdAt,
    ],
  );
  if (conversationId) {
    db.runSync(
      'UPDATE Conversations SET time_last_update = ? WHERE id = ? AND (time_last_update IS NULL OR time_last_update < ?)',
      [createdAt, conversationId, createdAt],
    );
  }
}

/** Ghi 1 giao dịch ví; wallet_id resolve qua user_id (null nếu chưa có ví). */
function upsertTransaction(t: any, walletUserId: string | null): void {
  if (!t || t.id === undefined || t.id === null) return;
  db.runSync(
    `INSERT OR REPLACE INTO Transactions
      (id, wallet_id, type, amount, status, description, order_id, created_at)
     VALUES (?, (SELECT id FROM Wallets WHERE user_id = ?), ?, ?, ?, ?, ?, ?)`,
    [
      String(t.id),
      walletUserId,
      t.type ?? null,
      numOrNull(t.amount) ?? 0,
      t.status ?? 'completed',
      t.description ?? null,
      t.order_id ?? t.reference_id ?? null,
      t.created_at ?? nowISO(),
    ],
  );
}

/** Cập nhật số dư ví hiện tại vào Wallets + Users.virtual_balance cho user đang đăng nhập. */
function updateCurrentBalance(payload: any): void {
  const uid = currentUserId();
  if (!uid) return;
  const balance = numOrNull(
    payload && typeof payload === 'object' ? (payload.balance ?? payload.virtual_balance) : payload,
  );
  if (balance === null) return;
  ensureUserRow(uid);
  db.runSync('INSERT OR IGNORE INTO Wallets (user_id, balance) VALUES (?, ?)', [uid, balance]);
  db.runSync('UPDATE Wallets SET balance = ? WHERE user_id = ?', [balance, uid]);
  db.runSync('UPDATE Users SET virtual_balance = ? WHERE id = ?', [balance, uid]);
}

function upsertNews(n: any): void {
  if (!n || n.id === undefined || n.id === null) return;
  db.runSync(
    `INSERT OR REPLACE INTO News (id, title, created_at) VALUES (?, ?, ?)`,
    [String(n.id), n.title ?? n.name ?? '', n.created_at ?? Date.now()],
  );
}

// ─── Router: URL → bảng ───────────────────────────────────────────────────────

const PRODUCT_LIST_URLS = ['/api/get_list_products', '/api/get_user_listings'];
const PRODUCT_MUTATION_URLS = ['/api/add_product', '/api/update/'];
const USER_URLS = [
  '/users/get_user_info',
  '/users/set_user_info',
  '/auth/me',
  '/auth/login',
  '/auth/signup',
  '/auth/change_info_after_signup',
];
const USER_LIST_URLS = ['/get_list_followed', '/get_list_following', '/get_list_blocks'];
const ORDER_URLS = [
  '/order/get_list_purchases',
  '/order/get_purchase',
  '/order/create_order',
  '/order/edit_purchase',
];

function includesAny(url: string, markers: string[]): boolean {
  return markers.some((m) => url.includes(m));
}

/**
 * Điểm vào chính: gọi sau mỗi response THÀNH CÔNG (trong apiCall).
 * @param body Toàn bộ body server trả ({ code, message, data }).
 */
export function persistServerResponse(method: ApiMethod, url: string, body: unknown): void {
  try {
    if (!body || typeof body !== 'object') return;
    const payload = (body as any).data;
    if (payload === undefined || payload === null) return;

    // ── Products ──────────────────────────────────────────────────────────────
    // Chi tiết 1 sản phẩm: lưu cả biến thể (variants) và bình luận (comments) lồng trong.
    if (url.includes('/api/get_products')) {
      db.withTransactionSync(() => {
        asArray(payload).forEach((p: any) => {
          upsertProduct(p);
          if (p?.id == null) return;
          const pid = String(p.id);
          (Array.isArray(p.variants) ? p.variants : []).forEach((v: any) => upsertProductVariant(pid, v));
          (Array.isArray(p.comments) ? p.comments : []).forEach((c: any) =>
            upsertComment({ ...c, product_id: c.product_id ?? pid }),
          );
        });
      });
      return;
    }

    if (includesAny(url, PRODUCT_LIST_URLS) || includesAny(url, PRODUCT_MUTATION_URLS)) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertProduct));
      return;
    }

    if (url.includes('/api/search')) {
      // search trả hỗn hợp { type: 'product' | 'user', item }.
      db.withTransactionSync(() => {
        asArray(payload).forEach((row: any) => {
          const item = row?.item ?? row;
          if (row?.type === 'user' || item?.username || item?.phonenumber) upsertUser(item);
          else upsertProduct(item);
        });
      });
      return;
    }

    if (url.includes('/api/get_comments_product')) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertComment));
      return;
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    if (includesAny(url, ORDER_URLS)) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertOrder));
      return;
    }

    // ── Conversations / Messages ────────────────────────────────────────────────
    if (url.includes('/conversation/get_list_conversation')) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertConversation));
      return;
    }

    if (url.includes('/conversation/get_conversation')) {
      db.withTransactionSync(() => {
        // Có thể là 1 conversation (kèm messages/participants) hoặc danh sách message.
        if (
          payload && !Array.isArray(payload) &&
          (payload.participants || payload.last_message || payload.messages)
        ) {
          upsertConversation(payload);
        } else {
          const convId =
            payload && !Array.isArray(payload) && payload.conversation_id != null
              ? String(payload.conversation_id)
              : undefined;
          asArray(payload).forEach((m: any) => upsertMessage(m, convId));
        }
      });
      return;
    }

    if (url.includes('/conversation/send_message')) {
      db.withTransactionSync(() => asArray(payload).forEach((m: any) => upsertMessage(m)));
      return;
    }

    // ── Wallet ──────────────────────────────────────────────────────────────────
    if (url.includes('/wallets/get_balance_history')) {
      const uid = currentUserId();
      db.withTransactionSync(() => asArray(payload).forEach((t: any) => upsertTransaction(t, uid)));
      return;
    }

    if (url.includes('/wallets/get_current_balance')) {
      updateCurrentBalance(payload);
      return;
    }

    // ── Users ────────────────────────────────────────────────────────────────────
    if (includesAny(url, USER_URLS)) {
      // login/signup bọc user trong { tokens, user }.
      const candidate = (payload as any).user ?? payload;
      db.withTransactionSync(() => asArray(candidate).forEach(upsertUser));
      return;
    }

    if (includesAny(url, USER_LIST_URLS)) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertUser));
      return;
    }

    // ── News ─────────────────────────────────────────────────────────────────────
    if (url.includes('/News/list_news') || /\/News\/[^/]+$/.test(url)) {
      db.withTransactionSync(() => asArray(payload).forEach(upsertNews));
      return;
    }
  } catch (e) {
    if (__DEV__) console.warn(`[Persist] Bỏ qua lỗi ghi DB cho ${method} ${url}:`, e);
  }
}
