import { apiCall } from '../client';
import type {
  ApiResponse,
  Order,
  OrderAddress,
  OrderTimeline,
  ShipFrom,
  ShipFee,
  PaginatedResponse,
} from '../../../types';

export const ordersApi = {
  // Shipping
  getShipFrom: () =>
    apiCall<ApiResponse<ShipFrom[]>>('GET', '/get_ship_from'),

  getShipFee: (params: { ship_from_id: string; ship_to: string }) =>
    apiCall<ApiResponse<ShipFee>>('GET', '/get_ship_fee', undefined, params),

  // Order addresses
  getOrderAddresses: () =>
    apiCall<ApiResponse<OrderAddress[]>>('GET', '/get_list_order_address'),

  addOrderAddress: (body: Omit<OrderAddress, 'id'>) =>
    apiCall<ApiResponse<OrderAddress>>('POST', '/add_order_address', body),

  editOrderAddress: (addressId: string, body: Partial<Omit<OrderAddress, 'id'>>) =>
    apiCall<ApiResponse<OrderAddress>>('POST', '/edit_order_address', { address_id: addressId, ...body }),

  deleteOrderAddress: (addressId: string) =>
    apiCall<ApiResponse<null>>('POST', '/delete_order_address', { address_id: addressId }),

  // Orders
  getOrderStatus: (orderId: string) =>
    apiCall<ApiResponse<{ status: Order['status'] }>>('GET', '/get_order_status', undefined, { order_id: orderId }),

  createOrder: (body: {
    items: { product_id: string; quantity: number }[];
    address_id: string;
    note?: string;
  }) => apiCall<ApiResponse<Order>>('POST', '/create_order', body),

  getPurchases: (params?: { status?: Order['status']; page?: number; limit?: number }) =>
    apiCall<ApiResponse<PaginatedResponse<Order>>>('GET', '/get_list_purchases', undefined, params as Record<string, unknown>),

  getPurchase: (orderId: string) =>
    apiCall<ApiResponse<Order>>('GET', '/get_purchase', undefined, { order_id: orderId }),

  editPurchase: (orderId: string, body: Partial<Order>) =>
    apiCall<ApiResponse<Order>>('POST', '/edit_purchase', { order_id: orderId, ...body }),

  cancelOrder: (orderId: string, reason?: string) =>
    apiCall<ApiResponse<null>>('POST', '/cancel_order', { order_id: orderId, reason }),

  sellerMarkShipped: (orderId: string, trackingNumber?: string) =>
    apiCall<ApiResponse<null>>('POST', '/seller_mark_as_shipped', { order_id: orderId, tracking_number: trackingNumber }),

  buyerConfirmReceived: (orderId: string) =>
    apiCall<ApiResponse<null>>('POST', '/buyer_confirm_received', { order_id: orderId }),

  getOrderTimeline: (orderId: string) =>
    apiCall<ApiResponse<OrderTimeline[]>>('GET', '/get_order_timeline', undefined, { order_id: orderId }),

  setAcceptBuyer: (orderId: string, accept: boolean) =>
    apiCall<ApiResponse<null>>('POST', '/set_accept_buyer', { order_id: orderId, accept }),

  refundOrder: (body: { order_id: string; reason: string }) =>
    apiCall<ApiResponse<null>>('POST', '/refund_order', body),
};
