# DB SCHEMA (SQLite)
## Tables:
- Users: id, username, virtual_balance, rank, unit.
- Products: id, title, price, images (JSON), seller_id, stock.
- Posts (Achievements): id, title, media_url (local), status (pending/approved), ai_score, sync_status.
- Orders: id, product_id, total_price, buyer_id, status (pending_sync/synced).
- Comments: id, target_id, user_id, content.
## Sync Logic:
- Every table with remote counterpart must have `sync_status`.
- Local changes always SET `sync_status = 'pending'`.
- SyncService picks 'pending' -> API -> SET 'synced'.
