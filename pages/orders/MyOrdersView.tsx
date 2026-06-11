import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckoutStore } from '../../store/checkout';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { OrderRepository } from '../../lib/repositories/OrderRepository';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { Order } from '../../types';
import { TacticalImage } from '../../components/ui/TacticalImage';
import { Toast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/auth';

export function MyOrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const setCheckoutItems = useCheckoutStore(state => state.setCheckoutItems);

  const loadOrders = useCallback(async () => {
    try {
      const data = await OrderRepository.getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const openCancelModal = (orderId: string) => {
    setCancelingId(orderId);
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
      loadOrders();
      setCancelModalVisible(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể hủy đơn hàng lúc này.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleBuyAgain = (order: Order) => {
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

  const renderItem = ({ item }: { item: Order }) => {
    const isCancelable = item.status === 'pending' || item.status === 'pending_sync' || item.status === 'confirmed'; 
    const isBuyAgainable = item.status === 'delivered' || item.status === 'cancelled' || item.status === 'refunded';
    const statusDisplay = getStatusDisplay(item.status);

    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(main)/order/${item.id}` as any)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>ID: {item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusDisplay.color }]}>
            <Text style={[styles.statusText, { color: statusDisplay.color }]}>{statusDisplay.label}</Text>
          </View>
        </View>

        {item.items.map((prod, index) => (
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

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalAmount}>{item.total?.toLocaleString('vi-VN')} ₫</Text>
        </View>

        <View style={styles.actionRow}>
          {isCancelable && (
            <TouchableOpacity 
              style={[styles.cancelBtn, cancelingId === item.id && styles.disabledBtn]} 
              onPress={() => openCancelModal(item.id)}
              disabled={cancelingId === item.id}
            >
              <Text style={styles.cancelBtnText}>
                {cancelingId === item.id ? 'Đang hủy...' : 'HỦY LỆNH MUA'}
              </Text>
            </TouchableOpacity>
          )}
          {isBuyAgainable && (
            <TouchableOpacity 
              style={[styles.cancelBtn, { borderColor: UI_CONFIG.colors.primary, marginLeft: 8 }]} 
              onPress={() => handleBuyAgain(item)}
            >
              <Text style={[styles.cancelBtnText, { color: UI_CONFIG.colors.primary }]}>MUA LẠI</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeArea edges={['top']}>
        <Header title="ĐƠN HÀNG CỦA TÔI" leftIcon="arrow-back" showNotification={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Vui lòng đăng nhập để xem đơn hàng.</Text>
        </View>
      </SafeArea>
    );
  }

  const STATUS_TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipped', label: 'Đang giao' },
    { id: 'delivered', label: 'Đã nhận' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => {
        if (statusFilter === 'pending' && o.status === 'pending_sync') return true;
        return o.status === statusFilter;
      });

  const PRESET_REASONS = [
    "Muốn thay đổi địa chỉ nhận hàng",
    "Tìm thấy giá rẻ hơn chỗ khác",
    "Thay đổi ý định không muốn mua nữa",
    "Đặt nhầm sản phẩm/số lượng"
  ];

  return (
    <SafeArea edges={['top']}>
      <Header title="ĐƠN HÀNG CỦA TÔI" leftIcon="arrow-back" showNotification={false} />
      
      {toastMessage ? (
        <Toast message={toastMessage} type="success" onHide={() => setToastMessage('')} />
      ) : null}

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.filterTab, statusFilter === tab.id && styles.activeFilterTab]}
              onPress={() => setStatusFilter(tab.id)}
            >
              <Text style={[styles.filterTabText, statusFilter === tab.id && styles.activeFilterTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[UI_CONFIG.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={UI_CONFIG.colors.textSecondary} />
              <Text style={styles.emptyText}>Chưa có đơn hàng nào phù hợp.</Text>
            </View>
          }
        />
      )}

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
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setCancelModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>ĐÓNG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSubmit]} onPress={submitCancelOrder}>
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
  listContainer: { padding: UI_CONFIG.spacing.md, gap: UI_CONFIG.spacing.md },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: UI_CONFIG.spacing.lg },
  emptyText: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.textSecondary, marginTop: UI_CONFIG.spacing.md },
  card: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: 8,
    padding: UI_CONFIG.spacing.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
    paddingBottom: UI_CONFIG.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  orderId: {
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.md,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 14,
    color: UI_CONFIG.colors.text,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: UI_CONFIG.colors.text,
    fontWeight: '500',
  },
  productQuantity: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI_CONFIG.spacing.sm,
    paddingTop: UI_CONFIG.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  },
  totalLabel: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: UI_CONFIG.colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: UI_CONFIG.spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.danger,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  cancelBtnText: {
    color: UI_CONFIG.colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  filterContainer: {
    paddingVertical: UI_CONFIG.spacing.sm,
    backgroundColor: UI_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  filterScroll: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.colors.background,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  activeFilterTab: {
    backgroundColor: UI_CONFIG.colors.primary,
    borderColor: UI_CONFIG.colors.primary,
  },
  filterTabText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  activeFilterTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: UI_CONFIG.spacing.lg,
  },
  modalContent: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: 8,
    padding: UI_CONFIG.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.sm,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: UI_CONFIG.colors.textSecondary,
    marginRight: UI_CONFIG.spacing.sm,
  },
  radioActive: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: UI_CONFIG.colors.primary,
  },
  radioText: {
    color: UI_CONFIG.colors.text,
    fontSize: 14,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: 4,
    padding: UI_CONFIG.spacing.sm,
    color: UI_CONFIG.colors.text,
    marginTop: UI_CONFIG.spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: UI_CONFIG.spacing.lg,
    gap: UI_CONFIG.spacing.sm,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
  },
  modalBtnSubmit: {
    backgroundColor: UI_CONFIG.colors.danger,
  },
  modalBtnTextCancel: {
    color: UI_CONFIG.colors.textSecondary,
    fontWeight: 'bold',
  },
  modalBtnTextSubmit: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
