import NetInfo from '@react-native-community/netinfo';
import { db } from '../storage/sqlite';
import { ordersApi } from '../api/endpoints/orders';
import { useAuthStore } from '../../store/auth';
import type { Order, OrderItem } from '../../types';

export const OrderRepository = {
  /**
   * Tạo đơn hàng mới theo phương án Offline-First.
   * 1. Kiểm tra số dư ví ảo trong SQLite cục bộ trước.
   * 2. Thực hiện trừ số dư ví và lưu đơn hàng vào các bảng SQLite: Orders và OrderItems thông qua Transaction.
   * 3. Tạo một task đồng bộ ORDER_UPLOAD trong SyncQueue để đồng bộ ngầm lên server.
   * 4. Trả về kết quả giao dịch cục bộ thành công ngay lập tức để đem lại trải nghiệm 0ms trễ cho chiến sĩ.
   */
  async placeOrder(params: {
    items: { product_id: string; title: string; price: number; quantity: number; image?: string }[];
    addressId: string;
    note?: string;
  }): Promise<{ success: boolean; message?: string; orderId?: string }> {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { success: false, message: 'Đồng chí chưa đăng nhập hệ thống.' };
    }

    const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
    const totalAmount = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      // 1. Kiểm tra số dư ví cục bộ
      const wallet = db.getFirstSync<{ balance: number }>(
        'SELECT balance FROM Wallets WHERE user_id = ?',
        [user.id]
      );

      if (!wallet || wallet.balance < totalAmount) {
        return { 
          success: false, 
          message: `Số dư điểm chiến tích không đủ (Hiện có: ${wallet?.balance || 0} ₫, Cần thanh toán: ${totalAmount} ₫)` 
        };
      }

      // 2. Chạy Transaction ghi cơ sở dữ liệu đồng thời bảo đảm tính toàn vẹn dữ liệu ví
      db.withTransactionSync(() => {
        // A. Tạo Hóa đơn cục bộ
        db.runSync(
          `INSERT INTO Orders (
            id, buyer_id, total_price, status, sync_status, created_at, 
            buyer_coordinates_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            user.id,
            totalAmount,
            'pending_sync', // Trạng thái đồng bộ cục bộ
            'pending_sync',
            new Date().toISOString(),
            `Địa chỉ nhận: ${params.addressId}`
          ]
        );

        // B. Tạo chi tiết các mặt hàng của đơn hàng
        params.items.forEach(item => {
          const itemId = 'itm_' + Math.random().toString(36).substr(2, 9);
          db.runSync(
            `INSERT INTO OrderItems (id, order_id, product_id, price, quantity) 
             VALUES (?, ?, ?, ?, ?)`,
            [itemId, orderId, item.product_id, item.price, item.quantity]
          );
        });

        // C. Trừ ví cục bộ (Wallets và Users) để đồng bộ trải nghiệm tiền tệ tức thì
        db.runSync(
          'UPDATE Wallets SET balance = balance - ? WHERE user_id = ?',
          [totalAmount, user.id]
        );
        db.runSync(
          'UPDATE Users SET virtual_balance = virtual_balance - ? WHERE id = ?',
          [totalAmount, user.id]
        );

        // D. Tạo hàng chờ đồng bộ SyncQueue để đẩy lên server khi online
        const queueId = 'q_' + Math.random().toString(36).substr(2, 9);
        const syncPayload = JSON.stringify({
          items: params.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
          address_id: params.addressId,
          note: params.note || ''
        });

        db.runSync(
          `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            queueId,
            'ORDER_UPLOAD',
            orderId,
            syncPayload,
            1, // Độ ưu tiên cao cho đơn hàng quân nhu
            0,
            new Date().toISOString()
          ]
        );
      });

      // Cập nhật số dư trong store Auth của Client để giao diện cập nhật ngay lập tức
      useAuthStore.getState().updateUser({
        virtual_balance: user.virtual_balance - totalAmount
      });

      console.log(`[OrderRepo] Đơn hàng offline ${orderId} đã được tạo cục bộ thành công & xếp hàng chờ sync.`);

      // Kích hoạt đồng bộ ngầm ngay nếu có kết nối mạng lập tức
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        // Gọi runSyncProcess của SyncService ngầm
        const { SyncService } = require('../../services/SyncService');
        SyncService.runSyncProcess().catch((err: any) => console.warn('[OrderRepo] Sync ngầm lỗi:', err));
      }

      return { success: true, orderId };
    } catch (e) {
      console.error('[OrderRepo] Lỗi đặt đơn hàng:', e);
      return { success: false, message: 'Đã xảy ra lỗi cục bộ trong quá trình giao dịch dã chiến.' };
    }
  },

  /**
   * Lấy danh sách hóa đơn lịch sử (Offline-First).
   * Lấy từ SQLite cục bộ lên trước để hiển thị nhanh, sau đó fetch API đồng bộ nếu online.
   */
  async getOrders(): Promise<Order[]> {
    try {
      const localOrders = this.getLocalOrders();
      const state = await NetInfo.fetch();

      if (state.isConnected) {
        ordersApi.getPurchases({ page: 1, limit: 20 }).then(res => {
          if (res.success && res.data) {
            this.syncOrdersWithServer(res.data.items);
          }
        }).catch(err => {
          console.warn('[OrderRepo] Lỗi fetch hóa đơn từ server:', err);
        });
      }

      return localOrders;
    } catch (e) {
      console.error('[OrderRepo] Lỗi trong getOrders:', e);
      return this.getLocalOrders();
    }
  },

  /**
   * Đọc danh sách hóa đơn kết hợp join OrderItems từ SQLite
   */
  getLocalOrders(): Order[] {
    const user = useAuthStore.getState().user;
    if (!user) return [];

    try {
      // 1. Lấy toàn bộ đơn hàng của user
      const orderRows = db.getAllSync<any>(
        'SELECT * FROM Orders WHERE buyer_id = ? ORDER BY created_at DESC',
        [user.id]
      );

      const orders: Order[] = [];

      for (const order of orderRows) {
        // 2. Lấy các item tương ứng của đơn hàng này
        const itemRows = db.getAllSync<any>(
          `SELECT oi.*, p.title, p.images 
           FROM OrderItems oi 
           LEFT JOIN Products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );

        const items: OrderItem[] = itemRows.map(row => {
          let imageUri = '';
          try {
            const parsedImages = row.images ? JSON.parse(row.images) : [];
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              imageUri = parsedImages[0];
            }
          } catch (e) {}

          return {
            product_id: row.product_id,
            title: row.title || 'Sản phẩm quân nhu',
            image: imageUri || undefined,
            price: row.price || 0,
            quantity: row.quantity || 1
          };
        });

        orders.push({
          id: order.id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id || '1',
          seller_name: 'Nhà cung cấp quân nhu',
          items,
          subtotal: order.total_price,
          ship_fee: order.shipping_fee || 0,
          total: order.total_price + (order.shipping_fee || 0),
          status: this.mapStatus(order.status),
          address: {
            id: 'addr_default',
            full_name: user.full_name,
            phone: user.phone || '0000000000',
            address: order.buyer_coordinates_description || 'Căn cứ dã chiến',
            is_default: true
          },
          created_at: order.created_at,
          updated_at: order.created_at
        });
      }

      return orders;
    } catch (e) {
      console.error('[OrderRepo] Lỗi đọc đơn hàng SQLite:', e);
      return [];
    }
  },

  /**
   * Đồng bộ hóa danh sách đơn hàng lấy từ Server vào SQLite cục bộ
   */
  syncOrdersWithServer(serverOrders: Order[]): void {
    try {
      db.withTransactionSync(() => {
        serverOrders.forEach(o => {
          db.runSync(
            `INSERT OR REPLACE INTO Orders (id, buyer_id, total_price, status, sync_status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [o.id, o.buyer_id, o.total, o.status, 'synced', o.created_at]
          );

          o.items.forEach(item => {
            const localItemId = `itm_${o.id}_${item.product_id}`;
            db.runSync(
              `INSERT OR REPLACE INTO OrderItems (id, order_id, product_id, price, quantity) 
               VALUES (?, ?, ?, ?, ?)`,
              [localItemId, o.id, item.product_id, item.price, item.quantity]
            );
          });
        });
      });
      console.log(`[OrderRepo] Đã đồng bộ ${serverOrders.length} đơn hàng từ server về SQLite local.`);
    } catch (e) {
      console.error('[OrderRepo] Lỗi lưu đơn hàng đồng bộ từ server:', e);
    }
  },

  /**
   * Ánh xạ trạng thái cục bộ SQLite sang kiểu trạng thái an toàn trong Client
   */
  mapStatus(sqliteStatus: string): Order['status'] {
    if (sqliteStatus === 'pending_sync') return 'pending';
    if (sqliteStatus === 'synced') return 'confirmed';
    return sqliteStatus as Order['status'];
  }
};
