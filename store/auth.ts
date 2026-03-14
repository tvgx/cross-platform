import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isLoggedIn: false,

      setAuth: (user, tokens) =>
        set({ user, tokens, isLoggedIn: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () =>
        set({ user: null, tokens: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
