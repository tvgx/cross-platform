import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { Category, Brand, ProductListItem } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

interface CatalogState {
  categories: Category[];
  brands: Brand[];
  products: ProductListItem[];
  lastSyncedAt: number | null;
  isFetching: boolean;
  // Actions
  setCategories: (cats: Category[]) => void;
  setBrands: (brands: Brand[]) => void;
  setProducts: (products: ProductListItem[]) => void;
  appendProducts: (products: ProductListItem[]) => void;
  markSynced: () => void;
  setFetching: (value: boolean) => void;
  /** Returns true when cache is stale or empty */
  isStale: () => boolean;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: [],
      brands: [],
      products: [],
      lastSyncedAt: null,
      isFetching: false,

      setCategories: (cats) => set({ categories: cats }),
      setBrands: (brands) => set({ brands }),
      setProducts: (products) => set({ products }),
      appendProducts: (incoming) =>
        set((state) => {
          const existingIds = new Set(state.products.map((p) => p.id));
          const fresh = incoming.filter((p) => !existingIds.has(p.id));
          return { products: [...state.products, ...fresh] };
        }),
      markSynced: () => set({ lastSyncedAt: Date.now() }),
      setFetching: (value) => set({ isFetching: value }),

      isStale: () => {
        const { lastSyncedAt } = get();
        if (!lastSyncedAt) return true;
        return Date.now() - lastSyncedAt > CACHE_TTL_MS;
      },
    }),
    {
      name: 'catalog-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
