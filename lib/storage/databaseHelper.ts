import { Asset } from 'expo-asset';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

/**
 * SQLite Helper — tầng thao tác FILE của CSDL (không đụng tới schema/SQL).
 * Chịu trách nhiệm: phân giải đường dẫn, kiểm tra tồn tại, sao chép DB đóng gói
 * sẵn từ assets/databases, và quyết định "tạo mới khi chưa có DB ở đường dẫn".
 *
 * DatabaseRepository dùng helper này để ĐIỀU KHIỂN vòng đời CSDL.
 */

/**
 * Tên file CSDL SQLite cục bộ (dã chiến). Đây là NGUỒN SỰ THẬT DUY NHẤT cho
 * tên DB — cả `sqlite.ts` lẫn `DatabaseRepository` đều tham chiếu hằng này.
 */
export const DATABASE_NAME = 'army_db_v2.db';

/**
 * (TÙY CHỌN) CSDL đóng gói sẵn đặt trong `assets/databases/`.
 *
 * File seed: `assets/databases/army_db_v2.db` (sinh bởi scripts/generate-seed-db.js).
 * Metro bundle được nhờ đã thêm 'db' vào resolver.assetExts (metro.config.js).
 *
 * LƯU Ý: KHÔNG được `require` một đường dẫn không tồn tại — Metro sẽ vỡ bundle.
 * Nếu xoá file seed, đặt lại biến này về `null`.
 */
export const BUNDLED_DATABASE_ASSET: number | null = require('../../assets/databases/army_db_v2.db');

/** Thư mục expo-sqlite lưu các file .db: `${documentDirectory}SQLite`. */
export const getDatabaseDirectory = (): string => `${documentDirectory}SQLite`;

/** Đường dẫn tuyệt đối tới file CSDL trên thiết bị. */
export const getDatabasePath = (): string => `${getDatabaseDirectory()}/${DATABASE_NAME}`;

/** Kết quả của bước chuẩn bị CSDL. */
export type DatabasePrepareResult = 'exists' | 'copied' | 'fresh';

/** Kiểm tra file CSDL đã tồn tại ở đường dẫn đích trên thiết bị chưa. */
export const databaseFileExists = async (): Promise<boolean> => {
  try {
    const info = await getInfoAsync(getDatabasePath());
    return info.exists;
  } catch (e) {
    console.warn('[DBHelper] Lỗi kiểm tra tồn tại file CSDL:', e);
    return false;
  }
};

/** Đảm bảo thư mục SQLite tồn tại trước khi mở/sao chép DB. */
const ensureDatabaseDirectory = async (): Promise<void> => {
  const dir = getDatabaseDirectory();
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
};

/**
 * LOGIC KHỞI TẠO CỐT LÕI: đảm bảo có DB ở đường dẫn đích TRƯỚC khi mở.
 *
 * - File đã có            → 'exists' (giữ nguyên dữ liệu cục bộ).
 * - Chưa có + có DB seed   → sao chép từ assets/databases ra đích → 'copied'.
 * - Chưa có + không seed    → 'fresh' (openDatabaseSync + initDB sẽ tự dựng DB rỗng).
 *
 * Phải gọi TRƯỚC khi mở DB nếu muốn nạp DB seed từ assets.
 */
export const ensureDatabaseReady = async (): Promise<DatabasePrepareResult> => {
  try {
    if (await databaseFileExists()) {
      return 'exists';
    }

    await ensureDatabaseDirectory();

    if (BUNDLED_DATABASE_ASSET != null) {
      const asset = Asset.fromModule(BUNDLED_DATABASE_ASSET);
      await asset.downloadAsync();
      const source = asset.localUri ?? asset.uri;
      if (source) {
        await copyAsync({ from: source, to: getDatabasePath() });
        console.log('[DBHelper] Đã sao chép CSDL đóng gói từ assets/databases ra đường dẫn đích.');
        return 'copied';
      }
    }

    console.log('[DBHelper] Chưa có CSDL ở đường dẫn đích — sẽ tạo mới rỗng và dựng schema.');
    return 'fresh';
  } catch (e) {
    console.error('[DBHelper] Lỗi chuẩn bị CSDL, fallback sang tạo mới:', e);
    return 'fresh';
  }
};

/** Xoá hẳn file CSDL khỏi đĩa (phục vụ reset / recovery). */
export const deleteDatabaseFile = async (): Promise<void> => {
  try {
    const path = getDatabasePath();
    const info = await getInfoAsync(path);
    if (info.exists) {
      await deleteAsync(path, { idempotent: true });
      console.log('[DBHelper] Đã xoá file CSDL:', path);
    }
  } catch (e) {
    console.error('[DBHelper] Lỗi xoá file CSDL:', e);
  }
};
