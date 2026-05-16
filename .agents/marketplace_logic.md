# MARKETPLACE LOGIC FUNCTIONS
## Cart Service (`store/cart.ts`)
- `addItem(product)`: Check stock -> Add to `items[]` or increment `quantity` -> Update `total`.
- `removeItem(id)`: Remove from `items[]` -> Update `total`.
- `updateQuantity(id, qty)`: Ensure `qty > 0` -> Update `items[]` -> Update `total`.

## Checkout Flow (`app/(main)/(tabs)/cart.tsx`)
- `validateBalance(userId, orderTotal)`: 
    - Input: `userId`, `orderTotal`.
    - Logic: Query `Users.virtual_balance` from SQLite -> Return `true` if `balance >= orderTotal`.
- `processCheckout()`:
    1. `validateBalance()`.
    2. `db.transaction()`:
        - `UPDATE Users SET virtual_balance = virtual_balance - total`.
        - For each item: `INSERT INTO Orders` with `status = 'pending_sync'`.
        - `INSERT INTO SyncQueue` (action: 'ORDER_UPLOAD', data: orderId).
    3. `clearCart()`.
    4. Navigate to `OrderSuccess`.

## Order Management
- `fetchLocalOrders(userId)`: `SELECT * FROM Orders WHERE buyer_id = ? ORDER BY created_at DESC`.
- `cancelOrder(orderId)`: Only if `status === 'pending_sync'` -> `DELETE FROM Orders` -> `DELETE FROM SyncQueue`.
