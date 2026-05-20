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
  { id: 'c1', name: 'Hỏa lực Tác chiến', icon: 'shield' },
  { id: 'c2', name: 'Trinh sát & Drones', icon: 'compass' },
  { id: 'c3', name: 'Năng lượng & Liên lạc', icon: 'bolt' },
  { id: 'c4', name: 'Quân nhu & Sinh tồn', icon: 'backpack' },
  { id: 'c5', name: 'Y tế & Cứu thương', icon: 'heart' },
  { id: 'c6', name: 'Kỹ thuật & Bảo trì', icon: 'wrench' }
];

export const MOCK_PRODUCTS: Product[] = [
  // c1: Hỏa lực Tác chiến
  {
    id: 'p1',
    title: 'Súng trường Tấn công STV-380',
    description: 'Súng trường tiêu chuẩn hiện đại của QĐNDVN cỡ đạn 7.62x39mm. Độ tin cậy cực cao trong điều kiện ngập nước, bùn cát. Tích hợp ray Picatinny lắp thiết bị ngắm quang học.',
    price: 15000000,
    images: ['https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c1',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    seller_avatar: 'https://i.pravatar.cc/150?u=1',
    stock: 20,
    sold_count: 5,
    rating: 4.9,
    rating_count: 12,
    like_count: 320,
    is_liked: false,
    created_at: '2023-10-01T00:00:00Z',
    updated_at: '2023-10-01T00:00:00Z'
  },
  {
    id: 'p2',
    title: 'Hộp đạn sắt 7.62x39mm (700 viên)',
    description: 'Hộp đạn sắt kín khí chống nước, chứa 700 viên đạn tiêu chuẩn 7.62x39mm kèm túi chống ẩm quân dụng. Thuận tiện lưu trữ lâu dài dưới công sự.',
    price: 1200000,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'], // Fallback realistic visual
    category_id: 'c1',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 150,
    sold_count: 45,
    rating: 4.8,
    rating_count: 24,
    like_count: 150,
    is_liked: true,
    created_at: '2023-11-05T00:00:00Z',
    updated_at: '2023-11-05T00:00:00Z'
  },
  // c2: Trinh sát & Drones
  {
    id: 'p3',
    title: 'Drone Trinh sát Chiến thuật Mavic 3T',
    description: 'UAV trinh sát đêm tích hợp camera cảm biến nhiệt hồng ngoại siêu nhạy, khả năng zoom số 56x. Định vị mục tiêu tọa độ GPS chính xác cho hỏa lực chi viện.',
    price: 25000000,
    images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c2',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 10,
    sold_count: 8,
    rating: 5.0,
    rating_count: 7,
    like_count: 240,
    is_liked: false,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z'
  },
  {
    id: 'p4',
    title: 'Pin Dự phòng thông minh Mavic 3T',
    description: 'Pin thông minh hiệu suất cao dung lượng 5000mAh, hoạt động ổn định trong dải nhiệt độ khắc nghiệt từ -10°C đến 40°C.',
    price: 850000,
    images: ['https://images.unsplash.com/photo-1610483178766-08852b8108b4?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c2',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 45,
    sold_count: 38,
    rating: 4.7,
    rating_count: 14,
    like_count: 98,
    is_liked: false,
    created_at: '2023-12-10T00:00:00Z',
    updated_at: '2023-12-10T00:00:00Z'
  },
  // c3: Năng lượng & Liên lạc
  {
    id: 'p5',
    title: 'Bộ đàm Kỹ thuật số Mã hóa AES-256',
    description: 'Bộ đàm cầm tay quân dụng mã hóa bảo mật chống nghe trộm cấp quân sự. Chống nước IP67, thời gian đàm thoại liên tục 18 giờ, cự ly liên lạc thực địa lên đến 8km.',
    price: 3500000,
    images: ['https://images.unsplash.com/photo-1543269600-fa37b1b58a9fe?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c3',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 30,
    sold_count: 18,
    rating: 4.9,
    rating_count: 12,
    like_count: 85,
    is_liked: false,
    created_at: '2023-12-15T00:00:00Z',
    updated_at: '2023-12-15T00:00:00Z'
  },
  {
    id: 'p6',
    title: 'Tấm sạc Năng lượng Mặt trời Chiến thuật 100W',
    description: 'Vỏ bọc vải dù Cordura siêu bền gấp gọn chống nước, cung cấp nguồn điện sạch sạc pin điện thoại, bộ đàm, UAV tại thao trường tác chiến.',
    price: 750000,
    images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c3',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 60,
    sold_count: 22,
    rating: 4.6,
    rating_count: 9,
    like_count: 110,
    is_liked: false,
    created_at: '2023-12-18T00:00:00Z',
    updated_at: '2023-12-18T00:00:00Z'
  },
  // c4: Quân nhu & Sinh tồn
  {
    id: 'p7',
    title: 'Balo Tác chiến 3 Ngày (3Q ASECO)',
    description: 'Dung tích 40L, chất liệu vải Cordura 1000D chống xé rách và chống thấm. Tích hợp hệ thống đai Molle bố trí thêm trang bị linh hoạt bên ngoài.',
    price: 450000,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c4',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 120,
    sold_count: 67,
    rating: 4.8,
    rating_count: 31,
    like_count: 195,
    is_liked: false,
    created_at: '2023-12-20T00:00:00Z',
    updated_at: '2023-12-20T00:00:00Z'
  },
  {
    id: 'p8',
    title: 'Hộp lương khô quân đội cao cấp BB702',
    description: 'Hộp thiếc bảo quản lâu dài, chứa 10 phong lương khô dinh dưỡng cao. Bổ sung năng lượng tức thì và các khoáng chất cần thiết duy trì thể trạng bền bỉ.',
    price: 180000,
    images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c4',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 500,
    sold_count: 1200,
    rating: 4.8,
    rating_count: 380,
    like_count: 950,
    is_liked: true,
    created_at: '2023-10-15T00:00:00Z',
    updated_at: '2023-10-15T00:00:00Z'
  },
  // c5: Y tế & Cứu thương
  {
    id: 'p9',
    title: 'Túi Sơ cứu Y tế Cá nhân Chiến thuật (IFAK)',
    description: 'Túi cứu thương khẩn cấp tháo nhanh chuyên dụng chứa garo cầm máu CAT Gen 7, gạc chèn vết thương hemostatic, băng dán ngực chống tràn khí màng phổi.',
    price: 320000,
    images: ['https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c5',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 90,
    sold_count: 240,
    rating: 4.9,
    rating_count: 85,
    like_count: 310,
    is_liked: false,
    created_at: '2023-11-20T00:00:00Z',
    updated_at: '2023-11-20T00:00:00Z'
  },
  // c6: Kỹ thuật & Bảo trì
  {
    id: 'p10',
    title: 'Bộ Dụng cụ Lau chùi Súng bộ binh Đa năng',
    description: 'Hộp dụng cụ nòng ghép đồng, cọ quét đồng, chổi cước vệ sinh và dung dịch dầu bôi trơn bảo dưỡng súng cầm tay chống gỉ sét do sương muối và độ ẩm.',
    price: 150000,
    images: ['https://images.unsplash.com/photo-1531844251246-9a1bfaae0d76?auto=format&fit=crop&q=80&w=400'],
    category_id: 'c6',
    seller_id: '1',
    seller_name: 'Nguyễn Văn A',
    stock: 120,
    sold_count: 420,
    rating: 4.9,
    rating_count: 98,
    like_count: 410,
    is_liked: false,
    created_at: '2023-12-25T00:00:00Z',
    updated_at: '2023-12-25T00:00:00Z'
  }
];

export const MOCK_ORDERS: Order[] = [];
