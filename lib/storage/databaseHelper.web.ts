/**
 * SQLite Helper (bản WEB).
 *
 * Trên web, dự án dùng AlaSQL (in-memory, xem `sqlite.web.ts`) → KHÔNG có file
 * CSDL trên đĩa. Các hàm dưới đây chỉ là stub giữ tương thích API với bản native
 * để `DatabaseRepository` chạy chung một interface trên mọi nền tảng.
 */

export const DATABASE_NAME = 'army_db_v2.db';
export const BUNDLED_DATABASE_ASSET: number | null = null;

export type DatabasePrepareResult = 'exists' | 'copied' | 'fresh';

export const getDatabaseDirectory = (): string => '(web:memory)';
export const getDatabasePath = (): string => '(web:memory)';

/** Web dùng in-memory DB nên coi như luôn "sẵn sàng". */
export const databaseFileExists = async (): Promise<boolean> => true;

/** Web không cần sao chép file; AlaSQL dựng schema ngay khi nạp module. */
export const ensureDatabaseReady = async (): Promise<DatabasePrepareResult> => 'exists';

/** Không có file để xoá trên web. */
export const deleteDatabaseFile = async (): Promise<void> => {};
