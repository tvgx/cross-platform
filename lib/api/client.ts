import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStoredJSON, removeStored } from '../storage/mmkv';
import type { AuthTokens } from '../../types';

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
    const tokens = getStoredJSON<AuthTokens>('auth_tokens');
    if (tokens?.access_token) {
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 ────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — clear credentials so the auth store re-hydrates
      // and triggers a logout on next render.
      removeStored('auth_tokens');
      removeStored('auth-storage');  // zustand persist key
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
  const response = await apiClient.request<T>({ method, url, data, params });
  return response.data;
}
