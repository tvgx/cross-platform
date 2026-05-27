// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar?: string;
  rank?: string;           // military rank
  unit?: string;
  virtual_balance: number; // virtual currency (achievement points)
  is_seller: boolean;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;           // in virtual currency
  images: string[];
  video?: string;
  category_id: string;
  brand_id?: string;
  seller_id: string;
  seller_name: string;
  seller_avatar?: string;
  stock: number;
  sold_count: number;
  rating: number;
  rating_count: number;
  like_count: number;
  is_liked: boolean;
  ship_from?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  seller_id: string;
  seller_name: string;
  rating: number;
  like_count: number;
  is_liked: boolean;
  stock: number;
  sold_count: number;
  category_id: string;
  created_at?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;           // local id (uuid)
  product_id: string;
  variant_id?: string;  // Biến thể sản phẩm (Kích cỡ/Màu sắc)
  variant_title?: string; // Tên hiển thị của biến thể
  title: string;
  price: number;
  image?: string;
  quantity: number;
  seller_id: string;
  seller_name: string;
}

// ─── Social ──────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  username: string;
  avatar?: string;
  content: string;
  created_at: string;
}

export interface Rating {
  id: string;
  product_id: string;
  order_id: string;
  user_id: string;
  username: string;
  avatar?: string;
  score: number;        // 1‒5
  comment?: string;
  images?: string[];
  created_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  thumbnail?: string;
  summary?: string;
  body: string;
  author?: string;
  published_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar?: string;
  rank?: string;
  unit?: string;
  is_following: boolean;
  is_blocked: boolean;
  listing_count: number;
  follower_count: number;
  following_count: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderAddress {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  is_default: boolean;
}

export interface OrderItem {
  product_id: string;
  title: string;
  image?: string;
  price: number;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  seller_name: string;
  items: OrderItem[];
  subtotal: number;
  ship_fee: number;
  total: number;
  status: OrderStatus;
  address: OrderAddress;
  ship_from?: string;
  tracking_number?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video';
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: { id: string; username: string; avatar?: string }[];
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'order'
  | 'message'
  | 'reward'
  | 'follow'
  | 'like'
  | 'comment'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ─── Balance / Rewards ───────────────────────────────────────────────────────

export interface BalanceTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_id?: string;  // order id, reward id, etc.
  created_at: string;
}

export interface RewardAppeal {
  id: string;
  user_id: string;
  video_url: string;
  images?: string[];
  description?: string;
  ml_score?: number;        // score proposed by ML
  ml_category?: string;
  appealed_amount?: number; // amount requested by soldier
  final_amount?: number;    // approved amount by admin
  status: 'pending' | 'ml_processed' | 'appealed' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
}

export interface WithdrawRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
}

// ─── Shipping ────────────────────────────────────────────────────────────────

export interface ShipFrom {
  id: string;
  name: string;             // city / province / base name
}

export interface ShipFee {
  ship_from_id: string;
  ship_to: string;
  fee: number;
  estimated_days: number;
}

// ─── Sync queue ──────────────────────────────────────────────────────────────

export type SyncOperation = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  queued_at: number;     // ms timestamp
  retry_count: number;
};

// ─── API response wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
