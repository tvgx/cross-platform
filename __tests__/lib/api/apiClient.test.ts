import { apiClient, apiCall } from '../../../lib/api/client';
import { useNetworkStore } from '../../../store/network';
import { rest } from 'msw';
import { server } from '../../../mocks/server';
import { getStoredJSON, removeStored } from '../../../lib/storage/mmkv';

// Mock dependencies
jest.mock('../../../store/network', () => ({
  useNetworkStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../../lib/storage/mmkv', () => ({
  getStoredJSON: jest.fn(),
  removeStored: jest.fn(),
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('apiClient & apiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    (useNetworkStore.getState as jest.Mock).mockReturnValue({
      isBackendAlive: true,
      checkBackendHealth: jest.fn(),
      setBackendAlive: jest.fn(),
    });
    (getStoredJSON as jest.Mock).mockReturnValue(null);
  });

  describe('Request Interceptor', () => {
    it('should attach Authorization header if token exists in auth_tokens', async () => {
      (getStoredJSON as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_tokens') return { access_token: 'test-token-123' };
        return null;
      });

      server.use(
        rest.get(`${BASE_URL}/test-auth`, (req, res, ctx) => {
          return res(ctx.json({ success: true, token: req.headers.get('Authorization') }));
        })
      );

      const response = await apiClient.get('/test-auth');
      expect(response.data.token).toBe('Bearer test-token-123');
    });

    it('should attach Authorization header if token exists in auth-storage (Zustand)', async () => {
      (getStoredJSON as jest.Mock).mockImplementation((key) => {
        if (key === 'auth-storage') return { state: { tokens: { access_token: 'zustand-token-456' } } };
        return null;
      });

      server.use(
        rest.get(`${BASE_URL}/test-auth-zustand`, (req, res, ctx) => {
          return res(ctx.json({ success: true, token: req.headers.get('Authorization') }));
        })
      );

      const response = await apiClient.get('/test-auth-zustand');
      expect(response.data.token).toBe('Bearer zustand-token-456');
    });
  });

  describe('Response Interceptor', () => {
    it('should resolve if code is 1000', async () => {
      server.use(
        rest.get(`${BASE_URL}/test-success`, (req, res, ctx) => {
          return res(ctx.json({ code: '1000', message: 'OK' }));
        })
      );

      const response = await apiClient.get('/test-success');
      expect(response.data.success).toBe(true);
    });

    it('should reject and throw error if code is not a success code (e.g. 9999)', async () => {
      server.use(
        rest.get(`${BASE_URL}/test-error`, (req, res, ctx) => {
          return res(ctx.json({ code: '9999', message: 'Lỗi server' }));
        })
      );

      try {
        await apiClient.get('/test-error');
      } catch (e: any) {
        expect(e.message).toBe('Lỗi server');
      }
    });

    it('should call removeStored on 401 Unauthorized', async () => {
      server.use(
        rest.get(`${BASE_URL}/test-401`, (req, res, ctx) => {
          return res(ctx.status(401));
        })
      );

      try {
        await apiClient.get('/test-401');
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(removeStored).toHaveBeenCalledWith('auth_tokens');
      expect(removeStored).toHaveBeenCalledWith('auth-storage');
    });

    it('should setBackendAlive to false on Network Error', async () => {
      const setBackendAliveMock = jest.fn();
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isBackendAlive: true,
        setBackendAlive: setBackendAliveMock,
      });

      server.use(
        rest.get(`${BASE_URL}/test-network-error`, (req, res) => {
          return res.networkError('Failed to connect');
        })
      );

      try {
        await apiClient.get('/test-network-error');
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(setBackendAliveMock).toHaveBeenCalledWith(false);
    });
  });

  describe('apiCall helper', () => {
    it('should make request if backend is alive', async () => {
      server.use(
        rest.get(`${BASE_URL}/test-api-call`, (req, res, ctx) => {
          return res(ctx.json({ code: '1000', data: 'success data' }));
        })
      );

      const data = await apiCall('GET', '/test-api-call');
      expect((data as any).data).toBe('success data');
    });

    it('should reject with "Local Mode Only" and ping health check if backend is dead', async () => {
      const checkBackendHealthMock = jest.fn();
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isBackendAlive: false,
        checkBackendHealth: checkBackendHealthMock,
      });

      try {
        await apiCall('GET', '/some-endpoint');
      } catch (e: any) {
        expect(e.message).toBe('Local Mode Only');
      }
      expect(checkBackendHealthMock).toHaveBeenCalled();
    });
  });
});
