import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { AppNotification } from '../types';

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  // Actions
  setNotifications: (items: AppNotification[]) => void;
  prependNotifications: (items: AppNotification[]) => void;
  markRead: (id: string | 'all') => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (items) =>
        set({
          notifications: items,
          unreadCount: items.filter((n) => !n.is_read).length,
        }),

      prependNotifications: (items) =>
        set((state) => {
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const fresh = items.filter((n) => !existingIds.has(n.id));
          const merged = [...fresh, ...state.notifications];
          return {
            notifications: merged,
            unreadCount: merged.filter((n) => !n.is_read).length,
          };
        }),

      markRead: (id) =>
        set((state) => {
          const updated =
            id === 'all'
              ? state.notifications.map((n) => ({ ...n, is_read: true }))
              : state.notifications.map((n) =>
                  n.id === id ? { ...n, is_read: true } : n,
                );
          return { notifications: updated, unreadCount: 0 };
        }),
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
