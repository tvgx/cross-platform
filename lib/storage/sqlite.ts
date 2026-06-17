import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from './databaseHelper';

// DÃ¹ng SQLite trÃªn mÃ´i trÆ°á»ng native Android/iOS
// Mở kết nối LAZY (chỉ mở ở lần truy cập đầu tiên), KHÔNG mở ở module load.
// Lý do: openDatabaseSync sẽ TẠO file rỗng nếu chưa có ở đường dẫn đích → nếu mở
// sớm thì bước copy seed (assets/databases) sẽ bị bỏ qua. Vì vậy app/_layout.tsx
// gọi DatabaseRepository.bootstrap() (ensureDatabaseReady copy seed) TRƯỚC khi có
// bất kỳ truy cập DB nào.
let _db: SQLite.SQLiteDatabase | null = null;
const _boundMethods = new Map<string | symbol, any>();

/** Lấy (mở nếu cần) kết nối CSDL native. */
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DATABASE_NAME);
    _boundMethods.clear();
  }
  return _db;
};

// `db` giữ nguyên API cũ (`db.runSync(...)`, `db.getAllSync(...)`) cho mọi repository,
// nhưng uỷ quyền tới kết nối mở lazy ở trên qua Proxy.
export const db: SQLite.SQLiteDatabase = new Proxy({} as SQLite.SQLiteDatabase, {
  get(_target, prop) {
    const instance = getDatabase();
    const value = (instance as any)[prop];
    if (typeof value !== 'function') return value;
    // Trong test, method là jest.fn → trả thẳng để giữ mock API + identity ổn định.
    if ((value as any)._isMockFunction) return value;
    // App thật: bind & cache để giữ đúng `this` (expo dùng this.nativeDatabase).
    if (!_boundMethods.has(prop)) _boundMethods.set(prop, value.bind(instance));
    return _boundMethods.get(prop);
  },
});

// Chặn dựng schema lặp lại: initDB() có thể được gọi cả khi nạp module lẫn từ
// DatabaseRepository.bootstrap(). CREATE TABLE IF NOT EXISTS vốn idempotent;
// guard này chỉ tránh chạy lại loạt lệnh không cần thiết.
let schemaInitialized = false;

/** Cho biết schema đã được dựng thành công hay chưa. */
export const isSchemaInitialized = (): boolean => schemaInitialized;

/** Đóng kết nối hiện tại để lần getDatabase() sau mở lại sạch (phục vụ reset). */
export const closeDatabase = (): void => {
  try {
    (_db as any)?.closeSync?.();
  } catch (e) {
    console.warn('[SQLite] Lỗi đóng kết nối CSDL:', e);
  }
  _db = null;
  _boundMethods.clear();
  schemaInitialized = false;
};

/**
 * Phiên bản schema cục bộ. TĂNG số này mỗi khi đổi cấu trúc bảng/cột để buộc
 * thiết bị migrate (drop & recreate) ở lần mở app kế tiếp — vá được lỗi lệch
 * schema kiểu "table X has no column named ...".
 */
export const SCHEMA_VERSION = 2;

/**
 * Schema cục bộ bám theo thiết kế server (docs/IT4788.sql) nhưng KHÔNG đổi tên
 * bảng/cột mà app đang dùng (đổi tên sẽ phá toàn bộ repository). Bảng kê tương ứng:
 *
 *   Server (IT4788.sql)   ↔  Local (bảng dưới đây)
 *   --------------------     ----------------------
 *   Battle_Proofs         ↔  Posts        (author_id ↔ user_id; +title, +media_url)
 *   Reward_Rules          ↔  RewardRules
 *   Product_Variants      ↔  ProductVariants
 *   Order_Items           ↔  OrderItems   (+total_price khớp server; app dùng price)
 *   User_Conversations    ↔  UserConversations
 *   User_Codes            ↔  User_Codes
 *   Products.image_urls   ↔  Products.image_urls (thêm để khớp; app hiện đọc cột images)
 *
 * Các cột CHỈ-CÓ-CỤC-BỘ phục vụ offline-first/UI (không có ở server):
 *   sync_status, price_new, images, video, stock, is_stock, sold_count, rating,
 *   like_count, comment, is_liked, virtual_balance, rank, unit, is_seller, phone, full_name.
 * Cố ý BỎ cột nhạy cảm `Users.password` (không lưu mật khẩu trên thiết bị).
 */

/** Drop sạch mọi bảng người dùng (giữ lại bảng nội bộ của SQLite). */
const dropAllTables = (): void => {
  try {
    db.execSync('PRAGMA foreign_keys = OFF;');
    const tables = db.getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'android_metadata'"
    );
    for (const t of tables) {
      db.execSync(`DROP TABLE IF EXISTS "${t.name}";`);
    }
    console.log(`[SQLite] Đã drop ${tables.length} bảng cũ để dựng lại schema mới.`);
  } catch (e) {
    console.warn('[SQLite] Lỗi drop bảng khi migrate:', e);
  } finally {
    db.execSync('PRAGMA foreign_keys = ON;');
  }
};

/**
 * Kiểm tra phiên bản schema trên thiết bị (PRAGMA user_version). Nếu cũ hơn
 * SCHEMA_VERSION → drop & recreate. Dữ liệu cục bộ là cache của server nên sẽ
 * được đồng bộ lại; SyncQueue đang chờ sẽ mất khi nâng cấp schema (chấp nhận được).
 */
const migrateSchemaIfNeeded = (): void => {
  try {
    const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    const deviceVersion = row?.user_version ?? 0;
    if (deviceVersion < SCHEMA_VERSION) {
      console.log(`[SQLite] Schema thiết bị v${deviceVersion} < v${SCHEMA_VERSION} → migrate (drop & recreate).`);
      dropAllTables();
    }
  } catch (e) {
    console.warn('[SQLite] Lỗi kiểm tra phiên bản schema:', e);
  }
};

export const initDB = () => {
  if (schemaInitialized) return;
  try {
    // Migrate TRƯỚC khi dựng bảng: vá lệch schema từ bản app cũ (vd thiếu price_new).
    migrateSchemaIfNeeded();
    // KÃ­ch hoáº¡t khÃ³a ngoáº¡i Ä‘á»ƒ báº£o toÃ n tÃ­nh toÃ n váº¹n quan há»‡ thá»±c thá»ƒ
    db.execSync('PRAGMA foreign_keys = ON;');

    // 1. Táº¡o báº£ng Users
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        fullname TEXT,      -- Khá»›p vá»›i server
        avatar TEXT,
        rank TEXT,
        unit TEXT,
        virtual_balance INTEGER DEFAULT 0,
        is_seller BOOLEAN DEFAULT 0,
        phone TEXT,
        phonenumber TEXT,  -- Khá»›p vá»›i server
        email TEXT UNIQUE,
        bio TEXT,
        role TEXT,         -- Khá»›p vá»›i server ('soldier', 'officer', 'vendor')
        created_at TEXT
      );
    `);

    // 2. Táº¡o báº£ng Wallets
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        balance REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 3. Táº¡o báº£ng Transactions
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Transactions (
        id TEXT PRIMARY KEY,
        wallet_id INTEGER,
        type TEXT,         -- 'EARN', 'SPEND'
        amount REAL,
        status TEXT,       -- 'completed', 'pending'
        description TEXT,
        order_id TEXT,
        created_at TEXT,
        FOREIGN KEY (wallet_id) REFERENCES Wallets (id) ON DELETE CASCADE
      );
    `);

    // 4. Táº¡o báº£ng RewardRules
    db.execSync(`
      CREATE TABLE IF NOT EXISTS RewardRules (
        id TEXT PRIMARY KEY,
        battle_type TEXT UNIQUE,
        reward_coin REAL
      );
    `);

    // 5. Táº¡o báº£ng Posts (Chiáº¿n tÃ­ch - TÆ°Æ¡ng thÃ­ch ngÆ°á»£c & Map vá»›i Battle_Proofs)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        media_url TEXT,    -- URI local dÃ£ chiáº¿n
        video_url TEXT,    -- Khá»›p vá»›i server
        image_url TEXT,    -- Khá»›p vá»›i server
        author_id TEXT,
        status TEXT,       -- 'pending', 'approved', 'rejected', 'appealing'
        sync_status TEXT DEFAULT 'pending_sync',
        ai_score INTEGER DEFAULT 0,
        reward_coin REAL DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (author_id) REFERENCES Users (id)
      );
    `);

    // 6. Táº¡o báº£ng Appeals (Khiáº¿u náº¡i dÃ£ chiáº¿n)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Appeals (
        id TEXT PRIMARY KEY,
        proof_id TEXT,
        user_id TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (proof_id) REFERENCES Posts (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 7. Táº¡o báº£ng Products (Sáº£n pháº©m quÃ¢n nhu/VÅ© khÃ­)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Products (
        id TEXT PRIMARY KEY,
        seller_id TEXT,
        category_id TEXT,
        brand_id TEXT,
        title TEXT,
        description TEXT,
        price INTEGER DEFAULT 0,
        price_new INTEGER DEFAULT 0,
        images TEXT,
        video TEXT,
        stock INTEGER DEFAULT 0,
        is_stock BOOLEAN DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment INTEGER DEFAULT 0,  -- ThÃªm má»›i
        is_liked BOOLEAN DEFAULT 0,
        image_urls TEXT,            -- Khớp server (IT4788 Products.image_urls); app hiện đọc cột images
        created_at TEXT
      );
    `);

    // 8. Táº¡o báº£ng ProductVariants (Biáº¿n thá»ƒ sáº£n pháº©m dÃ£ chiáº¿n)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS ProductVariants (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        size TEXT,
        color TEXT,
        stock INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE
      );
    `);

    // 9. Táº¡o báº£ng Likes (LÆ°á»£t thÃ­ch)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Likes (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        user_id TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 10. Táº¡o báº£ng Comments (BÃ¬nh luáº­n dÃ£ chiáº¿n)
    try {
      const fks = db.getAllSync<any>("PRAGMA foreign_key_list('Comments')");
      const hasUserFK = fks.some((fk: any) => fk.table === 'Users');
      if (hasUserFK) {
        console.log('[SQLite] PhÃ¡t hiá»‡n foreign key constraint cÅ© trÃªn Comments. Tiáº¿n hÃ nh recreate báº£ng...');
        db.execSync('DROP TABLE IF EXISTS Comments;');
      }
    } catch (e) {
      console.warn('[SQLite] Lá»—i kiá»ƒm tra/migration báº£ng Comments:', e);
    }

    db.execSync(`
      CREATE TABLE IF NOT EXISTS Comments (
        id TEXT PRIMARY KEY,
        target_id TEXT,    -- Ä á»ƒ tÆ°Æ¡ng thÃ­ch ngÆ°á»£c (product_id hoáº·c post_id)
        product_id TEXT,   -- Khá»›p vá»›i server
        user_id TEXT,
        user_name TEXT,
        content TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at TEXT,
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE
      );
    `);

    // 11. Táº¡o báº£ng Reports
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Reports (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        user_id TEXT,
        reason TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 12. Táº¡o báº£ng Orders (HÃ³a Ä‘Æ¡n tÃ­ch há»£p GPS)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Orders (
        id TEXT PRIMARY KEY,
        buyer_id TEXT,
        buyer_coordinates_x REAL DEFAULT 0.0,
        buyer_coordinates_y REAL DEFAULT 0.0,
        buyer_coordinates_description TEXT,
        seller_id TEXT,
        seller_coordinates_x REAL DEFAULT 0.0,
        seller_coordinates_y REAL DEFAULT 0.0,
        seller_coordinates_description TEXT,
        status TEXT,       -- 'pending_sync', 'synced', 'delivered', 'cancelled'
        total_price INTEGER DEFAULT 0,
        shipping_fee REAL DEFAULT 0.0,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at TEXT,
        product_id TEXT,   -- TÆ°Æ¡ng thÃ­ch ngÆ°á»£c cho Ä‘Æ¡n láº»
        quantity INTEGER,  -- TÆ°Æ¡ng thÃ­ch ngÆ°á»£c cho Ä‘Æ¡n láº»
        FOREIGN KEY (buyer_id) REFERENCES Users (id),
        FOREIGN KEY (seller_id) REFERENCES Users (id)
      );
    `);

    // 13. Táº¡o báº£ng OrderItems (Má»‘i quan há»‡ 1-N cho nhiá»u sáº£n pháº©m trong 1 hÃ³a Ä‘Æ¡n)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        product_id TEXT,
        variant_id TEXT,
        price REAL DEFAULT 0,
        total_price REAL DEFAULT 0,  -- Khớp server (IT4788 Order_Items.total_price)
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY (order_id) REFERENCES Orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products (id),
        FOREIGN KEY (variant_id) REFERENCES ProductVariants (id)
      );
    `);

    // 14. Táº¡o báº£ng Shipping
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Shipping (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        address_id TEXT,
        shipper_id TEXT,
        status TEXT,
        tracking_code TEXT,
        FOREIGN KEY (order_id) REFERENCES Orders (id) ON DELETE CASCADE
      );
    `);

    // 15. Táº¡o báº£ng Conversations
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Conversations (
        id TEXT PRIMARY KEY,
        time_last_update INTEGER
      );
    `);

    // 16. Táº¡o báº£ng UserConversations
    db.execSync(`
      CREATE TABLE IF NOT EXISTS UserConversations (
        user_id TEXT,
        conversation_id TEXT,
        PRIMARY KEY (user_id, conversation_id),
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES Conversations (id) ON DELETE CASCADE
      );
    `);

    // 17. Táº¡o báº£ng Messages
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        sender_id TEXT,
        content TEXT,
        image_url TEXT,
        video_url TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at INTEGER,
        FOREIGN KEY (conversation_id) REFERENCES Conversations (id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 18. Táº¡o báº£ng News
    db.execSync(`
      CREATE TABLE IF NOT EXISTS News (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER
      );
    `);

    // 18b. Bảng User_Codes (mã OTP) — khớp thiết kế server (IT4788.sql).
    db.execSync(`
      CREATE TABLE IF NOT EXISTS User_Codes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        code TEXT,
        expired_at TEXT,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 19. Táº¡o báº£ng SyncQueue (HÃ ng Ä‘á»£i offline)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS SyncQueue (
        id TEXT PRIMARY KEY,
        action TEXT,       -- 'ORDER_UPLOAD', 'MEDIA_UPLOAD', 'APPEAL_SUBMIT', etc.
        target_id TEXT,
        payload TEXT,      -- Dá»¯ liá»‡u JSON gá»­i Ä‘i
        priority INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);
    db.execSync(`
      CREATE TABLE IF NOT EXISTS ServerResponseCache (
        cache_key TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        params TEXT,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 20. Táº¡o báº£ng Notifications
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        body TEXT,
        data TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at TEXT
      );
    `);

    console.log('[SQLite] Khá»Ÿi táº¡o CSDL dÃ£ chiáº¿n thÃ nh cÃ´ng (khÃ´ng kÃ¨m dá»¯ liá»‡u giáº£).');
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    schemaInitialized = true;
  } catch (error) {
    console.error('Lá»—i khá»Ÿi táº¡o SQLite:', error);
  }
};

// KHÔNG auto-init ở module load nữa: DatabaseRepository.bootstrap() (gọi sớm trong
// app/_layout.tsx) chạy ensureDatabaseReady() (copy seed từ assets) TRƯỚC rồi mới
// initDB(), nhờ vậy file seed mới kịp được nạp trước khi mở kết nối.
