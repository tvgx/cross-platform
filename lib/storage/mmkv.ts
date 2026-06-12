import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';
import Constants, { ExecutionEnvironment } from 'expo-constants';

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
  // Sử dụng SQLite KeyValueStore thay cho MMKV để đảm bảo hoạt động trơn tru trong Expo Go
  const { db } = require('./sqlite');
  
  try {
    db.execSync('CREATE TABLE IF NOT EXISTS KeyValueStore (key TEXT PRIMARY KEY, value TEXT);');
  } catch (err) {
    console.error('[Storage Error]: Failed to create KeyValueStore table:', err);
  }

  storageInstance = {
    getString: (key: string) => {
      try {
        const row = db.getFirstSync('SELECT value FROM KeyValueStore WHERE key = ?', [key]);
        return row ? (row as any).value : null;
      } catch (e: any) {
        console.warn('[Storage Warning]: getString failed for key:', key, e.message);
        return null;
      }
    },
    set: (key: string, value: string | number | boolean) => {
      try {
        db.runSync(
          'INSERT OR REPLACE INTO KeyValueStore (key, value) VALUES (?, ?)',
          [key, value.toString()]
        );
      } catch (e: any) {
        console.warn('[Storage Warning]: set failed for key:', key, e.message);
      }
    },
    remove: (key: string) => {
      try {
        db.runSync('DELETE FROM KeyValueStore WHERE key = ?', [key]);
      } catch (e: any) {
        console.warn('[Storage Warning]: remove failed for key:', key, e.message);
      }
    }
  };
}

// Single storage instance shared across the app.
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
