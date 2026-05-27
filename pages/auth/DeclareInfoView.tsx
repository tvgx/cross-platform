import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';
import { userApi } from '../../lib/api/endpoints/user';
import { useRepositories } from '../../context/RepositoryProvider';

export function DeclareInfoView() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { userRepository } = useRepositories();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [unit, setUnit] = useState(user?.unit || '');
  const [rank, setRank] = useState(user?.rank || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên.');
      return;
    }

    setLoading(true);
    try {
      const updatedInfo = {
        full_name: fullName,
        unit,
        rank,
        address,
      };

      // Gọi API cập nhật
      const res = await userApi.setUserInfo(updatedInfo);
      
      // Cập nhật local store
      if (user) {
        const newUser = { ...user, ...updatedInfo };
        updateUser(newUser);
        userRepository.saveUser(newUser); // Lưu vào SQLite local
      }

      NavigationService.replace(ROUTES.HOME);
    } catch (err) {
      console.log('[DeclareInfo] Cập nhật thất bại, áp dụng cho chế độ ngoại tuyến');
      if (user) {
        const newUser = { ...user, full_name: fullName, unit, rank, address };
        updateUser(newUser);
        userRepository.saveUser(newUser);
      }
      NavigationService.replace(ROUTES.HOME);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Bổ sung thông tin</Text>
          <Text style={styles.subtitle}>Vui lòng hoàn tất thông tin cá nhân để tiếp tục.</Text>

          <View style={styles.form}>
            <Input
              placeholder="Họ và tên (*)"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              placeholder="Đơn vị công tác"
              value={unit}
              onChangeText={setUnit}
            />
            <Input
              placeholder="Cấp bậc"
              value={rank}
              onChangeText={setRank}
            />
            <Input
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
            />
            {loading ? (
              <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
            ) : (
              <Button text="Hoàn tất" onPress={handleSubmit} />
            )}
          </View>
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: UI_CONFIG.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.background,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.xs,
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: UI_CONFIG.spacing.md,
  },
});
