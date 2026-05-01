import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UI_CONFIG } from '../../constants/config';

export interface CardProps {
  variant?: 'product' | 'order';
  imageSrc?: string;
  title?: string;
  price?: string | number;
  status?: string;
  onPress?: () => void;
}

export const Card = ({
  variant = 'product',
  imageSrc,
  title = 'Title Placeholder',
  price = '$0.00',
  status,
  onPress,
}: CardProps) => {

  if (variant === 'order') {
    return (
      <TouchableOpacity style={styles.orderContainer} onPress={onPress}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>{title}</Text>
          {status && <Text style={styles.orderStatus}>{status}</Text>}
        </View>
        <Text style={styles.orderPrice}>{price}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.productContainer} onPress={onPress}>
      <View style={styles.imagePlaceholder}>
        {imageSrc ? (
          <Image source={{ uri: imageSrc }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Image</Text>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.productPrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Product styles
  productContainer: {
    backgroundColor: UI_CONFIG.colors.white,
    borderRadius: UI_CONFIG.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    width: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: UI_CONFIG.colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageText: {
    color: UI_CONFIG.colors.textSecondary,
  },
  productInfo: {
    padding: UI_CONFIG.spacing.sm,
  },
  productTitle: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  productPrice: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.primary,
  },

  // Order styles
  orderContainer: {
    backgroundColor: UI_CONFIG.colors.white,
    borderRadius: UI_CONFIG.borderRadius.md,
    padding: UI_CONFIG.spacing.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    width: '100%',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  orderTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.medium,
    color: UI_CONFIG.colors.text,
  },
  orderStatus: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.success,
  },
  orderPrice: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
  },
});
