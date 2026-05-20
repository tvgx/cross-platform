import NetInfo from '@react-native-community/netinfo';
import { db } from '../lib/storage/sqlite';
import { clearFileCache } from '../lib/storage/fileSystem';
import axios from 'axios';

const MOCK_API_URL = 'https://api.army-plus.vn/v1';

export const SyncService = {
  /**
   * Quét và xử lý hàng đợi đồng bộ
   */
  async runSyncProcess() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log('[Sync] Thiết bị Offline - Tạm hoãn đồng bộ');
      return;
    }

    try {
      // 1. Lấy danh sách task từ SyncQueue
      const tasks = db.getAllSync<any>('SELECT * FROM SyncQueue ORDER BY priority DESC, created_at ASC LIMIT 10');
      
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
          } else if (task.action === 'SEND_MESSAGE') {
            success = await this.sendMessage(task.target_id, payloadParsed);
          }

          if (success) {
            // Xóa khỏi hàng đợi nếu thành công
            db.runSync('DELETE FROM SyncQueue WHERE id = ?', [task.id]);
            console.log(`[Sync] Tác vụ ${task.id} hoàn tất.`);
          } else {
            // Tăng count retry
            db.runSync('UPDATE SyncQueue SET retry_count = retry_count + 1 WHERE id = ?', [task.id]);
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
   * Upload đơn hàng (Quan hệ phức tạp)
   */
  async uploadOrder(orderId: string, payload: any) {
    console.log(`[Sync] Đang đồng bộ hóa đơn hàng quan hệ ${orderId} lên máy chủ dã chiến...`);
    // Giả lập API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cập nhật trạng thái trong bảng Orders
    db.runSync("UPDATE Orders SET status = 'synced', sync_status = 'synced' WHERE id = ?", [orderId]);
    return true;
  },

  /**
   * Upload Media (Video/Ảnh chiến tích)
   */
  async uploadMedia(postId: string) {
    const post = db.getFirstSync<any>('SELECT * FROM Posts WHERE id = ?', [postId]);
    if (!post) return false;

    console.log(`[Sync] Đang tải lên Media cho bài đăng: ${post.title}`);

    try {
      // Giả lập upload Multipart Form Data
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Cập nhật trạng thái Database
      db.runSync('UPDATE Posts SET sync_status = "synced" WHERE id = ?', [postId]);
      
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Cập nhật trạng thái Appeals cục bộ
    db.runSync("UPDATE Appeals SET sync_status = 'synced', status = 'resolved' WHERE id = ?", [appealId]);
    return true;
  },

  /**
   * Đồng bộ tin nhắn (Messages)
   */
  async sendMessage(messageId: string, payload: any) {
    console.log(`[Sync] Đang gửi tin nhắn dã chiến ${messageId} lên máy chủ dã chiến...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Cập nhật trạng thái tin nhắn cục bộ
    db.runSync("UPDATE Messages SET sync_status = 'synced' WHERE id = ?", [messageId]);
    return true;
  }
};

/**
 * Lắng nghe thay đổi mạng để kích hoạt đồng bộ
 */
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    SyncService.runSyncProcess();
  }
});
