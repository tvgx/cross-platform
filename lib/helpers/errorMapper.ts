// Centralized Tactical Error Messages for Soldiers (Army+ App)

export type TacticalErrorType = 'timeout' | 'server_error' | 'empty' | 'crash' | 'rollback';

const TACTICAL_ERRORS: Record<TacticalErrorType, string> = {
  timeout: 'Mất kết nối vệ tinh. Đang chạy offline.',
  server_error: 'Lỗi kết nối Tổng kho. Hiển thị dự phòng cục bộ.',
  empty: 'Khí tài chưa được cấp phép hoặc giải mật.',
  crash: 'Hệ thống phòng thủ đang khôi phục. Thử lại sau 30s.',
  rollback: 'Tuyến tiếp vận gián đoạn. Đang hoàn tiền cục bộ.',
};

/**
 * Lấy thông điệp lỗi dã chiến tối giản, cung cấp đủ thông tin nhanh nhất cho chiến sĩ.
 */
export function getTacticalErrorMessage(type: TacticalErrorType | string, defaultMsg = 'Lỗi kết nối hệ thống dã chiến'): string {
  if (type in TACTICAL_ERRORS) {
    return TACTICAL_ERRORS[type as TacticalErrorType];
  }
  
  // Trả về trực tiếp nếu đã là thông báo ngắn gọn
  return defaultMsg;
}
