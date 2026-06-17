import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';
import { ordersApi } from '../../lib/api/endpoints/orders';

export interface LocationItem {
  id: number;
  name: string;
}

interface LocationPickerProps {
  province: LocationItem | null;
  ward: LocationItem | null;
  onChange: (province: LocationItem | null, ward: LocationItem | null) => void;
}

/**
 * Chuẩn hoá 1 phần tử khu vực từ server (get_ship_from) về { id, name }.
 * Server có thể trả nhiều tên trường khác nhau nên map phòng thủ.
 */
function toLocationItem(p: any): LocationItem | null {
  if (!p) return null;
  const rawId = p.id ?? p.value ?? p.code ?? p.area_id;
  const rawName = p.name ?? p.full_name ?? p.title ?? p.area_name ?? p.label;
  if (rawId === undefined || rawId === null) return null;
  return { id: Number(rawId), name: String(rawName ?? rawId) };
}

/** Lấy mảng khu vực từ data (có thể là mảng thẳng, hoặc { items: [...] } phân trang). */
function extractLocationList(data: any): LocationItem[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.list)
        ? data.list
        : [];
  return arr.map(toLocationItem).filter((x: LocationItem | null): x is LocationItem => x !== null);
}

/**
 * Chọn Tỉnh/Thành phố và Phường/Xã từ dữ liệu THẬT của server (GET /order/get_ship_from),
 * giúp lấy đúng id để gửi lên (address_id), thay vì nhập tay.
 */
export function LocationPicker({ province, ward, onChange }: LocationPickerProps) {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [provinceModal, setProvinceModal] = useState(false);
  const [wardModal, setWardModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProvinces(true);
      try {
        const res = await ordersApi.getProvinces();
        const items = extractLocationList(res?.data);
        if (mounted) setProvinces(items);
      } catch (e) {
        if (__DEV__) console.warn('[LocationPicker] Lỗi tải danh sách tỉnh/thành:', e);
        if (mounted) setProvinces([]);
      } finally {
        if (mounted) setLoadingProvinces(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadWards = async (provinceId: number) => {
    setLoadingWards(true);
    try {
      const res = await ordersApi.getWards(provinceId);
      setWards(extractLocationList(res?.data));
    } catch (e) {
      if (__DEV__) console.warn('[LocationPicker] Lỗi tải danh sách phường/xã:', e);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handlePickProvince = (item: LocationItem) => {
    setProvinceModal(false);
    onChange(item, null); // đổi tỉnh thì reset phường
    setWards([]);
    loadWards(item.id);
  };

  const handlePickWard = (item: LocationItem) => {
    setWardModal(false);
    onChange(province, item);
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: LocationItem[],
    loading: boolean,
    onPick: (item: LocationItem) => void,
    emptyText: string,
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={UI_CONFIG.colors.text} /></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => onPick(item)}>
                  <Text style={styles.rowText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={() => setProvinceModal(true)}>
        <Text style={province ? styles.value : styles.placeholder}>{province?.name || 'Chọn Tỉnh/Thành phố'}</Text>
        <Ionicons name="chevron-down" size={18} color={UI_CONFIG.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selector, !province && styles.disabled]}
        disabled={!province}
        onPress={() => setWardModal(true)}
      >
        <Text style={ward ? styles.value : styles.placeholder}>
          {ward?.name || (province ? 'Chọn Phường/Xã' : 'Chọn Tỉnh/Thành phố trước')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={UI_CONFIG.colors.textSecondary} />
      </TouchableOpacity>

      {renderModal(provinceModal, () => setProvinceModal(false), 'Chọn Tỉnh/Thành phố', provinces, loadingProvinces, handlePickProvince, 'Không tải được danh sách tỉnh/thành.')}
      {renderModal(wardModal, () => setWardModal(false), 'Chọn Phường/Xã', wards, loadingWards, handlePickWard, 'Không có phường/xã.')}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.md,
    borderRadius: 8,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  disabled: { opacity: 0.5 },
  value: { fontSize: 16, color: UI_CONFIG.colors.text },
  placeholder: { fontSize: 16, color: UI_CONFIG.colors.textSecondary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: UI_CONFIG.colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', minHeight: '40%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: UI_CONFIG.spacing.md, borderBottomWidth: 1, borderBottomColor: UI_CONFIG.colors.border },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: UI_CONFIG.colors.text },
  row: { paddingVertical: UI_CONFIG.spacing.md, paddingHorizontal: UI_CONFIG.spacing.lg, borderBottomWidth: 1, borderBottomColor: UI_CONFIG.colors.border },
  rowText: { fontSize: 16, color: UI_CONFIG.colors.text },
  empty: { textAlign: 'center', color: UI_CONFIG.colors.textSecondary, padding: UI_CONFIG.spacing.lg },
});
