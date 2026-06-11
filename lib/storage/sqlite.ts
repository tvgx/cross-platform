import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let localDb: any;

if (Platform.OS === 'web') {
  const alasql = require('alasql');
  localDb = {
    execSync: (sql: string) => {
      if (sql.includes('PRAGMA')) return;
      if (sql.includes('BEGIN TRANSACTION') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) return;
      try {
        // Strip out SQLite specific AUTOINCREMENT and FOREIGN KEY definitions for alasql compatibility
        let cleanedSql = sql
          .replace(/FOREIGN KEY\s*\([^)]+\)\s*REFERENCES\s*\w+\s*\([^)]+\)(?:\s*ON\s+DELETE\s+[A-Z ]+)?/gi, '')
          .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
          .replace(/PRIMARY KEY\s*AUTO_INCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
          .replace(/PRIMARY KEY\s*AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
          .replace(/,\s*,/g, ',')
          .replace(/,\s*\)/g, ')')
          .replace(/\(\s*,/g, '(');
        
        const queries = cleanedSql.split(';').map(q => q.trim()).filter(q => q.length > 0);
        for (const query of queries) {
          alasql(query);
        }
      } catch (e: any) {
        console.warn('[AlaSQL execSync Warning]:', e.message, 'for SQL:', sql);
      }
    },
    runSync: (sql: string, params: any[] = []) => {
      if (sql.includes('BEGIN TRANSACTION') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) return { changes: 0, lastInsertRowId: 0 };
      try {
        let cleanedSql = sql.replace(/\bas count\b/gi, 'AS [count]');
        
        if (/INSERT\s+OR\s+REPLACE\s+INTO/gi.test(cleanedSql) || /REPLACE\s+INTO/gi.test(cleanedSql)) {
          cleanedSql = cleanedSql.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO').replace(/REPLACE\s+INTO/gi, 'INSERT INTO');
          
          const tableMatch = cleanedSql.match(/INSERT\s+INTO\s+(\w+)/i);
          if (tableMatch && tableMatch[1] && params.length > 0) {
            const tableName = tableMatch[1];
            const idVal = params[0];
            try {
              alasql(`DELETE FROM ${tableName} WHERE id = ?`, [idVal]);
            } catch (err) {}
          }
        }
        
        alasql(cleanedSql, params);
        return { changes: 1, lastInsertRowId: 1 };
      } catch (e: any) {
        console.warn('[AlaSQL runSync Warning]:', e.message, 'for SQL:', sql);
        return { changes: 0, lastInsertRowId: 0 };
      }
    },
    getFirstSync: <T>(sql: string, params: any[] = []): T | null => {
      try {
        let cleanedSql = sql.replace(/\bas count\b/gi, 'AS [count]');
        const res = alasql(cleanedSql, params);
        return res && res[0] ? (res[0] as T) : null;
      } catch (e: any) {
        console.warn('[AlaSQL getFirstSync Warning]:', e.message, 'for SQL:', sql);
        return null;
      }
    },
    getAllSync: <T>(sql: string, params: any[] = []): T[] => {
      try {
        let cleanedSql = sql.replace(/\bas count\b/gi, 'AS [count]');
        const res = alasql(cleanedSql, params);
        return (res || []) as T[];
      } catch (e: any) {
        console.warn('[AlaSQL getAllSync Warning]:', e.message, 'for SQL:', sql);
        return [];
      }
    },
    withTransactionSync: (cb: () => void) => {
      try {
        cb();
      } catch (e: any) {
        console.error('[AlaSQL withTransactionSync Error]:', e.message);
      }
    }
  };
} else {
  localDb = SQLite.openDatabaseSync('army_db_v2.db');
}

export const db = localDb as SQLite.SQLiteDatabase;

export const initDB = () => {
  try {
    // Kích hoạt khóa ngoại để bảo toàn tính toàn vẹn quan hệ thực thể
    db.execSync('PRAGMA foreign_keys = ON;');

    // 1. Tạo bảng Users
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        fullname TEXT,      -- Khớp với server
        avatar TEXT,
        rank TEXT,
        unit TEXT,
        virtual_balance INTEGER DEFAULT 0,
        is_seller BOOLEAN DEFAULT 0,
        phone TEXT,
        phonenumber TEXT,  -- Khớp với server
        email TEXT UNIQUE,
        bio TEXT,
        role TEXT,         -- Khớp với server ('soldier', 'officer', 'vendor')
        created_at TEXT
      );
    `);

    // 2. Tạo bảng Wallets
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        balance REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 3. Tạo bảng Transactions
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Transactions (
        id TEXT PRIMARY KEY,
        wallet_id INTEGER,
        type TEXT,         -- 'EARN', 'SPEND'
        amount REAL,
        status TEXT,       -- 'completed', 'pending'
        description TEXT,
        order_id TEXT,
        created_at TEXT,
        FOREIGN KEY (wallet_id) REFERENCES Wallets (id) ON DELETE CASCADE
      );
    `);

    // 4. Tạo bảng RewardRules
    db.execSync(`
      CREATE TABLE IF NOT EXISTS RewardRules (
        id TEXT PRIMARY KEY,
        battle_type TEXT UNIQUE,
        reward_coin REAL
      );
    `);

    // 5. Tạo bảng Posts (Chiến tích - Tương thích ngược & Map với Battle_Proofs)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        media_url TEXT,    -- URI local dã chiến
        video_url TEXT,    -- Khớp với server
        image_url TEXT,    -- Khớp với server
        author_id TEXT,
        status TEXT,       -- 'pending', 'approved', 'rejected', 'appealing'
        sync_status TEXT DEFAULT 'pending_sync',
        ai_score INTEGER DEFAULT 0,
        reward_coin REAL DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (author_id) REFERENCES Users (id)
      );
    `);

    // 6. Tạo bảng Appeals (Khiếu nại dã chiến)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Appeals (
        id TEXT PRIMARY KEY,
        proof_id TEXT,
        user_id TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (proof_id) REFERENCES Posts (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 7. Tạo bảng Products (Sản phẩm quân nhu/Vũ khí)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Products (
        id TEXT PRIMARY KEY,
        seller_id TEXT,
        category_id TEXT,
        brand_id TEXT,
        title TEXT,
        description TEXT,
        price INTEGER DEFAULT 0,
        price_new INTEGER DEFAULT 0,
        images TEXT,
        video TEXT,
        stock INTEGER DEFAULT 0,
        is_stock BOOLEAN DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment INTEGER DEFAULT 0,  -- Thêm mới
        is_liked BOOLEAN DEFAULT 0,
        created_at TEXT
      );
    `);

    // 8. Tạo bảng ProductVariants (Biến thể sản phẩm dã chiến)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS ProductVariants (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        size TEXT,
        color TEXT,
        stock INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE
      );
    `);

    // 9. Tạo bảng Likes (Lượt thích)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Likes (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        user_id TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 10. Tạo bảng Comments (Bình luận dã chiến)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Comments (
        id TEXT PRIMARY KEY,
        target_id TEXT,    -- Để tương thích ngược (product_id hoặc post_id)
        product_id TEXT,   -- Khớp với server
        user_id TEXT,
        user_name TEXT,
        content TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at TEXT,
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 11. Tạo bảng Reports
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Reports (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        user_id TEXT,
        reason TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 12. Tạo bảng Orders (Hóa đơn tích hợp GPS)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Orders (
        id TEXT PRIMARY KEY,
        buyer_id TEXT,
        buyer_coordinates_x REAL DEFAULT 0.0,
        buyer_coordinates_y REAL DEFAULT 0.0,
        buyer_coordinates_description TEXT,
        seller_id TEXT,
        seller_coordinates_x REAL DEFAULT 0.0,
        seller_coordinates_y REAL DEFAULT 0.0,
        seller_coordinates_description TEXT,
        status TEXT,       -- 'pending_sync', 'synced', 'delivered', 'cancelled'
        total_price INTEGER DEFAULT 0,
        shipping_fee REAL DEFAULT 0.0,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at TEXT,
        product_id TEXT,   -- Tương thích ngược cho đơn lẻ
        quantity INTEGER,  -- Tương thích ngược cho đơn lẻ
        FOREIGN KEY (buyer_id) REFERENCES Users (id),
        FOREIGN KEY (seller_id) REFERENCES Users (id)
      );
    `);

    // 13. Tạo bảng OrderItems (Mối quan hệ 1-N cho nhiều sản phẩm trong 1 hóa đơn)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        product_id TEXT,
        variant_id TEXT,
        price REAL DEFAULT 0,
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY (order_id) REFERENCES Orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products (id),
        FOREIGN KEY (variant_id) REFERENCES ProductVariants (id)
      );
    `);

    // 14. Tạo bảng Shipping
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Shipping (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        address_id TEXT,
        shipper_id TEXT,
        status TEXT,
        tracking_code TEXT,
        FOREIGN KEY (order_id) REFERENCES Orders (id) ON DELETE CASCADE
      );
    `);

    // 15. Tạo bảng Conversations
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Conversations (
        id TEXT PRIMARY KEY,
        time_last_update INTEGER
      );
    `);

    // 16. Tạo bảng UserConversations
    db.execSync(`
      CREATE TABLE IF NOT EXISTS UserConversations (
        user_id TEXT,
        conversation_id TEXT,
        PRIMARY KEY (user_id, conversation_id),
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES Conversations (id) ON DELETE CASCADE
      );
    `);

    // 17. Tạo bảng Messages
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        sender_id TEXT,
        content TEXT,
        image_url TEXT,
        video_url TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        created_at INTEGER,
        FOREIGN KEY (conversation_id) REFERENCES Conversations (id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES Users (id) ON DELETE CASCADE
      );
    `);

    // 18. Tạo bảng News
    db.execSync(`
      CREATE TABLE IF NOT EXISTS News (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER
      );
    `);

    // 19. Tạo bảng SyncQueue (Hàng đợi offline)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS SyncQueue (
        id TEXT PRIMARY KEY,
        action TEXT,       -- 'ORDER_UPLOAD', 'MEDIA_UPLOAD', 'APPEAL_SUBMIT', etc.
        target_id TEXT,
        payload TEXT,      -- Dữ liệu JSON gửi đi
        priority INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);

    console.log('[SQLite] Khởi tạo CSDL dã chiến thành công (không kèm dữ liệu giả).');
  } catch (error) {
    console.error('Lỗi khởi tạo SQLite:', error);
  }
};

// Khởi tạo DB ngay khi module được import để đảm bảo an toàn cho cả Background Tasks
initDB();
