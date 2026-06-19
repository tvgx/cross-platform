import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { socialApi } from '../../lib/api/endpoints/social';
import { Rating } from '../../types';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const res = await socialApi.getRatings(productId);
      if (res.success && res.data) {
        setReviews(Array.isArray(res.data) ? res.data : (res.data.items || []));
      }
    } catch (e) {
      console.log('Error loading reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Thông báo', 'Bạn cần đăng nhập để đánh giá');
      return;
    }
    try {
      setSubmitting(true);
      await socialApi.setRating({
        user_id: productId, // Dựa theo social.ts hiện tại
        product_id: productId,
        score,
        comment,
      });
      setModalVisible(false);
      setComment('');
      setScore(5);
      loadReviews();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá');
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnrate = async (ratingId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn rút lại đánh giá này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Rút lại',
        style: 'destructive',
        onPress: async () => {
          try {
            await socialApi.setRating({
              user_id: productId,
              product_id: productId,
              score: 0, // Level = 0 means unrate
              comment: '',
            });
            loadReviews();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xoá đánh giá');
          }
        }
      }
    ]);
  };

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IconSymbol
          key={i}
          name={i <= rating ? 'star.fill' : 'star'}
          size={size}
          color="#FFD700"
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  if (isLoading) {
    return <ActivityIndicator style={{ margin: 20 }} color={UI_CONFIG.colors.primary} />;
  }

  // Lấy ra đánh giá của người dùng hiện tại (nếu có)
  const myReview = reviews.find(r => String(r.user_id) === String(user?.id) || r.username === user?.username);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá sản phẩm ({reviews.length})</Text>
        <Button 
          text="Viết đánh giá" 
          onPress={() => setModalVisible(true)} 
          variant="secondary"
          style={{ height: 36, paddingHorizontal: 12 }}
        />
      </View>

      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
      ) : (
        reviews.map((r, index) => {
          // Fix map key warning if id is missing or duplicate
          const key = r.id ? String(r.id) : `review_${index}`;
          const isMine = String(r.user_id) === String(user?.id) || r.username === user?.username;
          return (
            <View key={key} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Image 
                  source={{ uri: r.avatar || 'https://i.pravatar.cc/100' }} 
                  style={styles.avatar} 
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.username}>{r.username || r.user_id || 'Người dùng'}</Text>
                  {renderStars(r.score || (r as any).level || 5)}
                </View>
                <Text style={styles.date}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                </Text>
              </View>
              {!!(r.comment || (r as any).content) && (
                <Text style={styles.comment}>{r.comment || (r as any).content}</Text>
              )}
              {isMine && (
                <TouchableOpacity onPress={() => handleUnrate(r.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Xoá đánh giá</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      {/* Modal Viết đánh giá */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
            
            <View style={styles.starSelectContainer}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setScore(s)} style={{ padding: 4 }}>
                  <IconSymbol name={s <= score ? 'star.fill' : 'star'} size={32} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nhập nhận xét của bạn..."
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.modalActions}>
              <Button 
                text="Hủy" 
                variant="secondary" 
                onPress={() => setModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button 
                text={submitting ? "Đang gửi..." : "Gửi"} 
                onPress={handleSubmitReview} 
                disabled={submitting} 
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    marginTop: UI_CONFIG.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
  },
  emptyText: {
    color: UI_CONFIG.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewItem: {
    paddingVertical: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  reviewInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: UI_CONFIG.colors.textLight,
  },
  comment: {
    fontSize: 14,
    color: UI_CONFIG.colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  deleteBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: UI_CONFIG.colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: UI_CONFIG.spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  starSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
