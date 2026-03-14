import { apiCall } from '../client';
import type {
  ApiResponse,
  Comment,
  Rating,
  NewsItem,
  UserProfile,
  PaginatedResponse,
} from '../../../types';

export const socialApi = {
  // Comments
  getComments: (productId: string, params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Comment>>>('GET', '/get_comments_product', undefined, { product_id: productId, ...params } as Record<string, unknown>),

  postComment: (body: { product_id: string; content: string }) =>
    apiCall<ApiResponse<Comment>>('POST', '/set_comments_product', body),

  likeProduct: (productId: string) =>
    apiCall<ApiResponse<{ is_liked: boolean; like_count: number }>>('POST', '/like_product', { product_id: productId }),

  reportProduct: (body: { product_id: string; reason: string }) =>
    apiCall<ApiResponse<null>>('POST', '/report_product', body),

  // Ratings
  getRatings: (productId: string, params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Rating>>>('GET', '/get_rates', undefined, { product_id: productId, ...params } as Record<string, unknown>),

  setRating: (body: { product_id: string; order_id: string; score: number; comment?: string; images?: string[] }) =>
    apiCall<ApiResponse<Rating>>('POST', '/set_rates', body),

  // Search
  search: (params: { q: string; category_id?: string; page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<{ type: 'product' | 'user'; item: unknown }>>>('GET', '/search', undefined, params as Record<string, unknown>),

  saveSearch: (keyword: string) =>
    apiCall<ApiResponse<null>>('POST', '/save_search', { keyword }),

  getSavedSearches: () =>
    apiCall<ApiResponse<string[]>>('GET', '/get_list_search_saved'),

  // News
  getNewsList: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<NewsItem>>>('GET', '/get_list_news', undefined, params as Record<string, unknown>),

  getNews: (newsId: string) =>
    apiCall<ApiResponse<NewsItem>>('GET', '/get_news', undefined, { news_id: newsId }),

  // Follow / Block
  setFollow: (body: { user_id: string; action: 'follow' | 'unfollow' }) =>
    apiCall<ApiResponse<null>>('POST', '/set_user_follow', body),

  getFollowed: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('GET', '/get_list_followed', undefined, params as Record<string, unknown>),

  getFollowing: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('GET', '/get_list_following', undefined, params as Record<string, unknown>),

  getBlocks: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('GET', '/get_list_blocks', undefined, params as Record<string, unknown>),

  blockUser: (body: { user_id: string; action: 'block' | 'unblock' }) =>
    apiCall<ApiResponse<null>>('POST', '/blocks', body),
};
