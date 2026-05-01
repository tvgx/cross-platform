import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';
import { MOCK_USERS } from '../../lib/mockDB';
import { useAuthStore } from '../../store/auth';

export function LoginView() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    // Simulate API call using MOCK_USERS
    setTimeout(() => {
      setLoading(false);
      const user = MOCK_USERS.find(u => u.username === username || u.phone === username);
      // For mock purpose, accept any password if user is found, or default to mock user 1
      if (user) {
        setAuth(user, { access_token: 'mock_token' });
        router.replace('/(main)/(tabs)' as Href);
      } else if (username === 'admin') {
        setAuth(MOCK_USERS[0], { access_token: 'mock_token' });
        router.replace('/(main)/(tabs)' as Href);
      } else {
        Alert.alert('Đăng nhập thất bại', 'Sai thông tin đăng nhập');
      }
    }, 1000);
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>

          <View style={styles.form}>
            <Input
              placeholder="Số điện thoại hoặc Tên đăng nhập"
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
            {loading ? (
              <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
            ) : (
              <Button text="Đăng nhập" onPress={handleLogin} />
            )}

            <View style={styles.signupPrompt}>
              <Text style={styles.signupText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup' as Href)}>
                <Text style={styles.signupLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
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
    maxWidth: 400, // For web grid layout
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xxl,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: UI_CONFIG.spacing.md,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: UI_CONFIG.spacing.lg,
  },
  signupText: {
    color: UI_CONFIG.colors.textSecondary,
  },
  signupLink: {
    color: UI_CONFIG.colors.primary,
    fontWeight: UI_CONFIG.typography.weights.bold,
  }
});
