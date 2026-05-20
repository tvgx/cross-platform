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
  }
};
