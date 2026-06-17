import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useNetworkStore } from '../../store/network';
import type { AuthTokens } from '../../types';
import { getStoredJSON, removeStored } from '../storage/mmkv';
import { getCachedServerResponse, saveServerResponseCache } from '../storage/serverResponseCache';
import { persistServerResponse } from '../storage/responsePersistence';
import { getMessageForCode, isSuccessCode, TOKEN_INVALID_CODE } from '../helpers/errorMapper';

// Set EXPO_PUBLIC_API_URL in your .env file.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = '';

    // 1. Thử lấy từ auth_tokens trực tiếp
    const tokens = getStoredJSON<AuthTokens>('auth_tokens');
    if (tokens?.access_token) {
      token = tokens.access_token;
    } else {
      // 2. Thử lấy từ Zustand persisted store 'auth-storage'
      const authPersist = getStoredJSON<{ state: { tokens: AuthTokens | null } }>('auth-storage');
      if (authPersist?.state?.tokens?.access_token) {
        token = authPersist.state.tokens.access_token;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // --- VERBOSE LOGGING: REQUEST (chỉ ở chế độ dev để tránh lộ payload nhạy cảm) ---
    if (__DEV__) {
      const payloadLog = config.data ? ` - Payload: ${JSON.stringify(config.data)}` : '';
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}${payloadLog}`);
    }
    // --------------------------------

    return config;
  },
  (error) => {
    console.error(`[API REQUEST ERROR]`, error);
    const sanitizedError = new Error(error.message);
    return Promise.reject(sanitizedError);
  },
);

// Response interceptor: handle 401 & Network Errors

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as any;
      const codeStr = dataObj.code !== undefined ? String(dataObj.code) : undefined;

      // Allowlist: chỉ các mã thành công (1000/9994/200/201) mới được coi là OK.
      // Nếu response không có field `code` thì dựa trên HTTP status.
      dataObj.success = codeStr === undefined
        ? response.status >= 200 && response.status < 300
        : isSuccessCode(codeStr);

      // Token hết hạn trả về ở body 200 → xóa phiên để buộc đăng nhập lại.
      if (codeStr === TOKEN_INVALID_CODE) {
        removeStored('auth_tokens');
        removeStored('auth-storage');
        console.warn(`[API RESPONSE 9998] Token hết hạn tại ${response.config.url}`);
        const err = new Error(getMessageForCode(codeStr, dataObj.message));
        (err as any).serverCode = codeStr;
        (err as any).response = { status: response.status, data: dataObj };
        return Promise.reject(err);
      }

      if (!dataObj.success) {
        const msg = getMessageForCode(codeStr, dataObj.message);
        console.warn(`[API RESPONSE ERROR] ${response.config.method?.toUpperCase()} ${response.config.url} - Code: ${dataObj.code}, Message: ${msg}`);
        const err = new Error(msg);
        (err as any).serverCode = codeStr;
        (err as any).response = { status: response.status, data: dataObj };
        return Promise.reject(err);
      }

      // --- VERBOSE LOGGING: SUCCESS RESPONSE (chỉ dev) ---
      if (__DEV__) {
        console.log(`[API RESPONSE SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url}`);
        console.log(`[API RESPONSE DATA]`, JSON.stringify(dataObj));
      }
      // -----------------------------------------
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired - clear credentials so the auth store re-hydrates
      // and triggers a logout on next render.
      removeStored('auth_tokens');
      removeStored('auth-storage');  // zustand persist key
      console.error(`[API RESPONSE 401] Token expired or unauthorized.`);
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      // If it's a network error or timeout, flag the backend as dead
      useNetworkStore.getState().setBackendAlive(false);
      console.error(`[API NETWORK ERROR] Code: ${error.code}`);
    } else {
      console.error(`[API RESPONSE ERROR] Status: ${error.response?.status}, Data:`, error.response?.data);
    }
    const sanitizedError = new Error(error.message);
    (sanitizedError as any).code = error.code;
    if (error.response) {
      (sanitizedError as any).response = {
        status: error.response.status,
        data: error.response.data,
      };
    }
    return Promise.reject(sanitizedError);
  },
);

// Helper: unified API call

export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const networkStore = useNetworkStore.getState();
  const cachedResponse = () => getCachedServerResponse<T>(method, url, data, params);

  if (!networkStore.isOnline || !networkStore.isBackendAlive) {
    console.log(`[API Client] Device offline or backend dead. Falling back to Local Cache.`);
    if (!networkStore.isBackendAlive) {
      networkStore.checkBackendHealth();
    }

    const cached = cachedResponse();
    if (cached) return cached;

    const offlineError = new Error('Local Mode Only');
    (offlineError as any).code = 'ERR_NETWORK';
    return Promise.reject(offlineError);
  }

  try {
    const response = await apiClient.request<T>({ method, url, data, params });
    saveServerResponseCache(method, url, data, params, response.data);
    // Tự động điền dữ liệu server vào đúng bảng SQLite (upsert: xoá cũ, áp dụng mới).
    persistServerResponse(method, url, response.data);
    return response.data;
  } catch (error: any) {
    if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || !error?.response) {
      const cached = cachedResponse();
      if (cached) {
        console.log(`[API Client] Returning cached response for ${method} ${url}.`);
        return cached;
      }
    }
    return Promise.reject(error);
  }
}
