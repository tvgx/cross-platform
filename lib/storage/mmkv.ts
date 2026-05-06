import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

let storageInstance: any;

if (Platform.OS === 'web') {
  storageInstance = {
    getString: (key: string) => {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: (key: string, value: string | number | boolean) => {
      try { window.localStorage.setItem(key, value.toString()); } catch (e) {}
    },
    remove: (key: string) => {
      try { window.localStorage.removeItem(key); } catch (e) {}
    }
  };
} else {
  const { createMMKV } = require('react-native-mmkv');
  storageInstance = createMMKV({ id: 'militart-store' });
}

// Single MMKV instance (or fallback) shared across the app.
export const storage = storageInstance;

/**
 * Zustand persist storage adapter backed by MMKV (or localStorage on Web).
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
