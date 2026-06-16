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
  toggleLikeLocally: (productId: string) => void;
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

      toggleLikeLocally: (productId: string) => {
        set((state) => {
          const updateProductList = (list: ProductListItem[]) => 
            list.map(p => {
              if (String(p.id) === String(productId)) {
                const newLiked = !p.is_liked;
                const newLikeCount = newLiked ? (p.like_count || 0) + 1 : Math.max(0, (p.like_count || 0) - 1);
                return { ...p, is_liked: newLiked, like_count: newLikeCount };
              }
              return p;
            });
            
          return {
            displayedProducts: updateProductList(state.displayedProducts),
            localProductCache: updateProductList(state.localProductCache),
          };
        });

      },

      fetchInitialData: async () => {
        const { userInterestHistory } = get();
        set({ isLoadingInitial: true, localProductCache: [], displayedProducts: [], categoryOffsets: { 0: 0 } });

        try {
          // 1. Fetch categories
          const catRes = await apiCall<{ data: Category[] }>('POST', '/api/get_categories', {});
          const categories = catRes.data || [];
          
          if (categories.length === 0) {
             set({ isLoadingInitial: false, categories: [] });
             return;
          }

          // 2. Fetch products globally (all categories)
          const res = await apiCall<{ data: ProductListItem[] }>('POST', '/api/get_list_products', {
            index: 0,
            count: 300,
          });
          
          let allProducts = res.data || [];

          // 3. Prioritize by user interest locally
          if (userInterestHistory.length > 0) {
            allProducts.sort((a, b) => {
              const aInterest = userInterestHistory.indexOf(Number(a.category_id));
              const bInterest = userInterestHistory.indexOf(Number(b.category_id));
              const aScore = aInterest !== -1 ? userInterestHistory.length - aInterest : 0;
              const bScore = bInterest !== -1 ? userInterestHistory.length - bInterest : 0;
              return bScore - aScore;
            });
          } else {
            allProducts = shuffleArray(allProducts);
          }

          // 4. Update state: Set 100 to displayed, rest to cache
          const displayed = allProducts.slice(0, 100);
          const cache = allProducts.slice(100);

          set({
            categories,
            localProductCache: cache,
            displayedProducts: displayed,
            categoryOffsets: { 0: allProducts.length }, // track global offset
            isLoadingInitial: false,
            hasMore: allProducts.length >= 300
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
        const { categoryOffsets, userInterestHistory } = get();
        const currentIndex = categoryOffsets[0] || 0;
        
        try {
          const res = await apiCall<{ data: ProductListItem[] }>('POST', '/api/get_list_products', {
            index: currentIndex,
            count: 300,
          });
          
          let newProducts = res.data || [];
          
          if (newProducts.length === 0) {
            set({ hasMore: false });
            return;
          }

          if (userInterestHistory.length > 0) {
            newProducts.sort((a, b) => {
              const aInterest = userInterestHistory.indexOf(Number(a.category_id));
              const bInterest = userInterestHistory.indexOf(Number(b.category_id));
              const aScore = aInterest !== -1 ? userInterestHistory.length - aInterest : 0;
              const bScore = bInterest !== -1 ? userInterestHistory.length - bInterest : 0;
              return bScore - aScore;
            });
          } else {
            newProducts = shuffleArray(newProducts);
          }

          set((state) => ({
            localProductCache: [...state.localProductCache, ...newProducts],
            categoryOffsets: { 0: currentIndex + newProducts.length },
            hasMore: newProducts.length >= 300
          }));
        } catch (err) {
          console.error('Error in bg fetch', err);
        }
      }

    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ userInterestHistory: state.userInterestHistory, categories: state.categories }),
    }
  )
);
