import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../store/network';
import { useSyncQueueStore } from '../store/syncQueue';
import { registerBackgroundSyncAsync } from '../lib/tasks/backgroundSync';
import { initDB } from '../lib/storage/sqlite';

export default function RootLayout() {
  const setOnline = useNetworkStore((state) => state.setOnline);

  useEffect(() => {
    // Initialize SQLite Database
    initDB();
    // Register background fetch task
    registerBackgroundSyncAsync();

    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setOnline(!!isConnected);

      // Foreground Sync: Process queue immediately when online
      if (isConnected) {
        useSyncQueueStore.getState().processQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Flow */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Main Flow (Drawer -> Tabs) */}
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
