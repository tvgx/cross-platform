import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import { apiCall } from '../lib/api/client';
import type { Category, ProductListItem } from '../types';

interface ProductState {
  categories: Category[];
  localProductCache: ProductListItem[];
  displayedProducts: ProductListItem[];
  userInterestHistory: number[]; // Array of category IDs
  categoryOffsets: Record<number, number>;
  isLoadingInitial: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;

  fetchInitialData: () => Promise<void>;
  loadNextPage: () => Promise<void>;
  fetchBackgroundNextPage: () => Promise<void>;
  addInterest: (categoryId: number) => void;
}

// Helper to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      categories: [],
      localProductCache: [],
      displayedProducts: [],
      userInterestHistory: [],
      categoryOffsets: {},
      isLoadingInitial: false,
      isFetchingMore: false,
      hasMore: true,

      addInterest: (categoryId: number) => {
        set((state) => {
          const history = state.userInterestHistory.filter((id) => id !== categoryId);
          history.unshift(categoryId);
          return { userInterestHistory: history.slice(0, 20) };
        });
      },

      fetchInitialData: async () => {
        const { userInterestHistory } = get();
        set({ isLoadingInitial: true, localProductCache: [], displayedProducts: [], categoryOffsets: {} });

        try {
          // 1. Fetch categories
          const catRes = await apiCall<{ data: Category[] }>('POST', '/api/get_categories', {});
          const categories = catRes.data || [];
          
          if (categories.length === 0) {
             set({ isLoadingInitial: false, categories: [] });
             return;
          }

          // 2. Select priority categories based on history, or default to first 5
          let targetCategoryIds: number[] = [];
          if (userInterestHistory.length > 0) {
             targetCategoryIds = userInterestHistory.slice(0, 5); // Pick top 5 recent interests
             const remaining = categories.filter(c => !targetCategoryIds.includes(Number(c.id)));
             while (targetCategoryIds.length < 5 && remaining.length > 0) {
               targetCategoryIds.push(Number(remaining.pop()?.id));
             }
          } else {
             targetCategoryIds = categories.slice(0, 5).map(c => Number(c.id));
          }

          // 3. Fetch products for each selected category
          const countPerCat = Math.ceil(300 / targetCategoryIds.length);
          const newOffsets: Record<number, number> = {};
          let allProducts: ProductListItem[] = [];

          const requests = targetCategoryIds.map(async (catId) => {
            try {
              const res = await apiCall<{ data: ProductListItem[] }>('POST', '/api/get_list_products', {
                category_id: catId,
                index: 0,
                count: countPerCat,
              });
              const products = (res.data || []).map(p => ({ ...p, category_id: String(catId) }));
              newOffsets[catId] = countPerCat; // Update offset for next pagination
              return products;
            } catch (err) {
              console.error(`Error fetching products for category ${catId}`, err);
              return [];
            }
          });

          const results = await Promise.all(requests);
          results.forEach(arr => {
            allProducts = allProducts.concat(arr);
          });

          allProducts = shuffleArray(allProducts);

          // 4. Update state: Set 100 to displayed, rest to cache
          const displayed = allProducts.slice(0, 100);
          const cache = allProducts.slice(100);

          set({
            categories,
            localProductCache: cache,
            displayedProducts: displayed,
            categoryOffsets: newOffsets,
            isLoadingInitial: false,
            hasMore: allProducts.length > 0
          });

        } catch (error) {
          console.error('Error in fetchInitialData:', error);
          set({ isLoadingInitial: false });
        }
      },

      loadNextPage: async () => {
        const { localProductCache, displayedProducts, isFetchingMore } = get();
        
        if (isFetchingMore) return;
        set({ isFetchingMore: true });

        // Giả lập delay 500ms
        await new Promise(resolve => setTimeout(resolve, 500));

        if (localProductCache.length >= 100) {
          const next100 = localProductCache.slice(0, 100);
          const remaining = localProductCache.slice(100);
          set({ 
            displayedProducts: [...displayedProducts, ...next100], 
            localProductCache: remaining,
            isFetchingMore: false 
          });
          
          if (remaining.length < 100) {
            get().fetchBackgroundNextPage();
          }
          return;
        }

        const remainingCache = [...localProductCache];
        set({ 
          displayedProducts: [...displayedProducts, ...remainingCache],
          localProductCache: [],
          isFetchingMore: false
        });

        get().fetchBackgroundNextPage();
      },

      fetchBackgroundNextPage: async () => {
        const { categoryOffsets } = get();
        const targetCategoryIds = Object.keys(categoryOffsets).map(Number);
        
        if (targetCategoryIds.length === 0) {
          set({ hasMore: false });
          return;
        }

        const countPerCat = Math.ceil(300 / targetCategoryIds.length);
        const newOffsets = { ...categoryOffsets };
        let allProducts: ProductListItem[] = [];

        const requests = targetCategoryIds.map(async (catId) => {
          const currentIndex = newOffsets[catId] || 0;
          try {
            const res = await apiCall<{ data: ProductListItem[] }>('POST', '/api/get_list_products', {
              category_id: catId,
              index: currentIndex,
              count: countPerCat,
            });
            const products = (res.data || []).map(p => ({ ...p, category_id: String(catId) }));
            newOffsets[catId] = currentIndex + products.length; 
            return products;
          } catch (err) {
            console.error(`Error in bg fetch for category ${catId}`, err);
            return [];
          }
        });

        const results = await Promise.all(requests);
        results.forEach(arr => {
          allProducts = allProducts.concat(arr);
        });

        if (allProducts.length === 0) {
          set({ hasMore: false });
          return;
        }

        allProducts = shuffleArray(allProducts);

        set((state) => ({
          localProductCache: [...state.localProductCache, ...allProducts],
          categoryOffsets: newOffsets
        }));
      }

    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ userInterestHistory: state.userInterestHistory, categories: state.categories }),
    }
  )
);
