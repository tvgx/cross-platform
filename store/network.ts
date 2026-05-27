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
      // Perform a lightweight request to check backend connectivity
      await axios.get(`${BASE_URL}/check_new_items`, {
        timeout: 5000,
        params: { since: '2024-01-01' }
      });
      set({ isBackendAlive: true });
      console.log('[Network] Backend is ALIVE.');
    } catch (error) {
      console.warn('[Network] Backend health check FAILED. Switching to Offline Mode.');
      set({ isBackendAlive: false });
    }
  }
}));
