import { db } from '../storage/sqlite';
import { UserHelper } from '../helpers/UserHelper';
import type { User } from '../../types';

export const UserRepository = {
  /**
   * Truy vấn thông tin người dùng từ SQLite cục bộ.
   */
  getUser(userId: string): User | null {
    try {
      const row = db.getFirstSync<any>('SELECT * FROM Users WHERE id = ?', [userId]);
      if (!row) return null;
      return UserHelper.parseUser(row);
    } catch (e) {
      console.error('[UserRepo] Lỗi truy vấn getUser:', e);
      return null;
    }
  },

  /**
   * Truy vấn thông tin người dùng từ tên đăng nhập hoặc số điện thoại.
   */
  getUserByUsernameOrPhone(identifier: string): User | null {
    try {
      const row = db.getFirstSync<any>(
        'SELECT * FROM Users WHERE username = ? OR phone = ?',
        [identifier, identifier]
      );
      if (!row) return null;
      return UserHelper.parseUser(row);
    } catch (e) {
      console.error('[UserRepo] Lỗi truy vấn getUserByUsernameOrPhone:', e);
      return null;
    }
  },

  /**
   * Lấy số dư ví ảo cục bộ.
   */
  getUserBalance(userId: string): number {
    try {
      const row = db.getFirstSync<{ balance: number }>(
        'SELECT balance FROM Wallets WHERE user_id = ?',
        [userId]
      );
      return row ? Number(row.balance) : 0;
    } catch (e) {
      console.error('[UserRepo] Lỗi lấy số dư ví:', e);
      return 0;
    }
  },

  /**
   * Cập nhật số dư ví trong cả bảng Wallets và Users (đảm bảo đồng bộ giao diện).
   */
  updateUserBalance(userId: string, balance: number): void {
    try {
      db.withTransactionSync(() => {
        db.runSync(
          'UPDATE Wallets SET balance = ? WHERE user_id = ?',
          [balance, userId]
        );
        db.runSync(
          'UPDATE Users SET virtual_balance = ? WHERE id = ?',
          [balance, userId]
        );
      });
      console.log(`[UserRepo] Đã cập nhật số dư ví mới: ${balance} ₫ cho User ${userId}`);
    } catch (e) {
      console.error('[UserRepo] Lỗi cập nhật số dư ví:', e);
    }
  },

  /**
   * Xác minh tài khoản đăng nhập dã chiến.
   */
  verifyLogin(email: string, role: string): User | null {
    try {
      const row = db.getFirstSync<any>(
        'SELECT * FROM Users WHERE email = ? AND role = ?',
        [email, role]
      );
      if (!row) return null;
      return UserHelper.parseUser(row);
    } catch (e) {
      console.error('[UserRepo] Lỗi xác minh tài khoản đăng nhập:', e);
      return null;
    }
  },

  /**
   * Tạo ví mới cho người dùng.
   */
  createWallet(userId: string, balance: number = 0): void {
    try {
      db.runSync(
        'INSERT OR IGNORE INTO Wallets (user_id, balance) VALUES (?, ?)',
        [userId, balance]
      );
    } catch (e) {
      console.error('[UserRepo] Lỗi khởi tạo ví mới:', e);
    }
  },

  /**
   * Ghi log giao dịch nạp/trừ xu ảo.
   */
  createTransaction(tx: {
    id: string;
    wallet_id: number;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
  }): void {
    try {
      db.runSync(
        `INSERT INTO Transactions (id, wallet_id, type, amount, status, description, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.wallet_id, tx.type, tx.amount, tx.status, tx.description, tx.created_at]
      );
    } catch (e) {
      console.error('[UserRepo] Lỗi ghi nhận giao dịch:', e);
    }
  },

  /**
   * Lưu thông tin người dùng cục bộ vào SQLite.
   */
  saveUser(user: User): void {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO Users (id, username, full_name, fullname, avatar, rank, unit, virtual_balance, is_seller, phone, phonenumber, email, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(user.id),
          user.username || '',
          user.full_name || '',
          user.full_name || '',
          user.avatar || '',
          user.rank || '',
          user.unit || '',
          user.virtual_balance || 0,
          user.is_seller ? 1 : 0,
          user.phone || '',
          user.phone || '',
          user.email || `offline_${user.id}@army.local`,
          user.is_seller ? 'vendor' : (user.rank === 'Sĩ quan' || user.rank === 'officer' || user.rank === 'admin' ? 'officer' : 'soldier'),
          user.created_at || new Date().toISOString()
        ]
      );
      console.log(`[UserRepo] Đã lưu User ${user.id} (${user.username}) vào SQLite.`);
    } catch (e) {
      console.error('[UserRepo] Lỗi lưu user vào SQLite:', e);
    }
  },

  /**
   * Theo dõi người dùng (người bán).
   */
  followUser(followerId: string, followedId: string): void {
    try {
      const id = `${followerId}_${followedId}`;
      db.runSync(
        `INSERT OR REPLACE INTO Follows (id, follower_id, followed_id, sync_status, created_at)
         VALUES (?, ?, ?, 'pending_sync', ?)`,
        [id, followerId, followedId, new Date().toISOString()]
      );
    } catch (e) {
      console.error('[UserRepo] Lỗi khi theo dõi người dùng:', e);
    }
  },

  /**
   * Bỏ theo dõi người dùng.
   */
  unfollowUser(followerId: string, followedId: string): void {
    try {
      db.runSync(
        `DELETE FROM Follows WHERE follower_id = ? AND followed_id = ?`,
        [followerId, followedId]
      );
    } catch (e) {
      console.error('[UserRepo] Lỗi khi bỏ theo dõi người dùng:', e);
    }
  },

  /**
   * Kiểm tra xem đang có theo dõi không.
   */
  isFollowing(followerId: string, followedId: string): boolean {
    try {
      const row = db.getFirstSync<{ id: string }>(
        `SELECT id FROM Follows WHERE follower_id = ? AND followed_id = ?`,
        [followerId, followedId]
      );
      return !!row;
    } catch (e) {
      console.error('[UserRepo] Lỗi kiểm tra theo dõi:', e);
      return false;
    }
  },

  /**
   * Lấy danh sách người bán (users) đang theo dõi.
   */
  getFollowedSellers(followerId: string): User[] {
    try {
      const rows = db.getAllSync<any>(
        `SELECT u.* FROM Users u
         INNER JOIN Follows f ON u.id = f.followed_id
         WHERE f.follower_id = ?`,
        [followerId]
      );
      return rows.map(row => UserHelper.parseUser(row));
    } catch (e) {
      console.error('[UserRepo] Lỗi lấy danh sách người bán đã theo dõi:', e);
      return [];
    }
  },

  /**
   * Đưa tác vụ theo dõi vào hàng đợi đồng bộ.
   */
  queueFollowUser(followerId: string, followedId: string, isFollowing: boolean): void {
    try {
      const { SyncQueueRepository } = require('./SyncQueueRepository');
      SyncQueueRepository.addSyncTask({
        id: `follow_${followerId}_${followedId}_${Date.now()}`,
        action: isFollowing ? 'FOLLOW_USER' : 'UNFOLLOW_USER',
        target_id: followedId,
        payload: JSON.stringify({ user_id: followedId, action: isFollowing ? 'follow' : 'unfollow' }),
        priority: 1,
      });
    } catch (e) {
      console.error('[UserRepo] Lỗi đưa tác vụ theo dõi vào hàng đợi:', e);
    }
  },

  /**
   * Đánh dấu trạng thái theo dõi là đã đồng bộ.
   */
  markFollowSynced(followerId: string, followedId: string): void {
    try {
      db.runSync(
        "UPDATE Follows SET sync_status = 'synced' WHERE follower_id = ? AND followed_id = ?",
        [followerId, followedId]
      );
    } catch (e) {
      console.error('[UserRepo] Lỗi đánh dấu đồng bộ theo dõi:', e);
    }
  }
};
