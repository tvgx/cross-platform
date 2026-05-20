import { User } from '../../types';

export const UserHelper = {
  /**
   * Chuyển đổi hàng từ bảng Users trong SQLite sang Interface User của hệ thống.
   */
  parseUser(row: any): User {
    if (!row) throw new Error('Không thể phân tích đối tượng User rỗng');
    
    return {
      id: String(row.id),
      username: row.username || '',
      full_name: row.full_name || row.fullname || '',
      avatar: row.avatar || undefined,
      rank: row.rank || undefined,
      unit: row.unit || undefined,
      virtual_balance: Number(row.virtual_balance || 0),
      is_seller: row.is_seller === 1 || row.is_seller === true,
      phone: row.phone || row.phonenumber || undefined,
      email: row.email || undefined,
      created_at: row.created_at || new Date().toISOString(),
    };
  },

  /**
   * Định dạng số dư điểm chiến tích dã chiến (VNĐ/Xu).
   */
  formatBalance(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' ₫';
  },

  /**
   * Ánh xạ chức vụ/cấp bậc quân hàm sang Role Hệ thống.
   */
  mapRole(rank: string | undefined): 'soldier' | 'officer' | 'vendor' {
    if (!rank) return 'soldier';
    const normalized = rank.toLowerCase();
    if (normalized.includes('sĩ quan') || normalized.includes('chỉ huy')) {
      return 'officer';
    }
    if (normalized.includes('nhà bán') || normalized.includes('vendor')) {
      return 'vendor';
    }
    return 'soldier';
  }
};
