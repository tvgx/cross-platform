import { apiCall } from '../client';
import type {
  ApiResponse,
  AppNotification,
  Message,
  Conversation,
  BalanceTransaction,
  PaginatedResponse,
} from '../../../types';

// Helper tính offset phân trang từ page/limit.
const toIndex = (page?: number, limit?: number) =>
  page !== undefined && limit !== undefined ? (page - 1) * limit : 0;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; group?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<AppNotification>>>('POST', '/notification/get_notification', {
      index: toIndex(params?.page, params?.limit),
      count: params?.limit ?? 20,
      group: params?.group ?? 0,
    }),

  markRead: (notificationId: string | 'all') =>
    apiCall<ApiResponse<null>>('POST', '/notification/set_read_notification', { notification_id: notificationId }),
};

// ─── Messaging / Conversations ─────────────────────────────────────────────────

export const messagingApi = {
  send: (body: { to_id?: string | number; conversation_id?: string; content: string; type?: Message['type']; product_id?: string | number }) =>
    apiCall<ApiResponse<Message>>('POST', '/conversation/send_message', {
      ...(body.to_id !== undefined ? { to_id: body.to_id } : {}),
      ...(body.conversation_id !== undefined ? { conversation_id: body.conversation_id } : {}),
      message: body.content,
      type_message: body.type ?? 'text',
      ...(body.product_id !== undefined ? { product_id: body.product_id } : {}),
    }),

  getConversation: (params: { partner_id?: string | number; conversation_id?: string; page?: number; limit?: number }) =>
    apiCall<ApiResponse<Conversation>>('POST', '/conversation/get_conversation', {
      ...(params.partner_id !== undefined ? { partner_id: params.partner_id } : {}),
      ...(params.conversation_id !== undefined ? { conversation_id: params.conversation_id } : {}),
      index: toIndex(params.page, params.limit),
      count: params.limit ?? 20,
    }),

  getConversationList: (params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Conversation>>>('POST', '/conversation/get_list_conversation', {
      index: toIndex(params?.page, params?.limit),
      count: params?.limit ?? 20,
    }),

  getConversationDetail: (conversationId: string, params?: { page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Message>>>('POST', '/conversation/get_conversation', {
      conversation_id: conversationId,
      index: toIndex(params?.page, params?.limit),
      count: params?.limit ?? 20,
    }),

  markMessageRead: (partnerId: string | number) =>
    apiCall<ApiResponse<null>>('POST', '/conversation/set_read_message', { partner_id: partnerId }),
};

// ─── Balance ──────────────────────────────────────────────────────────────────

export const balanceApi = {
  getCurrent: () =>
    apiCall<ApiResponse<{ balance: number }>>('POST', '/wallets/get_current_balance'),

  getHistory: (params?: { index?: number; count?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<BalanceTransaction>>>('POST', '/wallets/get_balance_history', {
      index: params?.index ?? 0,
      count: params?.count ?? 20,
    }),
};

// LƯU Ý: ĐÃ BỎ `rewardsApi` (/rewards/*) và `cartApi` (/order/get_cart, add_cart, …)
// vì các path này KHÔNG tồn tại trong 68 API server (xem scripts/openapi.json).
// Giữ lại sẽ gọi 404. Server không có giỏ hàng phía server lẫn quy trình thưởng riêng;
// nếu cần, hãy dùng đúng endpoint server thật khi backend bổ sung.
