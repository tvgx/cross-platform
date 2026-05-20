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
  keyword?: string;
}

export const productsApi = {
  getCategories: (parentId?: number) =>
    apiCall<ApiResponse<Category[]>>('POST', '/api/get_categories', { parent_id: parentId }),

  getListProducts: (params?: ProductFilters) => {
    const body: Record<string, unknown> = {
      index: params?.page !== undefined && params?.limit !== undefined ? (params.page - 1) * params.limit : 0,
      count: params?.limit || 50,
    };
    if (params?.category_id) body.category_id = parseInt(params.category_id, 10);
    if (params?.brand_id) body.brand_id = parseInt(params.brand_id, 10);
    if (params?.keyword) body.keyword = params.keyword;
    if (params?.min_price) body.price_min = params.min_price;
    if (params?.max_price) body.price_max = params.max_price;
    if (params?.sort) body.order = params.sort;

    return apiCall<ApiResponse<ProductListItem[]>>('POST', '/api/get_list_products', body);
  },

  getProduct: (productId: string) =>
    apiCall<ApiResponse<Product>>('POST', '/api/get_products', { id: parseInt(productId, 10) }),

  getListBrand: (categoryId?: number) =>
    apiCall<ApiResponse<Brand[]>>('POST', '/api/get_list_brands', { category_id: categoryId }),

  checkNewItems: (since: string) =>
    apiCall<ApiResponse<{ has_new: boolean; count: number }>>('GET', '/check_new_items', undefined, { since }),

  addProduct: (body: Omit<Product, 'id' | 'seller_id' | 'seller_name' | 'created_at' | 'updated_at' | 'rating' | 'rating_count' | 'like_count' | 'is_liked' | 'sold_count'>) =>
    apiCall<ApiResponse<Product>>('POST', '/api/add_product', body),

  editProduct: (productId: string, body: Partial<Product>) =>
    apiCall<ApiResponse<Product>>('PATCH', `/api/update/${productId}`, body),

  deleteProduct: (productId: string) =>
    apiCall<ApiResponse<null>>('DELETE', `/api/delete/${productId}`),

  getUserListings: (userId?: string, params?: { page?: number; limit?: number }) => {
    const body = {
      user_id: userId ? parseInt(userId, 10) : 1,
      index: params?.page !== undefined && params?.limit !== undefined ? (params.page - 1) * params.limit : 0,
      count: params?.limit || 50,
      keyword: '',
      category_id: 0
    };
    return apiCall<ApiResponse<ProductListItem[]>>('POST', '/api/get_user_listings', body);
  },
};
