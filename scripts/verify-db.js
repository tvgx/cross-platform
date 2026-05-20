const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../assets/databases/army_db.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi mở database:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('=== VERIFYING SQLITE DATABASE CONTENT ===\n');

  // Query all tables in the database
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", [], (err, tables) => {
    if (err) {
      console.error('Lỗi khi truy vấn danh sách bảng:', err.message);
      return;
    }

    console.log(`Số lượng bảng tìm thấy: ${tables.length}`);
    console.log('Danh sách các bảng:', tables.map(t => t.name).join(', '));
    console.log('\n--- Kiểm tra chi tiết số lượng dòng dữ liệu ---');

    let completed = 0;
    tables.forEach((table) => {
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, row) => {
        if (err) {
          console.error(`Lỗi đếm số dòng bảng ${table.name}:`, err.message);
        } else {
          console.log(`Bảng: ${table.name.padEnd(20)} | Số dòng dữ liệu: ${row.count}`);
        }

        completed++;
        if (completed === tables.length) {
          verifyForeignKeys();
        }
      });
    });
  });

  function verifyForeignKeys() {
    console.log('\n--- Kiểm tra ràng buộc khóa ngoại (PRAGMA foreign_key_check) ---');
    db.all('PRAGMA foreign_key_check;', [], (err, rows) => {
      if (err) {
        console.error('Lỗi khi chạy PRAGMA foreign_key_check:', err.message);
      } else if (rows.length === 0) {
        console.log('Không phát hiện lỗi vi phạm ràng buộc khóa ngoại! Database hoàn toàn toàn vẹn.');
      } else {
        console.warn('CẢNH BÁO: Phát hiện các vi phạm khóa ngoại:', rows);
      }
      
      console.log('\n--- Truy vấn thử sản phẩm kèm thông tin người bán ---');
      db.all(`
        SELECT p.id, p.title, p.price, u.full_name as seller_name, u.rank, u.unit 
        FROM Products p 
        JOIN Users u ON p.seller_id = u.id 
        LIMIT 3
      `, [], (err, rows) => {
        if (err) {
          console.error('Lỗi khi JOIN Products và Users:', err.message);
        } else {
          console.log('3 Sản phẩm mẫu:');
          rows.forEach(r => {
            console.log(` - ID: ${r.id} | Tên: ${r.title} | Giá: ${r.price} VNĐ | Người bán: ${r.seller_name} (${r.rank} - ${r.unit})`);
          });
        }
        closeDb();
      });
    });
  }

  function closeDb() {
    db.close((err) => {
      if (err) {
        console.error('Lỗi khi đóng database:', err.message);
      } else {
        console.log('\n=== HOÀN TẤT KIỂM TRA ===');
      }
    });
  }
});
