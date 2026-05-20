export const PostHelper = {
  /**
   * Xác minh tiêu đề chiến tích có hợp lệ hay không.
   */
  validatePostTitle(title: string): boolean {
    if (!title) return false;
    const trimmed = title.trim();
    return trimmed.length >= 5 && trimmed.length <= 100;
  },

  /**
   * Phân tích bản ghi SQLite thành đối tượng Post tương thích ngược.
   */
  parsePost(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title || '',
      description: row.description || '',
      media_url: row.media_url || '',
      video_url: row.video_url || '',
      image_url: row.image_url || '',
      author_id: row.author_id,
      status: row.status || 'pending',
      sync_status: row.sync_status || 'pending_sync',
      ai_score: Number(row.ai_score || 0),
      reward_coin: Number(row.reward_coin || 0),
      created_at: row.created_at || new Date().toISOString(),
    };
  },

  /**
   * Ánh xạ mã trạng thái bài viết chiến tích sang tiếng Việt thân thiện với lính dã chiến.
   */
  mapPostStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Chờ phê duyệt';
      case 'approved':
        return 'Đã phê duyệt (Đã cộng xu)';
      case 'rejected':
        return 'Từ chối phê duyệt';
      case 'appealing':
        return 'Đang khiếu nại';
      default:
        return 'Không xác định';
    }
  }
};
