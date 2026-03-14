import { apiCall } from '../client';
import type {
  ApiResponse,
  Category,
  Brand,
  Product,
  ProductListItem,
  PaginatedResponse,
} from '../../../types';

export interface ProductFilters {
  category_id?: string;
  brand_id?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

export const productsApi = {
  getCategories: () =>
    apiCall<ApiResponse<Category[]>>('GET', '/get_categories'),

  getListProducts: (params?: ProductFilters) =>
    apiCall<ApiResponse<PaginatedResponse<ProductListItem>>>('GET', '/get_list_products', undefined, params as Record<string, unknown>),

  getProduct: (productId: string) =>
    apiCall<ApiResponse<Product>>('GET', '/get_products', undefined, { product_id: productId }),

  getListBrand: () =>
    apiCall<ApiResponse<Brand[]>>('GET', '/get_list_brand'),

  checkNewItems: (since: string) =>
    apiCall<ApiResponse<{ has_new: boolean; count: number }>>('GET', '/check_new_items', undefined, { since }),

  addProduct: (body: Omit<Product, 'id' | 'seller_id' | 'seller_name' | 'created_at' | 'updated_at' | 'rating' | 'rating_count' | 'like_count' | 'is_liked' | 'sold_count'>) =>
    apiCall<ApiResponse<Product>>('POST', '/add_products', body),

  editProduct: (productId: string, body: Partial<Product>) =>
    apiCall<ApiResponse<Product>>('POST', '/edit_products', { product_id: productId, ...body }),

  deleteProduct: (productId: string) =>
    apiCall<ApiResponse<null>>('POST', '/del_products', { product_id: productId }),

  getUserListings: (userId?: string, params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<ProductListItem>>>('GET', '/get_user_listings', undefined, { user_id: userId, ...params } as Record<string, unknown>),
};
