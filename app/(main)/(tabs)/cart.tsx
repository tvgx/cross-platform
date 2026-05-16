import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Animated } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { UI_CONFIG } from '../../../constants/config';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useCartStore } from '../../../store/cart';
import { TacticalButton } from '../../../components/ui/TacticalButton';
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

  useEffect(() => {
    if (user?.id) {
      try {
        const u = db.getFirstSync<any>('SELECT virtual_balance FROM Users WHERE id = ?', [user.id]);
        if (u) {
          setBalance(u.virtual_balance);
          updateUser({ virtual_balance: u.virtual_balance });
        }
      } catch (err) {
        console.error('Error syncing balance in Cart:', err);
      }
    }
  }, [user?.id]);

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('TRUY CẬP BỊ TỪ CHỐI', 'Vui lòng xác thực danh tính để thanh toán.');
      return;
    }
    
    if (items.length === 0) {
      Alert.alert('GIỎ HÀNG TRỐNG', 'Lệnh mua hàng không có nội dung.');
      return;
    }

    if (balance < total) {
      Alert.alert('SỐ DƯ KHÔNG ĐỦ', 'Ngân sách virtual không đủ. Hãy gửi thêm chứng minh chiến tích (PoCA) để nhận thêm quân nhu.');
      return;
    }

    Alert.alert(
      'XÁC NHẬN LỆNH MUA',
      `Bạn đang thực hiện lệnh mua với tổng giá trị ${total.toLocaleString('vi-VN')} Xu. Lệnh này sẽ được gửi tới Bộ Quốc Phòng.`,
      [
        { text: 'HỦY', style: 'cancel' },
        { text: 'XÁC NHẬN (CONFIRM)', onPress: processCheckout }
      ]
    );
  };

  const processCheckout = () => {
    if (!user) return;
    try {
      const newBalance = balance - total;
      const now = new Date().toISOString();
      const orderId = `ORD_${Date.now()}`;

      // Database Transaction Logic from .agents/marketplace_logic.md
      db.execSync('BEGIN TRANSACTION;');
      
      try {
        // 1. Deduct Balance
        db.runSync('UPDATE Users SET virtual_balance = ? WHERE id = ?', [newBalance, user.id]);

        // 2. Create Orders & SyncQueue entries
        for (const item of items) {
          const subOrderId = `${orderId}_${item.product_id}`;
          db.runSync(
            'INSERT INTO Orders (id, product_id, quantity, total_price, buyer_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [subOrderId, item.product_id, item.quantity, item.price * item.quantity, user.id, 'pending_sync', now]
          );
          
          db.runSync(
            'INSERT INTO SyncQueue (id, action, target_id, payload, created_at) VALUES (?, ?, ?, ?, ?)',
            [`SQ_${subOrderId}`, 'ORDER_UPLOAD', subOrderId, JSON.stringify(item), now]
          );
        }

        db.execSync('COMMIT;');
        
        // 3. Update Local State
        setBalance(newBalance);
        updateUser({ virtual_balance: newBalance });
        clearCart();
        
        // 4. Success Navigation
        router.replace({
          pathname: '/(main)/order-success',
          params: { orderId }
        });

      } catch (innerErr) {
        db.execSync('ROLLBACK;');
        throw innerErr;
      }
      
    } catch (err) {
      console.error(err);
      Alert.alert('LỖI HỆ THỐNG', 'Không thể khởi tạo lệnh mua hàng. Vui lòng thử lại sau.');
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header 
        leftIcon="menu" 
        onPressLeft={() => navigation.dispatch(DrawerActions.openDrawer())} 
        title="Quân Nhu / Giỏ Hàng"
        rightIcon="notifications"
      />
      
      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>KHÔNG CÓ LỆNH MUA NÀO ĐANG CHỜ</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.container}>
            {items.map(item => (
              <View key={item.product_id} style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title.toUpperCase()}</Text>
                  <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} XU</Text>
                  
                  <View style={styles.quantityRow}>
                    <TacticalButton variant="outline" text="-" size="sm" onPress={() => updateQuantity(item.product_id, item.quantity - 1)} />
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TacticalButton variant="outline" text="+" size="sm" onPress={() => updateQuantity(item.product_id, item.quantity + 1)} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.glassContainer}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>NGÂN SÁCH HIỆN TẠI:</Text>
                <Text style={styles.balanceValue}>{balance.toLocaleString('vi-VN')} XU</Text>
              </View>
              
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>TỔNG CHI PHÍ:</Text>
                <Text style={[styles.balanceValue, { color: UI_CONFIG.colors.primary }]}>
                  {total.toLocaleString('vi-VN')} XU
                </Text>
              </View>

              <TacticalButton 
                text="XÁC NHẬN THANH TOÁN" 
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.light,
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
    backgroundColor: UI_CONFIG.colors.dark,
  },
  glassContainer: {
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.light,
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
