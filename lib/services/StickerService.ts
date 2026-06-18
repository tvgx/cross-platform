import { db } from '../storage/sqlite';
import { useAppStore } from '../../store/app';

export const StickerService = {
  async fetchAndStoreStickersIfNeeded() {
    try {
      // Vì fetchAndStoreStickersIfNeeded có thể gọi từ ngoài React Tree nên dùng .getState()
      const hasFetched = useAppStore.getState().hasFetchedStickers;
      if (hasFetched) return;

      console.log('[StickerService] Lần đầu mở app, đang tải stickers/icons...');
      
      // Dùng API Github emojis làm mẫu api bên thứ 3
      const response = await fetch('https://api.github.com/emojis');
      if (!response.ok) throw new Error('Failed to fetch emojis');
      const data = await response.json();
      
      // Lấy 100 emoji phổ biến để lưu vào localdb (tránh quá tải)
      const stickerEntries = Object.entries(data).slice(0, 100);

      db.withTransactionSync(() => {
        for (const [name, url] of stickerEntries) {
          db.runSync(
            'INSERT OR REPLACE INTO Stickers (id, url, category) VALUES (?, ?, ?)',
            [name, url as string, 'emoji']
          );
        }
      });

      // Đánh dấu đã tải
      useAppStore.getState().setHasFetchedStickers(true);
      console.log('[StickerService] Tải và lưu stickers hoàn tất.');
    } catch (e) {
      console.error('[StickerService] Lỗi khi tải stickers:', e);
    }
  },

  getAllStickers() {
    try {
      return db.getAllSync<{ id: string; url: string; category: string }>('SELECT * FROM Stickers');
    } catch (e) {
      console.error('[StickerService] Lỗi khi lấy stickers:', e);
      return [];
    }
  }
};
