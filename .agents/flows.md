# FLOWS & NAVIGATION (Expo Router)
## Routes:
- (auth)/login: Soldier entry.
- (main)/(tabs)/index: Home/Marketplace feed.
- (main)/(tabs)/upload: PoCA upload (AI Analysis).
- (main)/(tabs)/cart: Checkout with virtual balance.
- (main)/detail/[id]: Product/Post detail.
- (main)/order-success: Post-checkout.
## Business Logic:
1. Marketplace: Cart (Zustand) -> SQLite Order -> Check `virtual_balance` -> Deduct -> SyncQueue.
2. PoCA: Select Media -> Save to FileSystem (Cache) -> SQLite Post -> Mock AI Scan -> SyncQueue.
3. Media Cache: Videos are stored in `FileSystem.documentDirectory + 'cache/'`. NEVER delete until `sync_status === 'synced'`.
