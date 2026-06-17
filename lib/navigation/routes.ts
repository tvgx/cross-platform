export const ROUTES = {
  // Auth
  WELCOME: '/(auth)/welcome' as any,
  LOGIN: '/(auth)/login' as any,
  SIGNUP: '/(auth)/signup' as any,
  DECLARE_INFO: '/(auth)/declare-info' as any,
  
  // Tabs (Main Feed)
  HOME: '/(main)' as any,
  UPLOAD: '/(main)/upload' as any,
  CART: '/(main)/cart' as any,
  PROFILE: '/(main)/profile' as any,
  
  // Products & Categories
  SEARCH: '/(main)/search' as any,
  SEARCH_RESULTS: (q?: string, categoryId?: string) => {
    let query = '';
    if (q) query += `q=${encodeURIComponent(q)}&`;
    if (categoryId) query += `category_id=${encodeURIComponent(categoryId)}&`;
    if (query) query = `?${query.slice(0, -1)}`;
    return `/(main)/search-results${query}` as any;
  },
  ALL_PRODUCTS: '/(main)/all-products' as any,
  CATEGORY: (id: string) => `/(main)/category/${id}` as any,
  
  // Screens
  DETAIL: (id: string) => `/(main)/detail?id=${id}` as any,
  OFFICER: '/(main)/officer' as any,
  ACHIEVEMENTS: '/(main)/achievements' as any,
  APPEAL: (id: string) => `/(main)/appeal-form?id=${id}` as any,
  ORDER_SUCCESS: '/(main)/order-success' as any,
  
  // New Tab Screens
  ORDERS: '/(main)/orders' as any,
  LIKED_PRODUCTS: '/(main)/liked' as any,
  PROFILE_INFO: '/(main)/personal-info' as any,
  EDIT_PERSONAL_INFO: '/(main)/edit-personal-info' as any,
  CHANGE_PASSWORD: '/(main)/change-password' as any,
  SETTINGS: '/(main)/settings' as any,
  NOTIFICATIONS: '/(main)/notifications' as any,
  CHAT: '/(main)/chat' as any,
  CHAT_DETAIL: (id: string) => `/(main)/chat/${id}` as any,
  
  // Root Modals
  MODAL: '/modal' as const
};
