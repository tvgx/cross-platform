import { Platform } from 'react-native';
import { closeDatabase, db, getDatabase, initDB, isSchemaInitialized } from '../storage/sqlite';
import {
  DATABASE_NAME,
  databaseFileExists,
  deleteDatabaseFile,
  ensureDatabaseReady,
  getDatabasePath,
  type DatabasePrepareResult,
} from '../storage/databaseHelper';

/**
 * DatabaseRepository — CHỊU TRÁCH NHIỆM TẠO VÀ ĐIỀU KHIỂN vòng đời CSDL SQLite.
 *
 * Khác với các repository thực thể (User/Product/Order...) chỉ đọc-ghi dữ liệu,
 * repo này quản lý chính file CSDL: chuẩn bị (nạp DB seed từ assets hoặc tạo mới
 * khi chưa có), dựng schema, báo cáo trạng thái và reset khi cần.
 *
 * Luồng bootstrap (gọi 1 lần lúc app khởi động — xem RepositoryProvider):
 *   1. ensureDatabaseReady()  → quyết định 'exists' | 'copied' | 'fresh'.
 *   2. initDB()               → dựng schema (CREATE TABLE IF NOT EXISTS, idempotent).
 */

// Các bảng chính dùng cho báo cáo trạng thái (getStatus).
const CORE_TABLES = [
  'Users',
  'Products',
  'Orders',
  'OrderItems',
  'Posts',
  'Messages',
  'Conversations',
  'SyncQueue',
  'ServerResponseCache',
] as const;

let bootstrapped = false;
let bootstrapPromise: Promise<DatabasePrepareResult> | null = null;

export const DatabaseRepository = {
  /** Tên file CSDL (nguồn sự thật từ databaseHelper). */
  getDatabaseName(): string {
    return DATABASE_NAME;
  },

  /** Đường dẫn tuyệt đối tới file CSDL trên thiết bị. */
  getDatabasePath(): string {
    return getDatabasePath();
  },

  /**
   * Bootstrap CSDL — an toàn khi gọi nhiều lần (idempotent, chống chạy song song).
   *
   * Trả về kết quả chuẩn bị: 'exists' | 'copied' | 'fresh'.
   * 'fresh' nghĩa là KHÔNG tìm thấy DB ở đường dẫn → đã khởi tạo mới.
   */
  async bootstrap(): Promise<DatabasePrepareResult> {
    if (bootstrapped) return 'exists';
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      let result: DatabasePrepareResult = 'fresh';
      try {
        result = await ensureDatabaseReady();
        if (result === 'fresh') {
          console.log(`[DatabaseRepo] Không có CSDL "${DATABASE_NAME}" ở đường dẫn đích — tiến hành khởi tạo mới.`);
        }
        // Mở kết nối SAU khi đã copy seed (nếu có) để mở đúng file đã nạp.
        getDatabase();
      } catch (e) {
        console.error('[DatabaseRepo] Lỗi chuẩn bị CSDL:', e);
      } finally {
        // Luôn dựng schema để app chạy được, kể cả khi bước chuẩn bị lỗi.
        try {
          initDB();
        } catch (e) {
          console.error('[DatabaseRepo] Lỗi dựng schema CSDL:', e);
        }
        bootstrapped = isSchemaInitialized();
        bootstrapPromise = null;
        console.log(`[DatabaseRepo] CSDL sẵn sàng (trạng thái chuẩn bị: ${result}).`);
      }
      return result;
    })();

    return bootstrapPromise;
  },

  /** CSDL đã bootstrap và schema đã dựng xong chưa. */
  isReady(): boolean {
    return bootstrapped && isSchemaInitialized();
  },

  /** Kiểm tra file CSDL có tồn tại trên đĩa không (web luôn true — in-memory). */
  async exists(): Promise<boolean> {
    return databaseFileExists();
  },

  /**
   * Báo cáo trạng thái CSDL: tên, đường dẫn, đã dựng schema chưa, và số hàng
   * của các bảng chính. Giá trị -1 nghĩa là bảng chưa tồn tại / truy vấn lỗi.
   */
  getStatus(): Record<string, string | number | boolean> {
    const status: Record<string, string | number | boolean> = {
      name: DATABASE_NAME,
      path: getDatabasePath(),
      schemaInitialized: isSchemaInitialized(),
    };

    for (const table of CORE_TABLES) {
      try {
        const row = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`);
        status[table] = row?.c ?? 0;
      } catch {
        status[table] = -1;
      }
    }

    return status;
  },

  /**
   * Reset CSDL: đóng kết nối, xoá file, rồi bootstrap lại (copy seed + dựng schema).
   * Dùng cho dev / recovery khi DB hỏng schema. Web (AlaSQL in-memory) không áp dụng.
   */
  async reset(): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('[DatabaseRepo] reset() không áp dụng trên web (AlaSQL in-memory) — hãy tải lại trang.');
      return;
    }
    closeDatabase();
    await deleteDatabaseFile();
    bootstrapped = false;
    await this.bootstrap();
    console.log('[DatabaseRepo] Đã reset CSDL về trạng thái seed ban đầu.');
  },
};
