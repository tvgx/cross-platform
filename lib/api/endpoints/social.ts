import { apiCall } from '../client';
import { ProductRepository } from '../../repositories/ProductRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { useAuthStore } from '../../../store/auth';
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
  getComments: async (productId: string, params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    try {
      const res = await apiCall<ApiResponse<PaginatedResponse<Comment>>>('POST', '/api/get_comments_product', {
        product_id: parseInt(productId, 10),
        index: (page - 1) * limit,
        count: limit,
      });

      const serverItems = Array.isArray((res as any).data)
        ? (res as any).data
        : ((res as any).data?.items || []);

      serverItems.forEach((c: any) => {
        ProductRepository.addComment({
          id: String(c.id || `comment_${productId}_${Date.now()}_${Math.random().toString(36).slice(2)}`),
          product_id: String(c.product_id || productId),
          user_id: String(c.user_id || c.poster?.id || '0'),
          user_name: c.poster?.name || c.username || c.user_name || 'User',
          content: c.content || '',
          created_at: c.created_at || new Date().toISOString(),
          sync_status: 'synced',
        });
      });

      return res;
    } catch (error) {
      const localItems = ProductRepository.getComments(productId).map((c: any) => ({
        id: c.id,
        product_id: c.product_id,
        user_id: c.user_id,
        username: c.username,
        content: c.content,
        created_at: c.created_at,
      }));

      return {
        success: true,
        data: {
          items: localItems,
          total: localItems.length,
          page,
          limit,
          has_more: false,
        },
      } as ApiResponse<PaginatedResponse<Comment>>;
    }
  },

  postComment: async (body: { product_id: string; content: string }) => {
    const user = useAuthStore.getState().user;
    const localComment = {
      id: `comment_${body.product_id}_${user?.id || 'guest'}_${Date.now()}`,
      product_id: body.product_id,
      user_id: String(user?.id || 'guest'),
      user_name: user?.username || user?.full_name || 'User',
      content: body.content,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await apiCall<ApiResponse<Comment>>('POST', '/api/set_comments_product', {
        product_id: parseInt(body.product_id, 10),
        content: body.content,
        index: 0,
        count: 20
      });

      const serverComment: any = res.data || {};
      ProductRepository.addComment({
        ...localComment,
        id: String(serverComment.id || localComment.id),
        user_id: String(serverComment.user_id || localComment.user_id),
        user_name: serverComment.username || serverComment.user_name || localComment.user_name,
        created_at: serverComment.created_at || localComment.created_at,
        sync_status: 'synced',
      });

      return res;
    } catch (error: any) {
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || !error?.response) {
        ProductRepository.addComment(localComment);
        ProductRepository.queueComment(localComment);
        return {
          success: true,
          data: {
            id: localComment.id,
            product_id: localComment.product_id,
            user_id: localComment.user_id,
            username: localComment.user_name,
            content: localComment.content,
            created_at: localComment.created_at,
          } as Comment,
          message: 'Đã lưu bình luận offline, sẽ đồng bộ khi có mạng.',
        };
      }
      throw error;
    }
  },

  likeProduct: async (productId: string) => {
    const user = useAuthStore.getState().user;
    try {
      const res = await apiCall<ApiResponse<{ is_liked: boolean; like_count: number }>>('POST', '/api/like_product', {
        product_id: parseInt(productId, 10)
      });

      if (user && res.data) {
        ProductRepository.likeProduct(productId, String(user.id), !!res.data.is_liked, Number(res.data.like_count || 0));
      }

      return res;
    } catch (error: any) {
      if (user && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || !error?.response)) {
        ProductRepository.queueLikeProduct(productId, String(user.id));
      }
      throw error;
    }
  },

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

  setRating: (body: { user_id: string | number; score: number; comment?: string; product_id?: string; purchase_id?: string }) =>
    apiCall<ApiResponse<Rating>>('POST', '/api/set_rates', {
      user_id: typeof body.user_id === 'string' ? parseInt(body.user_id, 10) : body.user_id,
      level: body.score,
      content: body.comment ?? '',
      ...(body.product_id ? { product_id: parseInt(body.product_id, 10) } : {}),
      ...(body.purchase_id ? { purchase_id: parseInt(body.purchase_id, 10) } : {}),
    }),

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

  delSavedSearch: (params: { keyword?: string; search_id?: number }) =>
    apiCall<ApiResponse<null>>('POST', '/api/del_saved_search', params),

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
  setFollow: async (body: { user_id: string; action: 'follow' | 'unfollow' }) => {
    const user = useAuthStore.getState().user;
    if (user) {
      ProductRepository.ensureUserRow(String(user.id));
      if (body.action === 'follow') {
        UserRepository.followUser(String(user.id), body.user_id);
      } else {
        UserRepository.unfollowUser(String(user.id), body.user_id);
      }
    }

    try {
      const res = await apiCall<ApiResponse<null>>('POST', '/set_user_follow', {
        followee_id: parseInt(body.user_id, 10),
        action: body.action
      });
      return res;
    } catch (error: any) {
      if (user && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || !error?.response)) {
        UserRepository.queueFollowUser(String(user.id), body.user_id, body.action === 'follow');
        return {
          success: true,
          data: null,
          message: 'Đã lưu trạng thái theo dõi offline, sẽ đồng bộ khi có mạng.'
        } as unknown as ApiResponse<null>;
      }
      throw error;
    }
  },

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