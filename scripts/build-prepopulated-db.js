const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../assets/databases/army_db.db');

// Ensure parent directories exist
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Delete existing database file to build clean
if (fs.existsSync(dbPath)) {
  console.log('Xóa file .db hiện tại để khởi tạo mới hoàn toàn...');
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối SQLite:', err.message);
    process.exit(1);
  }
  console.log('Đã tạo/kết nối thành công tới SQLite DB tại:', dbPath);
});

// Run commands sequentially
db.serialize(() => {
  // Kích hoạt khóa ngoại
  db.run('PRAGMA foreign_keys = ON;');

  console.log('Đang khởi tạo các bảng và mối quan hệ...');

  // 1. Tạo bảng Users
  db.run(`
    CREATE TABLE Users (
      id TEXT PRIMARY KEY,
      username TEXT,
      full_name TEXT,
      fullname TEXT,
      avatar TEXT,
      rank TEXT,
      unit TEXT,
      virtual_balance INTEGER DEFAULT 0,
      is_seller BOOLEAN DEFAULT 0,
      phone TEXT,
      phonenumber TEXT,
      email TEXT UNIQUE,
      bio TEXT,
      role TEXT,
      created_at TEXT
    );
  `);

  // 2. Tạo bảng Wallets
  db.run(`
    CREATE TABLE Wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
    );
  `);

  // 3. Tạo bảng Transactions
  db.run(`
    CREATE TABLE Transactions (
      id TEXT PRIMARY KEY,
      wallet_id INTEGER,
      type TEXT,
      amount REAL,
      status TEXT,
      description TEXT,
      order_id TEXT,
      created_at TEXT,
      FOREIGN KEY (wallet_id) REFERENCES Wallets (id) ON DELETE CASCADE
    );
  `);

  // 4. Tạo bảng RewardRules
  db.run(`
    CREATE TABLE RewardRules (
      id TEXT PRIMARY KEY,
      battle_type TEXT UNIQUE,
      reward_coin REAL
    );
  `);

  // 5. Tạo bảng Posts
  db.run(`
    CREATE TABLE Posts (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      media_url TEXT,
      video_url TEXT,
      image_url TEXT,
      author_id TEXT,
      status TEXT,
      sync_status TEXT DEFAULT 'pending_sync',
      ai_score INTEGER DEFAULT 0,
      reward_coin REAL DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (author_id) REFERENCES Users (id)
    );
  `);

  // 6. Tạo bảng Appeals
  db.run(`
    CREATE TABLE Appeals (
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

  // 7. Tạo bảng Products
  db.run(`
    CREATE TABLE Products (
      id TEXT PRIMARY KEY,
      seller_id TEXT,
      category_id TEXT,
      brand_id TEXT,
      title TEXT,
      description TEXT,
      price INTEGER DEFAULT 0,
      images TEXT,
      image_urls TEXT,
      stock INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      is_liked BOOLEAN DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (seller_id) REFERENCES Users (id)
    );
  `);

  // 8. Tạo bảng ProductVariants
  db.run(`
    CREATE TABLE ProductVariants (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      size TEXT,
      color TEXT,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE
    );
  `);

  // 9. Tạo bảng Likes
  db.run(`
    CREATE TABLE Likes (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      user_id TEXT,
      sync_status TEXT DEFAULT 'pending_sync',
      FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
    );
  `);

  // 10. Tạo bảng Comments
  db.run(`
    CREATE TABLE Comments (
      id TEXT PRIMARY KEY,
      target_id TEXT,
      product_id TEXT,
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
  db.run(`
    CREATE TABLE Reports (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      user_id TEXT,
      reason TEXT,
      sync_status TEXT DEFAULT 'pending_sync',
      FOREIGN KEY (product_id) REFERENCES Products (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
    );
  `);

  // 12. Tạo bảng Orders
  db.run(`
    CREATE TABLE Orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT,
      buyer_coordinates_x REAL DEFAULT 0.0,
      buyer_coordinates_y REAL DEFAULT 0.0,
      buyer_coordinates_description TEXT,
      seller_id TEXT,
      seller_coordinates_x REAL DEFAULT 0.0,
      seller_coordinates_y REAL DEFAULT 0.0,
      seller_coordinates_description TEXT,
      status TEXT,
      total_price INTEGER DEFAULT 0,
      shipping_fee REAL DEFAULT 0.0,
      sync_status TEXT DEFAULT 'pending_sync',
      created_at TEXT,
      product_id TEXT,
      quantity INTEGER,
      FOREIGN KEY (buyer_id) REFERENCES Users (id),
      FOREIGN KEY (seller_id) REFERENCES Users (id)
    );
  `);

  // 13. Tạo bảng OrderItems
  db.run(`
    CREATE TABLE OrderItems (
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
  db.run(`
    CREATE TABLE Shipping (
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
  db.run(`
    CREATE TABLE Conversations (
      id TEXT PRIMARY KEY,
      time_last_update INTEGER
    );
  `);

  // 16. Tạo bảng UserConversations
  db.run(`
    CREATE TABLE UserConversations (
      user_id TEXT,
      conversation_id TEXT,
      PRIMARY KEY (user_id, conversation_id),
      FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES Conversations (id) ON DELETE CASCADE
    );
  `);

  // 17. Tạo bảng Messages
  db.run(`
    CREATE TABLE Messages (
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
  db.run(`
    CREATE TABLE News (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at INTEGER
    );
  `);

  // 19. Tạo bảng SyncQueue
  db.run(`
    CREATE TABLE SyncQueue (
      id TEXT PRIMARY KEY,
      action TEXT,
      target_id TEXT,
      payload TEXT,
      priority INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  console.log('Khởi tạo bảng hoàn tất. Đang đổ dữ liệu Seed...');

  // --- SEEDING DATA ---

  // 1. Seed Users
  const MOCK_USERS = [
    {
      id: '1',
      username: 'nguyenvana',
      full_name: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?u=1',
      rank: 'Sĩ quan',
      unit: 'Quân khu 7',
      virtual_balance: 1500000,
      is_seller: true,
      phone: '0901234567',
      email: 'nva@army.vn',
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      username: 'tranvanb',
      full_name: 'Trần Văn B',
      avatar: 'https://i.pravatar.cc/150?u=2',
      rank: 'Chiến sĩ',
      unit: 'Sư đoàn 5',
      virtual_balance: 50000,
      is_seller: false,
      phone: '0907654321',
      email: 'tvb@army.vn',
      created_at: '2023-06-15T00:00:00Z'
    }
  ];

  const userStmt = db.prepare('INSERT INTO Users (id, username, full_name, fullname, avatar, rank, unit, virtual_balance, is_seller, phone, phonenumber, email, role, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  MOCK_USERS.forEach(user => {
    userStmt.run([
      user.id,
      user.username,
      user.full_name,
      user.full_name,
      user.avatar,
      user.rank,
      user.unit,
      user.virtual_balance,
      user.is_seller ? 1 : 0,
      user.phone,
      user.phone,
      user.email,
      user.is_seller ? 'vendor' : (user.rank === 'Sĩ quan' ? 'officer' : 'soldier'),
      'Tác chiến dã chiến dũng cảm.',
      user.created_at
    ]);
  });
  userStmt.finalize();

  // 2. Seed Wallets
  const walletStmt = db.prepare('INSERT INTO Wallets (user_id, balance) VALUES (?, ?)');
  MOCK_USERS.forEach(user => {
    walletStmt.run([user.id, user.virtual_balance]);
  });
  walletStmt.finalize();

  // 3. Seed RewardRules
  const mockRules = [
    { id: 'r1', battle_type: 'Bắn rơi UAV Mavic 3 Pro', reward_coin: 50000 },
    { id: 'r2', battle_type: 'Tiêu diệt xe tăng Leopard', reward_coin: 1500000 },
    { id: 'r3', battle_type: 'Phát hiện trận địa pháo binh', reward_coin: 200000 },
    { id: 'r4', battle_type: 'Bắn hạ trực thăng K-52', reward_coin: 3000000 }
  ];
  const ruleStmt = db.prepare('INSERT INTO RewardRules (id, battle_type, reward_coin) VALUES (?, ?, ?)');
  mockRules.forEach(rule => {
    ruleStmt.run([rule.id, rule.battle_type, rule.reward_coin]);
  });
  ruleStmt.finalize();

  // 4. Seed Products
  const MOCK_PRODUCTS = [
    {
      id: 'p1',
      title: 'Súng trường Tấn công STV-380',
      description: 'Súng trường tiêu chuẩn hiện đại của QĐNDVN cỡ đạn 7.62x39mm. Độ tin cậy cực cao trong điều kiện ngập nước, bùn cát. Tích hợp ray Picatinny lắp thiết bị ngắm quang học.',
      price: 15000000,
      images: ['https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c1',
      seller_id: '1',
      stock: 20,
      sold_count: 5,
      rating: 4.9,
      like_count: 320,
      is_liked: false,
      created_at: '2023-10-01T00:00:00Z'
    },
    {
      id: 'p2',
      title: 'Hộp đạn sắt 7.62x39mm (700 viên)',
      description: 'Hộp đạn sắt kín khí chống nước, chứa 700 viên đạn tiêu chuẩn 7.62x39mm kèm túi chống ẩm quân dụng. Thuận tiện lưu trữ lâu dài dưới công sự.',
      price: 1200000,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c1',
      seller_id: '1',
      stock: 150,
      sold_count: 45,
      rating: 4.8,
      like_count: 150,
      is_liked: true,
      created_at: '2023-11-05T00:00:00Z'
    },
    {
      id: 'p3',
      title: 'Drone Trinh sát Chiến thuật Mavic 3T',
      description: 'UAV trinh sát đêm tích hợp camera cảm biến nhiệt hồng ngoại siêu nhạy, khả năng zoom số 56x. Định vị mục tiêu tọa độ GPS chính xác cho hỏa lực chi viện.',
      price: 25000000,
      images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c2',
      seller_id: '1',
      stock: 10,
      sold_count: 8,
      rating: 5.0,
      like_count: 240,
      is_liked: false,
      created_at: '2023-12-01T00:00:00Z'
    },
    {
      id: 'p4',
      title: 'Pin Dự phòng thông minh Mavic 3T',
      description: 'Pin thông minh hiệu suất cao dung lượng 5000mAh, hoạt động ổn định trong dải nhiệt độ khắc nghiệt từ -10°C đến 40°C.',
      price: 850000,
      images: ['https://images.unsplash.com/photo-1610483178766-08852b8108b4?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c2',
      seller_id: '1',
      stock: 45,
      sold_count: 38,
      rating: 4.7,
      like_count: 98,
      is_liked: false,
      created_at: '2023-12-10T00:00:00Z'
    },
    {
      id: 'p5',
      title: 'Bộ đàm Kỹ thuật số Mã hóa AES-256',
      description: 'Bộ đàm cầm tay quân dụng mã hóa bảo mật chống nghe trộm cấp quân sự. Chống nước IP67, thời gian đàm thoại liên tục 18 giờ, cự ly liên lạc thực địa lên đến 8km.',
      price: 3500000,
      images: ['https://images.unsplash.com/photo-1543269600-fa37b1b58a9fe?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c3',
      seller_id: '1',
      stock: 30,
      sold_count: 18,
      rating: 4.9,
      like_count: 85,
      is_liked: false,
      created_at: '2023-12-15T00:00:00Z'
    },
    {
      id: 'p6',
      title: 'Tấm sạc Năng lượng Mặt trời Chiến thuật 100W',
      description: 'Vỏ bọc vải dù Cordura siêu bền gấp gọn chống nước, cung cấp nguồn điện sạch sạc pin điện thoại, bộ đàm, UAV tại thao trường tác chiến.',
      price: 750000,
      images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c3',
      seller_id: '1',
      stock: 60,
      sold_count: 22,
      rating: 4.6,
      like_count: 110,
      is_liked: false,
      created_at: '2023-12-18T00:00:00Z'
    },
    {
      id: 'p7',
      title: 'Balo Tác chiến 3 Ngày (3Q ASECO)',
      description: 'Dung tích 40L, chất liệu vải Cordura 1000D chống xé rách và chống thấm. Tích hợp hệ thống đai Molle bố trí thêm trang bị linh hoạt bên ngoài.',
      price: 450000,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c4',
      seller_id: '1',
      stock: 120,
      sold_count: 67,
      rating: 4.8,
      like_count: 195,
      is_liked: false,
      created_at: '2023-12-20T00:00:00Z'
    },
    {
      id: 'p8',
      title: 'Hộp lương khô quân đội cao cấp BB702',
      description: 'Hộp thiếc bảo quản lâu dài, chứa 10 phong lương khô dinh dưỡng cao. Bổ sung năng lượng tức thì và các khoáng chất cần thiết duy trì thể trạng bền bỉ.',
      price: 180000,
      images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c4',
      seller_id: '1',
      stock: 500,
      sold_count: 1200,
      rating: 4.8,
      like_count: 950,
      is_liked: true,
      created_at: '2023-10-15T00:00:00Z'
    },
    {
      id: 'p9',
      title: 'Túi Sơ cứu Y tế Cá nhân Chiến thuật (IFAK)',
      description: 'Túi cứu thương khân cấp tháo nhanh chuyên dụng chứa garo cầm máu CAT Gen 7, gạc chèn vết thương hemostatic, băng dán ngực chống tràn khí màng phổi.',
      price: 320000,
      images: ['https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c5',
      seller_id: '1',
      stock: 90,
      sold_count: 240,
      rating: 4.9,
      like_count: 310,
      is_liked: false,
      created_at: '2023-11-20T00:00:00Z'
    },
    {
      id: 'p10',
      title: 'Bộ Dụng cụ Lau chùi Súng bộ binh Đa năng',
      description: 'Hộp dụng cụ nòng ghép đồng, cọ quét đồng, chổi cước vệ sinh và dung dịch dầu bôi trơn bảo dưỡng súng cầm tay chống gỉ sét do sương muối và độ ẩm.',
      price: 150000,
      images: ['https://images.unsplash.com/photo-1531844251246-9a1bfaae0d76?auto=format&fit=crop&q=80&w=400'],
      category_id: 'c6',
      seller_id: '1',
      stock: 120,
      sold_count: 420,
      rating: 4.9,
      like_count: 410,
      is_liked: false,
      created_at: '2023-12-25T00:00:00Z'
    }
  ];

  const prodStmt = db.prepare('INSERT INTO Products (id, seller_id, category_id, brand_id, title, description, price, images, image_urls, stock, sold_count, rating, like_count, is_liked, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  MOCK_PRODUCTS.forEach(p => {
    prodStmt.run([
      p.id,
      p.seller_id,
      p.category_id,
      'b1',
      p.title,
      p.description,
      p.price,
      JSON.stringify(p.images),
      JSON.stringify(p.images),
      p.stock,
      p.sold_count,
      p.rating,
      p.like_count,
      p.is_liked ? 1 : 0,
      p.created_at
    ]);
  });
  prodStmt.finalize();

  // 5. Seed ProductVariants
  const mockVariants = [
    { id: 'pv1', product_id: 'p1', size: 'Standard Size', color: 'Xanh rêu dã chiến', stock: 30 },
    { id: 'pv2', product_id: 'p1', size: 'Large Capacity', color: 'Cát sa mạc', stock: 20 },
    { id: 'pv3', product_id: 'p2', size: 'Size 41', color: 'Da đen dã ngoại', stock: 10 },
    { id: 'pv4', product_id: 'p2', size: 'Size 42', color: 'Da đen dã ngoại', stock: 10 },
    { id: 'pv5', product_id: 'p3', size: 'Free Size', color: 'Lá cây', stock: 100 }
  ];
  const varStmt = db.prepare('INSERT INTO ProductVariants (id, product_id, size, color, stock) VALUES (?, ?, ?, ?, ?)');
  mockVariants.forEach(v => {
    varStmt.run([v.id, v.product_id, v.size, v.color, v.stock]);
  });
  varStmt.finalize();

  console.log('Ghi dữ liệu thành công!');
});

// Close database connection
db.close((err) => {
  if (err) {
    console.error('Lỗi khi đóng database:', err.message);
  } else {
    console.log('Đã tạo thành công file database pre-populated hoàn hảo tại assets/databases/army_db.db!');
  }
});
