import NetInfo from '@react-native-community/netinfo';
import { db } from '../storage/sqlite';
import { productsApi, ProductFilters } from '../api/endpoints/products';
import { useCatalogStore } from '../../store/catalog';
import { useNetworkStore } from '../../store/network';
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
      const catalogStore = useCatalogStore.getState();
      const isStale = catalogStore.isStale();

      // 1. Thử gọi API trước (Online-first)
      if (isStale || forceRefresh) {
        try {
          console.log('[ProductRepo] Kích hoạt tải dữ liệu từ Server...');
          // Chạy đồng bộ để chờ dữ liệu mới nhất (Online-first)
          await this.fetchAndSyncProducts(filters);
        } catch (err) {
          console.warn('[ProductRepo] Lỗi tải danh sách sản phẩm từ Server (Offline/Error), fallback về SQLite:', err);
        }
      }

      // 2. Lấy dữ liệu cục bộ (sau khi đã cập nhật nếu có)
      const localProducts = this.getLocalProducts(filters);
      return localProducts;
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
        name: row.title || row.name,
        price: row.price,
        price_new: row.price_new,
        image: row.images || row.image,
        video: row.video,
        seller_id: row.seller_id,
        seller_name: 'Nhà cung cấp quân nhu', // Fallback tên
        rating: row.rating || 5.0,
        like: row.like_count || row.like || 0,
        comment: row.comment || 0,
        is_liked: row.is_liked === 1,
        stock: row.stock || 0,
        is_stock: row.is_stock === 1,
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
      const localProduct = this.getLocalProductDetail(productId);

      // 1. Thử gọi API trước
      if (!localProduct || forceRefresh) {
        try {
          const response = await productsApi.getProduct(productId);
          if (response && response.success && response.data) {
            const p: any = response.data;
            // Lưu vào SQLite dã chiến cục bộ
            db.runSync(
              `INSERT OR REPLACE INTO Products 
              (id, seller_id, category_id, brand_id, title, description, price, price_new, images, video, stock, is_stock, sold_count, rating, like_count, comment, is_liked, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                String(p.id),
                p.seller_id ? String(p.seller_id) : '1',
                p.category_id ? String(p.category_id) : '1',
                p.brand_id ? String(p.brand_id) : 'b1',
                p.title || p.name || 'Không có tên',
                p.description || '',
                Number(p.price) || 0,
                Number(p.price_new) || 0,
                p.images || p.image || null,
                p.video || null,
                p.stock !== undefined ? p.stock : (p.is_stock ? 100 : 0),
                p.is_stock ? 1 : 0,
                p.sold_count || 0,
                p.rating || 5.0,
                p.like_count || p.like || 0,
                p.comment || 0,
                p.is_liked === true || p.is_liked === '1' ? 1 : 0,
                p.created_at || new Date().toISOString()
              ]
            );
            return p;
          }
        } catch (err) {
          console.warn('[ProductRepo] Lỗi lấy chi tiết sản phẩm từ Server, fallback về SQLite:', err);
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
        title: row.title || row.name,
        description: row.description || '',
        price: row.price,
        price_new: row.price_new,
        images: row.images ? [row.images] : [],
        video: row.video,
        category_id: row.category_id,
        brand_id: row.brand_id,
        seller_id: row.seller_id,
        seller_name: 'Nhà cung cấp quân nhu',
        stock: row.stock || 0,
        is_stock: row.is_stock === 1,
        sold_count: row.sold_count || 0,
        rating: row.rating || 5.0,
        like_count: row.like_count || row.like || 0,
        comment: row.comment || 0,
        is_liked: row.is_liked === 1,
        created_at: row.created_at,
        updated_at: row.created_at,
      } as unknown as Product;
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

    if (store.isStale() || force || store.categories.length === 0) {
      try {
        console.log('[ProductRepo] Đồng bộ danh mục từ máy chủ...');
        const [catRes, brandRes] = await Promise.all([
          productsApi.getCategories(),
          productsApi.getListBrand()
        ]);

        if (catRes && catRes.success && catRes.data) {
          store.setCategories(catRes.data);
        }
        if (brandRes && brandRes.success && brandRes.data) {
          store.setBrands(brandRes.data);
        }
        store.markSynced();
      } catch (err) {
        console.warn('[ProductRepo] Lỗi tải danh mục/thương hiệu (Offline/Error):', err);
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
      const items = Array.isArray(response.data) 
        ? response.data 
        : (response.data && Array.isArray((response.data as any).items) ? (response.data as any).items : []);

      // Chạy Transaction đồng bộ SQLite hàng loạt cực kỳ tối ưu
      db.withTransactionSync(() => {
        items.forEach((p: any) => {
          db.runSync(
            `INSERT OR REPLACE INTO Products 
            (id, seller_id, category_id, brand_id, title, description, price, price_new, images, video, stock, is_stock, sold_count, rating, like_count, comment, is_liked, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(p.id),
              p.seller_id ? String(p.seller_id) : '1',
              p.category_id ? String(p.category_id) : '1',
              p.brand_id ? String(p.brand_id) : 'b1',
              p.title || p.name || 'Không có tên',
              p.description || '',
              Number(p.price) || 0,
              Number(p.price_new) || 0,
              p.images || p.image || null,
              p.video || null,
              p.stock !== undefined ? p.stock : (p.is_stock ? 100 : 0),
              p.is_stock ? 1 : 0,
              p.sold_count || 0,
              p.rating || 5.0,
              p.like_count || p.like || 0,
              p.comment || 0,
              p.is_liked === true || p.is_liked === '1' ? 1 : 0,
              p.created_at || new Date().toISOString()
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
   * Helper an toàn chống crash ứng dụng khi phân tích chuỗi JSON lưu trong SQLite.
   */
  safeParseJSON(text: string | null | undefined, fallback: any): any {
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  },

  /**
   * Cập nhật lượt thích sản phẩm của người dùng và lưu vào SQLite Likes.
   */
  likeProduct(productId: string, userId: string, isLiked: boolean, likeCount: number): void {
    try {
      db.withTransactionSync(() => {
        // A. Cập nhật bảng Products
        db.runSync(
          'UPDATE Products SET is_liked = ?, like_count = ? WHERE id = ?',
          [isLiked ? 1 : 0, likeCount, productId]
        );

        // B. Lưu hoặc xóa lượt thích chi tiết
        if (isLiked) {
          const likeId = `like_${userId}_${productId}`;
          db.runSync(
            'INSERT OR REPLACE INTO Likes (id, product_id, user_id, sync_status) VALUES (?, ?, ?, ?)',
            [likeId, productId, userId, 'pending_sync']
          );
        } else {
          db.runSync(
            'DELETE FROM Likes WHERE product_id = ? AND user_id = ?',
            [productId, userId]
          );
        }
      });
      console.log(`[ProductRepo] Đã lưu cập nhật lượt thích sản phẩm ${productId} cho User ${userId}`);
    } catch (e) {
      console.error('[ProductRepo] Lỗi cập nhật lượt thích sản phẩm:', e);
      throw e;
    }
  },

  /**
   * Lấy danh sách bình luận của một sản phẩm quân nhu.
   */
  getComments(productId: string): any[] {
    try {
      const rows = db.getAllSync<any>(
        'SELECT * FROM Comments WHERE target_id = ? OR product_id = ? ORDER BY created_at DESC',
        [productId, productId]
      );
      return rows.map(r => ({
        id: r.id,
        product_id: r.product_id || r.target_id,
        user_id: r.user_id,
        username: r.user_name || 'Đồng chí ẩn danh',
        content: r.content,
        created_at: r.created_at
      }));
    } catch (e) {
      console.error('[ProductRepo] Lỗi lấy danh sách bình luận:', e);
      return [];
    }
  },

  /**
   * Thêm bình luận dã chiến mới (offline-first).
   */
  addComment(comment: {
    id: string;
    product_id: string;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
  }): void {
    try {
      db.runSync(
        `INSERT INTO Comments (id, target_id, product_id, user_id, user_name, content, sync_status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          comment.id,
          comment.product_id,
          comment.product_id,
          comment.user_id,
          comment.user_name,
          comment.content,
          'pending_sync',
          comment.created_at
        ]
      );
      console.log(`[ProductRepo] Thêm bình luận offline ${comment.id} thành công.`);
    } catch (e) {
      console.error('[ProductRepo] Lỗi thêm bình luận dã chiến:', e);
      throw e;
    }
  }
};
