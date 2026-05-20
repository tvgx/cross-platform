import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { TacticalButton } from '../../../components/ui/TacticalButton';
import { Input } from '../../../components/ui/Input';
import { UI_CONFIG } from '../../../constants/config';
import { useAuthStore } from '../../../store/auth';
import { useRepositories } from '../../../context/RepositoryProvider';
import { cacheMedia } from '../../../lib/storage/fileSystem';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../../components/navigation/Header';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SyncService } from '../../../services/SyncService';

export default function UploadScreen() {
  const { postRepository } = useRepositories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const user = useAuthStore(state => state.user);

  const handleSelectMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!title || !mediaUri || !user) {
      Alert.alert('THÔNG TIN THIẾU', 'Vui lòng nhập tiêu đề và chọn minh chứng chiến tích.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Lưu vào Cache bền vững (Offline-first)
      const localUri = await cacheMedia(mediaUri);
      
      const postId = `POST_${Date.now()}`;
      const now = new Date().toISOString();
      const mockAiScore = Math.floor(Math.random() * 50000) + 10000;

      // 2. Lưu vào SQLite qua PostRepository
      postRepository.createPost({
        id: postId,
        title,
        description,
        media_url: localUri,
        author_id: user.id,
        status: 'pending',
        ai_score: mockAiScore,
        reward_coin: mockAiScore,
        created_at: now
      });

      // 3. Kích hoạt sync ngay nếu có mạng
      SyncService.runSyncProcess();

      Alert.alert(
        'LỆNH GỬI THÀNH CÔNG', 
        `Chiến tích đã được lưu vào bộ nhớ tác chiến. Đang chờ AI định giá (Dự kiến: ${mockAiScore.toLocaleString('vi-VN')} Xu).`
      );
      
      setTitle('');
      setDescription('');
      setMediaUri(null);
      
    } catch (err) {
      console.error(err);
      Alert.alert('LỖI HỆ THỐNG', 'Không thể lưu trữ chiến tích cục bộ.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="CHỨNG MINH CHIẾN TÍCH" leftIcon="menu" rightIcon="cloud-upload" />
      
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Gửi bằng chứng (Ảnh/Video) để AI định giá quy đổi ra quân nhu. 
          Dữ liệu sẽ tự động đồng bộ khi có sóng.
        </Text>

        <View style={styles.form}>
          <Input 
            placeholder="TIÊU ĐỀ CHIẾN TÍCH" 
            value={title} 
            onChangeText={setTitle} 
            style={styles.input}
          />
          <Input 
            placeholder="MÔ TẢ CHI TIẾT (TÙY CHỌN)" 
            value={description} 
            onChangeText={setDescription} 
            style={styles.input}
            multiline
          />

          <TouchableOpacity style={styles.mediaBox} onPress={handleSelectMedia}>
            {mediaUri ? (
              <View style={{ width: '100%', height: '100%' }}>
                <Image source={{ uri: mediaUri }} style={styles.previewImage} />
                <View style={styles.previewOverlay}>
                  <StatusBadge status="pending_sync" />
                </View>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} style={{ marginBottom: 10 }} />
                <Text style={styles.placeholderText}>NHẤN ĐỂ CHỌN ẢNH / VIDEO CHIẾN TÍCH</Text>
              </View>
            )}
          </TouchableOpacity>

          <TacticalButton 
            text={isProcessing ? "ĐANG XỬ LÝ..." : "GỬI BẰNG CHỨNG"} 
            onPress={handleUpload} 
            disabled={isProcessing}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: UI_CONFIG.spacing.lg },
  subtitle: { 
    fontSize: 12, 
    color: UI_CONFIG.colors.textSecondary, 
    marginBottom: 30, 
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600'
  },
  form: { gap: 20 },
  input: {
    backgroundColor: UI_CONFIG.colors.light,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontWeight: '700',
  },
  mediaBox: {
    height: 220,
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: UI_CONFIG.colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  previewOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  placeholderBox: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center'
  }
});
