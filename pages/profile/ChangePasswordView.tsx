import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Button } from '../../components/ui/Button';
import { UI_CONFIG } from '../../constants/config';

export function ChangePasswordView() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu mới không khớp!');
      return;
    }
    setMessage('Đổi mật khẩu thành công (Mô phỏng)!');
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="ĐỔI MẬT KHẨU" leftIcon="arrow-back" showNotification={false} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu hiện tại</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Nhập mật khẩu hiện tại"
            value={oldPassword}
            onChangeText={setOldPassword}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {message ? (
          <Text style={[styles.message, message.includes('thành công') ? styles.success : styles.error]}>
            {message}
          </Text>
        ) : null}
        
        <View style={styles.buttonContainer}>
          <Button text="Cập nhật mật khẩu" onPress={handleChangePassword} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: UI_CONFIG.spacing.lg,
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
  buttonContainer: {
    marginTop: UI_CONFIG.spacing.xl,
  },
  message: {
    marginTop: UI_CONFIG.spacing.md,
    textAlign: 'center',
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  },
  error: {
    color: UI_CONFIG.colors.danger,
  },
  success: {
    color: '#4CAF50',
  }
});
