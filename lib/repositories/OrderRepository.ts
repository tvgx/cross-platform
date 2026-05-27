import NetInfo from '@react-native-community/netinfo';
import { db } from '../storage/sqlite';
import { ordersApi } from '../api/endpoints/orders';
import { useAuthStore } from '../../store/auth';
import { useNetworkStore } from '../../store/network';
import type { Order, OrderItem } from '../../types';
import { encryptCoordinates } from '../utils/crypto';

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

      // 2. Thử gọi API tạo đơn hàng trước (Online-first)
      let apiSuccess = false;
      try {
        const apiPayload = {
          items: params.items.map(item => ({
            product_id: parseInt(item.product_id, 10),
            quantity: item.quantity
          })),
          source: "mobile",
          address_id: parseInt(params.addressId, 10) || 1
        };
        console.log(`[OrderRepo] Đang gọi API tạo đơn hàng...`);
        await ordersApi.createOrder(apiPayload);
        apiSuccess = true;
      } catch (err: any) {
        // Kiểm tra xem lỗi có phải lỗi nghiệp vụ không (Status 4xx)
        const status = err.response?.status;
        if (status && status >= 400 && status < 500) {
           return { success: false, message: err.response?.data?.message || 'Lỗi hệ thống từ Server.' };
        }
        console.log('[OrderRepo] Lỗi mạng hoặc backend Offline. Chuyển sang fallback cục bộ.', err);
      }

      // 3. Chạy Transaction ghi cơ sở dữ liệu đồng thời bảo đảm tính toàn vẹn dữ liệu ví
      db.withTransactionSync(() => {
        // A. Tạo Hóa đơn cục bộ
        const buyerGpsEnc = encryptCoordinates(20.8449, 106.6881); // Outpost Delta
        const orderStatus = apiSuccess ? 'synced' : 'pending_sync';
        db.runSync(
          `INSERT INTO Orders (
            id, buyer_id, total_price, status, sync_status, created_at, 
            buyer_coordinates_x, buyer_coordinates_y, buyer_coordinates_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            user.id,
            totalAmount,
            orderStatus,
            orderStatus,
            new Date().toISOString(),
            20.8449,
            106.6881,
            `Địa chỉ nhận: ${params.addressId} [GPS_ENC:${buyerGpsEnc}]`
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

        // D. Tạo hàng chờ đồng bộ SyncQueue nếu API thất bại (cơ chế dã chiến)
        if (!apiSuccess) {
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
        }
      });

      // Cập nhật số dư trong store Auth của Client để giao diện cập nhật ngay lập tức
      useAuthStore.getState().updateUser({
        virtual_balance: user.virtual_balance - totalAmount
      });

      console.log(`[OrderRepo] Đơn hàng ${orderId} đã tạo thành công (API: ${apiSuccess ? 'Thành công' : 'Offline Fallback'}).`);

      // Kích hoạt đồng bộ ngầm ngay nếu có kết nối mạng và backend sống
      if (!apiSuccess) {
        const netState = await NetInfo.fetch();
        const isBackendAlive = useNetworkStore.getState().isBackendAlive;
        if (netState.isConnected && isBackendAlive) {
          // Gọi runSyncProcess của SyncService ngầm
          const { SyncService } = require('../../services/SyncService');
          SyncService.runSyncProcess().catch((err: any) => console.warn('[OrderRepo] Sync ngầm lỗi:', err));
        }
      }

      return { success: true, orderId };
    } catch (e) {
      console.error('[OrderRepo] Lỗi đặt đơn hàng:', e);
      return { success: false, message: 'Đã xảy ra lỗi cục bộ trong quá trình giao dịch dã chiến.' };
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      // 1. Thử gọi API trước để lấy dữ liệu mới nhất (Online-first)
      try {
        const res = await ordersApi.getPurchases({ index: '0', count: '20' });
        if (res && res.success && res.data) {
          this.syncOrdersWithServer(res.data.items);
          console.log('[OrderRepo] Lấy hóa đơn từ server thành công.');
        }
      } catch (err) {
        console.log('[OrderRepo] Không thể lấy hóa đơn từ server (Offline/Error), fallback về SQLite.');
      }

      // 2. Trả về dữ liệu từ SQLite local sau khi đã cập nhật (hoặc nếu API lỗi thì trả về cache cũ)
      return this.getLocalOrders();
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
  },

  /**
   * Thực hiện thanh toán đơn hàng đầy đủ (Transaction dã chiến).
   * Khấu trừ số dư ví, cập nhật kho sản phẩm, ghi Orders, OrderItems, Transactions và SyncQueue.
   */
  async checkoutOrder(params: {
    userId: string;
    items: {
      product_id: string;
      title: string;
      price: number;
      quantity: number;
      image?: string;
      variant_id?: string;
      variant_title?: string;
      seller_id: string;
    }[];
    total: number;
    shipFee: number;
    sellerId: string;
  }): Promise<string> {
    const orderId = `ORD_${Date.now()}`;
    const now = new Date().toISOString();

    let apiSuccess = false;
    try {
      console.log(`[OrderRepo] Đang gọi API tạo đơn hàng (checkout)...`);
      const apiPayload = {
        items: params.items.map(item => ({
          product_id: parseInt(item.product_id, 10),
          quantity: item.quantity
        })),
        source: "mobile",
        address_id: 1 // hardcode default address for now
      };
      await ordersApi.createOrder(apiPayload);
      apiSuccess = true;
    } catch (err) {
      console.log('[OrderRepo] Lỗi mạng hoặc backend Offline. Chuyển sang fallback cục bộ.', err);
    }

    db.withTransactionSync(() => {
      // 1. Khấu trừ số dư tài khoản của chiến sĩ
      db.runSync(
        'UPDATE Users SET virtual_balance = virtual_balance - ? WHERE id = ?',
        [params.total, params.userId]
      );

      // Cập nhật số dư trong bảng ví tiền Wallets
      db.runSync(
        'UPDATE Wallets SET balance = balance - ? WHERE user_id = ?',
        [params.total, params.userId]
      );

      // 2. Ghi hóa đơn chính (Orders)
      const firstItem = params.items[0];
      const buyerGpsEnc = encryptCoordinates(20.8449, 106.6881);
      const sellerGpsEnc = encryptCoordinates(21.0285, 105.8542);
      db.runSync(
        `INSERT INTO Orders (
          id, buyer_id, buyer_coordinates_x, buyer_coordinates_y, buyer_coordinates_description,
          seller_id, seller_coordinates_x, seller_coordinates_y, seller_coordinates_description,
          status, total_price, shipping_fee, sync_status, created_at, product_id, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          orderId,
          params.userId,
          20.8449, // Outpost Delta Latitude
          106.6881, // Outpost Delta Longitude
          `Tiền đồn Hải Phòng - Outpost Delta-7 [GPS_ENC:${buyerGpsEnc}]`,
          params.sellerId,
          21.0285, // Depot Bravo Latitude
          105.8542, // Depot Bravo Longitude
          `Tổng kho quân khu Thủ đô - Base Bravo-1 [GPS_ENC:${sellerGpsEnc}]`,
          apiSuccess ? 'synced' : 'pending_sync',
          params.total,
          params.shipFee,
          apiSuccess ? 'synced' : 'pending_sync',
          now,
          firstItem.product_id,
          firstItem.quantity
        ]
      );

      // 3. Ghi chi tiết các mặt hàng vào bảng OrderItems & cập nhật kho
      for (const item of params.items) {
        const itemId = `OI_${orderId}_${item.product_id}_${item.variant_id || 'none'}`;
        db.runSync(
          'INSERT INTO OrderItems (id, order_id, product_id, variant_id, price, quantity) VALUES (?, ?, ?, ?, ?, ?);',
          [itemId, orderId, item.product_id, item.variant_id || '', item.price, item.quantity]
        );

        // Trừ kho cục bộ
        if (item.variant_id) {
          db.runSync(
            'UPDATE ProductVariants SET stock = MAX(0, stock - ?) WHERE id = ?;',
            [item.quantity, item.variant_id]
          );
        } else {
          db.runSync(
            'UPDATE Products SET stock = MAX(0, stock - ?) WHERE id = ?;',
            [item.quantity, item.product_id]
          );
        }
      }

      // 4. Tạo giao dịch tài chính ghi lại lịch sử thanh toán
      const txId = `TX_${Date.now()}`;
      db.runSync(
        'INSERT INTO Transactions (id, wallet_id, type, amount, status, description, order_id, created_at) VALUES (?, (SELECT id FROM Wallets WHERE user_id = ?), ?, ?, ?, ?, ?, ?);',
        [txId, params.userId, 'SPEND', params.total, 'completed', `Thanh toán đơn hàng quân nhu ${orderId}`, orderId, now]
      );

      // 5. Đẩy hàng chờ SyncQueue nếu API thất bại
      if (!apiSuccess) {
        const buyerGpsEncPayload = encryptCoordinates(20.8449, 106.6881);
        const sellerGpsEncPayload = encryptCoordinates(21.0285, 105.8542);
        const syncPayload = {
          id: orderId,
          buyer_id: params.userId,
          buyer_coordinates: { x: 20.8449, y: 106.6881, description: `Tiền đồn Hải Phòng - Outpost Delta-7 [GPS_ENC:${buyerGpsEncPayload}]` },
          seller_id: params.sellerId,
          seller_coordinates: { x: 21.0285, y: 105.8542, description: `Tổng kho quân khu Thủ đô - Base Bravo-1 [GPS_ENC:${sellerGpsEncPayload}]` },
          total_price: params.total,
          shipping_fee: params.shipFee,
          created_at: now,
          items: params.items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            variant_title: item.variant_title || null,
            price: item.price,
            quantity: item.quantity,
            title: item.title
          }))
        };

        db.runSync(
          'INSERT INTO SyncQueue (id, action, target_id, payload, created_at) VALUES (?, ?, ?, ?, ?);',
          [`SQ_${orderId}`, 'ORDER_UPLOAD', orderId, JSON.stringify(syncPayload), now]
        );
      }
    });

    return orderId;
  },

  /**
   * Hoàn tiền cục bộ (Rollback/Refund) khi đơn hàng gặp sự cố hết hàng/hủy đơn từ Server.
   */
  rollbackOrderLocal(orderId: string, reason: string): void {
    try {
      const order = db.getFirstSync<{ buyer_id: string; total_price: number }>(
        'SELECT buyer_id, total_price FROM Orders WHERE id = ?',
        [orderId]
      );
      if (order) {
        db.withTransactionSync(() => {
          // 1. Hoàn lại số dư ví cục bộ
          db.runSync(
            'UPDATE Wallets SET balance = balance + ? WHERE user_id = ?',
            [order.total_price, order.buyer_id]
          );
          db.runSync(
            'UPDATE Users SET virtual_balance = virtual_balance + ? WHERE id = ?',
            [order.total_price, order.buyer_id]
          );

          // 2. Cập nhật trạng thái đơn hàng cục bộ thành 'cancelled'
          db.runSync(
            "UPDATE Orders SET status = 'cancelled', sync_status = 'failed', buyer_coordinates_description = ? WHERE id = ?",
            [`Lỗi dã chiến: ${reason}`, orderId]
          );

          // 3. Hoàn lại số lượng tồn kho sản phẩm/biến thể dã chiến
          const items = db.getAllSync<{ product_id: string; quantity: number; variant_id: string }>(
            'SELECT product_id, quantity, variant_id FROM OrderItems WHERE order_id = ?',
            [orderId]
          );
          for (const item of items) {
            if (item.variant_id) {
              db.runSync(
                'UPDATE ProductVariants SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.variant_id]
              );
            } else {
              db.runSync(
                'UPDATE Products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
              );
            }
          }

          // 4. Tạo giao dịch tài chính EARN để ghi nhận hoàn tiền rõ ràng
          const txId = `TX_REF_${Date.now()}`;
          db.runSync(
            'INSERT INTO Transactions (id, wallet_id, type, amount, status, description, order_id, created_at) VALUES (?, (SELECT id FROM Wallets WHERE user_id = ?), ?, ?, ?, ?, ?, ?);',
            [txId, order.buyer_id, 'EARN', order.total_price, 'completed', `Hoàn tiền dã chiến cho đơn hàng ${orderId} (${reason})`, orderId, new Date().toISOString()]
          );
        });

        // 5. Cập nhật số dư trong Zustand Store UI dã chiến ngay lập tức
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === order.buyer_id) {
          useAuthStore.getState().updateUser({
            virtual_balance: currentUser.virtual_balance + order.total_price
          });
        }
        console.log(`[OrderRepo] Đã rollback hoàn tiền thành công đơn hàng ${orderId} cục bộ. Lý do: ${reason}`);
      }
    } catch (e) {
      console.error('[OrderRepo] Lỗi thực hiện rollback đơn hàng dã chiến:', e);
    }
  },

  /**
   * Đánh dấu đơn hàng đã được đồng bộ hóa thành công lên máy chủ dã chiến.
   */
  markOrderSynced(orderId: string): void {
    try {
      db.runSync(
        "UPDATE Orders SET status = 'synced', sync_status = 'synced' WHERE id = ?",
        [orderId]
      );
      console.log(`[OrderRepo] Đã đánh dấu đơn hàng ${orderId} đã đồng bộ thành công.`);
    } catch (e) {
      console.error('[OrderRepo] Lỗi cập nhật trạng thái đồng bộ đơn hàng:', e);
    }
  }
};
