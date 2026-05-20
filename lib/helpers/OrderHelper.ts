import { OrderStatus } from '../../types';

export const OrderHelper = {
  /**
   * Chuyển đổi danh sách mặt hàng đặt hàng thành chuỗi JSON để truyền lên SyncQueue.
   */
  serializeItems(items: { product_id: string; quantity: number }[]): string {
    return JSON.stringify(items);
  },

  /**
   * Định dạng tọa độ GPS dã chiến của người mua/người bán (Kinh độ, Vĩ độ) kèm mô tả căn cứ.
   */
  formatCoordinates(x: number, y: number, description?: string): string {
    const coords = `Tọa độ: (${(x || 0.0).toFixed(6)}, ${(y || 0.0).toFixed(6)})`;
    return description ? `${coords} - Căn cứ: ${description}` : coords;
  },

  /**
   * Ánh xạ trạng thái SQLite cục bộ sang trạng thái chuẩn của Client.
   */
  mapOrderStatus(status: string): OrderStatus {
    if (status === 'pending_sync') return 'pending';
    if (status === 'synced') return 'confirmed';
    return status as OrderStatus;
  }
};
