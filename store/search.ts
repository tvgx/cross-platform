import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../lib/storage/mmkv';
import { socialApi } from '../lib/api/endpoints/social';

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (keyword: string) => void;
  removeRecentSearch: (keyword: string) => void;
  clearRecentSearches: () => void;
  hydrateFromServer: () => Promise<void>;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],

      addRecentSearch: (keyword: string) => {
        const query = keyword.trim();
        if (!query) return;
        
        set((state) => {
          // Dedupe (case-insensitive) and limit to ~10
          const filtered = state.recentSearches.filter(
            (k) => k.toLowerCase() !== query.toLowerCase()
          );
          return { recentSearches: [query, ...filtered].slice(0, 10) };
        });

        // Fire and forget
        socialApi.saveSearch(query).catch((err) => {
          console.warn('[SearchStore] Failed to save search to server', err);
        });
      },

      removeRecentSearch: (keyword: string) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter(
            (k) => k.toLowerCase() !== keyword.toLowerCase()
          )
        }));
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      hydrateFromServer: async () => {
        try {
          const result = await socialApi.getSavedSearches();
          const responseData = result?.data as any;
          if (responseData) {
            let serverKeywords: string[] = [];
            
            // Handle different possible API response structures
            if (Array.isArray(responseData)) {
              serverKeywords = responseData.map(item => typeof item === 'object' ? item.keyword : item);
            } else if (responseData.data && Array.isArray(responseData.data)) {
              serverKeywords = responseData.data.map((item: any) => typeof item === 'object' ? item.keyword : item);
            } else if (responseData.items && Array.isArray(responseData.items)) {
              serverKeywords = responseData.items.map((item: any) => typeof item === 'object' ? item.keyword : item);
            }
            
            set((state) => {
              // Merge keeping local first, then server
              const combined = [...state.recentSearches];
              for (const kw of serverKeywords) {
                if (!combined.some(k => k.toLowerCase() === kw.toLowerCase())) {
                  combined.push(kw);
                }
              }
              return { recentSearches: combined.slice(0, 10) };
            });
          }
        } catch (err) {
          console.warn('[SearchStore] Failed to hydrate searches from server', err);
        }
      }
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
