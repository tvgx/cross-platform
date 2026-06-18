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
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SyncService } from '../../../services/SyncService';
import { SwipeWrapper } from '../../../components/navigation/SwipeWrapper';

export default function UploadScreen() {
  const { postRepository } = useRepositories();
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
    if (!description || !mediaUri || !user) {
      Alert.alert('THIẾU THÔNG TIN', 'Nhập mô tả và chọn minh chứng.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Lưu vào Cache bền vững (Offline-first)
      const localUri = await cacheMedia(mediaUri);
      
      const postId = `POST_${Date.now()}`;
      const now = new Date().toISOString();
      const aiScore = 0; // Sẽ được API định giá sau khi upload thành công

      // 2. Lưu vào SQLite qua PostRepository (bây giờ là async gọi API)
      await postRepository.createPost({
        id: postId,
        title: '',
        description,
        media_url: localUri,
        image_url: localUri.endsWith('.mp4') ? '' : localUri,
        video_url: localUri.endsWith('.mp4') ? localUri : '',
        author_id: user.id,
        status: 'pending',
        ai_score: aiScore,
        reward_coin: aiScore,
        created_at: now
      });

      // 3. Kích hoạt sync ngay nếu có mạng (đối với các task fallback)
      SyncService.runSyncProcess();

      Alert.alert(
        'THÀNH CÔNG', 
        `Đã gửi chiến tích. Chờ Hội đồng / AI xét duyệt để nhận Xu.`
      );
      
      
      setDescription('');
      setDescription('');
      setMediaUri(null);
      
    } catch (err) {
      console.error(err);
      Alert.alert('LỖI', 'Không lưu được chiến tích.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SwipeWrapper currentTab="upload">
      <SafeArea edges={['top']}>
        <CustomAppBar title="CHỨNG MINH CHIẾN TÍCH" />
      
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Gửi bằng chứng (Ảnh/Video) để AI định giá quy đổi ra quân nhu. 
          Dữ liệu sẽ tự động đồng bộ khi có sóng.
        </Text>

        <View style={styles.form}>
          <Input 
            placeholder="MÔ TẢ CHIẾN TÍCH (Bắt buộc)" 
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
                <Text style={{ fontSize: 40, color: UI_CONFIG.colors.primary, marginBottom: 10, fontWeight: '200' }}>+</Text>
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
    </SwipeWrapper>
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
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderColor: UI_CONFIG.colors.border,
    color: UI_CONFIG.colors.text,
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
