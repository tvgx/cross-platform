import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  balance: number;
  totalSpent: number;
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (partial: Partial<User>) => void;
  setBalance: (balance: number) => void;
  setTotalSpent: (totalSpent: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isLoggedIn: false,
      balance: 0,
      totalSpent: 0,

      setAuth: (user, tokens) =>
        set({ user, tokens, isLoggedIn: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setBalance: (balance) => set({ balance }),
      
      setTotalSpent: (totalSpent) => set({ totalSpent }),

      logout: () =>
        set({ user: null, tokens: null, isLoggedIn: false, balance: 0, totalSpent: 0 }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
