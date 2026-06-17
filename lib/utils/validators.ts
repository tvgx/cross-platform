/**
 * Bộ kiểm tra (validate) đầu vào phía client — báo lỗi NGAY trên app trước khi gửi server,
 * tránh truyền dữ liệu sai định dạng. Quy tắc theo đề tài (slide Tuần 1).
 */

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

const OK: ValidationResult = { ok: true };

/** Số điện thoại Việt Nam: bắt đầu bằng 0, đủ 10 chữ số. */
export function validatePhone(phone: string): ValidationResult {
  const v = (phone || '').trim();
  if (!v) return { ok: false, message: 'Vui lòng nhập số điện thoại.' };
  if (!/^0\d{9}$/.test(v)) return { ok: false, message: 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 0).' };
  return OK;
}

/** Mật khẩu: 6–10 ký tự, không chứa ký tự đặc biệt (chỉ chữ và số). */
export function validatePassword(password: string): ValidationResult {
  const v = password || '';
  if (!v) return { ok: false, message: 'Vui lòng nhập mật khẩu.' };
  if (v.length < 6 || v.length > 10) return { ok: false, message: 'Mật khẩu phải có từ 6 đến 10 ký tự.' };
  if (/[^A-Za-z0-9]/.test(v)) return { ok: false, message: 'Mật khẩu không được chứa ký tự đặc biệt.' };
  return OK;
}

/** Email cơ bản (cho phép rỗng nếu không bắt buộc — dùng allowEmpty). */
export function validateEmail(email: string, allowEmpty = false): ValidationResult {
  const v = (email || '').trim();
  if (!v) return allowEmpty ? OK : { ok: false, message: 'Vui lòng nhập email.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, message: 'Email không đúng định dạng.' };
  return OK;
}

/** Mã xác thực OTP: đúng 6 ký tự (chữ và số). */
export function validateOtp(code: string): ValidationResult {
  const v = (code || '').trim();
  if (!v) return { ok: false, message: 'Vui lòng nhập mã xác thực.' };
  if (!/^[A-Za-z0-9]{6}$/.test(v)) return { ok: false, message: 'Mã xác thực gồm đúng 6 ký tự.' };
  return OK;
}

/** Trường bắt buộc không rỗng. */
export function validateRequired(value: string, label = 'Trường này'): ValidationResult {
  if (!value || !value.trim()) return { ok: false, message: `${label} không được để trống.` };
  return OK;
}

/** Chạy lần lượt nhiều validator, trả về lỗi đầu tiên (nếu có). */
export function firstError(...results: ValidationResult[]): ValidationResult {
  for (const r of results) {
    if (!r.ok) return r;
  }
  return OK;
}
