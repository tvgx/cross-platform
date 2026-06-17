import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';

interface SellerInfoCardProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  hideViewShopButton?: boolean;
  onPressSeller?: () => void;
  onPressFollow?: () => void;
  onPressChat?: () => void;
  onPressViewShop?: () => void;
}

export function SellerInfoCard({
  sellerId,
  sellerName,
  sellerAvatar,
  hideViewShopButton,
  onPressSeller,
  onPressFollow,
  onPressChat,
  onPressViewShop
}: SellerInfoCardProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.sellerInfo} 
        onPress={onPressSeller}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: sellerAvatar || 'https://i.pravatar.cc/150' }} 
          style={styles.avatar} 
        />
        <View style={styles.nameContainer}>
          <Text style={styles.sellerName} numberOfLines={1}>{sellerName || 'Người bán'}</Text>
          {!hideViewShopButton && (
            <TouchableOpacity style={styles.viewShopRow} onPress={onPressViewShop}>
              <Text style={styles.viewShopText}>Xem Shop</Text>
              <Ionicons name="chevron-forward" size={14} color={UI_CONFIG.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.followBtn, { backgroundColor: 'transparent' }]} 
          onPress={onPressFollow}
        >
          <Text style={styles.followBtnText}>Theo dõi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={onPressChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={UI_CONFIG.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: UI_CONFIG.spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: UI_CONFIG.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    marginRight: UI_CONFIG.spacing.md,
  },
  nameContainer: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: 4,
  },
  viewShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewShopText: {
    fontSize: 13,
    color: UI_CONFIG.colors.textSecondary,
    marginRight: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.primary,
    marginRight: 8,
    borderRadius: UI_CONFIG.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnText: {
    color: UI_CONFIG.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
