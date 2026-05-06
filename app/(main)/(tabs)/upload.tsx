import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { UI_CONFIG } from '../../../constants/config';
import { useAuthStore } from '../../../store/auth';
import { db } from '../../../lib/storage/sqlite';
import { saveFileToLocal } from '../../../lib/storage/fileSystem';
import * as ImagePicker from 'expo-image-picker';

export default function UploadScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);

  const handleSelectMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!title) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề chiến tích');
      return;
    }
    if (!mediaUri) {
      Alert.alert('Lỗi', 'Vui lòng chọn video hoặc ảnh minh chứng');
      return;
    }
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập');
      return;
    }

    try {
      // Save file permanently to local file system
      const localUri = await saveFileToLocal(mediaUri, 'uploads');
      
      const postId = `post_${Date.now()}`;
      const now = new Date().toISOString();
      const mockAiScore = Math.floor(Math.random() * 50000) + 10000; // random score between 10k and 60k

      db.runSync(
        'INSERT INTO Posts (id, title, description, media_url, author_id, status, ai_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [postId, title, description, localUri, user.id, 'pending', mockAiScore, now]
      );

      Alert.alert('Đã lưu thành công', `Chiến tích của bạn đã được ghi nhận nội bộ. Điểm AI dự kiến: ${mockAiScore.toLocaleString('vi-VN')} ₫. Sĩ quan sẽ xét duyệt sớm.`);
      
      setTitle('');
      setDescription('');
      setMediaUri(null);
      
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể lưu file chiến tích');
    }
  };

  return (
    <SafeArea edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng tải Chiến Tích</Text>
        <Text style={styles.subtitle}>Gửi video/ảnh chiến tích để hệ thống AI định giá quy đổi ra Tiền ảo.</Text>

        <View style={styles.form}>
          <Input placeholder="Tiêu đề chiến tích" value={title} onChangeText={setTitle} />
          <Input placeholder="Mô tả chi tiết" value={description} onChangeText={setDescription} />

          <TouchableOpacity style={styles.mockVideoBox} onPress={handleSelectMedia}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
            ) : (
              <Text style={{ color: '#fff' }}>[Nhấn để chọn Video/Ảnh từ thư viện]</Text>
            )}
          </TouchableOpacity>

          <Button text="Gửi lên Hệ thống" onPress={handleUpload} />
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: UI_CONFIG.spacing.lg },
  title: { fontSize: UI_CONFIG.typography.sizes.xl, fontWeight: 'bold' },
  subtitle: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginBottom: 20, marginTop: 5, lineHeight: 20 },
  form: { gap: 15 },
  mockVideoBox: {
    height: 180,
    backgroundColor: '#555',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  }
});
