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
import { useAppStore } from '../../store/app';
import { useProductStore } from '../../store/product';
import * as Haptics from 'expo-haptics';

interface ProductCardProps {
  item: ProductListItem;
  style?: any;
}

export const ProductCard = React.memo(({ item, style }: ProductCardProps) => {
  const toggleLike = useCatalogStore(state => state.toggleLike);
  const toggleLikeLocally = useProductStore(state => state.toggleLikeLocally);
  const userId = useAuthStore(state => state.user?.id) || 'guest';
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(item.id, userId);
    toggleLikeLocally(item.id);
  };

  return (
    <TouchableOpacity 
      style={[styles.productCard, { backgroundColor: currentColors.surface }, style]}
      onPress={() => NavigationService.navigate(ROUTES.DETAIL(String(item.id)))}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <TacticalImage uri={item.image || ''} categoryId={item.category_id} style={styles.productImage} />
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons name={item.is_liked ? "heart" : "heart-outline"} size={20} color={item.is_liked ? currentColors.primary : "#999"} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: currentColors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.productPrice, { color: currentColors.primary }]}>{formatCurrency(Number(item.price_new) || Number(item.price))}</Text>
        <View style={styles.productFooter}>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={12} color={currentColors.accent} />
            <Text style={[styles.ratingText, { color: currentColors.textSecondary }]}>{item.rating}</Text>
          </View>
          <Text style={[styles.soldCount, { color: currentColors.textSecondary }]}>Đã bán {item.sold_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id && 
         prevProps.item.is_liked === nextProps.item.is_liked &&
         prevProps.item.like_count === nextProps.item.like_count;
});

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    borderRadius: UI_CONFIG.borderRadius.sm, // Smaller border radius
    overflow: 'hidden',
    minWidth: Platform.OS === 'web' ? 200 : '45%',
    // Very subtle shadow instead of a border
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1, // Ensure square images (Shopee style)
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: UI_CONFIG.spacing.sm,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: UI_CONFIG.spacing.xs,
    height: 36, // Enough for exactly 2 lines
    lineHeight: 18,
  },
  productPrice: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: '500',
    marginBottom: UI_CONFIG.spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  soldCount: {
    fontSize: 11,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
  }
});
