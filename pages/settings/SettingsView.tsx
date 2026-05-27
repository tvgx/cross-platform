import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';

export function SettingsView() {
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);

  return (
    <SafeArea edges={['top']}>
      <Header title="CÀI ĐẶT" leftIcon="arrow-back" showNotification={false} />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Thông báo đẩy</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Xác thực FaceID / Vân tay</Text>
          <Switch value={faceId} onValueChange={setFaceId} />
        </View>

        <Text style={styles.sectionTitle}>Hiển thị</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Chế độ tối (Dark Mode)</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.logoutText} onPress={logout}>
          Đăng xuất
        </Text>
        
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: UI_CONFIG.spacing.lg,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  settingText: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
  },
  divider: {
    height: 30,
  },
  logoutText: {
    color: UI_CONFIG.colors.danger,
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
  },
  versionText: {
    textAlign: 'center',
    color: UI_CONFIG.colors.textSecondary,
    marginTop: UI_CONFIG.spacing.xl,
    fontSize: UI_CONFIG.typography.sizes.sm,
  }
});
