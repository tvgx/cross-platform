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

// ─── Bảng mã response chính thức của đề tài ────────────────────────────────────
// Nguồn: slide "DANH SÁCH MÃ RESPONSE" (docs/PROJECT1_TMDT/Tuần 1.pptx).
// Server là chuẩn — client phải xử lý đủ mọi mã trả về.

/** Các mã coi là THÀNH CÔNG. 9994 = "hết dữ liệu/cuối danh sách" (rỗng nhưng không lỗi). */
export const SUCCESS_CODES = ['1000', '9994', '200', '201'];

/** Mã báo hết dữ liệu / danh sách rỗng (không phải lỗi, nhưng cần hiển thị empty-state). */
export const EMPTY_LIST_CODE = '9994';

/** Mã token hết hạn → cần đăng xuất và quay về màn đăng nhập. */
export const TOKEN_INVALID_CODE = '9998';

/** Ánh xạ mã → thông điệp tiếng Việt hiển thị cho người dùng. */
export const RESPONSE_CODE_MESSAGES: Record<string, string> = {
  '1000': 'Thành công.',
  '1001': 'Không kết nối được máy chủ. Vui lòng thử lại sau.',
  '1002': 'Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại.',
  '1003': 'Dữ liệu nhập sai kiểu. Vui lòng kiểm tra lại.',
  '1004': 'Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại.',
  '1005': 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
  '1006': 'Tệp tải lên quá lớn so với giới hạn cho phép.',
  '1007': 'Tải tệp lên thất bại. Vui lòng thử lại.',
  '1008': 'Vượt quá số lượng ảnh tối đa cho phép.',
  '1009': 'Bạn không có quyền truy cập tài nguyên này.',
  '1010': 'Thao tác này đã được thực hiện trước đó.',
  '1011': 'Sản phẩm đã được bán hoặc đã hết hàng.',
  '1012': 'Địa điểm nhận hàng không được hỗ trợ giao vận.',
  '1013': 'Liên kết người dùng đã tồn tại.',
  '1014': 'Mã khuyến mãi đã hết hạn.',
  '1015': 'Mã khuyến mãi đã hết hạn.',
  '1016': 'Vi phạm chính sách: chỉ báo cáo khi cân nặng > 20KG và giá trị > 30 triệu.',
  '1017': 'Đổi tên người dùng cần cách nhau tối thiểu 30 ngày.',
  '1018': 'Tên người dùng đã được thay đổi.',
  '9992': 'Sản phẩm không tồn tại.',
  '9993': 'Mã xác thực không chính xác.',
  '9994': 'Không có thêm dữ liệu.',
  '9995': 'Tài khoản chưa được đăng ký trên hệ thống.',
  '9996': 'Số điện thoại này đã được đăng ký.',
  '9997': 'Phương thức không hợp lệ.',
  '9998': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  '9999': 'Lỗi hệ thống. Vui lòng thử lại sau.',
};

/**
 * Ánh xạ mã → thông điệp theo NGỮ CẢNH XÁC THỰC (đăng nhập/đăng ký/đổi mật khẩu).
 * Server trả mã chung (vd 1004 = "tham số không hợp lệ") nhưng với màn auth phải dịch
 * sang câu dễ hiểu cho người dùng, KHÔNG hiển thị text thô của server.
 */
export const AUTH_CODE_MESSAGES: Record<string, string> = {
  '1002': 'Tên đăng nhập hoặc mật khẩu không đúng.',
  '1003': 'Tên đăng nhập hoặc mật khẩu không đúng.',
  '1004': 'Tên đăng nhập hoặc mật khẩu không đúng.',
  '9993': 'Mã xác thực không chính xác.',
  '9995': 'Tài khoản chưa được đăng ký trên hệ thống.',
  '9996': 'Số điện thoại này đã được đăng ký.',
  '9998': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
};

/** True nếu mã thuộc nhóm thành công. */
export function isSuccessCode(code?: string | number | null): boolean {
  if (code === undefined || code === null) return false;
  return SUCCESS_CODES.includes(String(code));
}

/**
 * Lấy thông điệp người dùng cho một mã response.
 * Ưu tiên BẢNG MAP tiếng Việt cho mã đã biết (server là chuẩn nhưng text thô khó hiểu);
 * chỉ dùng message do server trả về cho mã CHƯA map; cuối cùng là fallback.
 */
export function getMessageForCode(
  code?: string | number | null,
  serverMessage?: string | null,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (code !== undefined && code !== null) {
    const mapped = RESPONSE_CODE_MESSAGES[String(code)];
    if (mapped) return mapped;
  }
  if (serverMessage && serverMessage.trim()) return serverMessage;
  return fallback;
}

/**
 * Lấy thông điệp lỗi cho ngữ cảnh XÁC THỰC.
 * KHÔNG bao giờ hiển thị text thô của server — luôn map mã sang tiếng Việt thân thiện.
 */
export function getAuthErrorMessage(
  code?: string | number | null,
  fallback = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
): string {
  if (code !== undefined && code !== null) {
    const authMapped = AUTH_CODE_MESSAGES[String(code)];
    if (authMapped) return authMapped;
  }
  // Bỏ qua serverMessage (text thô) trong ngữ cảnh auth; chỉ dùng bảng map chung.
  return getMessageForCode(code, undefined, fallback);
}
