export const ProductHelper = {
  /**
   * Phân tích an toàn chuỗi JSON ảnh của sản phẩm lưu trong cơ sở dữ liệu.
   */
  parseImages(imagesStr: string | null | undefined): string[] {
    if (!imagesStr) return [];
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Định dạng điểm đánh giá sao sản phẩm dã chiến (ví dụ: 4.89 -> 4.9).
   */
  formatRating(rating: number): string {
    return (rating || 5.0).toFixed(1);
  },

  /**
   * Xác minh độ dài và nội dung của bình luận quân nhu.
   */
  validateCommentContent(content: string): boolean {
    if (!content) return false;
    const trimmed = content.trim();
    // Bình luận quân dụng phải từ 2 ký tự đến 1000 ký tự
    return trimmed.length >= 2 && trimmed.length <= 1000;
  }
};
