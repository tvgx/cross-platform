import { db } from '../storage/sqlite';
import { AppNotification } from '../../types';

export const NotificationRepository = {
  /** Lưu hoặc cập nhật một notification */
  saveNotification: (notification: AppNotification): void => {
    try {
      db.runSync(
        `INSERT INTO Notifications (id, type, title, body, data, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           is_read = excluded.is_read`,
        [
          notification.id,
          notification.type,
          notification.title,
          notification.body,
          notification.data ? JSON.stringify(notification.data) : null,
          notification.is_read ? 1 : 0,
          notification.created_at,
        ]
      );
    } catch (e) {
      console.warn('[NotificationRepo] saveNotification error', e);
    }
  },

  /** Đánh dấu notification đã đọc */
  markAsRead: (id: string): void => {
    try {
      db.runSync('UPDATE Notifications SET is_read = 1 WHERE id = ?', [id]);
    } catch (e) {
      console.warn('[NotificationRepo] markAsRead error', e);
    }
  },

  /** Đánh dấu tất cả đã đọc */
  markAllAsRead: (): void => {
    try {
      db.runSync('UPDATE Notifications SET is_read = 1');
    } catch (e) {
      console.warn('[NotificationRepo] markAllAsRead error', e);
    }
  },

  /** Lấy danh sách notifications, giới hạn top 50 mới nhất */
  getNotifications: (limit: number = 50): AppNotification[] => {
    try {
      const rows = db.getAllSync<any>(
        'SELECT * FROM Notifications ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data ? JSON.parse(row.data) : undefined,
        is_read: row.is_read === 1,
        created_at: row.created_at,
      }));
    } catch (e) {
      console.warn('[NotificationRepo] getNotifications error', e);
      return [];
    }
  },

  /** Lấy số lượng thông báo chưa đọc */
  getUnreadCount: (): number => {
    try {
      const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM Notifications WHERE is_read = 0');
      return row?.count || 0;
    } catch (e) {
      console.warn('[NotificationRepo] getUnreadCount error', e);
      return 0;
    }
  },
};
