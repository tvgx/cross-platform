import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCheckoutStore } from '../../store/checkout';

export default function AddressEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setAddress = useCheckoutStore(state => state.setAddress);

  const [receiverName, setReceiverName] = useState(params.receiver_name as string || '');
  const [phone, setPhone] = useState(params.phone as string || '');
  const [provinceName, setProvinceName] = useState(params.province as string || '');
  const [wardName, setWardName] = useState(params.ward as string || '');
  const [addressDetail, setAddressDetail] = useState(params.address as string || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!receiverName || !phone || !addressDetail || !provinceName || !wardName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${addressDetail}, ${wardName}, ${provinceName}`;
      
      const body = {
        receiver_name: receiverName,
        phone,
        address: addressDetail,
        address_detail: addressDetail,
        full_address: fullAddress,
        is_default: params.is_default === 'true',
        lat: 0,
        lng: 0,
        address_id: []
      };

      const res = await ordersApi.editOrderAddress(params.id as string, body);
      if (res.data) {
        // Cập nhật lại store nếu đây là địa chỉ đang được chọn checkout
        setAddress(res.data);
        router.back();
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu địa chỉ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Sửa Địa chỉ" />
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Liên hệ</Text>
        <Input 
          placeholder="Họ và tên" 
          value={receiverName} 
          onChangeText={setReceiverName} 
        />
        <Input 
          placeholder="Số điện thoại" 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Địa chỉ</Text>
        
        <Input 
          placeholder="Tỉnh/Thành phố" 
          value={provinceName} 
          onChangeText={setProvinceName} 
        />

        <Input 
          placeholder="Phường/Xã, Quận/Huyện" 
          value={wardName} 
          onChangeText={setWardName} 
        />

        <Input 
          placeholder="Tên đường, Tòa nhà, Số nhà" 
          value={addressDetail} 
          onChangeText={setAddressDetail} 
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          text={isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}
          onPress={handleSave}
          backgroundColor={UI_CONFIG.colors.primary}
          disabled={isSubmitting}
        />
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: 4,
  },
  footer: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  }
});
