import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Comments, CommentItem } from '../../components/Comments';
import { UI_CONFIG } from '../../constants/config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../lib/storage/sqlite';
import { Product } from '../../types';
import { useCartStore } from '../../store/cart';
import { Button } from '../../components/ui/Button';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useAuthStore } from '../../store/auth';
import { Input } from '../../components/ui/Input';

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const addItem = useCartStore(state => state.addItem);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadComments();
    }
  }, [id]);

  const loadProduct = () => {
    try {
      const p = db.getFirstSync<any>('SELECT * FROM Products WHERE id = ?', [id]);
      if (p) {
        setProduct({
          ...p,
          images: JSON.parse(p.images),
          is_liked: p.is_liked === 1
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = () => {
    try {
      const result = db.getAllSync<any>('SELECT * FROM Comments WHERE target_id = ? ORDER BY created_at DESC', [id]);
      setComments(result.map(c => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        content: c.content,
        createdAt: c.created_at
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        seller_id: product.seller_id,
        seller_name: product.seller_name
      });
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
    }
  };

  const handleToggleLike = () => {
    if (product) {
      try {
        const newLikedState = !product.is_liked;
        const newLikeCount = newLikedState ? product.like_count + 1 : product.like_count - 1;
        db.runSync('UPDATE Products SET is_liked = ?, like_count = ? WHERE id = ?', [newLikedState ? 1 : 0, newLikeCount, product.id]);
        setProduct({ ...product, is_liked: newLikedState, like_count: newLikeCount });
      } catch (err) {
        console.error('Error toggling like:', err);
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thích');
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user || !product) return;
    try {
      const commentId = `cmt_${Date.now()}`;
      const now = new Date().toISOString();
      db.runSync(
        'INSERT INTO Comments (id, target_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [commentId, product.id, user.id, user.full_name || user.username, newComment, now]
      );
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    }
  };

  if (!product) {
    return (
      <SafeArea edges={['top', 'bottom']}>
        <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Product Detail" />
        <View style={styles.center}><Text>Product not found.</Text></View>
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
        onPressRight={() => router.push('/(main)/(tabs)/cart')}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.images[0] }} style={styles.imagePlaceholder} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{product.price.toLocaleString('vi-VN')} ₫</Text>
          
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
              text={product.is_liked ? `Đã thích (${product.like_count})` : `Thích (${product.like_count})`} 
              onPress={handleToggleLike}
              style={{ flex: 1 }}
              backgroundColor={product.is_liked ? UI_CONFIG.colors.primary : UI_CONFIG.colors.light}
              textColor={product.is_liked ? UI_CONFIG.colors.white : UI_CONFIG.colors.text}
            />
            <Button 
              text="Thêm vào Giỏ" 
              onPress={handleAddToCart}
              style={{ flex: 2, marginLeft: 10 }}
            />
          </View>
        </View>

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
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: UI_CONFIG.colors.light,
    resizeMode: 'cover'
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
    marginTop: UI_CONFIG.spacing.lg,
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
