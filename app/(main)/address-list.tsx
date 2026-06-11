import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useCheckoutStore } from '../../store/checkout';
import { useRouter } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { OrderAddress } from '../../types';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function AddressListScreen() {
  const router = useRouter();
  const setAddress = useCheckoutStore(state => state.setAddress);
  const selectedAddress = useCheckoutStore(state => state.selectedAddress);

  const [addresses, setAddresses] = useState<OrderAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

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

  const handleSelect = (addr: OrderAddress) => {
    setAddress(addr);
    router.back();
  };

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Chọn Địa chỉ" />
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {addresses.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
            </View>
          ) : (
            addresses.map(addr => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <TouchableOpacity 
                  key={addr.id} 
                  style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                  onPress={() => handleSelect(addr)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.name}>{addr.receiver_name}</Text>
                    <Text style={styles.phone}>{addr.phone}</Text>
                  </View>
                  <Text style={styles.addressText}>{addr.address}</Text>
                  {addr.full_address && <Text style={styles.addressText}>{addr.full_address}</Text>}
                  {addr.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Mặc định</Text>
                    </View>
                  )}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={UI_CONFIG.colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })
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
    position: 'relative',
  },
  addressCardSelected: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
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
    paddingRight: 24,
  },
  defaultBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
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
  checkIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  footer: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  }
});
