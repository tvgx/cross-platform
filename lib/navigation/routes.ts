export const ROUTES = {
  // Auth
  WELCOME: '/(auth)/welcome' as const,
  LOGIN: '/(auth)/login' as const,
  SIGNUP: '/(auth)/signup' as const,
  DECLARE_INFO: '/(auth)/declare-info' as const,
  
  // Tabs (Main Feed)
  HOME: '/(main)/(tabs)' as const,
  UPLOAD: '/(main)/(tabs)/upload' as const,
  CART: '/(main)/(tabs)/cart' as const,
  PROFILE: '/(main)/(tabs)/profile' as const,
  
  // Products & Categories
  ALL_PRODUCTS: '/(main)/all-products' as any,
  CATEGORY: (id: string) => `/(main)/category/${id}` as any,
  
  // Screens
  DETAIL: (id: string) => `/(main)/detail?id=${id}` as any,
  OFFICER: '/(main)/officer' as any,
  ACHIEVEMENTS: '/(main)/achievements' as const,
  APPEAL: (id: string) => `/(main)/appeal-form?id=${id}` as any,
  ORDER_SUCCESS: '/(main)/order-success' as const,
  
  // New Tab Screens
  ORDERS: '/(main)/(tabs)/orders' as any,
  LIKED_PRODUCTS: '/(main)/(tabs)/liked' as any,
  PROFILE_INFO: '/(main)/(tabs)/personal-info' as any,
  CHANGE_PASSWORD: '/(main)/(tabs)/change-password' as any,
  SETTINGS: '/(main)/(tabs)/settings' as any,
  NOTIFICATIONS: '/(main)/(tabs)/notifications' as any,
  
  // Root Modals
  MODAL: '/modal' as const
};
