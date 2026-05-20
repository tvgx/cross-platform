import { db } from '../storage/sqlite';

export const NewsRepository = {
  /**
   * Lấy danh sách tin tức quân dụng đã lưu.
   */
  getNews(): any[] {
    try {
      return db.getAllSync<any>('SELECT * FROM News ORDER BY created_at DESC');
    } catch (e) {
      console.error('[NewsRepo] Lỗi truy vấn tin tức:', e);
      return [];
    }
  },

  /**
   * Thêm tin tức quân sự mới.
   */
  addNewsItem(item: { id: string; title: string; created_at: number }): void {
    try {
      db.runSync(
        'INSERT OR REPLACE INTO News (id, title, created_at) VALUES (?, ?, ?)',
        [item.id, item.title, item.created_at]
      );
    } catch (e) {
      console.error('[NewsRepo] Lỗi lưu tin tức mới:', e);
    }
  }
};
