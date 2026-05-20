export const MessageHelper = {
  /**
   * Xác minh tin nhắn dã chiến hợp lệ trước khi lưu/gửi.
   */
  validateMessage(content: string): boolean {
    if (!content) return false;
    return content.trim().length > 0 && content.trim().length <= 5000;
  },

  /**
   * Định dạng thời gian gửi tin nhắn dã chiến (ví dụ: "10:30" hoặc "20-05-2026").
   */
  formatMessageTime(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // Nếu cùng ngày thì hiển thị Giờ:Phút
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    // Nếu khác ngày hiển thị ngày/tháng/năm
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};
