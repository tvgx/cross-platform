import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Button } from '../../components/ui/Button';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';

export function PersonalInfoView() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <SafeArea edges={['top']}>
      <Header title="THÔNG TIN CÁ NHÂN" leftIcon="arrow-back" showNotification={false} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ và tên"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Nhập địa chỉ email"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Cấp bậc</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.rank || 'Chưa cập nhật'}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Đơn vị</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.unit || 'Chưa cập nhật'}
            editable={false}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button text="Lưu thay đổi" onPress={() => { }} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  changeAvatarText: {
    color: UI_CONFIG.colors.primary,
    fontSize: UI_CONFIG.typography.sizes.sm,
    fontWeight: UI_CONFIG.typography.weights.medium,
  },
  formGroup: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  label: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    fontWeight: UI_CONFIG.typography.weights.medium,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: UI_CONFIG.borderRadius.md,
    padding: UI_CONFIG.spacing.md,
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
  },
  disabledInput: {
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    color: UI_CONFIG.colors.textSecondary,
  },
  buttonContainer: {
    marginTop: UI_CONFIG.spacing.xl,
  }
});
