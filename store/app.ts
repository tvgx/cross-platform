import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';

interface AppState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDarkMode: false, // Default to light mode (Communist style)
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
