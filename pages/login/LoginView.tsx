import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';
import { useRepositories } from '../../context/RepositoryProvider';
import { authApi } from '../../lib/api/endpoints/auth';
import { balanceApi } from '../../lib/api/endpoints/misc';
import { usersApi } from '../../lib/api/endpoints/users';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';
import { useAuthStore } from '../../store/auth';
import { useNetworkStore } from '../../store/network';
import { validatePhone, validateRequired, firstError } from '../../lib/utils/validators';
import { getAuthErrorMessage } from '../../lib/helpers/errorMapper';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
export function LoginView() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const { userRepository } = useRepositories();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      NetInfo.fetch().then(state => {
        const isConnected = state.isConnected && state.isInternetReachable !== false;
        useNetworkStore.getState().setOnline(!!isConnected);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    const check = firstError(
      validatePhone(phoneNumber),
      validateRequired(password, 'Mật khẩu'),
    );
    if (!check.ok) {
      Alert.alert('Lỗi', check.message!);
      return;
    }

    setLoading(true);

    try {
      // 1. Thử gọi API đăng nhập từ server
      console.log('[Auth] Đang gọi API đăng nhập từ server...');
      const res = await authApi.login({ phone_number: phoneNumber, password });

      if (res && res.success) {
        const user = res.data.user;
        const tokens = res.data.tokens;

        if (!user || !user.id) {
          throw new Error('Dữ liệu trả về không hợp lệ (thiếu user.id)');
        }

        console.log('[Auth] Đăng nhập thành công từ server. User ID:', user.id);

        // Lưu thông tự cục bộ vào SQLite để đồng bộ ngoại tuyến
        userRepository.saveUser(user);
        userRepository.createWallet(user.id, user.virtual_balance || 0);

        setAuth(user, tokens);

        // Fetch extra user info and balance
        try {
          console.log('[Auth] Fetching extra user info and wallet balance...');
          const [userInfoResult, balanceResult] = await Promise.allSettled([
            usersApi.getUserInfo(user.id),
            balanceApi.getCurrent()
          ]);

          if (userInfoResult.status === 'fulfilled' && userInfoResult.value?.data) {
            console.log('[Auth] Extra user info fetched.');
            const extraData = userInfoResult.value.data;
            user.firstname = extraData.firstname;
            user.lastname = extraData.lastname;
            user.email = extraData.email;
            user.avatar = extraData.avatar || user.avatar;
            user.cover_image = extraData.cover_image || user.cover_image;
            
            // Cập nhật lại store sau khi đã thay đổi user info
            useAuthStore.getState().updateUser(extraData as any);
          }

          if (balanceResult.status === 'fulfilled' && balanceResult.value?.data) {
            useAuthStore.getState().setBalance(balanceResult.value.data.balance);
            console.log(`[Auth] Loaded wallet balance: ${balanceResult.value.data.balance}`);
          }
        } catch (extraErr) {
          console.log('[Auth] Non-fatal error fetching extra info:', extraErr);
        }

        setLoading(false);

        // Chuyển hướng theo cấp bậc/vai trò
        if (user.rank === 'Sĩ quan' || user.rank === 'officer' || user.rank === 'admin' || (user as any).role === 'officer') {
          NavigationService.replace(ROUTES.OFFICER);
        } else {
          NavigationService.replace(ROUTES.HOME);
        }
        return;
      } else {
        // Lỗi nghiệp vụ từ server (ví dụ: sai mật khẩu) → map mã sang tiếng Việt, không show text thô.
        setLoading(false);
        const errMsg = getAuthErrorMessage((res as any).code, 'Sai số điện thoại hoặc mật khẩu.');
        Alert.alert('Đăng nhập thất bại', errMsg);
        return;
      }
    } catch (apiErr: any) {
      const isNetworkError = apiErr.message === 'Local Mode Only' || apiErr.code === 'ERR_NETWORK' || apiErr.code === 'ECONNABORTED';

      if (isNetworkError) {
        console.log('[Auth] Mạng lỗi thực sự (Axios Network Error):', apiErr.message);
      } else {
        console.log('[Auth] Lỗi xử lý dữ liệu hoặc server từ chối:', apiErr.message || apiErr);
      }

      // Nếu không phải lỗi mạng thì báo lỗi nghiệp vụ.
      // Ưu tiên map mã server (serverCode) sang tiếng Việt thân thiện, KHÔNG hiển thị text thô.
      if (!isNetworkError) {
        setLoading(false);
        const serverCode = apiErr.serverCode ?? apiErr.response?.data?.code;
        let errMsg = getAuthErrorMessage(serverCode, 'Sai số điện thoại hoặc mật khẩu.');
        // Chỉ dùng HTTP status khi server không trả mã nghiệp vụ.
        if (serverCode === undefined || serverCode === null) {
          const status = apiErr.response?.status;
          if (status === 400 || status === 401) errMsg = 'Sai số điện thoại hoặc mật khẩu.';
          else if (status === 404) errMsg = 'Tài khoản chưa được đăng ký trên hệ thống.';
          else if (status >= 500) errMsg = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
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
