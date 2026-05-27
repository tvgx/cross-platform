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
  getComments: (productId: string, params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<Comment>>>('POST', '/api/get_comments_product', {
      product_id: parseInt(productId, 10),
      index: (page - 1) * limit,
      count: limit,
    });
  },

  postComment: (body: { product_id: string; content: string }) =>
    apiCall<ApiResponse<Comment>>('POST', '/api/set_comments_product', {
      product_id: parseInt(body.product_id, 10),
      content: body.content,
      index: 0,
      count: 20
    }),

  likeProduct: (productId: string) =>
    apiCall<ApiResponse<{ is_liked: boolean; like_count: number }>>('POST', '/api/like_product', {
      product_id: parseInt(productId, 10)
    }),

  reportProduct: (body: { product_id: string; reason: string }) =>
    apiCall<ApiResponse<null>>('POST', '/api/report_product', {
      product_id: parseInt(body.product_id, 10),
      subject: 'Báo cáo khí tài',
      details: body.reason
    }),

  // Ratings
  getRatings: (productId: string, params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<Rating>>>('POST', '/api/get_rates', {
      user_id: parseInt(productId, 10),
      index: (page - 1) * limit,
      count: limit
    });
  },

  setRating: (body: { product_id: string; order_id: string; score: number; comment?: string; images?: string[] }) =>
    apiCall<ApiResponse<Rating>>('POST', '/api/set_rates', body),

  // Search
  search: (params: { q: string; category_id?: string; page?: number; limit?: number }) => {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const body: Record<string, unknown> = {
      keyword: params.q,
      index: (page - 1) * limit,
      count: limit
    };
    if (params.category_id) {
      body.category_id = parseInt(params.category_id, 10);
    }
    return apiCall<ApiResponse<PaginatedResponse<{ type: 'product' | 'user'; item: unknown }>>>('POST', '/api/search', body);
  },

  saveSearch: (keyword: string) =>
    apiCall<ApiResponse<null>>('POST', '/api/save_search', { keyword }),

  getSavedSearches: () =>
    apiCall<ApiResponse<string[]>>('POST', '/api/get_list_saved_search', {}),

  // News
  getNewsList: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<NewsItem>>>('POST', '/News/list_news', {
      index: (page - 1) * limit,
      count: limit
    });
  },

  getNews: (newsId: string) =>
    apiCall<ApiResponse<NewsItem>>('GET', `/News/${newsId}`),

  // Follow / Block
  setFollow: (body: { user_id: string; action: 'follow' | 'unfollow' }) =>
    apiCall<ApiResponse<null>>('POST', '/set_user_follow', {
      followee_id: parseInt(body.user_id, 10),
      action: body.action
    }),

  getFollowed: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('POST', '/get_list_followed', {
      user_id: 1,
      index: (page - 1) * limit,
      count: limit
    });
  },

  getFollowing: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('POST', '/get_list_following', {
      user_id: 1,
      index: (page - 1) * limit,
      count: limit
    });
  },

  blockUser: (body: { user_id: string; action: 'block' | 'unblock' }) =>
    apiCall<ApiResponse<null>>('POST', '/set_user_block', {
      user_id: parseInt(body.user_id, 10),
      type: body.action === 'block' ? 1 : 0
    }),

  getBlocks: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<UserProfile>>>('POST', '/get_list_blocks', {
      index: (page - 1) * limit,
      count: limit
    });
  },
};
