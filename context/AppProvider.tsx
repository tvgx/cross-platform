/**
 * AppProvider — the root context layer for the military ecommerce app.
 *
 * Strategy: cache-first, background refresh (stale-while-revalidate)
 * ────────────────────────────────────────────────────────────────────
 * 1. On mount:  Zustand + MMKV rehydrates stores instantly from disk.
 *              The UI renders with the last-known data immediately.
 *
 * 2. Network:  NetInfo subscription updates useNetworkStore.
 *              When the device goes online after being offline, the sync
 *              queue is flushed and stale caches are refreshed.
 *
 * 3. Refresh:  If the catalog cache is stale (> 5 min old) and the
 *              device is online, categories/brands/products are fetched
 *              silently in the background — no loading spinners.
 *
 * 4. Auth:     If the stored token is rejected by the server (401),
 *              the axios interceptor clears the token keys and the store
 *              rehydrates on next render, triggering a logout redirect.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { productsApi } from '../lib/api/endpoints/products';
import { userApi } from '../lib/api/endpoints/user';
import { notificationsApi } from '../lib/api/endpoints/misc';
import { useAuthStore } from '../store/auth';
import { useNetworkStore } from '../store/network';
import { useCatalogStore } from '../store/catalog';
import { useNotificationsStore } from '../store/notifications';
import { useSyncQueueStore } from '../store/syncQueue';

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  /** True once the initial rehydration + first-load attempt is done */
  isAppReady: boolean;
  /** Manually trigger a full catalog refresh (e.g. pull-to-refresh) */
  refreshCatalog: () => Promise<void>;
  /** Manually trigger a notification refresh */
  refreshNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({
  isAppReady: false,
  refreshCatalog: async () => {},
  refreshNotifications: async () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAppReady, setAppReady] = useState(false);

  // Store selectors — use individual primitives to avoid re-renders
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const setOnline = useNetworkStore((s) => s.setOnline);
  const setConnecting = useNetworkStore((s) => s.setConnecting);
  const isOnline = useNetworkStore((s) => s.isOnline);

  const isStale = useCatalogStore((s) => s.isStale);
  const setCategories = useCatalogStore((s) => s.setCategories);
  const setBrands = useCatalogStore((s) => s.setBrands);
  const setProducts = useCatalogStore((s) => s.setProducts);
  const markSynced = useCatalogStore((s) => s.markSynced);
  const setFetching = useCatalogStore((s) => s.setFetching);

  const setNotifications = useNotificationsStore((s) => s.setNotifications);

  const processQueue = useSyncQueueStore((s) => s.processQueue);

  // Guard against concurrent fetches
  const fetchingCatalog = useRef(false);
  const fetchingNotifications = useRef(false);

  // ── Catalog refresh ────────────────────────────────────────────────────────

  const refreshCatalog = useCallback(async () => {
    if (fetchingCatalog.current) return;
    fetchingCatalog.current = true;
    setFetching(true);
    try {
      const [catRes, brandRes, prodRes] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getListBrand(),
        productsApi.getListProducts({ limit: 50, page: 1 }),
      ]);

      if (catRes.success) setCategories(catRes.data);
      if (brandRes.success) setBrands(brandRes.data);
      if (prodRes.success && prodRes.data) {
        const items = Array.isArray(prodRes.data)
          ? prodRes.data
          : (prodRes.data && Array.isArray((prodRes.data as any).items) ? (prodRes.data as any).items : []);
        setProducts(items);
      }
      markSynced();
    } catch {
      // Silently fail — UI already shows cached data
    } finally {
      setFetching(false);
      fetchingCatalog.current = false;
    }
  }, [setCategories, setBrands, setProducts, markSynced, setFetching]);

  // ── Notification refresh ───────────────────────────────────────────────────

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn || fetchingNotifications.current) return;
    fetchingNotifications.current = true;
    try {
      const res = await notificationsApi.getNotifications({ limit: 30 });
      if (res.success) setNotifications(res.data.items);
    } catch {
      // Silently fail
    } finally {
      fetchingNotifications.current = false;
    }
  }, [isLoggedIn, setNotifications]);

  // ── User info refresh ──────────────────────────────────────────────────────

  const refreshUserInfo = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    try {
      const res = await userApi.getUserInfo(Number(user.id));
      if (res.success) updateUser(res.data);
    } catch {
      // Token may have been invalidated; axios interceptor handles 401.
    }
  }, [isLoggedIn, user, updateUser]);

  // ── Network subscription ───────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setConnecting(state.type === 'cellular' && !state.isConnected);
      setOnline(online);
    });

    return () => unsubscribe();
  }, [setOnline, setConnecting]);

  // ── When app comes back online ─────────────────────────────────────────────

  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOnline) {
      if (wasOffline.current) {
        // Back online after being offline — flush queued mutations
        processQueue();
        wasOffline.current = false;
      }
    } else {
      wasOffline.current = true;
    }
  }, [isOnline, processQueue]);

  // ── Initial preload ────────────────────────────────────────────────────────

  useEffect(() => {
    async function preload() {
      // The stores already hydrated from MMKV — UI can render immediately.
      // Only fire network requests if online and cache is stale.
      if (isOnline) {
        const stale = isStale();
        const promises: Promise<void>[] = [];

        if (stale) promises.push(refreshCatalog());
        if (isLoggedIn) {
          promises.push(refreshUserInfo());
          promises.push(refreshNotifications());
          promises.push(processQueue());
        }

        // Run all in parallel, but don't block app readiness.
        Promise.all(promises).catch(() => {});
      }

      setAppReady(true);
    }

    preload();
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth state changes — refresh user-specific data ───────────────────────

  const prevLoggedIn = useRef(isLoggedIn);

  useEffect(() => {
    if (isLoggedIn && !prevLoggedIn.current && isOnline) {
      refreshUserInfo();
      refreshNotifications();
      processQueue();
    }
    prevLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, isOnline, refreshUserInfo, refreshNotifications, processQueue]);

  return (
    <AppContext.Provider value={{ isAppReady, refreshCatalog, refreshNotifications }}>
      {children}
    </AppContext.Provider>
  );
}
