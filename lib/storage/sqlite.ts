import * as SQLite from 'expo-sqlite';
import { MOCK_PRODUCTS, MOCK_USERS } from '../mockDB'; // Import to seed initially

export const db = SQLite.openDatabaseSync('army_db.db');

export const initDB = () => {
  try {
    // Create Users table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        avatar TEXT,
        rank TEXT,
        unit TEXT,
        virtual_balance INTEGER,
        is_seller BOOLEAN,
        phone TEXT,
        email TEXT
      );
    `);

    // Create Products table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Products (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        price INTEGER,
        images TEXT, -- JSON string
        category_id TEXT,
        seller_id TEXT,
        seller_name TEXT,
        stock INTEGER,
        sold_count INTEGER,
        rating REAL,
        like_count INTEGER,
        is_liked BOOLEAN
      );
    `);

    // Create Posts (Chiến tích) table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        media_url TEXT, -- local file URI
        author_id TEXT,
        status TEXT, -- 'pending', 'approved', 'rejected'
        sync_status TEXT DEFAULT 'pending_sync', -- 'pending_sync', 'synced'
        ai_score INTEGER,
        created_at TEXT
      );
    `);

    // Create SyncQueue table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS SyncQueue (
        id TEXT PRIMARY KEY,
        action TEXT, -- 'ORDER_UPLOAD', 'MEDIA_UPLOAD'
        target_id TEXT,
        payload TEXT, -- JSON string
        priority INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);

    // Create Orders table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Orders (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        quantity INTEGER,
        total_price INTEGER,
        buyer_id TEXT,
        status TEXT, -- 'pending_sync', 'synced'
        created_at TEXT
      );
    `);

    // Create Comments table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Comments (
        id TEXT PRIMARY KEY,
        target_id TEXT, -- product_id or post_id
        user_id TEXT,
        user_name TEXT,
        content TEXT,
        created_at TEXT
      );
    `);

    // Seed data if empty
    const userCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM Users');
    if (userCount && userCount.count === 0) {
      MOCK_USERS.forEach(user => {
        db.runSync(
          'INSERT INTO Users (id, username, full_name, avatar, rank, unit, virtual_balance, is_seller, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.username, user.full_name, user.avatar || '', user.rank || '', user.unit || '', user.virtual_balance, user.is_seller ? 1 : 0, user.phone || '', user.email || '']
        );
      });
    }

    const productCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM Products');
    if (productCount && productCount.count === 0) {
      MOCK_PRODUCTS.forEach(p => {
        db.runSync(
          'INSERT INTO Products (id, title, description, price, images, category_id, seller_id, seller_name, stock, sold_count, rating, like_count, is_liked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.title, p.description, p.price, JSON.stringify(p.images), p.category_id, p.seller_id, p.seller_name, p.stock, p.sold_count, p.rating, p.like_count || 0, p.is_liked ? 1 : 0]
        );
      });
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
