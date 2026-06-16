import NetInfo from '@react-native-community/netinfo';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UI_CONFIG } from '../constants/config';
import { RepositoryProvider } from '../context/RepositoryProvider';
import { registerBackgroundSyncAsync } from '../lib/tasks/backgroundSync';
import { SyncService } from '../services/SyncService';
import { useAppStore } from '../store/app';
import { useNetworkStore } from '../store/network';
import { useSyncQueueStore } from '../store/syncQueue';

export default function RootLayout() {
  const setOnline = useNetworkStore((state) => state.setOnline);
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('sync_completed', () => {
      console.log('[RootLayout] Sync hoàn tất');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // DB is auto-initialized on module load in sqlite.ts

    // Initialize SyncService listeners
    SyncService.init();

    // Register background fetch task
    registerBackgroundSyncAsync();

    // Auto-refresh JWT Test Token on startup if user is logged in
    const { useAuthStore } = require('../store/auth');
    const { isLoggedIn, user, setAuth } = useAuthStore.getState();
    if (isLoggedIn && user) {
      NetInfo.fetch().then(netState => {
        const isConnected = netState.isConnected && netState.isInternetReachable !== false;
        if (!isConnected) {
          console.log('[Auth] Bỏ qua làm mới JWT Test Token khi khởi động (thiết bị ngoại tuyến).');
          return;
        }
        const { apiCall } = require('../lib/api/client');
        apiCall('GET', '/get-test-token')
          .then((token: any) => {
            if (token && typeof token === 'string') {
              setAuth(user, { access_token: token });
              console.log('[Auth] Tự động làm mới JWT Test Token thành công khi khởi động!');
            }
          })
          .catch((err: any) => {
            console.log('[Auth] Không thể làm mới JWT Test Token khi khởi động:', err.message);
          });
      });
    }

    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setOnline(!!isConnected);

      // Foreground Sync: Process queue immediately when online
      if (isConnected) {
        useSyncQueueStore.getState().processQueue();
        SyncService.runSyncProcess().catch((err: any) => console.warn('[RootLayout] SyncService error:', err));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: currentColors.background }}>
        <RepositoryProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth Flow */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Main Flow (Drawer -> Tabs) */}
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          </Stack>
        </RepositoryProvider>
      </View>
    </SafeAreaProvider>
  );
}
