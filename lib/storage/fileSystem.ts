import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  downloadAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

const CACHE_FOLDER = `${documentDirectory}cache/`;
const UPLOADS_FOLDER = `${documentDirectory}uploads/`;

/**
 * Đảm bảo thư mục tồn tại
 */
export const ensureDirExists = async (dirPath: string) => {
  const dir = await getInfoAsync(dirPath);
  if (!dir.exists) {
    await makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

/**
 * Lưu file vào cache cục bộ (Dành cho Media chiến tích)
 * @param sourceUri URI tạm thời (từ ImagePicker)
 * @returns URI cục bộ bền vững
 */
export const cacheMedia = async (sourceUri: string): Promise<string> => {
  await ensureDirExists(CACHE_FOLDER);
  
  const ext = sourceUri.split('.').pop();
  const filename = `POCA_${Date.now()}.${ext}`;
  const destUri = CACHE_FOLDER + filename;

  await copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};

/**
 * Xóa file khỏi cache
 * CHỈ gọi hàm này sau khi sync_status === 'synced'
 */
export const clearFileCache = async (fileUri: string) => {
  try {
    const info = await getInfoAsync(fileUri);
    if (info.exists) {
      await deleteAsync(fileUri);
      console.log(`[Cache] Đã xóa file: ${fileUri}`);
    }
  } catch (err) {
    console.error(`[Cache] Lỗi khi xóa file: ${fileUri}`, err);
  }
};

/**
 * Các hàm cũ được giữ lại để tương thích ngược (Legacy)
 */
export const saveFileToLocal = async (sourceUri: string, folder: string = 'uploads'): Promise<string> => {
  const folderUri = `${documentDirectory}${folder}/`;
  await ensureDirExists(folderUri);
  const filename = sourceUri.split('/').pop() || `file_${Date.now()}`;
  const destUri = folderUri + filename;
  await copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};

export const downloadFileToLocal = async (url: string, folder: string = 'downloads'): Promise<string> => {
  const folderUri = `${documentDirectory}${folder}/`;
  await ensureDirExists(folderUri);
  const filename = url.split('/').pop()?.split('?')[0] || `file_${Date.now()}`;
  const destUri = folderUri + filename;
  const fileInfo = await getInfoAsync(destUri);
  if (fileInfo.exists) return destUri;
  const result = await downloadAsync(url, destUri);
  return result.uri;
};
