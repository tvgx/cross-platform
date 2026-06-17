import { DeviceEventEmitter } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { clearFileCache } from '../lib/storage/fileSystem';
import { SyncQueueRepository } from '../lib/repositories/SyncQueueRepository';
import { PostRepository } from '../lib/repositories/PostRepository';
import { OrderRepository } from '../lib/repositories/OrderRepository';
import { MessageRepository } from '../lib/repositories/MessageRepository';
import { apiCall } from '../lib/api/client';
import { useNetworkStore } from '../store/network';
import { db } from '../lib/storage/sqlite';


let activeOnlineInterval: any = null;
let isInitialized = false;
let isSyncing = false;

export const SyncService = {
  /**
   * Quét và xử lý hàng đợi đồng bộ dã chiến.
   */
  async runSyncProcess() {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const state = await NetInfo.fetch();
      const isOnline = useNetworkStore.getState().isOnline;

      if (!state.isConnected) {
        console.log('[Sync] Thiết bị Offline - Tạm hoãn đồng bộ lên server. (Cập nhật Local)');
      }
      
      if (!isOnline) {
        console.log('[Sync] Máy chủ không phản hồi (Offline Mode) - Tự động hoàn tất tác vụ cục bộ.');
      }

      // 1. Lấy danh sách task từ SyncQueueRepository
      const tasks = SyncQueueRepository.getPendingTasks(10);
      
      if (tasks.length === 0) return;

      console.log(`[Sync] Bắt đầu đồng bộ ${tasks.length} tác vụ...`);

      for (const task of tasks) {
        let success = false;
        
        try {
          const payloadParsed = task.payload ? JSON.parse(task.payload) : null;

          if (task.action === 'ORDER_UPLOAD') {
            success = await this.uploadOrder(task.target_id, payloadParsed);
          } else if (task.action === 'MEDIA_UPLOAD') {
            success = await this.uploadMedia(task.target_id);
          } else if (task.action === 'APPEAL_SUBMIT') {
            success = await this.submitAppeal(task.target_id, payloadParsed);
          } else if (task.action === 'MESSAGE_SEND' || task.action === 'SEND_MESSAGE') {
            success = await this.sendMessage(task.target_id, payloadParsed);
          } else if (task.action === 'LIKE_PRODUCT') {
            success = await this.syncLikeProduct(task.target_id, payloadParsed);
          } else if (task.action === 'COMMENT_POST') {
            success = await this.syncComment(task.target_id, payloadParsed);
          }

          if (success) {
            // Xóa khỏi hàng đợi nếu thành công
            SyncQueueRepository.deleteTask(task.id);
            console.log(`[Sync] Tác vụ ${task.id} hoàn tất.`);
          } else {
            // Tăng count retry
            SyncQueueRepository.incrementRetry(task.id);
          }
        } catch (err) {
          console.error(`[Sync] Lỗi khi xử lý task ${task.id}:`, err);
        }
      }
    } catch (error) {
      console.error('[Sync] Lỗi hệ thống đồng bộ:', error);
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Upload đơn hàng lên server Cloudflare (Ánh xạ chuẩn DTO)
   */
  async uploadOrder(orderId: string, payload: any) {
    console.log(`[Sync] Đang đồng bộ đơn hàng ${orderId} lên máy chủ dã chiến Cloudflare...`);
    if (!payload || !payload.items) {
      console.warn('[Sync] Payload đơn hàng trống hoặc sai định dạng. Bỏ qua.');
      return true; // Bỏ qua task lỗi
    }

    try {
      const isOnline = useNetworkStore.getState().isOnline;

      if (!isOnline) {
        // Chưa thực sự online: giữ task trong hàng đợi để gửi lại khi có mạng thật.
        return false;
      }

      const addressId = parseInt(payload.address_id);
      if (isNaN(addressId)) throw new Error(`Invalid address_id: ${payload.address_id}`);

      // 1. Ánh xạ chuẩn CreateOrderDto
      const apiPayload = {
        items: payload.items.map((item: any) => {
          const pid = parseInt(item.product_id);
          if (isNaN(pid)) throw new Error(`Invalid product_id: ${item.product_id}`);
          return { product_id: pid, quantity: item.quantity };
        }),
        order_source: "mobile",
        address_id: addressId
      };

      console.log(`[Sync] Gửi CreateOrderDto:`, JSON.stringify(apiPayload));

      // 2. Gọi API tạo đơn hàng thực tế
      await apiCall('POST', '/order/create_order', apiPayload);

      console.log(`[Sync] Đồng bộ đơn hàng ${orderId} lên server thành công.`);
      
      // 3. Đánh dấu đơn hàng là confirmation/synced trong SQLite
      OrderRepository.markOrderSynced(orderId);
      return true;
    } catch (err: any) {
      console.error(`[Sync] Lỗi khi gửi đơn hàng ${orderId} lên server:`, err);

      // Phân tích mã lỗi từ API Server
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi không xác định';

      if (status && status >= 400 && status < 500) {
        // Lỗi nghiệp vụ (Status 4xx: Hết hàng, Sai thông tin, Không đủ điều kiện...)
        // Tiến hành HOÀN TIỀN (Rollback) cục bộ để chiến sĩ không bị mất điểm oan uổng!
        console.log(`[Sync] Phát hiện lỗi nghiệp vụ ${status} từ Server. Tiến hành rollback ví dã chiến...`);
        OrderRepository.rollbackOrderLocal(orderId, errorMsg);
        
        // Trả về true để loại bỏ task lỗi ra khỏi hàng đợi SyncQueue (tránh retry vô hạn)
        return true; 
      }

      // Lỗi mạng hoặc server sập (5xx / Timeout) -> Trả về false để hàng đợi tiếp tục thử lại sau khi có mạng tốt
      return false;
    }
  },

  /**
   * Upload Media (Video/Ảnh chiến tích)
   */
  async uploadMedia(postId: string) {
    const post = PostRepository.getPostDetail(postId);
    if (!post) return false;

    console.log(`[Sync] Đang tải lên Media cho bài đăng: ${post.title}`);

    try {
      const isOnline = useNetworkStore.getState().isOnline;
      if (!isOnline) {
        // Giữ task trong hàng đợi cho tới khi online thật.
        return false;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: post.media_url,
        type: post.media_url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
        name: post.media_url.split('/').pop() || 'media_file'
      } as any);
      formData.append('post_id', postId);

      // Upload Multipart Form Data thực tế (endpoint server: /upload/file)
      await apiCall('POST', '/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 1. Cập nhật trạng thái thông qua PostRepository
      PostRepository.markPostSynced(postId);
      
      // 2. Xóa Cache cục bộ để giải phóng bộ nhớ (theo yêu cầu guide)
      await clearFileCache(post.media_url);

      return true;
    } catch (err) {
      console.error(`[Sync] Lỗi upload media cho post ${postId}:`, err);
      return false;
    }
  },

  /**
   * Đồng bộ đơn khiếu nại (Appeals)
   */
  async submitAppeal(appealId: string, payload: any) {
    console.log(`[Sync] Đang đồng bộ khiếu nại chiến tích ${appealId} lên máy chủ...`);

    const isOnline = useNetworkStore.getState().isOnline;
    if (!isOnline) return false; // giữ task để gửi lại khi online thật

    try {
      await apiCall('POST', '/rewards/create_reward_appeal', {
        reward_id: payload?.reward_id ?? appealId,
        reason: payload?.reason ?? payload?.description ?? '',
      });
      PostRepository.markAppealSynced(appealId);
      return true;
    } catch (err) {
      console.error(`[Sync] Lỗi đồng bộ khiếu nại ${appealId}:`, err);
      return false;
    }
  },

  /**
   * Đồng bộ tin nhắn (Messages) lên server dã chiến
   */
  async sendMessage(messageId: string, payload: any) {
    console.log(`[Sync] Đang gửi tin nhắn dã chiến ${messageId} lên máy chủ dã chiến Cloudflare...`);
    if (!payload) return true;

    try {
      const isOnline = useNetworkStore.getState().isOnline;
      if (!isOnline) return false; // giữ task để gửi lại khi online thật

      // Ánh xạ SendMessageDto — chấp nhận tin nhắn theo conversation_id hoặc to_id/partner_id,
      // product_id là tùy chọn (tin nhắn text thuần không cần product_id).
      const apiPayload: any = {
        message: payload.message || payload.content || '',
        type_message: payload.type_message || payload.type || 'text',
      };
      if (payload.conversation_id) apiPayload.conversation_id = payload.conversation_id;
      const toId = parseInt(payload.to_id);
      if (!isNaN(toId)) apiPayload.to_id = toId;
      const partnerId = parseInt(payload.partner_id);
      if (!isNaN(partnerId)) apiPayload.partner_id = partnerId;
      const productId = parseInt(payload.product_id);
      if (!isNaN(productId)) apiPayload.product_id = productId;

      // Gửi tin nhắn thực tế qua API
      await apiCall('POST', '/conversation/send_message', apiPayload);

      // Đánh dấu tin nhắn đã đồng bộ trong SQLite
      MessageRepository.markMessageSynced(messageId);
      return true;
    } catch (err) {
      console.error(`[Sync] Lỗi đồng bộ gửi tin nhắn ${messageId}:`, err);
      // Giữ lại task trong SyncQueue nếu là lỗi mạng để gửi lại sau
      return false;
    }
  },

  /**
   * Đồng bộ lượt thích sản phẩm lên máy chủ
   */
  async syncLikeProduct(productId: string, payload: any) {
    console.log(`[Sync] Đang đồng bộ lượt thích sản phẩm ${productId} lên máy chủ...`);
    if (!payload) return true;

    try {
      const isOnline = useNetworkStore.getState().isOnline;
      if (!isOnline) {
        return true;
      }

      const res = await apiCall<any>('POST', '/api/like_product', {
        product_id: parseInt(productId, 10),
      });

      if (res && res.success && res.data) {
        const isLiked = !!res.data.is_liked;
        const likeCount = Number(res.data.like_count || 0);

        db.runSync(
          'UPDATE Products SET is_liked = ?, like_count = ? WHERE id = ?',
          [isLiked ? 1 : 0, likeCount, productId]
        );

        if (isLiked) {
          const likeId = `like_${payload.user_id}_${productId}`;
          db.runSync(
            "INSERT OR REPLACE INTO Likes (id, product_id, user_id, sync_status) VALUES (?, ?, ?, 'synced')",
            [likeId, productId, payload.user_id]
          );
        } else {
          db.runSync(
            'DELETE FROM Likes WHERE product_id = ? AND user_id = ?',
            [productId, payload.user_id]
          );
        }
      }
      return true;
    } catch (err) {
      console.error(`[Sync] Lỗi đồng bộ lượt thích cho sản phẩm ${productId}:`, err);
      return false;
    }
  },

  /**
   * Đồng bộ bình luận lên máy chủ
   */
  async syncComment(commentId: string, payload: any) {
    console.log(`[Sync] Đang đồng bộ bình luận ${commentId} lên máy chủ...`);
    if (!payload) return true;

    try {
      const isOnline = useNetworkStore.getState().isOnline;
      if (!isOnline) {
        return true;
      }

      const res = await apiCall<any>('POST', '/api/set_comments_product', {
        product_id: parseInt(payload.product_id, 10),
        content: payload.content,
        index: 0,
        count: 20
      });

      if (res && res.success) {
        const serverComment = res.data || {};
        const newId = String(serverComment.id || commentId);

        if (newId !== commentId) {
          db.runSync(
            "UPDATE Comments SET id = ?, sync_status = 'synced' WHERE id = ?",
            [newId, commentId]
          );
        } else {
          db.runSync(
            "UPDATE Comments SET sync_status = 'synced' WHERE id = ?",
            [commentId]
          );
        }
        console.log(`[Sync] Đồng bộ bình luận thành công. ID cũ: ${commentId}, ID mới: ${newId}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Sync] Lỗi đồng bộ bình luận ${commentId}:`, err);
      return false;
    }
  },

  init() {
    if (isInitialized) return;
    isInitialized = true;

    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('[Sync] Kênh truyền trực tuyến tốc độ cao hoạt động.');
        
        // Kích hoạt đồng bộ tức thì
        this.runSyncProcess().then(() => {
          DeviceEventEmitter.emit('sync_completed');
        });
        
        // Khởi tạo interval đồng bộ liên tục khi online (mỗi 15 giây)
        if (!activeOnlineInterval) {
          activeOnlineInterval = setInterval(() => {
            this.runSyncProcess();
          }, 15000);
        }
      } else {
        console.log('[Sync] Mất kết nối. Chuyển sang chế độ tác chiến ngoại tuyến ngầm.');
        
        // Xóa interval khi offline để bảo toàn pin
        if (activeOnlineInterval) {
          clearInterval(activeOnlineInterval);
          activeOnlineInterval = null;
        }
      }
    });
  }
};

