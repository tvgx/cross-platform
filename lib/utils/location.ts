/**
 * Các hàm tiện ích để tính toán cự ly tọa độ GPS dã chiến trong Army+
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Tính toán khoảng cách địa lý giữa 2 tọa độ bằng công thức Haversine (trả về mét hoặc km).
 * @param lat1 Vĩ độ điểm 1 (buyer_coordinates_x)
 * @param lon1 Kinh độ điểm 1 (buyer_coordinates_y)
 * @param lat2 Vĩ độ điểm 2 (seller_coordinates_x)
 * @param lon2 Kinh độ điểm 2 (seller_coordinates_y)
 */
export const calculateDistance = (
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 0;
  }

  // Tọa độ bằng 0 thường là mock hoặc không hợp lệ
  if (lat1 === 0 && lon1 === 0) return 0;
  if (lat2 === 0 && lon2 === 0) return 0;

  try {
    const R = 6371; // Bán kính Trái Đất tính theo Kilomet
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKm = R * c;
    
    return distanceInKm; // Trả về dạng Kilomet
  } catch (error) {
    console.error('[LocationHelper] Lỗi tính cự ly:', error);
    return 0;
  }
};

/**
 * Trả về chuỗi cự ly hiển thị dã chiến thân thiện với người dùng (m hoặc km).
 */
export const formatDistance = (distanceInKm: number): string => {
  if (!distanceInKm || distanceInKm <= 0) return '0 m';
  
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  
  return `${distanceInKm.toFixed(1)} km`;
};
