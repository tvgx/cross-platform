import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStoredJSON, removeStored } from '../storage/mmkv';
import type { AuthTokens } from '../../types';
import { useNetworkStore } from '../../store/network';

// Set EXPO_PUBLIC_API_URL in your .env file.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach Bearer token ─────────────────────────────────

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
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 & Network Errors ─────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as any;
      if (dataObj.code !== undefined) {
        const codeStr = String(dataObj.code);
        dataObj.success = codeStr === '1000' || codeStr === '9994' || codeStr === '200' || codeStr === '201' || (response.status >= 200 && response.status < 300 && codeStr !== '1004' && codeStr !== '9999');
      } else {
        dataObj.success = response.status >= 200 && response.status < 300;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — clear credentials so the auth store re-hydrates
      // and triggers a logout on next render.
      removeStored('auth_tokens');
      removeStored('auth-storage');  // zustand persist key
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      // If it's a network error or timeout, we might want to flag the backend as dead
      useNetworkStore.getState().setBackendAlive(false);
    }
    return Promise.reject(error);
  },
);

// ─── Helper: unified API call ─────────────────────────────────────────────────

export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const networkStore = useNetworkStore.getState();
  
  if (!networkStore.isBackendAlive) {
    console.log(`[API Client] Backend is marked as dead (Offline Mode). Pinging health check in background...`);
    // Ping background to recover if backend is back up
    networkStore.checkBackendHealth();
    
    // Throw error so caller falls back to Local immediately
    return Promise.reject(new Error('Local Mode Only'));
  }

  const response = await apiClient.request<T>({ method, url, data, params });
  return response.data;
}
