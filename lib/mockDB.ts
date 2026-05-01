import { User, Product, Category, Order } from '../types';

// Mock Users based on Schema
export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'nguyenvana',
    full_name: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?u=1',
    rank: 'Sĩ quan',
    unit: 'Quân khu 7',
    virtual_balance: 1500000,
    is_seller: true,
    phone: '0901234567',
    email: 'nva@army.vn',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'tranvanb',
    full_name: 'Trần Văn B',
    avatar: 'https://i.pravatar.cc/150?u=2',
    rank: 'Chiến sĩ',
    unit: 'Sư đoàn 5',
    virtual_balance: 50000,
    is_seller: false,
    phone: '0907654321',
    email: 'tvb@army.vn',
    created_at: '2023-06-15T00:00:00Z'
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Quân tư trang', icon: 'shield' },
  { id: 'c2', name: 'Nhu yếu phẩm', icon: 'cart' },
  { id: 'c3', name: 'Lưu niệm', icon: 'star' },
  { id: 'c4', name: 'Khác', icon: 'grid' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Balo Chiến thuật 511',
    description: 'Balo chống nước bền bỉ, nhiều ngăn chuyên dụng.',
    price: 350000,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c1',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    seller_avatar: 'https://i.pravatar.cc/150?u=1',
    stock: 50,
    sold_count: 120,
    rating: 4.8,
    rating_count: 45,
    like_count: 300,
    is_liked: false,
    created_at: '2023-10-01T00:00:00Z',
    updated_at: '2023-10-01T00:00:00Z'
  },
  {
    id: 'p2',
    title: 'Giày dã chiến cấp tá',
    description: 'Giày da bò thật 100%, đế đúc nguyên khối chống trượt.',
    price: 850000,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c1',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 20,
    sold_count: 50,
    rating: 5.0,
    rating_count: 12,
    like_count: 150,
    is_liked: true,
    created_at: '2023-11-05T00:00:00Z',
    updated_at: '2023-11-05T00:00:00Z'
  },
  {
    id: 'p3',
    title: 'Mũ tai bèo chống nắng',
    description: 'Chất liệu Kaki thoáng mát, thích hợp hành quân dã ngoại.',
    price: 85000,
    images: ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c1',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 100,
    sold_count: 300,
    rating: 4.5,
    rating_count: 80,
    like_count: 400,
    is_liked: false,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z'
  }
];

export const MOCK_ORDERS: Order[] = [];
