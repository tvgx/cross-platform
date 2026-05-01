import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';

export function SignupView() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phonenumber, setPhonenumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = () => {
    if (!username || !password || !confirmPassword || !fullname || !phonenumber) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login' as Href) }
      ]);
    }, 1000);
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Input
                placeholder="Họ và tên"
                value={fullname}
                onChangeText={setFullname}
              />
              <Input
                placeholder="Số điện thoại"
                value={phonenumber}
                onChangeText={setPhonenumber}
                keyboardType="phone-pad"
              />
              <Input
                placeholder="Tên đăng nhập"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Input
                variant="password"
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
              />
              <Input
                variant="password"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {loading ? (
                <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
              ) : (
                <Button text="Đăng ký" onPress={handleSignup} />
              )}

              <View style={styles.loginPrompt}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login' as Href)}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    maxWidth: 400, // For web grid layout
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: UI_CONFIG.spacing.md,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xxl,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.xl,
    textAlign: 'center',
    marginTop: UI_CONFIG.spacing.xl,
  },
  form: {
    gap: UI_CONFIG.spacing.md,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: UI_CONFIG.spacing.lg,
  },
  loginText: {
    color: UI_CONFIG.colors.textSecondary,
  },
  loginLink: {
    color: UI_CONFIG.colors.primary,
    fontWeight: UI_CONFIG.typography.weights.bold,
  }
});
