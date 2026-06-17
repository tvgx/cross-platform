# assets/databases

Chứa file CSDL **SQLite đóng gói sẵn (seed)** ship cùng app: **`army_db_v2.db`**.

File này được sinh tự động bởi [scripts/generate-seed-db.js](../../scripts/generate-seed-db.js)
(schema đầy đủ, `user_version=1`, chưa có dữ liệu). App copy nó ra
`${documentDirectory}SQLite/army_db_v2.db` ở lần mở đầu tiên nếu thiết bị chưa có DB.

> ⚠️ Đừng sửa tay file `.db`. Khi đổi schema, hãy sửa cả [lib/storage/sqlite.ts](../../lib/storage/sqlite.ts)
> lẫn generator rồi chạy lại: `npm run seed:db` (hoặc `node scripts/generate-seed-db.js`).

## Khởi tạo & kiểm tra — chạy NGAY khi mở app

`app/_layout.tsx` gọi `DatabaseRepository.bootstrap()` ngay khi app mở và **chặn render**
(gate) cho tới khi CSDL sẵn sàng, nên không màn hình nào truy cập DB trước khi khởi tạo xong:

1. `ensureDatabaseReady()` ([lib/storage/databaseHelper.ts](../../lib/storage/databaseHelper.ts))
   quyết định nạp DB như bảng dưới.
2. `getDatabase()` mở kết nối **sau** khi copy (mở lazy — không mở ở module load).
3. `initDB()` chạy `migrateSchemaIfNeeded()` rồi `CREATE TABLE IF NOT EXISTS`.

| Tình huống | Kết quả |
| --- | --- |
| Đã có file DB ở đường dẫn đích | `exists` — giữ nguyên dữ liệu |
| Chưa có + có seed (`army_db_v2.db`) | `copied` — sao chép seed ra đích |
| Chưa có + không có seed | `fresh` — tạo DB rỗng, `initDB()` dựng schema |

## Migrate schema (vá lệch cột kiểu `no column named price_new`)

- `migrateSchemaIfNeeded()` so `PRAGMA user_version` của thiết bị với `SCHEMA_VERSION`.
  Cũ hơn → **drop & recreate** toàn bộ bảng theo schema mới (dữ liệu local là cache của
  server nên tự đồng bộ lại).
- Khi đổi cấu trúc bảng/cột: **tăng `SCHEMA_VERSION`** trong `sqlite.ts`, cập nhật generator,
  chạy `npm run seed:db`. Thiết bị tự migrate ở lần mở kế tiếp.
- Schema local bám theo [docs/IT4788.sql](../../docs/IT4788.sql) (xem bảng kê tương ứng đầu
  `sqlite.ts`), cộng các cột offline-only (`sync_status`, `price_new`, `images`...).

## Gỡ seed (nếu cần)

Xoá `army_db_v2.db` và đặt `BUNDLED_DATABASE_ASSET = null` trong
[lib/storage/databaseHelper.ts](../../lib/storage/databaseHelper.ts). App sẽ tự tạo DB mới rỗng
ở lần mở kế tiếp. (KHÔNG `require` đường dẫn không tồn tại — Metro sẽ vỡ bundle.)
