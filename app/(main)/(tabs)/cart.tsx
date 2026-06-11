import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeArea } from '../../../components/layout/SafeArea';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useNavigation, useRouter } from 'expo-router';
import { useCartStore } from '../../../store/cart';
import { useCheckoutStore } from '../../../store/checkout';
import { TacticalButton } from '../../../components/ui/TacticalButton';
import { useAuthStore } from '../../../store/auth';
import { TacticalImage } from '../../../components/ui/TacticalImage';
import { SwipeWrapper } from '../../../components/navigation/SwipeWrapper';
  
export default function CartScreen() {
  const router = useRouter();
  
  const items = useCartStore(state => state.items);
  const selectedIds = useCartStore(state => state.selectedIds);
  const selectedTotal = useCartStore(state => state.selectedTotal());
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const toggleSelection = useCartStore(state => state.toggleSelection);
  const selectAll = useCartStore(state => state.selectAll);

  const setCheckoutItems = useCheckoutStore(state => state.setCheckoutItems);
  const user = useAuthStore(state => state.user);
  
  const handleCheckout = () => {
    if (!user) {
      Alert.alert('BỊ TỪ CHỐI', 'Vui lòng đăng nhập.');
      return;
    }
    
    if (selectedIds.length === 0) {
      Alert.alert('CHƯA CHỌN MẶT HÀNG', 'Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }

    const itemsToCheckout = items.filter(i => selectedIds.includes(i.id));
    setCheckoutItems(itemsToCheckout);
    router.push('/(main)/checkout' as any);
  };

  return (
    <SwipeWrapper currentTab="cart">
      <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: UI_CONFIG.colors.background }}>
        <CustomAppBar title="Quân Nhu / Giỏ Hàng" />
        
        {items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>CHƯA CÓ SẢN PHẨM TRONG GIỎ HÀNG</Text>
          </View>
        ) : (
          <>
            <View style={styles.selectAllRow}>
              <TouchableOpacity onPress={() => selectAll(selectedIds.length !== items.length)} style={styles.checkboxContainer}>
                <Ionicons name={selectedIds.length === items.length && items.length > 0 ? "checkbox" : "square-outline"} size={24} color={UI_CONFIG.colors.primary} />
                <Text style={styles.selectAllText}>CHỌN TẤT CẢ</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <View key={item.id} style={styles.cartItemWrapper}>
                    <TouchableOpacity onPress={() => toggleSelection(item.id)} style={styles.itemCheckbox}>
                      <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={UI_CONFIG.colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.cartItem}>
                      <TacticalImage uri={item.image} categoryId={item.product_id} style={styles.itemImage} />
                      <View style={styles.itemInfo}>
                        <View>
                          <Text style={styles.itemTitle}>{item.title?.toUpperCase() || 'SẢN PHẨM'}</Text>
                          {item.variant_title && (
                            <Text style={styles.itemVariant}>PHÂN LOẠI: {item.variant_title.toUpperCase()}</Text>
                          )}
                        </View>
                        <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} ₫</Text>
                        
                        <View style={styles.quantityRow}>
                          <TacticalButton variant="outline" text="-" size="sm" onPress={() => updateQuantity(item.id, item.quantity - 1)} />
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TacticalButton variant="outline" text="+" size="sm" onPress={() => updateQuantity(item.id, item.quantity + 1)} />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.glassContainer}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>TỔNG TIỀN (CHƯA PHÍ SHIP):</Text>
                  <Text style={[styles.balanceValue, { color: UI_CONFIG.colors.primary }]}>
                    {selectedTotal.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>

                <TacticalButton 
                  text={`ĐẶT HÀNG (${selectedIds.length})`} 
                  onPress={handleCheckout} 
                  fullWidth
                  size="lg"
                  style={styles.checkoutBtn}
                />
              </View>
            </View>
          </>
        )}
      </SafeArea>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: UI_CONFIG.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '900',
  },
  selectAllRow: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingTop: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontWeight: '700',
    color: UI_CONFIG.colors.text,
  },
  cartItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCheckbox: {
    marginRight: UI_CONFIG.spacing.md,
  },
  cartItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    padding: UI_CONFIG.spacing.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 2,
    backgroundColor: '#000',
  },
  itemInfo: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.md,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
    letterSpacing: 1,
  },
  itemVariant: {
    fontSize: 10,
    fontWeight: '700',
    color: UI_CONFIG.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  itemPrice: {
    color: UI_CONFIG.colors.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
  },
  footer: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
  },
  glassContainer: {
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 12,
    color: UI_CONFIG.colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
  },
  checkoutBtn: {
    marginTop: 10,
  }
});
