import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';

export default function OfficerDashboard() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <Text style={styles.title}>Officer Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, Sĩ quan {user?.full_name || user?.username}</Text>
        
        <View style={styles.card}>
          <Text style={styles.text}>Tại đây sĩ quan có thể xem danh sách khiếu nại định giá AI (Reward Appeals) và thực hiện ghi đè quyết định.</Text>
        </View>

        <Button text="Đăng xuất" onPress={handleLogout} style={{ marginTop: 20 }} />
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.background,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: UI_CONFIG.typography.weights.bold,
  },
  subtitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xl,
  },
  card: {
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.white,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  text: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
  }
});
