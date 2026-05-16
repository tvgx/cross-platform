# DATABASE OPERATIONS (SQLite)
## Core Setup (`lib/storage/sqlite.ts`)
- `initDB()`: 
    - `PRAGMA foreign_keys = ON`.
    - Create Tables: `Users`, `Products`, `Posts`, `Orders`, `SyncQueue`.
    - Seed Data: Only if `Users` table empty.

## SQL Patterns (Use `db.runSync` / `db.getAllSync`)
- **Get Balance**: `SELECT virtual_balance FROM Users WHERE id = ?`.
- **Deduct Balance**: `UPDATE Users SET virtual_balance = virtual_balance - ? WHERE id = ?`.
- **Add to Queue**: `INSERT INTO SyncQueue (id, action, target_id, payload) VALUES (?, ?, ?, ?)`.
- **Mark Synced**: `UPDATE [Table] SET sync_status = 'synced' WHERE id = ?`.

## Error Handling
- Wrap all `db.execSync/runSync` in `try-catch`.
- Log errors to a local `ErrorLog` table for debugging in combat zones.
