import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { useRepositories } from '../../context/RepositoryProvider';
import { authApi } from '../../lib/api/endpoints/auth';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';

export function LoginView() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const { userRepository } = useRepositories();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      // 1. Thử gọi API đăng nhập từ server
      console.log('[Auth] Đang gọi API đăng nhập từ server...');
      const res = await authApi.login({ phone_number: phoneNumber, password });
      
      if (res && (res.success || (res as any).code === '1000' || res.data)) {
        const rawData = res.data as any;
        
        // Handle both expected formats: nested {user, tokens} or flat {id, username, token}
        const user = rawData.user || {
          id: rawData.id || String(Math.random()),
          username: rawData.username || phoneNumber,
          full_name: rawData.username || 'Chiến sĩ',
          avatar: rawData.avatar,
          rank: 'Chiến sĩ', // Default
          virtual_balance: 0,
          is_seller: false,
          created_at: new Date().toISOString()
        };
        
        const tokens = rawData.tokens || {
          access_token: rawData.token
        };

        if (!user.id) {
           throw new Error('Dữ liệu trả về không hợp lệ');
        }

        console.log('[Auth] Đăng nhập thành công từ server. User ID:', user.id);

        // Lưu thông tin người dùng cục bộ vào SQLite để đồng bộ ngoại tuyến
        userRepository.saveUser(user);
        userRepository.createWallet(user.id, user.virtual_balance || 0);

        setAuth(user, tokens);
        setLoading(false);

        // Chuyển hướng theo cấp bậc/vai trò
        if (user.rank === 'Sĩ quan' || user.rank === 'officer' || user.rank === 'admin' || (user as any).role === 'officer') {
          NavigationService.replace(ROUTES.OFFICER);
        } else {
          NavigationService.replace(ROUTES.HOME);
        }
        return;
      } else {
        // Lỗi nghiệp vụ từ server (ví dụ: sai mật khẩu)
        setLoading(false);
        const errMsg = res.message || 'Sai thông tin đăng nhập.';
        Alert.alert('Đăng nhập thất bại', errMsg);
        return;
      }
    } catch (apiErr: any) {
      console.log('[Auth] Lỗi kết nối API đăng nhập hoặc lỗi nghiệp vụ:', apiErr);
      
      // Nếu là lỗi nghiệp vụ (ví dụ: HTTP status 4xx từ server) chứ không phải lỗi mạng/kết nối
      if (apiErr.response && apiErr.response.status >= 400 && apiErr.response.status < 500) {
        setLoading(false);
        const errMsg = apiErr.response.data?.message || 'Sai thông tin đăng nhập.';
        Alert.alert('Đăng nhập thất bại', errMsg);
        return;
      }

      // 2. Chế độ ngoại tuyến (Offline Fallback): Thử tìm kiếm tài khoản trong SQLite local
      console.log('[Auth] Kích hoạt chế độ đăng nhập ngoại tuyến (Offline Fallback) do lỗi mạng...');
      try {
        const user = userRepository.getUserByUsernameOrPhone(phoneNumber);
        if (user) {
          // Tạo JWT Token giả lập có định dạng giống thật
          const mockJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local_offline_mode_user_${user.id}.signature_mock`;
          setAuth(user, { access_token: mockJwtToken });
          setLoading(false);

          Alert.alert(
            'Chế độ ngoại tuyến',
            'Không kết nối được với máy chủ. Bạn đang đăng nhập bằng tài khoản lưu cục bộ trên thiết bị.',
            [
              {
                text: 'Đồng ý',
                onPress: () => {
                  if (user.rank === 'Sĩ quan' || user.rank === 'officer' || user.rank === 'admin') {
                    NavigationService.replace(ROUTES.OFFICER);
                  } else {
                    NavigationService.replace(ROUTES.HOME);
                  }
                }
              }
            ]
          );
        } else {
          setLoading(false);
          Alert.alert('Đăng nhập thất bại', 'Sai thông tin đăng nhập hoặc tài khoản không tồn tại trên thiết bị ở chế độ ngoại tuyến.');
        }
      } catch (dbErr) {
        setLoading(false);
        console.error('[Auth] Lỗi đăng nhập ngoại tuyến:', dbErr);
        Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi truy vấn dữ liệu cục bộ.');
      }
    }
  };


  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.hint}>Demo: nguyenvana (Sĩ quan) | tranvanb (Chiến sĩ)</Text>

          <View style={styles.form}>
            <Input
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoCapitalize="none"
            />
            <Input
              variant="password"
              placeholder="Mật khẩu (nhập bất kỳ)"
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
              <TouchableOpacity onPress={() => NavigationService.navigate(ROUTES.SIGNUP)}>
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
    maxWidth: 400,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xxl,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.sm,
    textAlign: 'center',
  },
  hint: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.xl,
    fontStyle: 'italic',
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
