const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://adware-merely-andrews-home.trycloudflare.com';
const dbPath = path.join(__dirname, '../assets/databases/army_db.db');

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối SQLite:', err.message);
    process.exit(1);
  }
});

// Helper for db.all wrapped in a Promise
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper for db.run wrapped in a Promise
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ ĐỒNG BỘ HOÁ OFFLINE-FIRST & HOÀN TIỀN DÃ CHIẾN');
  console.log('================================================================\n');

  try {
    // 1. Lấy thông tin user dã chiến để test
    console.log('[Step 1] Đọc thông tin chiến sĩ từ SQLite local...');
    const users = await dbQuery("SELECT * FROM Users WHERE id = '2' OR username = 'tranvanb';");
    if (users.length === 0) {
      throw new Error('Không tìm thấy chiến sĩ tranvanb trong Database!');
    }
    const user = users[0];
    console.log(` -> Chiến sĩ: ${user.full_name} | Cấp bậc: ${user.rank}`);
    console.log(` -> Số dư ví hiện tại: ${user.virtual_balance} ₫`);

    // Lấy ví từ Wallets
    const wallets = await dbQuery('SELECT * FROM Wallets WHERE user_id = ?', [user.id]);
    const wallet = wallets[0];
    console.log(` -> Số dư bảng Wallets: ${wallet ? wallet.balance : 0} ₫\n`);

    // 2. Lấy JWT Test Token từ Cloudflare
    console.log('[Step 2] Đang lấy JWT Test Token từ máy chủ Cloudflare...');
    let token = '';
    try {
      const tokenRes = await axios.get(`${BASE_URL}/get-test-token`);
      token = tokenRes.data;
      console.log(' -> Lấy token thành công! JWT Token:', token.substring(0, 50) + '...');
    } catch (e) {
      console.error(' -> KHÔNG kết nối được server Cloudflare!', e.message);
      process.exit(1);
    }

    // 3. Giả lập đặt đơn hàng Offline
    console.log('\n[Step 3] Giả lập luồng đặt đơn hàng ngoại tuyến (Offline Order)...');
    const orderId = 'ORD_TEST_' + Math.random().toString(36).substr(2, 9);
    const productId = 1; // ID hợp lệ
    const quantity = 2;
    const price = 50000;
    const totalAmount = price * quantity;

    console.log(` -> Đặt 2 chiếc sản phẩm ID ${productId} với giá ${price} ₫/chiếc`);
    console.log(` -> Tổng thanh toán: ${totalAmount} ₫`);

    // Thực hiện trừ tiền và ghi đơn hàng cục bộ vào SQLite (Offline transition)
    await dbRun('BEGIN TRANSACTION;');
    try {
      // Ghi đơn hàng
      await dbRun(
        `INSERT INTO Orders (id, buyer_id, total_price, status, sync_status, created_at, buyer_coordinates_description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, user.id, totalAmount, 'pending_sync', 'pending_sync', new Date().toISOString(), 'Tiền đồn Hải Phòng - Delta 7']
      );

      // Ghi chi tiết đơn hàng
      await dbRun(
        `INSERT INTO OrderItems (id, order_id, product_id, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [`OI_${orderId}`, orderId, String(productId), price, quantity]
      );

      // Khấu trừ ví ảo của chiến sĩ cục bộ (Users & Wallets)
      await dbRun('UPDATE Users SET virtual_balance = virtual_balance - ? WHERE id = ?', [totalAmount, user.id]);
      await dbRun('UPDATE Wallets SET balance = balance - ? WHERE user_id = ?', [totalAmount, user.id]);

      // Xếp hàng chờ đồng bộ SyncQueue
      const syncPayload = JSON.stringify({
        items: [{ product_id: productId, quantity: quantity }],
        address_id: 1,
        note: 'Giao gấp quân trang'
      });
      await dbRun(
        `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`SQ_${orderId}`, 'ORDER_UPLOAD', orderId, syncPayload, 3, 0, new Date().toISOString()]
      );

      await dbRun('COMMIT;');
      console.log(' -> Trừ tiền cục bộ và ghi SQLite ngoại tuyến thành công!');
    } catch (txErr) {
      await dbRun('ROLLBACK;');
      throw txErr;
    }

    // Đọc số dư ví sau khi trừ tiền cục bộ
    const [userAfter] = await dbQuery('SELECT virtual_balance FROM Users WHERE id = ?', [user.id]);
    console.log(` -> Số dư ví cục bộ sau khi trừ tiền (0ms trễ): ${userAfter.virtual_balance} ₫`);

    // 4. Đồng bộ lên Server Cloudflare (Gọi API thực tế)
    console.log('\n[Step 4] Đồng bộ đơn hàng ngoại tuyến lên Cloudflare...');
    const queueRows = await dbQuery('SELECT * FROM SyncQueue WHERE target_id = ?', [orderId]);
    if (queueRows.length === 0) {
      throw new Error('Không tìm thấy tác vụ đồng bộ trong SyncQueue!');
    }
    const task = queueRows[0];
    const payload = JSON.parse(task.payload);

    // Chuẩn hoá CreateOrderDto để gửi lên server
    const apiPayload = {
      items: payload.items.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity
      })),
      source: 'mobile',
      address_id: payload.address_id
    };

    console.log(' -> Gửi CreateOrderDto:', JSON.stringify(apiPayload));

    let syncSuccess = false;
    let rollbackReason = '';

    try {
      const response = await axios.post(`${BASE_URL}/order/create_order`, apiPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(' -> Server response status:', response.status);
      console.log(' -> Server response data:', response.data);

      if (response.data && (response.data.code === '1000' || response.status === 201)) {
        syncSuccess = true;
      } else {
        rollbackReason = response.data.message || 'Lỗi không xác định từ server';
      }
    } catch (err) {
      console.log(' -> Đồng bộ thất bại do lỗi mạng hoặc nghiệp vụ!');
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message || err.message;
        console.log(` -> Mã lỗi: ${status} | Nội dung: ${msg}`);

        if (status >= 400 && status < 500) {
          // Lỗi nghiệp vụ (Status 4xx: Hết hàng, Sai thông tin...) -> Kích hoạt rollback hoàn tiền cục bộ
          rollbackReason = `Mã lỗi ${status}: ${msg}`;
        }
      } else {
        console.log(' -> Lỗi kết nối mạng tạm thời:', err.message);
      }
    }

    // 5. Cập nhật SQLite sau khi đồng bộ hoặc Hoàn tiền (Rollback)
    if (syncSuccess) {
      console.log('\n[Step 5] Cập nhật SQLite thành công sau khi đồng bộ...');
      await dbRun("UPDATE Orders SET status = 'synced', sync_status = 'synced' WHERE id = ?", [orderId]);
      await dbRun('DELETE FROM SyncQueue WHERE id = ?', [task.id]);
      console.log(' -> Đơn hàng đã được đánh dấu: synced.');
      console.log(' -> Tác vụ đã được xoá khỏi SyncQueue.');
    } else if (rollbackReason) {
      console.log('\n[Step 5] [KÍCH HOẠT HOÀN TIỀN DÃ CHIẾN] Tiến hành rollback số dư ví cục bộ...');
      await dbRun('BEGIN TRANSACTION;');
      try {
        // Hoàn tiền bảng Users & Wallets
        await dbRun('UPDATE Users SET virtual_balance = virtual_balance + ? WHERE id = ?', [totalAmount, user.id]);
        await dbRun('UPDATE Wallets SET balance = balance + ? WHERE user_id = ?', [totalAmount, user.id]);

        // Cập nhật trạng thái đơn hàng thành cancelled
        await dbRun("UPDATE Orders SET status = 'cancelled', sync_status = 'failed', buyer_coordinates_description = ? WHERE id = ?", [
          `Hoàn tiền do: ${rollbackReason}`,
          orderId
        ]);

        // Tạo giao dịch EARN ghi nhận hoàn tiền rõ ràng
        await dbRun(
          `INSERT INTO Transactions (id, wallet_id, type, amount, status, description, order_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [`TX_REF_${orderId}`, wallet.id, 'EARN', totalAmount, 'completed', `Hoàn tiền tự động cho đơn ${orderId}`, orderId, new Date().toISOString()]
        );

        // Xoá tác vụ khỏi SyncQueue (Tránh retry vô hạn với lỗi nghiệp vụ)
        await dbRun('DELETE FROM SyncQueue WHERE id = ?', [task.id]);

        await dbRun('COMMIT;');
        console.log(` -> Hoàn lại ${totalAmount} ₫ thành công cho chiến sĩ!`);
        console.log(` -> Lí do hoàn tiền: ${rollbackReason}`);
      } catch (rollbackErr) {
        await dbRun('ROLLBACK;');
        console.error('Lỗi khi thực hiện rollback hoàn tiền:', rollbackErr);
      }
    } else {
      console.log('\n[Step 5] Lỗi kết nối mạng tạm thời (5xx/Timeout). Giữ nguyên đơn hàng ngoại tuyến để thử lại sau.');
    }

    // 6. Kiểm tra lại trạng thái cuối cùng trong database
    console.log('\n[Step 6] Kiểm tra trạng thái cuối cùng của Database...');
    const [finalUser] = await dbQuery('SELECT virtual_balance FROM Users WHERE id = ?', [user.id]);
    const [finalOrder] = await dbQuery('SELECT * FROM Orders WHERE id = ?', [orderId]);
    const finalQueue = await dbQuery('SELECT COUNT(*) as count FROM SyncQueue WHERE target_id = ?', [orderId]);

    console.log(` -> Số dư ví cuối cùng: ${finalUser.virtual_balance} ₫`);
    console.log(` -> Trạng thái Đơn hàng: status = '${finalOrder.status}' | sync_status = '${finalOrder.sync_status}'`);
    console.log(` -> Số tác vụ còn lại trong SyncQueue cho đơn này: ${finalQueue[0].count}`);

    console.log('\n================================================================');
    console.log('             HOÀN THÀNH KIỂM THỬ ĐỒNG BỘ DÃ CHIẾN!');
    console.log('================================================================');

  } catch (error) {
    console.error('\n[LỖI NGHIÊM TRỌNG TRONG KIỂM THỬ]:', error.message);
  } finally {
    db.close();
  }
}

runVerification();
