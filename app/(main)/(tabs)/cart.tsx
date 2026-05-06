import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { UI_CONFIG } from '../../../constants/config';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useCartStore } from '../../../store/cart';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth';
import { db } from '../../../lib/storage/sqlite';

export default function CartScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  
  const items = useCartStore(state => state.items);
  const total = useCartStore(state => state.total());
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clear);

  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const [balance, setBalance] = useState(user?.virtual_balance || 0);

  // Sync latest balance from DB when viewing cart
  useEffect(() => {
    if (user?.id) {
      const u = db.getFirstSync<any>('SELECT virtual_balance FROM Users WHERE id = ?', [user.id]);
      if (u) {
        setBalance(u.virtual_balance);
        updateUser({ virtual_balance: u.virtual_balance });
      }
    }
  }, [user?.id]);

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để thanh toán');
      return;
    }
    
    if (items.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống');
      return;
    }

    if (balance < total) {
      Alert.alert('Lỗi', 'Số dư Tiền ảo không đủ. Hãy đăng tải thêm chiến tích để nhận thêm Tiền ảo.');
      return;
    }

    try {
      const newBalance = balance - total;
      
      // Begin transaction manually if supported, but simple statements are fine here
      db.runSync('UPDATE Users SET virtual_balance = ? WHERE id = ?', [newBalance, user.id]);

      // Create Orders
      const orderId = `ord_${Date.now()}`;
      
      for (const item of items) {
        db.runSync(
          'INSERT INTO Orders (id, product_id, quantity, total_price, buyer_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`${orderId}_${item.product_id}`, item.product_id, item.quantity, item.price * item.quantity, user.id, 'pending_sync', new Date().toISOString()]
        );
      }

      setBalance(newBalance);
      updateUser({ virtual_balance: newBalance });
      clearCart();
      
      Alert.alert('Thành công', 'Đơn hàng đã được thanh toán và đang được vận chuyển ra tiền tuyến.', [
        { text: 'OK', onPress: () => router.replace('/(main)/(tabs)') }
      ]);
      
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thanh toán');
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header 
        leftIcon="menu" 
        onPressLeft={() => navigation.dispatch(DrawerActions.openDrawer())} 
        title="Giỏ hàng"
      />
      
      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.container}>
            {items.map(item => (
              <View key={item.id} style={styles.cartItem}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} ₫</Text>
                  
                  <View style={styles.quantityRow}>
                    <Button text="-" onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn} />
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Button text="+" onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Số dư Tiền ảo:</Text>
              <Text style={styles.balanceValue}>{balance.toLocaleString('vi-VN')} ₫</Text>
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Tổng cộng:</Text>
              <Text style={[styles.balanceValue, { color: UI_CONFIG.colors.primary }]}>
                {total.toLocaleString('vi-VN')} ₫
              </Text>
            </View>

            <Button 
              text="Thanh toán ngay" 
              onPress={handleCheckout} 
              style={styles.checkoutBtn}
            />
          </View>
        </>
      )}
    </SafeArea>
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
    fontSize: UI_CONFIG.typography.sizes.lg,
    color: UI_CONFIG.colors.textSecondary,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.white,
    padding: UI_CONFIG.spacing.sm,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: UI_CONFIG.borderRadius.sm,
    marginRight: UI_CONFIG.spacing.md,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: UI_CONFIG.colors.light,
    borderRadius: UI_CONFIG.borderRadius.sm,
    marginRight: UI_CONFIG.spacing.md,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  },
  itemPrice: {
    color: UI_CONFIG.colors.primary,
    fontWeight: 'bold',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: UI_CONFIG.spacing.xs,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    marginHorizontal: UI_CONFIG.spacing.md,
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  },
  footer: {
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.white,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  balanceLabel: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
  },
  balanceValue: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    marginTop: UI_CONFIG.spacing.md,
  }
});
