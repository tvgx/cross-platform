import { rest } from 'msw';
import { messagingApi } from '../../../../lib/api/endpoints/misc';
import { productsApi } from '../../../../lib/api/endpoints/products';
import { socialApi } from '../../../../lib/api/endpoints/social';
import { server } from '../../../../mocks/server';

jest.mock('../../../../store/network', () => ({
  useNetworkStore: {
    getState: jest.fn().mockReturnValue({ isBackendAlive: true, setBackendAlive: jest.fn() }),
  },
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('Buyer Social & Products APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Products Metadata', () => {
    it('should get categories successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/get_categories`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: [{ id: '1', name: 'Weapons' }] }));
        })
      );
      const res = await productsApi.getCategories();
      expect(res.success).toBe(true);
      expect(res.data[0].name).toBe('Weapons');
    });

    it('should get list brands successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/get_list_brands`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: [{ id: '1', name: 'Armory' }] }));
        })
      );
      const res = await productsApi.getListBrand();
      expect(res.success).toBe(true);
      expect(res.data[0].name).toBe('Armory');
    });
  });

  describe('Social Interactions', () => {
    it('should get comments for a product', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/get_comments_product`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({
            success: true,
            data: { items: [{ id: '1', content: 'Great!' }], total: 1 }
          }));
        })
      );
      const res = await socialApi.getComments('100');
      expect(res.success).toBe(true);
      expect(res.data.items[0].content).toBe('Great!');
    });

    it('should post a comment', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/set_comments_product`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: { id: '2', content: 'Nice' } }));
        })
      );
      const res = await socialApi.postComment({ product_id: '100', content: 'Nice' });
      expect(res.success).toBe(true);
      expect(res.data.id).toBe('2');
    });

    it('should like a product', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/like_product`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: true, data: { is_liked: true, like_count: 5 } }));
        })
      );
      const res = await socialApi.likeProduct('100');
      expect(res.success).toBe(true);
      expect(res.data.is_liked).toBe(true);
      expect(res.data.like_count).toBe(5);
    });
  });

  describe('Messaging', () => {
    it('should get conversation list', async () => {
      server.use(
        rest.get(`${BASE_URL}/get_list_conversation`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({
            success: true,
            data: { items: [{ id: 'c1', unread_count: 0 }], total: 1 }
          }));
        })
      );
      const res = await messagingApi.getConversationList();
      expect(res.success).toBe(true);
      expect(res.data.items).toHaveLength(1);
    });
  });
});
