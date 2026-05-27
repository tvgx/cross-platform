import { router, Href } from 'expo-router';

export const NavigationService = {
  /**
   * Push a new screen to the navigation stack
   */
  navigate: (path: Href) => {
    router.push(path);
  },

  /**
   * Replace the current screen with a new one
   */
  replace: (path: Href) => {
    router.replace(path);
  },

  /**
   * Go back to the previous screen if possible, otherwise go to home
   */
  goBack: () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)');
    }
  },

  /**
   * Force reset navigation to the provided root path
   */
  reset: (path: Href = '/(main)/(tabs)') => {
    router.replace(path);
  }
};
