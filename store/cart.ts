import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { CartItem } from '../types';
function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CartState {
  items: CartItem[];
  selectedIds: string[];
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelection: (id: string) => void;
  selectAll: (select: boolean) => void;
  clear: () => void;
  clearSelected: () => void;
  // Selectors
  total: () => number;
  selectedTotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedIds: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id && i.variant_id === item.variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          const newId = genId();
          return { 
            items: [...state.items, { ...item, id: newId }],
            selectedIds: [...state.selectedIds, newId] // Tự động chọn khi thêm mới
          };
        }),

      removeItem: (id) =>
        set((state) => ({ 
          items: state.items.filter((i) => i.id !== id),
          selectedIds: state.selectedIds.filter((selId) => selId !== id)
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.id !== id),
              selectedIds: state.selectedIds.filter((selId) => selId !== id)
            };
          }
          return {
            items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i))
          };
        }),

      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter(selId => selId !== id)
            : [...state.selectedIds, id]
        })),

      selectAll: (select) =>
        set((state) => ({
          selectedIds: select ? state.items.map(i => i.id) : []
        })),

      clear: () => set({ items: [], selectedIds: [] }),
      
      clearSelected: () =>
        set((state) => ({
          items: state.items.filter(i => !state.selectedIds.includes(i.id)),
          selectedIds: []
        })),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      selectedTotal: () => {
        const state = get();
        return state.items
          .filter(i => state.selectedIds.includes(i.id))
          .reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
