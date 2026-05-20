export const NewsHelper = {
  /**
   * Định dạng ngày công bố tin tức quân sự.
   */
  formatNewsDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
