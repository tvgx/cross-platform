import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  downloadAsync,
} from 'expo-file-system';

// Ensure directories exist
export const ensureDirExists = async (dirPath: string) => {
  const dir = await getInfoAsync(dirPath);
  if (!dir.exists) {
    await makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

/**
 * Copies a local file URI (e.g., from image picker) to the persistent documents directory
 * @param sourceUri The temporary file URI
 * @param folder 'uploads' or 'downloads'
 * @returns The permanent local URI
 */
export const saveFileToLocal = async (sourceUri: string, folder: string = 'uploads'): Promise<string> => {
  if (!documentDirectory) {
    throw new Error('documentDirectory is null — not supported on this platform');
  }
  const folderUri = documentDirectory + folder + '/';
  await ensureDirExists(folderUri);

  const filename = sourceUri.split('/').pop() || `file_${Date.now()}`;
  const destUri = folderUri + filename;

  await copyAsync({ from: sourceUri, to: destUri });

  return destUri;
};

/**
 * Downloads a file from a remote URL to the persistent documents directory
 * @param url The remote URL
 * @param folder 'downloads'
 * @returns The permanent local URI
 */
export const downloadFileToLocal = async (url: string, folder: string = 'downloads'): Promise<string> => {
  if (!documentDirectory) {
    throw new Error('documentDirectory is null — not supported on this platform');
  }
  const folderUri = documentDirectory + folder + '/';
  await ensureDirExists(folderUri);

  const filename = url.split('/').pop()?.split('?')[0] || `file_${Date.now()}`;
  const destUri = folderUri + filename;

  // Return cached file if it already exists
  const fileInfo = await getInfoAsync(destUri);
  if (fileInfo.exists) {
    return destUri;
  }

  const result = await downloadAsync(url, destUri);
  return result.uri;
};
