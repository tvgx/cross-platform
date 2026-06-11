import { ordersApi } from '../../../../lib/api/endpoints/orders';
import { server } from '../../../../mocks/server';
import { rest } from 'msw';
import { useNetworkStore } from '../../../../store/network';

jest.mock('../../../../store/network', () => ({
  useNetworkStore: {
    getState: jest.fn().mockReturnValue({ isBackendAlive: true, setBackendAlive: jest.fn() }),
  },
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('ordersApi (Buyer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Address & Shipping', () => {
    it('should get provinces successfully', async () => {
      server.use(
        rest.get(`${BASE_URL}/order/provinces`, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ success: true, data: [{ id: 1, name: 'Hanoi' }] })
          );
        })
      );
      const res = await ordersApi.getProvinces();
      expect(res.success).toBe(true);
      expect(res.data[0].name).toBe('Hanoi');
    });

    it('should get wards successfully', async () => {
      server.use(
        rest.get(`${BASE_URL}/order/wards`, (req, res, ctx) => {
          if (req.url.searchParams.get('province_id') === '1') {
            return res(ctx.status(200), ctx.json({ success: true, data: [{ id: 101, name: 'Ba Dinh' }] }));
          }
          return res(ctx.status(400));
        })
      );
      const res = await ordersApi.getWards(1);
      expect(res.success).toBe(true);
      expect(res.data[0].name).toBe('Ba Dinh');
    });

    it('should add order address successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/order/add_order_address`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: { id: 10, receiver_name: 'Soldier A' } }));
        })
      );
      const res = await ordersApi.addOrderAddress({
        receiver_name: 'Soldier A',
        phone: '0123',
        address: 'HQ',
        full_address: 'HQ',
        address_detail: 'Room 1',
        lat: 0,
        lng: 0,
        is_default: true
      });
      expect(res.success).toBe(true);
      expect(res.data.id).toBe(10);
    });

    it('should get order addresses', async () => {
      server.use(
        rest.get(`${BASE_URL}/order/get_list_order_address`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: [] }));
        })
      );
      const res = await ordersApi.getOrderAddresses();
      expect(res.success).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('should get ship fee', async () => {
      server.use(
        rest.post(`${BASE_URL}/order/get_ship_fee`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: { fee: 15000, estimated_days: 2 } }));
        })
      );
      const res = await ordersApi.getShipFee({ product_id: 1, address_id: 1 });
      expect(res.success).toBe(true);
      expect(res.data.fee).toBe(15000);
    });
  });

  describe('Order Management', () => {
    it('should get single purchase details', async () => {
      server.use(
        rest.post(`${BASE_URL}/order/get_purchase`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: { id: 'ORD123', status: 'pending' } }));
        })
      );
      const res = await ordersApi.getPurchase('ORD123');
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('pending');
    });

    it('should cancel order successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/order/cancel_order`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: null }));
        })
      );
      const res = await ordersApi.cancelOrder('ORD123', 'Changed my mind');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('should handle network error when cancelling order', async () => {
      server.use(
        rest.post(`${BASE_URL}/order/cancel_order`, (req, res, ctx) => {
          return res.networkError('Offline');
        })
      );
      try {
        await ordersApi.cancelOrder('ORD123', 'Changed my mind');
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
