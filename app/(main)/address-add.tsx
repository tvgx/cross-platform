import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useRouter } from 'expo-router';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useCheckoutStore } from '../../store/checkout';

export default function AddressAddScreen() {
  const router = useRouter();
  const setAddress = useCheckoutStore(state => state.setAddress);

  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'province' | 'ward'>('province');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const res = await ordersApi.getProvinces();
      if (res.data) setProvinces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWards = async (provinceId: number) => {
    setIsLoadingList(true);
    try {
      const res = await ordersApi.getWards(provinceId);
      if (res.data) setWards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSave = async () => {
    if (!receiverName || !phone || !addressDetail || !selectedProvince || !selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${addressDetail}, ${selectedWard.name}, ${selectedProvince.name}`;
      
      const body = {
        receiver_name: receiverName,
        phone,
        address: addressDetail,
        address_detail: addressDetail,
        full_address: fullAddress,
        is_default: false,
        lat: 0,
        lng: 0,
        address_id: [selectedWard.id, selectedProvince.id]
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

  const openModal = (type: 'province' | 'ward') => {
    if (type === 'ward' && !selectedProvince) {
      Alert.alert('Thông báo', 'Vui lòng chọn Tỉnh/Thành phố trước.');
      return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    const data = modalType === 'province' ? provinces : wards;
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{modalType === 'province' ? 'Chọn Tỉnh/Thành phố' : 'Chọn Phường/Xã'}</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={UI_CONFIG.colors.text} />
          </TouchableOpacity>
        </View>
        {isLoadingList ? (
          <View style={styles.center}><ActivityIndicator color={UI_CONFIG.colors.primary} /></View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.listItem}
                onPress={() => {
                  if (modalType === 'province') {
                    setSelectedProvince(item);
                    setSelectedWard(null);
                    loadWards(item.id);
                  } else {
                    setSelectedWard(item);
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
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
        <TouchableOpacity style={styles.selector} onPress={() => openModal('province')}>
          <Text style={selectedProvince ? styles.selectorText : styles.placeholderText}>
            {selectedProvince ? selectedProvince.name : 'Chọn Tỉnh/Thành phố'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={UI_CONFIG.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.selector} onPress={() => openModal('ward')}>
          <Text style={selectedWard ? styles.selectorText : styles.placeholderText}>
            {selectedWard ? selectedWard.name : 'Chọn Phường/Xã'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={UI_CONFIG.colors.textSecondary} />
        </TouchableOpacity>

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

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          {renderModalContent()}
        </View>
      </Modal>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: UI_CONFIG.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.surfaceLighter,
  },
  listItemText: {
    fontSize: 16,
  }
});
