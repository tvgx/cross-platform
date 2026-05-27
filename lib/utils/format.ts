/**
 * Các hàm tiện ích để định dạng dữ liệu trong ứng dụng Army+
 */

/**
 * Định dạng số xu/tiền ảo trong quân đội thành chuỗi hiển thị dễ đọc.
 * Ví dụ: 1500000 -> "1.500.000 ₫" hoặc tùy chọn hiển thị xu.
 */
export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₫';
  }
  
  // Format viết tắt T (Tỷ) cho các số dư cực lớn (>= 1000 Tỷ)
  if (amount >= 1_000_000_000_000) {
    const ty = Math.floor(amount / 1_000_000_000);
    return ty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "T ₫";
  }

  // Tối ưu hiệu năng thay vì sử dụng toLocaleString trên một số thiết bị Android cấu hình yếu
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
};

/**
 * Định dạng ngày giờ chuẩn tác chiến quân sự.
 * Hỗ trợ chuyển đổi string ISO hoặc UNIX timestamp thành định dạng DD/MM/YYYY HH:mm.
 */
export const formatMilitaryDate = (dateVal?: string | number | null): string => {
  if (!dateVal) return '--/--/----';
  
  try {
    const d = new Date(typeof dateVal === 'number' && dateVal < 100000000000 ? dateVal * 1000 : dateVal);
    if (isNaN(d.getTime())) return '--/--/----';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return '--/--/----';
  }
};
