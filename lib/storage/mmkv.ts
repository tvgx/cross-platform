import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Single MMKV instance shared across the app.
export const storage: MMKV = createMMKV({ id: 'militart-store' });

/**
 * Zustand persist storage adapter backed by MMKV.
 * MMKV reads/writes are synchronous and ~10× faster than AsyncStorage.
 */
export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.remove(name),
};

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function getStoredJSON<T>(key: string): T | null {
  try {
    const raw = storage.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function removeStored(key: string): void {
  storage.remove(key);
}
