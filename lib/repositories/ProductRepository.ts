import NetInfo from '@react-native-community/netinfo';
import { db } from '../storage/sqlite';
import { productsApi, ProductFilters } from '../api/endpoints/products';
import { useCatalogStore } from '../../store/catalog';
import type { Product, ProductListItem, Category, Brand } from '../../types';

export const ProductRepository = {
  /**
   * Lấy danh sách sản phẩm dã chiến.
   * Ưu tiên tải dữ liệu từ local SQLite để hiển thị tức thì (0ms latency),
   * sau đó nếu có mạng và cache hết hạn (hoặc forced), sẽ kéo dữ liệu từ API và cập nhật SQLite + Store ngầm.
   * 
   * @param filters Bộ lọc sản phẩm
   * @param forceRefresh Ép buộc gọi API để làm mới hoàn toàn dữ liệu
   */
  async getProducts(filters?: ProductFilters, forceRefresh = false): Promise<ProductListItem[]> {
    try {
      // 1. Luôn đọc dữ liệu cục bộ trước tiên để UI tải siêu nhanh
      const localProducts = this.getLocalProducts(filters);

      // 2. Kiểm tra kết nối mạng và tính hợp lệ của cache
      const state = await NetInfo.fetch();
      const catalogStore = useCatalogStore.getState();
      const isStale = catalogStore.isStale();

      if (state.isConnected && (isStale || forceRefresh)) {
        console.log('[ProductRepo] Kích hoạt tải dữ liệu ngầm từ Server...');
        // Chạy bất đồng bộ ngầm để không chặn UI của lính dã chiến
        this.fetchAndSyncProducts(filters).catch(err => {
          console.warn('[ProductRepo] Lỗi đồng bộ danh sách sản phẩm:', err);
        });
      }

      return localProducts.length > 0 ? localProducts : this.getFallbackMockProducts(filters);
    } catch (error) {
      console.error('[ProductRepo] Lỗi trong getProducts:', error);
      return this.getLocalProducts(filters);
    }
  },

  /**
   * Đọc danh sách sản phẩm trực tiếp từ bảng Products trong SQLite.
   */
  getLocalProducts(filters?: ProductFilters): ProductListItem[] {
    try {
      let query = 'SELECT * FROM Products';
      const params: any[] = [];
      const clauses: string[] = [];

      if (filters?.category_id) {
        clauses.push('category_id = ?');
        params.push(filters.category_id);
      }
      if (filters?.brand_id) {
        clauses.push('brand_id = ?');
        params.push(filters.brand_id);
      }

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      // Xử lý Sắp xếp
      if (filters?.sort) {
        if (filters.sort === 'newest') {
          query += ' ORDER BY created_at DESC';
        } else if (filters.sort === 'price_asc') {
          query += ' ORDER BY price ASC';
        } else if (filters.sort === 'price_desc') {
          query += ' ORDER BY price DESC';
        } else if (filters.sort === 'popular') {
          query += ' ORDER BY sold_count DESC';
        }
      } else {
        query += ' ORDER BY created_at DESC';
      }

      // Phân trang dã chiến
      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.page) {
          query += ' OFFSET ?';
          params.push((filters.page - 1) * filters.limit);
        }
      }

      const rows = db.getAllSync<any>(query, params);
      
      return rows.map(row => ({
        id: row.id,
        title: row.title,
        price: row.price,
        // Chuyển mảng ảnh lưu dưới dạng chuỗi JSON trong SQLite thành mảng string[]
        images: this.safeParseJSON(row.images, []),
        seller_id: row.seller_id,
        seller_name: 'Nhà cung cấp quân nhu', // Fallback tên
        rating: row.rating || 5.0,
        like_count: row.like_count || 0,
        is_liked: row.is_liked === 1,
        stock: row.stock || 0,
        sold_count: row.sold_count || 0,
        category_id: row.category_id,
      }));
    } catch (e) {
      console.error('[ProductRepo] Lỗi truy vấn SQLite local:', e);
      return [];
    }
  },

  /**
   * Lấy chi tiết sản phẩm.
   */
  async getProductDetail(productId: string, forceRefresh = false): Promise<Product | null> {
    try {
      // 1. Đọc chi tiết sản phẩm cục bộ
      const localProduct = this.getLocalProductDetail(productId);

      const state = await NetInfo.fetch();
      if (state.isConnected && (!localProduct || forceRefresh)) {
        const response = await productsApi.getProduct(productId);
        if (response.success && response.data) {
          const p = response.data;
          // Lưu vào SQLite dã chiến cục bộ
          db.runSync(
            `INSERT OR REPLACE INTO Products 
            (id, seller_id, category_id, brand_id, title, description, price, images, image_urls, stock, sold_count, rating, like_count, is_liked, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.seller_id,
              p.category_id,
              p.brand_id || 'b1',
              p.title,
              p.description,
              p.price,
              JSON.stringify(p.images),
              JSON.stringify(p.images),
              p.stock,
              p.sold_count,
              p.rating,
              p.like_count,
              p.is_liked ? 1 : 0,
              p.created_at || new Date().toISOString()
            ]
          );
          return p;
        }
      }

      return localProduct;
    } catch (error) {
      console.error('[ProductRepo] Lỗi lấy chi tiết sản phẩm:', error);
      return this.getLocalProductDetail(productId);
    }
  },

  /**
   * Đọc chi tiết sản phẩm từ SQLite
   */
  getLocalProductDetail(productId: string): Product | null {
    try {
      const row = db.getFirstSync<any>('SELECT * FROM Products WHERE id = ?', [productId]);
      if (!row) return null;

      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        price: row.price,
        images: this.safeParseJSON(row.images, []),
        category_id: row.category_id,
        brand_id: row.brand_id,
        seller_id: row.seller_id,
        seller_name: 'Nhà cung cấp quân nhu',
        stock: row.stock || 0,
        sold_count: row.sold_count || 0,
        rating: row.rating || 5.0,
        rating_count: 10,
        like_count: row.like_count || 0,
        is_liked: row.is_liked === 1,
        created_at: row.created_at,
        updated_at: row.created_at,
      };
    } catch (e) {
      console.error('[ProductRepo] Lỗi lấy chi tiết SQLite:', e);
      return null;
    }
  },

  /**
   * Đồng bộ danh sách Danh mục (Categories) và Thương hiệu (Brands).
   */
  async syncCategoriesAndBrands(force = false): Promise<{ categories: Category[]; brands: Brand[] }> {
    const store = useCatalogStore.getState();
    const state = await NetInfo.fetch();

    if (state.isConnected && (store.isStale() || force || store.categories.length === 0)) {
      try {
        console.log('[ProductRepo] Đồng bộ danh mục từ máy chủ...');
        const [catRes, brandRes] = await Promise.all([
          productsApi.getCategories().catch(() => null),
          productsApi.getListBrand().catch(() => null)
        ]);

        if (catRes && catRes.success && catRes.data) {
          store.setCategories(catRes.data);
        }
        if (brandRes && brandRes.success && brandRes.data) {
          store.setBrands(brandRes.data);
        }
        store.markSynced();
      } catch (err) {
        console.error('[ProductRepo] Lỗi tải danh mục/thương hiệu:', err);
      }
    }

    return {
      categories: store.categories,
      brands: store.brands
    };
  },

  /**
   * Hàm trợ lý đồng bộ danh sách sản phẩm từ Server về SQLite cục bộ
   */
  async fetchAndSyncProducts(filters?: ProductFilters): Promise<void> {
    const response = await productsApi.getListProducts(filters);
    if (response.success && response.data) {
      const items = response.data.items;

      // Chạy Transaction đồng bộ SQLite hàng loạt cực kỳ tối ưu
      db.withTransactionSync(() => {
        items.forEach(p => {
          db.runSync(
            `INSERT OR REPLACE INTO Products 
            (id, seller_id, category_id, title, price, images, stock, sold_count, rating, like_count, is_liked, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.seller_id,
              p.category_id,
              p.title,
              p.price,
              JSON.stringify(p.images),
              p.stock,
              p.sold_count,
              p.rating,
              p.like_count,
              p.is_liked ? 1 : 0,
              new Date().toISOString()
            ]
          );
        });
      });

      // Đẩy dữ liệu vào Zustand Store để re-render UI mượt mà
      useCatalogStore.getState().setProducts(items);
      useCatalogStore.getState().markSynced();
      console.log(`[ProductRepo] Đồng bộ thành công ${items.length} sản phẩm từ Server.`);
    }
  },

  /**
   * Lọc và nạp dữ liệu Mock dự phòng khi DB hoàn toàn rỗng để lính dã chiến có trải nghiệm ban đầu tốt nhất.
   */
  getFallbackMockProducts(filters?: ProductFilters): ProductListItem[] {
    const { MOCK_PRODUCTS } = require('../mockDB');
    let items: any[] = MOCK_PRODUCTS;

    if (filters?.category_id) {
      items = items.filter(p => p.category_id === filters.category_id);
    }
    return items.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      images: p.images,
      seller_id: p.seller_id,
      seller_name: p.seller_name,
      rating: p.rating,
      like_count: p.like_count,
      is_liked: p.is_liked,
      stock: p.stock,
      sold_count: p.sold_count,
      category_id: p.category_id,
    }));
  },

  /**
   * Helper an toàn chống crash ứng dụng khi phân tích chuỗi JSON lưu trong SQLite.
   */
  safeParseJSON(text: string | null | undefined, fallback: any): any {
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }
};
