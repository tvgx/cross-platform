# MEDIA & SYNC LOGIC FUNCTIONS
## File Management (`lib/storage/fileSystem.ts`)
- `cacheMedia(uri, type)`: 
    - Input: source URI, type ('image'|'video').
    - Logic: Generate `filename` -> `FileSystem.copyAsync` to `documentDirectory/cache/` -> Return `localUri`.
- `clearCache(fileUri)`: `FileSystem.deleteAsync` only after `sync_status === 'synced'`.

## Background Sync (`services/SyncService.ts`)
- `checkConnectivity()`: Use `NetInfo.fetch()` -> Return boolean.
- `syncQueueRunner()`: 
    - Logic: `SELECT * FROM SyncQueue ORDER BY priority, created_at`.
    - Loop: 
        - If action 'ORDER_UPLOAD': `uploadOrder(id)`.
        - If action 'MEDIA_UPLOAD': `uploadMedia(id)`.
- `uploadMedia(postId)`:
    1. Get `media_url` from `Posts` table.
    2. Upload file via `axios.post` (form-data).
    3. On success: `UPDATE Posts SET sync_status = 'synced'` -> `clearCache(media_url)`.
- `retryLogic(taskId)`: Increment `retry_count` in `SyncQueue` -> Exponential backoff.

## PoCA Flow
- `submitAchievement(data)`:
    1. `cacheMedia(data.uri)`.
    2. `INSERT INTO Posts` (status: 'pending', sync_status: 'pending').
    3. `INSERT INTO SyncQueue` (action: 'MEDIA_UPLOAD').
