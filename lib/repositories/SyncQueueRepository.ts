import { db } from '../storage/sqlite';

// Số lần thử lại tối đa cho một tác vụ đồng bộ trước khi ngừng (tránh retry vô hạn).
export const MAX_SYNC_RETRY = 5;

export const SyncQueueRepository = {
  /**
   * Lấy danh sách hàng đợi đồng bộ hóa dã chiến xếp theo thứ tự độ ưu tiên giảm dần.
   * Chỉ lấy các tác vụ chưa vượt quá ngưỡng retry để tránh quay vòng vô hạn.
   */
  getPendingTasks(limit = 10): any[] {
    try {
      return db.getAllSync<any>(
        'SELECT * FROM SyncQueue WHERE retry_count < ? ORDER BY priority DESC, created_at ASC LIMIT ?',
        [MAX_SYNC_RETRY, limit]
      );
    } catch (e) {
      console.error('[SyncQueueRepo] Lỗi lấy tác vụ hàng đợi:', e);
      return [];
    }
  },

  /**
   * Lấy các tác vụ đã vượt ngưỡng retry (để hiển thị/dọn dẹp ở tầng UI nếu cần).
   */
  getDeadTasks(): any[] {
    try {
      return db.getAllSync<any>(
        'SELECT * FROM SyncQueue WHERE retry_count >= ? ORDER BY created_at ASC',
        [MAX_SYNC_RETRY]
      );
    } catch (e) {
      console.error('[SyncQueueRepo] Lỗi lấy tác vụ quá hạn retry:', e);
      return [];
    }
  },

  /**
   * Xóa tác vụ khỏi hàng đợi sau khi đã đồng bộ thành công lên server.
   */
  deleteTask(taskId: string): void {
    try {
      db.runSync('DELETE FROM SyncQueue WHERE id = ?', [taskId]);
      console.log(`[SyncQueueRepo] Đã xóa tác vụ đồng bộ thành công ${taskId}`);
    } catch (e) {
      console.error('[SyncQueueRepo] Lỗi xóa tác vụ:', e);
    }
  },

  /**
   * Tăng số lần thử lại nếu gặp lỗi kết nối tạm thời hoặc quá tải server.
   */
  incrementRetry(taskId: string): void {
    try {
      db.runSync(
        'UPDATE SyncQueue SET retry_count = retry_count + 1 WHERE id = ?',
        [taskId]
      );
    } catch (e) {
      console.error('[SyncQueueRepo] Lỗi tăng số lần thử lại:', e);
    }
  },

  /**
   * Thêm một tác vụ đồng bộ mới vào hàng đợi (SyncQueue).
   */
  addSyncTask(task: {
    id: string;
    action: string;
    target_id: string;
    payload: string;
    priority?: number;
  }): void {
    try {
      db.runSync(
        `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at) 
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [
          task.id,
          task.action,
          task.target_id,
          task.payload,
          task.priority || 0,
          new Date().toISOString()
        ]
      );
    } catch (e) {
      console.error('[SyncQueueRepo] Lỗi thêm tác vụ vào hàng đợi:', e);
    }
  }
};
