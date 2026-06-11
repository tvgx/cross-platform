import '@testing-library/jest-native/extend-expect';
import { server } from './mocks/server';
import { fetch, Headers, Request, Response } from 'undici';

// Cài đặt polyfill cho fetch để MSW hoạt động trong môi trường Node (Jest)
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// Bật MSW trước tất cả các tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers sau mỗi test để tránh ảnh hưởng chéo
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Đóng MSW sau khi chạy xong tất cả các tests
afterAll(() => server.close());

// --- MOCK CÁC THƯ VIỆN CỦA REACT NATIVE / EXPO ---

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn().mockReturnValue({ isConnected: true }),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
    withExclusiveTransactionSync: jest.fn((callback) => callback()),
    withTransactionSync: jest.fn((callback) => callback()),
  }),
}));

// Mock expo-background-task
jest.mock('expo-background-task', () => ({
  defineTask: jest.fn(),
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
  BackgroundTaskResult: {
    Success: 1,
    Failed: 2,
    NoData: 3,
  },
}));

// Mock AsyncStorage hoặc react-native-mmkv nếu có (ở đây project dùng MMKV)
jest.mock('react-native-mmkv', () => {
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      getString: jest.fn(),
      getNumber: jest.fn(),
      getBoolean: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
      contains: jest.fn(),
    })),
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  manifest: {},
  expoConfig: {
    hostUri: '127.0.0.1:8081',
  },
  ExecutionEnvironment: {
    Bare: 'bare',
    Standalone: 'standalone',
    StoreClient: 'storeClient',
  },
}));
