import { db } from './sqlite';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const READ_PATH_MARKERS = [
  '/get',
  '/list',
  '/search',
  '/News',
  '/wallets/get',
  '/push_settings/get',
  '/order/get_ship_from',
];

const MUTATION_PATH_MARKERS = [
  '/add',
  '/create',
  '/edit',
  '/update',
  '/delete',
  '/cancel',
  '/set_',
  '/send',
  '/upload',
  '/refund',
  '/change_',
  '/logout',
  '/login',
  '/signup',
];

function stableStringify(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function canCacheServerResponse(method: ApiMethod, url: string): boolean {
  if (method === 'GET') return true;
  if (method !== 'POST') return false;
  if (MUTATION_PATH_MARKERS.some((marker) => url.includes(marker))) return false;
  return READ_PATH_MARKERS.some((marker) => url.includes(marker));
}

export function getServerCacheKey(method: ApiMethod, url: string, data?: unknown, params?: Record<string, unknown>): string {
  return `${method}:${url}:${stableStringify(data)}:${stableStringify(params)}`;
}

export function saveServerResponseCache(method: ApiMethod, url: string, data: unknown, params: Record<string, unknown> | undefined, responseData: unknown): void {
  if (!canCacheServerResponse(method, url)) return;

  try {
    const now = new Date().toISOString();
    db.runSync(
      `INSERT OR REPLACE INTO ServerResponseCache (cache_key, method, url, params, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM ServerResponseCache WHERE cache_key = ?), ?), ?)`,
      [
        getServerCacheKey(method, url, data, params),
        method,
        url,
        JSON.stringify({ data: data ?? null, params: params ?? null }),
        JSON.stringify(responseData),
        getServerCacheKey(method, url, data, params),
        now,
        now,
      ]
    );
  } catch (error) {
    console.warn('[ServerCache] Could not save API response cache:', error);
  }
}

export function getCachedServerResponse<T>(method: ApiMethod, url: string, data?: unknown, params?: Record<string, unknown>): T | null {
  if (!canCacheServerResponse(method, url)) return null;

  try {
    const row = db.getFirstSync<{ data: string }>(
      'SELECT data FROM ServerResponseCache WHERE cache_key = ?',
      [getServerCacheKey(method, url, data, params)]
    );
    if (!row?.data) return null;
    return JSON.parse(row.data) as T;
  } catch (error) {
    console.warn('[ServerCache] Could not read API response cache:', error);
    return null;
  }
}