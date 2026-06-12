import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useRouter } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { OrderAddress } from '../../types';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function MyAddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<OrderAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getOrderAddresses();
      if (res.data) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xoá địa chỉ', 'Bạn có chắc muốn xoá địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xoá', 
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.deleteOrderAddress(id);
            loadAddresses();
          } catch (e) {
            alert('Lỗi khi xoá địa chỉ.');
          }
        }
      }
    ]);
  };

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Sổ Địa chỉ" />
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {addresses.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bạn chưa có địa chỉ giao hàng nào.</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{addr.receiver_name}</Text>
                  <Text style={styles.phone}>{addr.phone}</Text>
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                {addr.full_address && <Text style={styles.addressText}>{addr.full_address}</Text>}
                
                <View style={styles.actionRow}>
                  {addr.is_default ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Mặc định</Text>
                    </View>
                  ) : <View />}
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => {
                      const parts = addr.full_address ? addr.full_address.split(',').map(p => p.trim()) : [];
                      const province = parts.length >= 3 ? parts[parts.length - 1] : '';
                      const ward = parts.length >= 3 ? parts[parts.length - 2] : '';
                      router.push({
                        pathname: '/(main)/address-edit',
                        params: { 
                          id: addr.id,
                          receiver_name: addr.receiver_name,
                          phone: addr.phone,
                          address: addr.address,
                          province,
                          ward,
                          is_default: addr.is_default ? 'true' : 'false'
                        }
                      });
                    }}>
                      <Ionicons name="pencil-outline" size={20} color={UI_CONFIG.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(addr.id.toString())}>
                      <Ionicons name="trash-outline" size={20} color={UI_CONFIG.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button 
          text="Thêm địa chỉ mới"
          onPress={() => router.push('/(main)/address-add' as any)}
          backgroundColor={UI_CONFIG.colors.primary}
        />
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  addressCard: {
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderRadius: 8,
    marginBottom: UI_CONFIG.spacing.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  phone: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  addressText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.surfaceLighter,
    paddingTop: 12,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    borderRadius: 4,
  },
  defaultText: {
    color: UI_CONFIG.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  }
});
