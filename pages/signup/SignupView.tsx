import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';
import { authApi } from '../../lib/api/endpoints/auth';
import { useRepositories } from '../../context/RepositoryProvider';
import { useAuthStore } from '../../store/auth';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';

export function SignupView() {
  const { userRepository } = useRepositories();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [phonenumber, setPhonenumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!phonenumber || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      // Tạo mã thiết bị UUID ngẫu nhiên dã chiến
      const uuid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      
      const signupBody = {
        phone_number: phonenumber,
        password,
        uuid,
      };
      
      console.log('[Signup] Đang gọi API đăng ký tối giản...', signupBody);
      const res = await authApi.signup(signupBody);
      
      if (res && (res.success || (res as any).code === '1000' || res.data)) {
        const { tokens, user } = res.data;
        console.log('[Signup] Đăng ký thành công từ server. User ID:', user.id);

        // Lưu thông tin người dùng cục bộ vào SQLite để tác chiến ngoại tuyến
        userRepository.saveUser(user);
        userRepository.createWallet(user.id, 999999999999999999);
        
        // Tự động kích hoạt trạng thái đăng nhập ngay lập tức
        setAuth(user, tokens);
        setLoading(false);

        Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Tự động đăng nhập vào ứng dụng.', [
          { 
            text: 'Bắt đầu', 
            onPress: () => {
              NavigationService.replace(ROUTES.DECLARE_INFO);
            } 
          }
        ]);
      } else {
        setLoading(false);
        const errMsg = res.message || 'Không thể đăng ký tài khoản. Vui lòng kiểm tra lại thông tin.';
        Alert.alert('Đăng ký thất bại', errMsg);
      }
    } catch (err: any) {
      console.log('[Signup] Mạng lỗi hoặc server từ chối:', err);
      setLoading(false);
      Alert.alert('Lỗi kết nối', 'Không thể đăng ký tài khoản lúc này. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Input
                placeholder="Số điện thoại"
                value={phonenumber}
                onChangeText={setPhonenumber}
                keyboardType="phone-pad"
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
                <TouchableOpacity onPress={() => NavigationService.replace(ROUTES.LOGIN)}>
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
