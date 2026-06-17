import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useRouter } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useCheckoutStore } from '../../store/checkout';
import { validatePhone } from '../../lib/utils/validators';
import { LocationPicker, LocationItem } from '../../components/ui/LocationPicker';

export default function AddressAddScreen() {
  const router = useRouter();
  const setAddress = useCheckoutStore(state => state.setAddress);

  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const [province, setProvince] = useState<LocationItem | null>(null);
  const [ward, setWard] = useState<LocationItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!receiverName || !phone || !addressDetail || !province || !ward) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và chọn Tỉnh/Phường.');
      return;
    }
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) {
      Alert.alert('Lỗi', phoneCheck.message!);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${addressDetail}, ${ward.name}, ${province.name}`;

      const body = {
        receiver_name: receiverName,
        phone,
        address: addressDetail,
        address_detail: addressDetail,
        full_address: fullAddress,
        is_default: false,
        lat: 0,
        lng: 0,
        // address_id là mảng id vị trí theo AddOrderAddressDto: [tỉnh, phường].
        address_id: [province.id, ward.id],
      };

      const res = await ordersApi.addOrderAddress(body);
      if (res.data) {
        setAddress(res.data);
        router.back();
      } else {
        Alert.alert('Lỗi', 'Không thể thêm địa chỉ.');
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
      <Header leftIcon="arrow-back" onPressLeft={() => router.back()} title="Thêm Địa chỉ" />
      
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

        <LocationPicker
          province={province}
          ward={ward}
          onChange={(p, w) => { setProvince(p); setWard(w); }}
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
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    padding: UI_CONFIG.spacing.md,
    borderRadius: 8,
  },
  selectorText: {
    fontSize: 16,
    color: UI_CONFIG.colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: UI_CONFIG.colors.textSecondary,
  },
  footer: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  }
});
