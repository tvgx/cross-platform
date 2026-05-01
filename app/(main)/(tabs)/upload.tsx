import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { UI_CONFIG } from '../../../constants/config';
import { useNetworkStore } from '../../../store/network';
import { useSyncQueueStore } from '../../../store/syncQueue';
import { rewardsApi } from '../../../lib/api/endpoints/misc';

export default function UploadScreen() {
  const isOnline = useNetworkStore(state => state.isOnline);
  const enqueue = useSyncQueueStore(state => state.enqueue);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleUpload = async () => {
    if (!title) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề chiến tích');
      return;
    }

    const payload = {
      file_name: `${title}.mp4`,
      mime_type: 'video/mp4',
      base64: 'fake-base64-data-for-demo',
      description: description
    };

    if (isOnline) {
      try {
        const res = await rewardsApi.uploadVideo(payload);
        if (res.success) {
          Alert.alert('Thành công', 'Upload thành công và AI đang tiến hành định giá.');
        } else {
          Alert.alert('Lỗi', 'Tải lên thất bại');
        }
      } catch (err) {
        Alert.alert('Lỗi', 'Mạng lỗi, vui lòng thử lại');
      }
    } else {
      enqueue({
        endpoint: '/upload_video',
        method: 'POST',
        data: payload
      });
      Alert.alert('Đã lưu Offline', 'Video của bạn đã được đưa vào hàng đợi chờ đồng bộ khi có mạng.');
    }
    setTitle('');
    setDescription('');
  };

  return (
    <SafeArea edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng tải Chiến Tích</Text>
        <Text style={styles.subtitle}>Gửi video/ảnh chiến trường để AI quy đổi thành tiền ảo mua sắm.</Text>

        <View style={styles.form}>
          <Input placeholder="Tiêu đề chiến tích" value={title} onChangeText={setTitle} />
          <Input placeholder="Mô tả chi tiết" value={description} onChangeText={setDescription} />
          
          <View style={styles.mockVideoBox}>
            <Text style={{ color: '#fff' }}>[Nhấn để chọn Video/Ảnh từ thư viện]</Text>
          </View>

          <Button text={isOnline ? "Đăng tải lên Server" : "Lưu vào Hàng đợi (Offline)"} onPress={handleUpload} />
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: UI_CONFIG.spacing.lg },
  title: { fontSize: UI_CONFIG.typography.sizes.xl, fontWeight: 'bold' },
  subtitle: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginBottom: 20, marginTop: 5 },
  form: { gap: 15 },
  mockVideoBox: {
    height: 150,
    backgroundColor: '#555',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  }
});
