import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import type { Category, Brand, ProductListItem } from '../types';
import { ProductRepository } from '../lib/repositories/ProductRepository';

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
  toggleLike: (productId: string, userId: string) => void;
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
      toggleLike: (productId, userId) => {
        // Xác định trạng thái hiện tại: ưu tiên catalog store, nếu không có thì tra product store
        // (màn Home dùng product store) để tránh ghi sai is_liked/like_count xuống SQLite.
        let current: any = get().products.find(p => String(p.id) === String(productId));
        if (!current) {
          try {
            const { useProductStore } = require('./product');
            const ps = useProductStore.getState();
            current = [...ps.displayedProducts, ...ps.localProductCache].find(
              (p: any) => String(p.id) === String(productId),
            );
          } catch {}
        }
        const wasLiked = !!current?.is_liked;
        const curCount = Number(current?.like_count ?? current?.like ?? 0);
        const newIsLiked = !wasLiked;
        const newLikeCount = newIsLiked ? curCount + 1 : Math.max(0, curCount - 1);

        // Cập nhật bản sao trong catalog store nếu sản phẩm có ở đây
        set((state) => ({
          products: state.products.map(p =>
            String(p.id) === String(productId)
              ? { ...p, is_liked: newIsLiked, like_count: newLikeCount }
              : p,
          ),
        }));

        // Truyền dữ liệu sản phẩm (nếu tìm được) để repository upsert hàng Products tối thiểu,
        // tránh "FOREIGN KEY constraint failed" khi SP của Home chưa có trong SQLite.
        ProductRepository.likeProduct(productId, userId, newIsLiked, newLikeCount, current);

        // Run API update asynchronously
        setTimeout(async () => {
          try {
            const { socialApi } = require('../lib/api/endpoints/social');
            await socialApi.likeProduct(productId);
          } catch (err) {
            console.warn('[CatalogStore] Lỗi gọi API likeProduct, đã lưu local và sẽ queue nếu offline', err);
          }
        }, 0);
      },

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
