import { apiCall } from '../client';
import type {
  ApiResponse,
  AppNotification,
  Message,
  Conversation,
  BalanceTransaction,
  RewardAppeal,
  WithdrawRequest,
  PaginatedResponse,
} from '../../../types';

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<AppNotification>>>('GET', '/get_notification', undefined, params as Record<string, unknown>),

  markRead: (notificationId: string | 'all') =>
    apiCall<ApiResponse<null>>('POST', '/set_read_notification', { notification_id: notificationId }),
};

// ─── Messaging ───────────────────────────────────────────────────────────────

export const messagingApi = {
  send: (body: { recipient_id?: string; conversation_id?: string; content: string; type?: Message['type'] }) =>
    apiCall<ApiResponse<Message>>('POST', '/send_message', body),

  getConversation: (params: { recipient_id?: string; conversation_id?: string }) =>
    apiCall<ApiResponse<Conversation>>('GET', '/get_conversation', undefined, params),

  getConversationList: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Conversation>>>('GET', '/get_list_conversation', undefined, params as Record<string, unknown>),

  getConversationDetail: (conversationId: string, params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Message>>>('GET', '/get_conversation_detail', undefined, { conversation_id: conversationId, ...params } as Record<string, unknown>),

  markMessageRead: (conversationId: string) =>
    apiCall<ApiResponse<null>>('POST', '/set_read_message', { conversation_id: conversationId }),
};

// ─── Balance ──────────────────────────────────────────────────────────────────

export const balanceApi = {
  getCurrent: () =>
    apiCall<ApiResponse<{ balance: number }>>('POST', '/get_current_balance'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<BalanceTransaction>>>('POST', '/get_balance_history', undefined, params as Record<string, unknown>),

  createWithdrawRequest: (body: { amount: number; note?: string }) =>
    apiCall<ApiResponse<WithdrawRequest>>('POST', '/create_withdraw_request', body),

  getWithdrawRequest: (requestId: string) =>
    apiCall<ApiResponse<WithdrawRequest>>('GET', '/get_withdraw_request', undefined, { request_id: requestId }),

  handleWithdrawRequest: (requestId: string, action: 'approve' | 'reject', note?: string) =>
    apiCall<ApiResponse<null>>('POST', '/set_request_withdraw', { request_id: requestId, action, note }),
};

// ─── Rewards ─────────────────────────────────────────────────────────────────

export const rewardsApi = {
  uploadVideo: (body: { file_name: string; mime_type: string; base64?: string }) =>
    apiCall<ApiResponse<{ upload_url: string; video_url: string }>>('POST', '/upload_video', body),

  createAppeal: (body: {
    video_url: string;
    images?: string[];
    description?: string;
    appealed_amount?: number;
  }) => apiCall<ApiResponse<RewardAppeal>>('POST', '/create_reward_appeal', body),
};

// ─── Cart (Local Only) ────────────────────────────────────────────────────────

export const cartApi = {
  // Tạm thời loại bỏ để xử lý local:
  // addToCart: (body: { product_id: string; quantity: number }) =>
  //   apiCall<ApiResponse<{ cart_id: string }>>('POST', '/add_to_cart', body),
};
