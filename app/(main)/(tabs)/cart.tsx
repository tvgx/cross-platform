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
import { TacticalImage } from '../../../components/ui/TacticalImage';

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
      
      const firstItem = items[0];
      const sellerId = firstItem.seller_id;
      const shipFee = 15; // Phí vận chuyển tác chiến cố định

      // Database Transaction Logic - Đảm bảo tính nhất quán dã chiến
      db.execSync('BEGIN TRANSACTION;');
      
      try {
        // 1. Khấu trừ số dư tài khoản của chiến sĩ
        db.runSync('UPDATE Users SET virtual_balance = ? WHERE id = ?', [newBalance, user.id]);

        // Cập nhật số dư trong bảng ví tiền Wallets
        db.runSync('UPDATE Wallets SET balance = ? WHERE user_id = ?', [newBalance, user.id]);

        // 2. Ghi hóa đơn chính (Orders) kèm Tọa độ GPS giả lập dã chiến
        db.runSync(
          `INSERT INTO Orders (
            id, buyer_id, buyer_coordinates_x, buyer_coordinates_y, buyer_coordinates_description,
            seller_id, seller_coordinates_x, seller_coordinates_y, seller_coordinates_description,
            status, total_price, shipping_fee, sync_status, created_at, product_id, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            orderId, 
            user.id, 
            20.8449, // Outpost Delta Latitude
            106.6881, // Outpost Delta Longitude
            'Tiền đồn Hải Phòng - Outpost Delta-7',
            sellerId,
            21.0285, // Depot Bravo Latitude
            105.8542, // Depot Bravo Longitude
            'Tổng kho quân khu Thủ đô - Base Bravo-1',
            'pending_sync',
            total,
            shipFee,
            'pending_sync',
            now,
            firstItem.product_id, // Tương thích ngược dòng cũ
            firstItem.quantity    // Tương thích ngược dòng cũ
          ]
        );

        // 3. Ghi chi tiết các mặt hàng vào bảng OrderItems (Quan hệ 1-N)
        for (const item of items) {
          const itemId = `OI_${orderId}_${item.product_id}_${item.variant_id || 'none'}`;
          db.runSync(
            'INSERT INTO OrderItems (id, order_id, product_id, variant_id, price, quantity) VALUES (?, ?, ?, ?, ?, ?);',
            [itemId, orderId, item.product_id, item.variant_id || '', item.price, item.quantity]
          );

          // Trừ trực tiếp kho cục bộ của variant (nếu khớp)
          if (item.variant_id) {
            db.runSync(
              'UPDATE ProductVariants SET stock = MAX(0, stock - ?) WHERE id = ?;',
              [item.quantity, item.variant_id]
            );
          } else {
            db.runSync(
              'UPDATE Products SET stock = MAX(0, stock - ?) WHERE id = ?;',
              [item.quantity, item.product_id]
            );
          }
        }

        // 4. Tạo giao dịch tài chính ghi lại lịch sử thanh toán
        const txId = `TX_${Date.now()}`;
        db.runSync(
          'INSERT INTO Transactions (id, wallet_id, type, amount, status, description, order_id, created_at) VALUES (?, (SELECT id FROM Wallets WHERE user_id = ?), ?, ?, ?, ?, ?, ?);',
          [txId, user.id, 'SPEND', total, 'completed', `Thanh toán đơn hàng quân nhu ${orderId}`, orderId, now]
        );

        // 5. Đưa tác vụ đồng bộ hóa ORDER_UPLOAD vào hàng đợi ngoại tuyến SyncQueue (Đầy đủ quan hệ)
        const syncPayload = {
          id: orderId,
          buyer_id: user.id,
          buyer_coordinates: { x: 20.8449, y: 106.6881, description: 'Tiền đồn Hải Phòng - Outpost Delta-7' },
          seller_id: sellerId,
          seller_coordinates: { x: 21.0285, y: 105.8542, description: 'Tổng kho quân khu Thủ đô - Base Bravo-1' },
          total_price: total,
          shipping_fee: shipFee,
          created_at: now,
          items: items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            variant_title: item.variant_title || null,
            price: item.price,
            quantity: item.quantity,
            title: item.title
          }))
        };

        db.runSync(
          'INSERT INTO SyncQueue (id, action, target_id, payload, created_at) VALUES (?, ?, ?, ?, ?);',
          [`SQ_${orderId}`, 'ORDER_UPLOAD', orderId, JSON.stringify(syncPayload), now]
        );

        db.execSync('COMMIT;');
        
        // 6. Cập nhật state nội bộ ứng dụng
        setBalance(newBalance);
        updateUser({ virtual_balance: newBalance });
        clearCart();
        
        // 7. Chuyển hướng sang màn hình thành công
        router.replace({
          pathname: '/(main)/order-success' as any,
          params: { orderId }
        });

      } catch (innerErr) {
        db.execSync('ROLLBACK;');
        throw innerErr;
      }
      
    } catch (err) {
      console.error('Lỗi giao dịch đặt hàng dã chiến:', err);
      Alert.alert('LỖI HỆ THỐNG', 'Không thể khởi tạo lệnh mua hàng dã chiến. Vui lòng thử lại sau.');
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
              <View key={item.id} style={styles.cartItem}>
                <TacticalImage uri={item.image} categoryId={item.product_id} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <View>
                    <Text style={styles.itemTitle}>{item.title.toUpperCase()}</Text>
                    {item.variant_title && (
                      <Text style={styles.itemVariant}>PHÂN LOẠI: {item.variant_title.toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} XU</Text>
                  
                  <View style={styles.quantityRow}>
                    <TacticalButton variant="outline" text="-" size="sm" onPress={() => updateQuantity(item.id, item.quantity - 1)} />
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TacticalButton variant="outline" text="+" size="sm" onPress={() => updateQuantity(item.id, item.quantity + 1)} />
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
