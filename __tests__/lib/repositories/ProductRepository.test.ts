import { ProductRepository } from '../../../lib/repositories/ProductRepository';
import { db } from '../../../lib/storage/sqlite';
import { useCatalogStore } from '../../../store/catalog';
import { server } from '../../../mocks/server';
import { rest } from 'msw';

// Mock DB và Store
jest.mock('../../../store/catalog', () => ({
  useCatalogStore: {
    getState: jest.fn(),
  },
}));

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

describe('ProductRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default catalog store mock
    (useCatalogStore.getState as jest.Mock).mockReturnValue({
      isStale: jest.fn().mockReturnValue(true), // Giả lập dữ liệu cũ, cần gọi API
      setProducts: jest.fn(),
      markSynced: jest.fn(),
      categories: [],
      brands: [],
      setCategories: jest.fn(),
      setBrands: jest.fn(),
    });
  });

  describe('Online Mode (API call success)', () => {
    it('should fetch products from API, save to SQLite, and return local products', async () => {
      // Mock db.getAllSync to simulate returning the products after saving to SQLite
      (db.getAllSync as jest.Mock).mockReturnValue([
        { id: '1', title: 'Sản phẩm Test 1', price: 10000, is_stock: 1 }
      ]);

      const products = await ProductRepository.getProducts();

      // Kiểm tra xem db.runSync (hay transaction) đã được gọi để lưu sản phẩm chưa
      expect(db.withTransactionSync).toHaveBeenCalled();
      
      // Kiểm tra dữ liệu trả về từ (mocked) SQLite
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('1');
      expect(products[0].name).toBe('Sản phẩm Test 1');
    });

    it('should correctly fetch product details from API and save to SQLite', async () => {
      // Mock db.getFirstSync to return null initially, forcing API call
      (db.getFirstSync as jest.Mock).mockReturnValueOnce(null);

      // Mock API detail
      server.use(
        rest.post(`${BASE_URL}/api/get_products`, (req, res, ctx) => {
          return res(ctx.json({
            code: '1000',
            message: 'OK',
            data: { id: '99', name: 'Detail Product', price: '500' },
            success: true
          }));
        })
      );

      const product = await ProductRepository.getProductDetail('99');
      
      expect(db.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO Products'),
        expect.arrayContaining(['99', 'Detail Product', 500])
      );
      expect(product?.id).toBe('99');
      expect(product?.title).toBe('Detail Product');
    });
  });

  describe('Offline Mode / Fallback', () => {
    it('should catch API error and fallback to SQLite data', async () => {
      // Ép API lỗi 500
      server.use(
        rest.post(`${BASE_URL}/api/get_list_products`, (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      // Mặc dù API lỗi, db.getAllSync vẫn trả về data
      (db.getAllSync as jest.Mock).mockReturnValue([
        { id: 'offline_1', title: 'Sản phẩm Offline', price: 20000 }
      ]);

      const products = await ProductRepository.getProducts();
      
      // Test fallback thành công
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('offline_1');
    });

    it('should fallback to SQLite when getting product detail fails', async () => {
      // Ép API lỗi 500
      server.use(
        rest.post(`${BASE_URL}/api/get_products`, (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      // Mock SQLite trả về detail
      (db.getFirstSync as jest.Mock).mockReturnValue({
        id: 'detail_offline',
        title: 'Detail Offline',
        price: 15000
      });

      const product = await ProductRepository.getProductDetail('detail_offline');
      expect(product?.id).toBe('detail_offline');
      expect(product?.title).toBe('Detail Offline');
    });
  });

  describe('Edge Cases', () => {
    it('should handle API returning malformed data gracefully', async () => {
      server.use(
        rest.post(`${BASE_URL}/api/get_list_products`, (req, res, ctx) => {
          return res(ctx.json({
            code: '1000',
            success: true,
            data: null // Malformed: data là null thay vì mảng
          }));
        })
      );

      (db.getAllSync as jest.Mock).mockReturnValue([]);

      // Code không được crash
      const products = await ProductRepository.getProducts();
      expect(products).toEqual([]);
    });

    it('getLocalProducts should return empty array if SQLite query throws', () => {
      (db.getAllSync as jest.Mock).mockImplementation(() => {
        throw new Error('SQLite Error');
      });

      const products = ProductRepository.getLocalProducts();
      expect(products).toEqual([]);
    });
  });
});
