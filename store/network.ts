import { create } from 'zustand';
import axios from 'axios';

interface NetworkState {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineAt: number | null;
  isBackendAlive: boolean;
  
  // Actions
  setOnline: (value: boolean) => void;
  setConnecting: (value: boolean) => void;
  setBackendAlive: (value: boolean) => void;
  checkBackendHealth: () => Promise<void>;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

export const useNetworkStore = create<NetworkState>()((set, get) => ({
  isOnline: true, // optimistic default until NetInfo fires
  isConnecting: false,
  lastOnlineAt: null,
  isBackendAlive: true, // optimistic default

  setOnline: (value) =>
    set((state) => ({
      isOnline: value,
      lastOnlineAt: value ? Date.now() : state.lastOnlineAt,
    })),

  setConnecting: (value) => set({ isConnecting: value }),

  setBackendAlive: (value) => set({ isBackendAlive: value }),

  checkBackendHealth: async () => {
    try {
      // Ping endpoint công khai có thật trên server ("/" — App root) để kiểm tra backend.
      // Coi mọi HTTP response (kể cả 4xx) là "backend sống"; chỉ lỗi mạng mới là chết.
      await axios.get(BASE_URL, { timeout: 5000 });
      set({ isBackendAlive: true });
      console.log('[Network] Backend is ALIVE.');
    } catch (error: any) {
      // Có response (server trả lỗi nghiệp vụ/HTTP) ⇒ backend vẫn sống.
      if (error?.response) {
        set({ isBackendAlive: true });
        console.log('[Network] Backend ALIVE (responded with status).');
        return;
      }
      console.warn('[Network] Backend health check FAILED. Switching to Offline Mode.');
      set({ isBackendAlive: false });
    }
  }
}));
