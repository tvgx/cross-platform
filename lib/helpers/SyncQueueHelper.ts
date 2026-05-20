export const SyncQueueHelper = {
  /**
   * Tuần tự hóa payload dữ liệu đồng bộ thành chuỗi JSON.
   */
  serializePayload(payload: any): string {
    if (!payload) return '{}';
    return typeof payload === 'string' ? payload : JSON.stringify(payload);
  },

  /**
   * Giải mã chuỗi JSON payload từ SQLite.
   */
  deserializePayload(payloadStr: string | null | undefined): any {
    if (!payloadStr) return {};
    try {
      return JSON.parse(payloadStr);
    } catch (e) {
      return {};
    }
  },

  /**
   * Lấy mức độ ưu tiên mặc định của hành động đồng bộ dã chiến.
   * Số lớn hơn nghĩa là ưu tiên cao hơn.
   */
  getPriorityLevel(action: string): number {
    switch (action) {
      case 'ORDER_UPLOAD':
        return 3; // Hóa đơn quân nhu mua súng đạn cần ưu tiên cao nhất
      case 'APPEAL_SUBMIT':
        return 2; // Khiếu nại lập chiến công
      case 'MEDIA_UPLOAD':
        return 1; // Tải lên ảnh chiến công
      default:
        return 0; // Bình thường
    }
  }
};
