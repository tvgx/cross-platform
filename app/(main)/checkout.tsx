import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useCheckoutStore } from '../../store/checkout';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';
import { useRouter } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { OrderAddress } from '../../types';
import { TacticalImage } from '../../components/ui/TacticalImage';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen() {
  const router = useRouter();
  const checkoutItems = useCheckoutStore(state => state.checkoutItems);
  const selectedAddress = useCheckoutStore(state => state.selectedAddress);
  const setAddress = useCheckoutStore(state => state.setAddress);
  const clearCheckout = useCheckoutStore(state => state.clearCheckout);
  const cartItems = useCartStore(state => state.items);
  const removeCartItem = useCartStore(state => state.removeItem);
  const clearSelectedCart = useCartStore(state => state.clearSelected);
  const user = useAuthStore(state => state.user);

  const [addresses, setAddresses] = useState<OrderAddress[]>([]);
  const [shippingFees, setShippingFees] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (checkoutItems.length === 0) {
      router.back();
      return;
    }
    loadAddresses();
  }, []);

  useEffect(() => {
    if (selectedAddress) {
      calculateShippingFees(selectedAddress.id);
    }
  }, [selectedAddress]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getOrderAddresses();
      if (res.data && res.data.length > 0) {
        setAddresses(res.data);
        if (!selectedAddress) {
          const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
          setAddress(defaultAddr);
        }
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateShippingFees = async (addressId: number) => {
    try {
      // Group items by seller_id
      const sellerProducts: Record<string, number> = {};
      checkoutItems.forEach(item => {
        if (!sellerProducts[item.seller_id]) {
          sellerProducts[item.seller_id] = parseInt(item.product_id, 10);
        }
      });

      const fees: Record<string, number> = {};
      for (const sellerId in sellerProducts) {
        const productId = sellerProducts[sellerId];
        // Call API getShipFee
        const res = await ordersApi.getShipFee({ product_id: productId, address_id: addressId });
        if (res.data && res.data.fee !== undefined) {
          fees[sellerId] = Number(res.data.fee);
        } else {
          // Fallback if API fails or doesn't return fee
          fees[sellerId] = 0;
        }
      }
      setShippingFees(fees);
    } catch (err) {
      console.error('Error calculating ship fees:', err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng thêm địa chỉ nhận hàng.');
      return;
    }
    if (!user) return;

    setIsPlacingOrder(true);
    try {
      const body = {
        items: checkoutItems.map(item => ({
          product_id: parseInt(item.product_id, 10),
          quantity: item.quantity
        })),
        source: 'app',
        address_id: Number(selectedAddress.id)
      };

      const res = await ordersApi.createOrder(body);
      
      // Thành công, xoá các item đã mua khỏi giỏ hàng
      checkoutItems.forEach(item => {
        removeCartItem(item.id);
      });
      clearCheckout();

      setShowSuccessToast(true);
      setTimeout(() => {
        router.replace('/(main)/(tabs)/order-success');
      }, 1500);

    } catch (err: any) {
      console.error('Error placing order:', err);
      Alert.alert('Lỗi', err?.message || 'Không thể đặt hàng lúc này.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const itemsTotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalShipFee = Object.values(shippingFees).reduce((sum, fee) => sum + fee, 0);
  const grandTotal = itemsTotal + totalShipFee;

  if (isLoading) {
    return (
      <SafeArea edges={['top', 'bottom']}>
        <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Thanh Toán" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Thanh Toán" />
      {showSuccessToast && <Toast message="Đặt hàng thành công!" type="success" />}
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Address Section */}
        <TouchableOpacity 
          style={styles.addressSection}
          onPress={() => router.push('/(main)/address-list' as any)}
        >
          <View style={styles.addressHeader}>
            <Ionicons name="location-outline" size={20} color={UI_CONFIG.colors.primary} />
            <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
          </View>
          {selectedAddress ? (
            <View style={styles.addressContent}>
              <Text style={styles.addressName}>{selectedAddress.receiver_name} | {selectedAddress.phone}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              {selectedAddress.full_address && (
                <Text style={styles.addressText}>{selectedAddress.full_address}</Text>
              )}
            </View>
          ) : (
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>Chưa có địa chỉ giao hàng. Chạm để thêm.</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={UI_CONFIG.colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Sản phẩm ({checkoutItems.length})</Text>
          {checkoutItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <TacticalImage uri={item.image} categoryId={item.product_id} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title?.toUpperCase()}</Text>
                {item.variant_title && <Text style={styles.itemVariant}>Loại: {item.variant_title}</Text>}
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} ₫</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={styles.summaryValue}>{itemsTotal.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{totalShipFee.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.grandTotalValue}>{grandTotal.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotalValue}>{grandTotal.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <Button 
          text={isPlacingOrder ? "Đang xử lý..." : "Đặt hàng"}
          onPress={handlePlaceOrder}
          style={styles.placeOrderBtn}
          backgroundColor={UI_CONFIG.colors.primary}
          disabled={isPlacingOrder || !selectedAddress}
        />
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
    marginLeft: 8,
  },
  addressSection: {
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderRadius: 8,
    position: 'relative',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressContent: {
    paddingLeft: 28,
    paddingRight: 24,
  },
  addressName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  addressText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  itemsSection: {
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderRadius: 8,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: UI_CONFIG.spacing.md,
    paddingBottom: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.md,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemVariant: {
    fontSize: 12,
    color: UI_CONFIG.colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    color: UI_CONFIG.colors.primary,
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 14,
    color: UI_CONFIG.colors.textSecondary,
  },
  summarySection: {
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: UI_CONFIG.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: UI_CONFIG.colors.textSecondary,
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.primary,
  },
  placeOrderBtn: {
    flex: 1,
    marginLeft: 16,
  }
});
