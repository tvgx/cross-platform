import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { SyncOperation } from '../types';
import { apiClient } from '../lib/api/client';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface SyncQueueState {
  queue: SyncOperation[];
  isProcessing: boolean;
  // Actions
  enqueue: (op: Omit<SyncOperation, 'id' | 'queued_at' | 'retry_count'>) => void;
  dequeue: (id: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

const MAX_RETRIES = 3;

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueue: (op) =>
        set((state) => ({
          queue: [
            ...state.queue,
            { ...op, id: genId(), queued_at: Date.now(), retry_count: 0 },
          ],
        })),

      dequeue: (id) =>
        set((state) => ({ queue: state.queue.filter((op) => op.id !== id) })),

      processQueue: async () => {
        const { queue, isProcessing } = get();
        if (isProcessing || queue.length === 0) return;

        set({ isProcessing: true });

        for (const op of [...queue]) {
          try {
            await apiClient.request({
              method: op.method,
              url: op.endpoint,
              data: op.data,
            });
            get().dequeue(op.id);
          } catch {
            if (op.retry_count >= MAX_RETRIES) {
              // Give up after MAX_RETRIES attempts
              get().dequeue(op.id);
            } else {
              // Increment retry counter in place
              set((state) => ({
                queue: state.queue.map((item) =>
                  item.id === op.id
                    ? { ...item, retry_count: item.retry_count + 1 }
                    : item,
                ),
              }));
            }
          }
        }

        set({ isProcessing: false });
      },

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'sync-queue-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
