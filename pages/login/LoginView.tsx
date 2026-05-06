import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { db } from '../../lib/storage/sqlite';
import { User } from '../../types';

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

    setTimeout(() => {
      setLoading(false);
      try {
        // Look up user from SQLite
        const row = db.getFirstSync<any>(
          'SELECT * FROM Users WHERE username = ? OR phone = ?',
          [username, username]
        );

        if (row) {
          const user: User = {
            id: row.id,
            username: row.username,
            full_name: row.full_name,
            avatar: row.avatar,
            rank: row.rank,
            unit: row.unit,
            virtual_balance: row.virtual_balance,
            is_seller: row.is_seller === 1,
            phone: row.phone,
            email: row.email,
            created_at: new Date().toISOString(),
          };
          setAuth(user, { access_token: 'mock_token' });

          // Route by rank
          if (row.rank === 'Sĩ quan' || row.rank === 'officer' || row.rank === 'admin') {
            router.replace('/(main)/officer' as Href);
          } else {
            router.replace('/(main)/(tabs)' as Href);
          }
        } else if (username === 'admin') {
          // Hardcoded fallback for officer demo
          const officerRow = db.getFirstSync<any>('SELECT * FROM Users WHERE id = "1"');
          if (officerRow) {
            const user: User = {
              id: officerRow.id,
              username: officerRow.username,
              full_name: officerRow.full_name,
              avatar: officerRow.avatar,
              rank: officerRow.rank,
              unit: officerRow.unit,
              virtual_balance: officerRow.virtual_balance,
              is_seller: officerRow.is_seller === 1,
              phone: officerRow.phone,
              email: officerRow.email,
              created_at: new Date().toISOString(),
            };
            setAuth(user, { access_token: 'mock_token' });
            router.replace('/(main)/officer' as Href);
          }
        } else {
          Alert.alert('Đăng nhập thất bại', 'Sai thông tin đăng nhập. Thử: nguyenvana / tranvanb');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Đã có lỗi xảy ra, thử lại sau.');
      }
    }, 800);
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.hint}>Demo: nguyenvana (Sĩ quan) | tranvanb (Chiến sĩ)</Text>

          <View style={styles.form}>
            <Input
              placeholder="Số điện thoại hoặc Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
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
