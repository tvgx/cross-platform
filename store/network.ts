import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineAt: number | null;
  // Actions
  setOnline: (value: boolean) => void;
  setConnecting: (value: boolean) => void;
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  isOnline: true, // optimistic default until NetInfo fires
  isConnecting: false,
  lastOnlineAt: null,

  setOnline: (value) =>
    set((state) => ({
      isOnline: value,
      lastOnlineAt: value ? Date.now() : state.lastOnlineAt,
    })),

  setConnecting: (value) => set({ isConnecting: value }),
}));
