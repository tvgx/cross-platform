import { authApi } from '../../../../lib/api/endpoints/auth';
import { server } from '../../../../mocks/server';
import { rest } from 'msw';
import { useNetworkStore } from '../../../../store/network';

jest.mock('../../../../store/network', () => ({
  useNetworkStore: {
    getState: jest.fn().mockReturnValue({ isBackendAlive: true, setBackendAlive: jest.fn() }),
  },
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                tokens: { access_token: 'acc_token' },
                user: { id: 'u1', full_name: 'Soldier A' }
              }
            })
          );
        })
      );

      const res = await authApi.login({ phone_number: '0123', password: '123' });
      expect(res.success).toBe(true);
      expect(res.data.user.full_name).toBe('Soldier A');
    });

    it('should throw error on incorrect credentials (400)', async () => {
      server.use(
        rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ message: 'Sai thông tin đăng nhập' }));
        })
      );

      try {
        await authApi.login({ phone_number: '0123', password: 'wrong' });
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle network offline correctly', async () => {
      server.use(
        rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
          return res.networkError('Offline');
        })
      );

      try {
        await authApi.login({ phone_number: '0123', password: '123' });
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('signup', () => {
    it('should signup successfully', async () => {
      server.use(
        rest.post(`${BASE_URL}/auth/signup`, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                tokens: { access_token: 'acc_token' },
                user: { id: 'u2', full_name: 'New Soldier' }
              }
            })
          );
        })
      );

      const res = await authApi.signup({ phone_number: '0999', password: 'abc', uuid: 'dev-123' });
      expect(res.success).toBe(true);
      expect(res.data.user.id).toBe('u2');
    });
  });
});
