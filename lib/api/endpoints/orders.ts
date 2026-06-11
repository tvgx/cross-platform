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
  getShipFrom: (params?: { index: number; count: number; parent_id: number; level?: number }) =>
    apiCall<ApiResponse<ShipFrom[]>>('GET', '/order/get_ship_from', undefined, params as Record<string, unknown>),

  getShipFee: (params: { product_id: number; address_id: number }) =>
    apiCall<ApiResponse<ShipFee>>('POST', '/order/get_ship_fee', params),

  // Order addresses
  getProvinces: () =>
    apiCall<ApiResponse<any[]>>('GET', '/order/provinces'),

  getWards: (provinceId: number) =>
    apiCall<ApiResponse<any[]>>('GET', `/order/wards`, undefined, { province_id: provinceId }),

  getOrderAddresses: () =>
    apiCall<ApiResponse<OrderAddress[]>>('GET', '/order/get_list_order_address'),

  addOrderAddress: (body: Omit<OrderAddress, 'id'>) =>
    apiCall<ApiResponse<OrderAddress>>('POST', '/order/add_order_address', body),

  editOrderAddress: (addressId: string, body: Partial<Omit<OrderAddress, 'id'>>) =>
    apiCall<ApiResponse<OrderAddress>>('PATCH', `/order/update/${addressId}`, body),

  deleteOrderAddress: (addressId: string) =>
    apiCall<ApiResponse<null>>('DELETE', `/order/delete/${addressId}`),

  // Orders
  getOrderStatus: (orderId: string) =>
    apiCall<ApiResponse<{ status: Order['status'] }>>('POST', '/order/get_order_status', { purchase_id: parseInt(orderId, 10) }),

  createOrder: (body: {
    items: { product_id: number; quantity: number }[];
    source: string;
    address_id: number;
  }) => apiCall<ApiResponse<Order>>('POST', '/order/create_order', body),

  getPurchases: (params?: { index: string | number; count: string | number; state?: string }) =>
    apiCall<ApiResponse<PaginatedResponse<Order>>>('POST', '/order/get_list_purchases', params),

  getPurchase: (orderId: string) =>
    apiCall<ApiResponse<Order>>('POST', '/order/get_purchase', { id: orderId }),

  editPurchase: (orderId: string, body: Partial<Order>) =>
    apiCall<ApiResponse<Order>>('POST', '/order/edit_purchase', { id: orderId, ...body }),

  cancelOrder: (orderId: string, reason: string) =>
    apiCall<ApiResponse<null>>('POST', '/order/cancel_order', { id: orderId, reason }),

  sellerMarkShipped: (orderId: string, buyerId: string) =>
    apiCall<ApiResponse<null>>('POST', '/order/seller_mark_as_shipped', { purchase_id: orderId, buyer_id: buyerId }),

  buyerConfirmReceived: (orderId: string, state?: string) =>
    apiCall<ApiResponse<null>>('POST', '/order/buyer_confirm_received', { purchase_id: orderId, state }),

  getOrderTimeline: (orderId: string) =>
    apiCall<ApiResponse<OrderTimeline[]>>('POST', '/order/get_order_timeline', { purchase_id: orderId }),

  setAcceptBuyer: (orderId: string, buyerId: string, accept: boolean) =>
    apiCall<ApiResponse<null>>('POST', '/order/set_accept_buyer', { purchase_id: orderId, buyer_id: buyerId, is_accept: accept ? 1 : 0 }),

  refundOrder: (body: { purchase_id: string; reason: string; state?: string }) =>
    apiCall<ApiResponse<null>>('POST', '/order/refund_order', body),
};
