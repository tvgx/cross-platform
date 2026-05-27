import NetInfo from '@react-native-community/netinfo';
import { clearFileCache } from '../lib/storage/fileSystem';
import { SyncQueueRepository } from '../lib/repositories/SyncQueueRepository';
import { PostRepository } from '../lib/repositories/PostRepository';
import { OrderRepository } from '../lib/repositories/OrderRepository';
import { MessageRepository } from '../lib/repositories/MessageRepository';
import { apiCall } from '../lib/api/client';
import { useNetworkStore } from '../store/network';

const MOCK_API_URL = 'https://api.army-plus.vn/v1';

let activeOnlineInterval: any = null;
let isInitialized = false;

export const SyncService = {
  /**
   * Quét và xử lý hàng đợi đồng bộ dã chiến.
   */
  async runSyncProcess() {
    const state = await NetInfo.fetch();
    const isBackendAlive = useNetworkStore.getState().isBackendAlive;

    if (!state.isConnected) {
      console.log('[Sync] Thiết bị Offline - Tạm hoãn đồng bộ lên server. (Cập nhật Local)');
    }
    
    if (!isBackendAlive) {
      console.log('[Sync] Máy chủ không phản hồi (Offline Mode) - Tự động hoàn tất tác vụ cục bộ.');
    }

    try {
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
      const isBackendAlive = useNetworkStore.getState().isBackendAlive;
      
      if (!isBackendAlive) {
        // Mô phỏng thành công ngay lập tức ở chế độ Local
        OrderRepository.markOrderSynced(orderId);
        return true;
      }

      // 1. Ánh xạ chuẩn CreateOrderDto
      const apiPayload = {
        items: payload.items.map((item: any) => ({
          product_id: isNaN(parseInt(item.product_id)) ? 1 : parseInt(item.product_id),
          quantity: item.quantity
        })),
        source: "mobile",
        address_id: isNaN(parseInt(payload.address_id)) ? 1 : parseInt(payload.address_id)
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
      const isBackendAlive = useNetworkStore.getState().isBackendAlive;
      if (!isBackendAlive) {
        PostRepository.markPostSynced(postId);
        return true;
      }

      // Giả lập upload Multipart Form Data
      await new Promise(resolve => setTimeout(resolve, 2000));

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
    
    const isBackendAlive = useNetworkStore.getState().isBackendAlive;
    if (isBackendAlive) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Cập nhật trạng thái Appeals thông qua PostRepository
    PostRepository.markAppealSynced(appealId);
    return true;
  },

  /**
   * Đồng bộ tin nhắn (Messages) lên server dã chiến
   */
  async sendMessage(messageId: string, payload: any) {
    console.log(`[Sync] Đang gửi tin nhắn dã chiến ${messageId} lên máy chủ dã chiến Cloudflare...`);
    if (!payload) return true;

    try {
      const isBackendAlive = useNetworkStore.getState().isBackendAlive;
      if (!isBackendAlive) {
        MessageRepository.markMessageSynced(messageId);
        return true;
      }

      // Ánh xạ chuẩn SendMessageDto
      const apiPayload = {
        to_id: isNaN(parseInt(payload.to_id)) ? 1 : parseInt(payload.to_id),
        message: payload.message || payload.content || '',
        type_message: payload.type_message || 'text',
        product_id: isNaN(parseInt(payload.product_id)) ? 1 : parseInt(payload.product_id)
      };

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

  init() {
    if (isInitialized) return;
    isInitialized = true;

    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('[Sync] Kênh truyền trực tuyến tốc độ cao hoạt động.');
        
        // Kích hoạt đồng bộ tức thì
        this.runSyncProcess();
        
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

