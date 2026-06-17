import { apiClient } from '../client';
import type { ApiResponse } from '../../../types';

/**
 * Upload file lên server (POST /upload/file — multipart/form-data).
 *
 * Đi thẳng qua apiClient (không qua apiCall) vì:
 *   - apiCall mặc định Content-Type JSON, không phù hợp multipart;
 *   - upload là mutation, không cần cache offline.
 * Interceptor response của apiClient vẫn chạy (map mã lỗi server → tiếng Việt như mọi API khác).
 */
export const uploadApi = {
  uploadFile: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // RN FormData nhận object { uri, name, type } cho phần file.
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    const res = await apiClient.post<ApiResponse<{ url: string }>>('/upload/file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
