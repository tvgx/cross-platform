import { OrderRepository } from '../../../lib/repositories/OrderRepository';
import { db } from '../../../lib/storage/sqlite';
import { useAuthStore } from '../../../store/auth';
import { useNetworkStore } from '../../../store/network';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock Dependencies
jest.mock('../../../store/auth', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../../store/network', () => ({
  useNetworkStore: {
    getState: jest.fn(),
  },
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('OrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 'u1', virtual_balance: 100000, full_name: 'Soldier A', phone: '0123' },
      updateUser: jest.fn(),
    });

    (useNetworkStore.getState as jest.Mock).mockReturnValue({
      isOnline: true,
      isBackendAlive: true,
      setBackendAlive: jest.fn(),
    });
  });

  describe('placeOrder - Online Mode', () => {
    it('should return error if user not logged in', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({ user: null });
      const res = await OrderRepository.placeOrder({ items: [], addressId: '1' });
      expect(res.success).toBe(false);
      expect(res.message).toBe('Đồng chí chưa đăng nhập hệ thống.');
    });

    it('should return error if insufficient wallet balance', async () => {
      (db.getFirstSync as jest.Mock).mockReturnValue({ balance: 1000 }); // Ví có 1k
      const res = await OrderRepository.placeOrder({
        items: [{ product_id: '1', title: 'A', price: 5000, quantity: 1 }],
        addressId: '1',
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain('Số dư điểm chiến tích không đủ');
    });

    it('should place order successfully and NOT create SyncQueue if API succeeds', async () => {
      (db.getFirstSync as jest.Mock).mockReturnValue({ balance: 100000 });

      server.use(
        http.post(`${BASE_URL}/order/create_order`, () => {
          return HttpResponse.json({ code: '1000', success: true });
        })
      );

      const res = await OrderRepository.placeOrder({
        items: [{ product_id: '1', title: 'A', price: 5000, quantity: 1 }],
        addressId: '1',
      });

      expect(res.success).toBe(true);
      expect(db.withTransactionSync).toHaveBeenCalled();

      // Ensure the INSERT into Orders works correctly
      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Orders'),
        expect.arrayContaining(['synced', 'synced']) // Status should be synced
      );

      // Verify that SyncQueue was NOT populated
      expect(db.runSync).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO SyncQueue'),
        expect.anything()
      );
    });
  });

  describe('placeOrder - Offline Mode (API fails)', () => {
    it('should fallback to local queue if API fails with network error', async () => {
      (db.getFirstSync as jest.Mock).mockReturnValue({ balance: 100000 });

      server.use(
        http.post(`${BASE_URL}/order/create_order`, () => {
          return HttpResponse.error();
        })
      );

      const res = await OrderRepository.placeOrder({
        items: [{ product_id: '1', title: 'A', price: 5000, quantity: 1 }],
        addressId: '1',
      });

      // Vẫn báo thành công cho user
      expect(res.success).toBe(true);

      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Orders'),
        expect.arrayContaining(['pending_sync', 'pending_sync']) // Status should be pending_sync
      );

      // Verify SyncQueue is populated
      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO SyncQueue'),
        expect.arrayContaining(['ORDER_UPLOAD'])
      );
    });

    it('should return error and NOT fallback if API fails with 4xx business error', async () => {
      (db.getFirstSync as jest.Mock).mockReturnValue({ balance: 100000 });

      server.use(
        http.post(`${BASE_URL}/order/create_order`, () => {
          return HttpResponse.json({ message: 'Sản phẩm đã hết hàng' }, { status: 400 });
        })
      );

      const res = await OrderRepository.placeOrder({
        items: [{ product_id: '1', title: 'A', price: 5000, quantity: 1 }],
        addressId: '1',
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Sản phẩm đã hết hàng');

      // Không ghi vào local database
      expect(db.withTransactionSync).not.toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return mapped orders from local SQLite', () => {
      // Mock db.getAllSync cho `getLocalOrders`
      (db.getAllSync as jest.Mock).mockImplementation((query) => {
        if (query.includes('FROM Orders')) {
          return [{ id: 'o1', buyer_id: 'u1', total_price: 5000, status: 'pending_sync', created_at: '2026-06-11' }];
        }
        if (query.includes('FROM OrderItems')) {
          return [{ order_id: 'o1', product_id: '1', title: 'Gun', price: 5000, quantity: 1 }];
        }
        return [];
      });

      const orders = OrderRepository.getLocalOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('o1');
      expect(orders[0].items[0].title).toBe('Gun');
    });
  });

  describe('rollbackOrderLocal', () => {
    it('should refund user and update product stocks', () => {
      (db.getFirstSync as jest.Mock).mockReturnValue({ buyer_id: 'u1', total_price: 5000 });
      (db.getAllSync as jest.Mock).mockReturnValue([
        { product_id: '1', quantity: 2, variant_id: null }
      ]);

      const updateUserMock = jest.fn();
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { id: 'u1', virtual_balance: 10000 },
        updateUser: updateUserMock,
      });

      OrderRepository.rollbackOrderLocal('o1', 'Hết hàng');

      // Check Refund wallet
      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Wallets SET balance = balance + ?'),
        [5000, 'u1']
      );

      // Check rollback stock
      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Products SET stock = stock + ?'),
        [2, '1']
      );

      // Check User Store updated
      expect(updateUserMock).toHaveBeenCalledWith({ virtual_balance: 15000 });
    });
  });
});
