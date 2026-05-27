import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { UI_CONFIG } from '../../../constants/config';
import { TacticalButton } from '../../../components/ui/TacticalButton';
import { Input } from '../../../components/ui/Input';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRepositories } from '../../../context/RepositoryProvider';
import { useAuthStore } from '../../../store/auth';

export default function AppealFormScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { postRepository } = useRepositories();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore(state => state.user);

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert('THIẾU THÔNG TIN', 'Vui lòng nhập lý do.');
      return;
    }

    Alert.alert(
      'XÁC NHẬN KHIẾU NẠI',
      'Đơn khiếu nại sẽ được gửi tới Sĩ quan trực thuộc để xét duyệt lại. Bạn chắc chắn chứ?',
      [
        { text: 'HỦY', style: 'cancel' },
        { text: 'GỬI BÁO CÁO', onPress: processAppeal }
      ]
    );
  };

  const processAppeal = async () => {
    if (!user) {
      Alert.alert('LỖI', 'Vui lòng đăng nhập.');
      return;
    }
    setIsSubmitting(true);
    try {
      const appealId = `APP_${postId}_${Date.now()}`;
      
      postRepository.submitAppeal({
        id: appealId,
        proof_id: postId,
        user_id: user.id,
        reason: reason
      });

      Alert.alert(
        'THÀNH CÔNG',
        'Đã gửi khiếu nại. Vui lòng chờ phản hồi.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('LỖI', 'Không gửi được khiếu nại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="ĐƠN KHIẾU NẠI QUÂN SỰ" leftIcon="arrow-back" onPressLeft={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            LƯU Ý: Việc khiếu nại sai sự thật hoặc lạm dụng hệ thống có thể bị kỷ luật theo quy định của đơn vị.
          </Text>
        </View>

        <Text style={styles.label}>MÃ CHIẾN TÍCH: {postId}</Text>
        
        <Text style={styles.sectionTitle}>LÝ DO KHIẾU NẠI</Text>
        <Input 
          placeholder="Mô tả chi tiết lý do bạn cho rằng AI định giá sai..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={6}
          style={styles.input}
        />

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>HƯỚNG DẪN:</Text>
          <Text style={styles.guideItem}>• Nêu rõ loại vũ khí/thiết bị bị tiêu diệt.</Text>
          <Text style={styles.guideItem}>• Cung cấp thêm bối cảnh trận đánh nếu cần.</Text>
          <Text style={styles.guideItem}>• Đề xuất mức định giá mong muốn (nếu có).</Text>
        </View>

        <TacticalButton 
          text={isSubmitting ? "ĐANG GỬI..." : "GỬI ĐƠN KHIẾU NẠI"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { padding: UI_CONFIG.spacing.lg },
  warningBox: {
    padding: 15,
    backgroundColor: 'rgba(183, 28, 28, 0.1)',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.danger,
    borderRadius: 4,
    marginBottom: 25,
  },
  warningText: {
    color: UI_CONFIG.colors.danger,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionTitle: {
    color: UI_CONFIG.colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    height: 150,
    textAlignVertical: 'top',
    padding: 15,
    borderRadius: 4,
    color: '#fff',
  },
  guideBox: {
    marginTop: 25,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  guideTitle: {
    color: UI_CONFIG.colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  guideItem: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 40,
  }
});
