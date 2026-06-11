import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { ordersApi } from '../../../lib/api/endpoints/orders';
import { OrderRepository } from '../../../lib/repositories/OrderRepository';
import { Order, OrderStatus } from '../../../types';
import { UI_CONFIG } from '../../../constants/config';
import { TacticalImage } from '../../../components/ui/TacticalImage';
import { Toast } from '../../../components/ui/Toast';
import { useCheckoutStore } from '../../../store/checkout';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');

  const setCheckoutItems = useCheckoutStore(state => state.setCheckoutItems);

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  const mapStatus = (apiState: string): OrderStatus => {
    const map: Record<string, OrderStatus> = {
      'pending': 'pending', 'new': 'pending',
      'confirmed': 'confirmed', 'processing': 'confirmed',
      'shipped': 'shipped', 'shipping': 'shipped',
      'delivered': 'delivered', 'completed': 'delivered', 'success': 'delivered',
      'cancelled': 'cancelled', 'canceled': 'cancelled',
      'refunded': 'refunded'
    };
    return map[apiState?.toLowerCase()] || 'pending';
  };

  const loadOrderDetail = async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getPurchase(id as string);
      
      // Fetch addresses to map the correct address if needed
      let addressList: any[] = [];
      try {
        const addrRes = await ordersApi.getOrderAddresses();
        if (addrRes && addrRes.data) {
          addressList = addrRes.data;
        }
      } catch (e) {
        console.warn('Cannot fetch addresses in order detail:', e);
      }

      if (res && res.success && res.data) {
        const o: any = res.data;
        console.log('[OrderDetail] API getPurchase:', JSON.stringify(o, null, 2));

        const addressData = {
          id: o.address?.id || 0,
          receiver_name: o.buyer?.name || o.buyer?.full_name || o.buyer?.username || o.buyer_name || o.receiver_name || o.address?.receiver_name || o.address?.name || 'Người nhận',
          phone: o.buyer?.phone || o.buyer?.phonenumber || o.buyer?.phone_number || o.buyer_phone || o.phone || o.address?.phone || o.address?.phone_number || '0000000000',
          address: o.buyer?.address || (typeof o.address === 'string' ? o.address : o.address?.address) || o.address?.street || o.buyer_coordinates_description || 'Địa chỉ dã chiến',
          full_address: o.buyer?.address || (typeof o.full_address === 'string' ? o.full_address : o.address?.full_address) || (typeof o.address === 'string' ? o.address : o.address?.address) || o.address?.street || o.buyer_coordinates_description || 'Địa chỉ dã chiến',
          address_detail: o.address?.address_detail || '',
          lat: o.address?.lat || 0,
          lng: o.address?.lng || 0,
          is_default: true
        };

        const mappedOrder: Order = {
          id: String(o.id),
          buyer_id: String(o.buyer_id || '0'),
          seller_id: String(o.seller_id || '1'),
          seller_name: o.seller_name || 'Nhà cung cấp quân nhu',
          items: (o.items || []).map((i: any) => ({
            product_id: String(i.product_id),
            title: i.name || i.title || 'Sản phẩm quân nhu',
            image: i.image || undefined,
            price: i.price || 0,
            quantity: i.quantity || 1
          })),
          subtotal: o.total_price || 0,
          ship_fee: o.shipping_fee || o.ship_fee || 0,
          total: (o.total_price || 0) + (o.shipping_fee || o.ship_fee || 0),
          status: mapStatus(o.state || o.status),
          address: addressData,
          created_at: o.created_at || new Date().toISOString(),
          updated_at: o.updated_at || new Date().toISOString()
        };
        setOrder(mappedOrder);
      } else {
        const allOrders = OrderRepository.getLocalOrders();
        const found = allOrders.find(o => o.id === String(id));
        if (found) setOrder(found);
        else throw new Error("Không tìm thấy đơn hàng");
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const allOrders = OrderRepository.getLocalOrders();
      const found = allOrders.find(o => o.id === String(id));
      if (found) {
        setOrder(found);
      } else {
        Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng.');
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': 
      case 'pending_sync': 
        return { label: 'CHỜ XÁC NHẬN / ĐỒNG BỘ', color: UI_CONFIG.colors.accent };
      case 'confirmed': 
        return { label: 'ĐÃ XÁC NHẬN', color: UI_CONFIG.colors.info };
      case 'shipped': 
        return { label: 'ĐANG GIAO', color: UI_CONFIG.colors.info };
      case 'delivered': 
        return { label: 'ĐÃ NHẬN', color: UI_CONFIG.colors.success };
      case 'cancelled': 
        return { label: 'ĐÃ HỦY', color: UI_CONFIG.colors.danger };
      default: 
        return { label: status.toUpperCase(), color: UI_CONFIG.colors.textSecondary };
    }
  };

  const openCancelModal = () => {
    setCancelingId(order?.id || null);
    setCancelReason('');
    setSelectedPresetReason('');
    setCancelModalVisible(true);
  };

  const submitCancelOrder = async () => {
    const reason = selectedPresetReason || cancelReason;
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc nhập lý do hủy đơn.');
      return;
    }
    
    try {
      await ordersApi.cancelOrder(cancelingId!, reason);
      setToastMessage('Hủy đơn hàng thành công.');
      setCancelModalVisible(false);
      loadOrderDetail();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể hủy đơn hàng lúc này.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleBuyAgain = () => {
    if (!order) return;
    const checkoutItems = order.items.map(item => ({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      product_id: item.product_id,
      title: item.title,
      price: Number(item.price),
      image: item.image || undefined,
      quantity: item.quantity,
      seller_id: order.seller_id,
      seller_name: order.seller_name
    }));
    setCheckoutItems(checkoutItems);
    router.push('/(main)/checkout' as any);
  };

  const PRESET_REASONS = [
    "Muốn thay đổi địa chỉ nhận hàng",
    "Tìm thấy giá rẻ hơn chỗ khác",
    "Thay đổi ý định không muốn mua nữa",
    "Đặt nhầm sản phẩm/số lượng"
  ];

  if (isLoading || !order) {
    return (
      <SafeArea edges={['top', 'bottom']}>
        <Header title="CHI TIẾT ĐƠN HÀNG" leftIcon="arrow-back" showNotification={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      </SafeArea>
    );
  }

  const statusDisplay = getStatusDisplay(order.status);
  const isCancelable = order.status === 'pending' || order.status === 'pending_sync' || order.status === 'confirmed'; 
  const isBuyAgainable = order.status === 'delivered' || order.status === 'cancelled' || order.status === 'refunded';

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header title="CHI TIẾT ĐƠN HÀNG" leftIcon="arrow-back" showNotification={false} />
      
      {toastMessage ? (
        <Toast message={toastMessage} type="success" onHide={() => setToastMessage('')} />
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            <Ionicons name="information-circle" size={24} color={statusDisplay.color} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Trạng thái đơn hàng</Text>
              <Text style={[styles.statusText, { color: statusDisplay.color }]}>{statusDisplay.label}</Text>
            </View>
          </View>
          <Text style={styles.orderId}>Mã đơn hàng: {order.id}</Text>
          <Text style={styles.orderDate}>Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</Text>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={UI_CONFIG.colors.primary} />
            <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
          </View>
          <Text style={styles.addressName}>{order.address.receiver_name}</Text>
          <Text style={styles.addressPhone}>{order.address.phone}</Text>
          <Text style={styles.addressDetail}>{order.address.address}</Text>
          {order.address.full_address && order.address.full_address !== order.address.address && (
            <Text style={styles.addressDetail}>{order.address.full_address}</Text>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color={UI_CONFIG.colors.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm ({order.items.length})</Text>
          </View>
          {order.items.map((prod, index) => (
            <View key={index} style={styles.productRow}>
              <TacticalImage uri={prod.image} categoryId={prod.product_id} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{prod.title}</Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>{prod.price?.toLocaleString('vi-VN')} ₫</Text>
                  <Text style={styles.productQuantity}>x{prod.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng:</Text>
            <Text style={styles.summaryValue}>{order.subtotal?.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={styles.summaryValue}>{order.ship_fee?.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.summaryTotalValue}>{order.total?.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {isCancelable && (
          <TouchableOpacity 
            style={[styles.bottomBtn, styles.cancelBtn]} 
            onPress={openCancelModal}
          >
            <Text style={styles.cancelBtnText}>HỦY ĐƠN HÀNG</Text>
          </TouchableOpacity>
        )}
        {isBuyAgainable && (
          <TouchableOpacity 
            style={[styles.bottomBtn, styles.buyAgainBtn]} 
            onPress={handleBuyAgain}
          >
            <Text style={styles.buyAgainBtnText}>MUA LẠI ĐƠN NÀY</Text>
          </TouchableOpacity>
        )}
        {!isCancelable && !isBuyAgainable && (
          <TouchableOpacity 
            style={[styles.bottomBtn, styles.backBtn]} 
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>QUAY LẠI</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
            <Text style={styles.modalSubtitle}>Vui lòng chọn lý do hoặc tự điền bên dưới</Text>
            
            {PRESET_REASONS.map((r, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.radioRow} 
                onPress={() => setSelectedPresetReason(r)}
              >
                <View style={[styles.radioCircle, selectedPresetReason === r && styles.radioActive]} />
                <Text style={styles.radioText}>{r}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.radioRow} 
              onPress={() => setSelectedPresetReason('')}
            >
              <View style={[styles.radioCircle, selectedPresetReason === '' && styles.radioActive]} />
              <Text style={styles.radioText}>Khác (Tự điền)</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.reasonInput, selectedPresetReason !== '' && {opacity: 0.5}]}
              placeholder="Nhập lý do hủy đơn của đồng chí..."
              value={cancelReason}
              onChangeText={(text) => {
                setCancelReason(text);
                setSelectedPresetReason('');
              }}
              multiline
              editable={selectedPresetReason === ''}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtnItem, styles.modalBtnCancel]} onPress={() => setCancelModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>ĐÓNG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnItem, styles.modalBtnSubmit]} onPress={submitCancelOrder}>
                <Text style={styles.modalBtnTextSubmit}>XÁC NHẬN HỦY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: UI_CONFIG.spacing.md, gap: UI_CONFIG.spacing.md },
  section: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: 8,
    padding: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  statusInfo: { marginLeft: UI_CONFIG.spacing.sm },
  statusTitle: { color: UI_CONFIG.colors.textSecondary, fontSize: 12 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  orderId: { color: UI_CONFIG.colors.text, fontSize: 14, fontWeight: '500', marginTop: 4 },
  orderDate: { color: UI_CONFIG.colors.textSecondary, fontSize: 12, marginTop: 2 },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
    paddingBottom: UI_CONFIG.spacing.sm,
  },
  sectionTitle: { color: UI_CONFIG.colors.text, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  addressName: { color: UI_CONFIG.colors.text, fontSize: 14, fontWeight: 'bold' },
  addressPhone: { color: UI_CONFIG.colors.textSecondary, fontSize: 14, marginTop: 4 },
  addressDetail: { color: UI_CONFIG.colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 },

  productRow: {
    flexDirection: 'row',
    marginBottom: UI_CONFIG.spacing.md,
  },
  productImage: { width: 60, height: 60, borderRadius: 4 },
  productInfo: { flex: 1, marginLeft: UI_CONFIG.spacing.md, justifyContent: 'space-between' },
  productTitle: { fontSize: 14, color: UI_CONFIG.colors.text },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: UI_CONFIG.colors.text, fontWeight: '500' },
  productQuantity: { color: UI_CONFIG.colors.textSecondary, fontSize: 12 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: UI_CONFIG.spacing.sm },
  summaryLabel: { color: UI_CONFIG.colors.textSecondary, fontSize: 14 },
  summaryValue: { color: UI_CONFIG.colors.text, fontSize: 14 },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: UI_CONFIG.colors.border, paddingTop: UI_CONFIG.spacing.md, marginTop: UI_CONFIG.spacing.xs },
  summaryTotalLabel: { color: UI_CONFIG.colors.text, fontSize: 16, fontWeight: 'bold' },
  summaryTotalValue: { color: UI_CONFIG.colors.primary, fontSize: 18, fontWeight: 'bold' },

  bottomBar: {
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  },
  bottomBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtn: { borderColor: UI_CONFIG.colors.danger, backgroundColor: 'transparent' },
  cancelBtnText: { color: UI_CONFIG.colors.danger, fontWeight: 'bold', fontSize: 14 },
  buyAgainBtn: { borderColor: UI_CONFIG.colors.primary, backgroundColor: UI_CONFIG.colors.primary },
  buyAgainBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  backBtn: { borderColor: UI_CONFIG.colors.border, backgroundColor: UI_CONFIG.colors.background },
  backBtnText: { color: UI_CONFIG.colors.text, fontWeight: 'bold', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: UI_CONFIG.spacing.lg },
  modalContent: { backgroundColor: UI_CONFIG.colors.surface, borderRadius: 8, padding: UI_CONFIG.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: UI_CONFIG.colors.text, marginBottom: UI_CONFIG.spacing.xs },
  modalSubtitle: { fontSize: 14, color: UI_CONFIG.colors.textSecondary, marginBottom: UI_CONFIG.spacing.md },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: UI_CONFIG.spacing.sm },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: UI_CONFIG.colors.textSecondary, marginRight: UI_CONFIG.spacing.sm },
  radioActive: { borderColor: UI_CONFIG.colors.primary, backgroundColor: UI_CONFIG.colors.primary },
  radioText: { color: UI_CONFIG.colors.text, fontSize: 14 },
  reasonInput: { borderWidth: 1, borderColor: UI_CONFIG.colors.border, borderRadius: 4, padding: UI_CONFIG.spacing.sm, color: UI_CONFIG.colors.text, marginTop: UI_CONFIG.spacing.sm, minHeight: 80, textAlignVertical: 'top' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: UI_CONFIG.spacing.lg, gap: UI_CONFIG.spacing.sm },
  modalBtnItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  modalBtnCancel: { backgroundColor: 'transparent' },
  modalBtnSubmit: { backgroundColor: UI_CONFIG.colors.danger },
  modalBtnTextCancel: { color: UI_CONFIG.colors.textSecondary, fontWeight: 'bold' },
  modalBtnTextSubmit: { color: '#fff', fontWeight: 'bold' }
});
