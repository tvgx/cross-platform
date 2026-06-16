import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { CommentItem, Comments } from '../../components/Comments';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Button } from '../../components/ui/Button';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Input } from '../../components/ui/Input';
import { TacticalImage } from '../../components/ui/TacticalImage';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { useCartStore } from '../../store/cart';
import { useCheckoutStore } from '../../store/checkout';
import { useProductStore } from '../../store/product';
import { useCatalogStore } from '../../store/catalog';
import { Product, ProductListItem } from '../../types';
import { productsApi } from '../../lib/api/endpoints/products';
import { socialApi } from '../../lib/api/endpoints/social';
import { ProductCard } from '../../components/product/ProductCard';

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = useCartStore(state => state.addItem);
  const user = useAuthStore(state => state.user);
  const toggleLikeLocally = useProductStore(state => state.toggleLikeLocally);
  const catalogToggleLike = useCatalogStore(state => state.toggleLike);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    await loadProduct();
    await loadComments();
    setIsLoading(false);
  };

  const loadProduct = async () => {
    try {
      const p = await ProductRepository.getProductDetail(id, true);
      if (p) {
        const mappedProduct: Product = {
          id: p.id,
          title: (p as any).name || p.title || 'Sản phẩm',
          description: (p as any).described || p.description || 'Chưa có mô tả',
          price: Number(p.price) || 0,
          images: Array.isArray((p as any).image) && (p as any).image.length > 0 ? (p as any).image.map((i: any) => i.url || i) : p.images || [],
          video: Array.isArray(p.video) && p.video.length > 0 ? p.video[0].url || p.video[0] : p.video || '',
          category_id: (p as any).category?.id || p.category_id || '',
          brand_id: (p as any).brand?.id || p.brand_id || '',
          seller_id: (p as any).seller?.id || p.seller_id || '',
          seller_name: (p as any).seller?.fullname || (p as any).seller?.username || p.seller_name || 'Người bán',
          seller_avatar: (p as any).seller?.avatar || (p as any).seller_avatar || '',
          stock: p.stock || 0,
          sold_count: p.sold_count || 0,
          rating: p.rating || 5.0,
          rating_count: (p as any).rating_count || 0,
          like_count: Number((p as any).like) || p.like_count || 0,
          is_liked: p.is_liked || false,
          created_at: (p as any).created || p.created_at || new Date().toISOString(),
          updated_at: (p as any).updated || p.updated_at || new Date().toISOString(),
        };
        setProduct(mappedProduct);
        loadRelatedProducts(mappedProduct.category_id);
      }
    } catch (err) {
      console.error('Error loading product detail:', err);
    }
  };

  const loadRelatedProducts = async (categoryId: string) => {
    try {
      // Gọi API lấy sản phẩm cùng danh mục
      const res = await productsApi.getListProducts({ category_id: categoryId, limit: 10 });
      if (res.data && res.data.length > 0) {
        setRelatedProducts(res.data.filter(p => String(p.id) !== id));
      } else {
        // Fallback ngẫu nhiên nếu không có cùng danh mục
        const fallbackRes = await productsApi.getListProducts({ limit: 10 });
        if (fallbackRes.data) {
          setRelatedProducts(fallbackRes.data.filter(p => String(p.id) !== id));
        }
      }
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  const loadComments = async () => {
    try {
      const res = await socialApi.getComments(id, { limit: 20 });
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      if (items.length > 0) {
        setComments(items.map((c: any) => ({
          id: c.id?.toString() || Math.random().toString(),
          userId: c.user_id?.toString() || '0',
          userName: c.poster?.name || c.username || 'User',
          content: c.content,
          createdAt: c.created_at || new Date().toISOString()
        })));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.images?.[0] || undefined,
        quantity: 1,
        seller_id: product.seller_id,
        seller_name: product.seller_name
      });
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
    }
  };

  const handleToggleLike = () => {
    if (product && user) {
      try {
        const newLikedState = !product.is_liked;
        const newLikeCount = newLikedState ? (product.like_count || 0) + 1 : Math.max(0, (product.like_count || 0) - 1);
        
        // Gọi action like
        catalogToggleLike(product.id, user.id);
        toggleLikeLocally(product.id.toString());
        
        setProduct({ ...product, is_liked: newLikedState, like_count: newLikeCount });
      } catch (err) {
        console.error('Error toggling like:', err);
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thích');
      }
    } else if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để thực hiện');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !product) return;
    try {
      await socialApi.postComment({ product_id: product.id.toString(), content: newComment });
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const checkoutItem = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      product_id: product.id,
      title: product.title,
      price: Number(product.price),
      image: product.images?.[0] || undefined,
      quantity: 1,
      seller_id: product.seller_id,
      seller_name: product.seller_name
    };
    useCheckoutStore.getState().setCheckoutItems([checkoutItem]);
    router.push('/(main)/checkout' as any);
  };

  const renderRelatedProduct = useCallback(({ item }: { item: ProductListItem }) => (
    <View style={{ width: 160, marginRight: UI_CONFIG.spacing.md }}>
      <ProductCard item={item} />
    </View>
  ), []);

  if (isLoading || !product) {
    return (
      <SafeArea edges={['top', 'bottom']}>
        <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Chi tiết sản phẩm" />
        <View style={styles.center}>
          {isLoading ? <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} /> : <Text>Không tìm thấy sản phẩm.</Text>}
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header 
        leftIcon="arrow-back" 
        onPressLeft={() => router.back()} 
        title={product.title}
        rightIcon="cart"
        onPressRight={() => router.push('/(main)/(tabs)/cart' as any)}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <TacticalImage uri={product.images?.[0] || ''} categoryId={product.category_id} style={styles.imagePlaceholder} />
          <TouchableOpacity style={styles.likeButton} onPress={handleToggleLike}>
            <Ionicons name={product.is_liked ? "heart" : "heart-outline"} size={28} color={product.is_liked ? UI_CONFIG.colors.primary : "#999"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{Number(product.price).toLocaleString('vi-VN')} ₫</Text>

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Đã bán: {product.sold_count}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="star.fill" size={16} color="#FFD700" />
              <Text style={styles.statsText}> {product.rating}</Text>
            </View>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.actionRow}>
            <Button 
              text="Thêm vào giỏ"
              onPress={handleAddToCart}
              style={{ flex: 1, marginRight: 8 }}
              backgroundColor={UI_CONFIG.colors.surfaceLighter}
              textColor={UI_CONFIG.colors.text}
            />
            <Button
              text="Mua ngay"
              onPress={handleBuyNow}
              style={{ flex: 1, marginLeft: 8 }}
              backgroundColor={UI_CONFIG.colors.primary}
            />
          </View>
        </View>

        {/* Sản phẩm liên quan */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Sản phẩm tương tự</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {relatedProducts.map((p) => (
                <View key={p.id} style={{ width: 160, marginRight: UI_CONFIG.spacing.md }}>
                  <ProductCard item={p} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Bình luận</Text>

          <View style={styles.commentInputRow}>
            <View style={{ flex: 1 }}>
              <Input placeholder="Viết bình luận..." value={newComment} onChangeText={setNewComment} />
            </View>
            <Button text="Gửi" onPress={handleAddComment} style={{ paddingHorizontal: 15, marginLeft: 10, height: 48 }} />
          </View>

          <Comments comments={comments} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: UI_CONFIG.spacing.xxl,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    resizeMode: 'cover'
  },
  likeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  infoContainer: {
    padding: UI_CONFIG.spacing.md,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: UI_CONFIG.typography.weights.bold,
  },
  price: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    color: UI_CONFIG.colors.primary,
    marginTop: UI_CONFIG.spacing.xs,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: UI_CONFIG.spacing.sm,
    paddingBottom: UI_CONFIG.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border
  },
  statsText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: UI_CONFIG.typography.sizes.md
  },
  description: {
    marginTop: UI_CONFIG.spacing.md,
    color: UI_CONFIG.colors.text,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: UI_CONFIG.spacing.xl,
    justifyContent: 'space-between',
  },
  relatedSection: {
    paddingVertical: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.surface,
    marginTop: UI_CONFIG.spacing.sm,
  },
  relatedTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.md,
  },
  relatedScroll: {
    paddingHorizontal: UI_CONFIG.spacing.md,
  },
  commentsSection: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginTop: UI_CONFIG.spacing.lg,
  },
  commentsTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md
  }
});
