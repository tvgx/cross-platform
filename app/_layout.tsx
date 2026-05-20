import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../store/network';
import { useSyncQueueStore } from '../store/syncQueue';
import { registerBackgroundSyncAsync } from '../lib/tasks/backgroundSync';
import { initDB } from '../lib/storage/sqlite';
import { RepositoryProvider } from '../context/RepositoryProvider';

export default function RootLayout() {
  const setOnline = useNetworkStore((state) => state.setOnline);

  useEffect(() => {
    // Initialize SQLite Database
    initDB();
    // Register background fetch task
    registerBackgroundSyncAsync();

    // Auto-refresh JWT Test Token on startup if user is logged in
    const { useAuthStore } = require('../store/auth');
    const { isLoggedIn, user, setAuth } = useAuthStore.getState();
    if (isLoggedIn && user) {
      const { apiCall } = require('../lib/api/client');
      apiCall('GET', '/get-test-token')
        .then((token: any) => {
          if (token && typeof token === 'string') {
            setAuth(user, { access_token: token });
            console.log('[Auth] Tự động làm mới JWT Test Token thành công khi khởi động!');
          }
        })
        .catch((err: any) => {
          console.log('[Auth] Không thể làm mới JWT Test Token khi khởi động (Chế độ Ngoại tuyến):', err.message);
        });
    }

    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setOnline(!!isConnected);

      // Foreground Sync: Process queue immediately when online
      if (isConnected) {
        useSyncQueueStore.getState().processQueue();
        const { SyncService } = require('../services/SyncService');
        SyncService.runSyncProcess().catch((err: any) => console.warn('[RootLayout] SyncService error:', err));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RepositoryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth Flow */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          {/* Main Flow (Drawer -> Tabs) */}
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack>
      </RepositoryProvider>
    </SafeAreaProvider>
  );
}
