import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ProductListItem } from '../../types';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';
import { formatCurrency } from '../../lib/utils/format';
import { IconSymbol } from '../ui/icon-symbol';
import { TacticalImage } from '../ui/TacticalImage';
import { UI_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useCatalogStore } from '../../store/catalog';
import { useAuthStore } from '../../store/auth';

interface ProductCardProps {
  item: ProductListItem;
  style?: any;
}

export const ProductCard = ({ item, style }: ProductCardProps) => {
  const toggleLike = useCatalogStore(state => state.toggleLike);
  const userId = useAuthStore(state => state.user?.id) || 'guest';

  const handleLike = () => {
    toggleLike(item.id, userId);
  };

  return (
    <TouchableOpacity 
      style={[styles.productCard, style]}
      onPress={() => NavigationService.navigate(ROUTES.DETAIL(item.id))}
    >
      <View style={styles.imageContainer}>
        <TacticalImage uri={item.images[0]} categoryId={item.category_id} style={styles.productImage} />
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons name={item.is_liked ? "heart" : "heart-outline"} size={22} color={item.is_liked ? "red" : "#666"} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.soldCount}>Đã bán {item.sold_count}</Text>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: UI_CONFIG.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    minWidth: Platform.OS === 'web' ? 200 : '45%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: UI_CONFIG.spacing.sm,
  },
  productTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: '500',
    marginBottom: UI_CONFIG.spacing.xs,
    height: 40,
  },
  productPrice: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.primary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soldCount: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    color: UI_CONFIG.colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    color: UI_CONFIG.colors.textSecondary,
  }
});
