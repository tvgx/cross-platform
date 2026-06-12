import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useAppStore } from '../../store/app';
import { useAuthStore } from '../../store/auth';

export function SettingsView() {
  const { logout } = useAuthStore();
  const { isDarkMode, setDarkMode } = useAppStore();
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;

  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(true);

  return (
    <SafeArea edges={['top']} style={{ backgroundColor: currentColors.background }}>
      <Header title="CÀI ĐẶT" leftIcon="arrow-back" showNotification={false} />
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={[styles.sectionTitle, { color: currentColors.textSecondary }]}>Tài khoản</Text>
        <View style={[styles.settingItem, { borderBottomColor: currentColors.border }]}>
          <Text style={[styles.settingText, { color: currentColors.text }]}>Thông báo đẩy</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ccc', true: currentColors.primary }}
          />
        </View>
        <View style={[styles.settingItem, { borderBottomColor: currentColors.border }]}>
          <Text style={[styles.settingText, { color: currentColors.text }]}>Xác thực FaceID / Vân tay</Text>
          <Switch
            value={faceId}
            onValueChange={setFaceId}
            trackColor={{ false: '#ccc', true: currentColors.primary }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: currentColors.textSecondary }]}>Hiển thị</Text>
        <View style={[styles.settingItem, { borderBottomColor: currentColors.border }]}>
          <Text style={[styles.settingText, { color: currentColors.text }]}>Giao diện tối</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ccc', true: currentColors.primary }}
          />
        </View>

        <View style={styles.divider} />

        <Text style={[styles.logoutText, { color: currentColors.danger }]} onPress={logout}>
          Đăng xuất
        </Text>

        <Text style={[styles.versionText, { color: currentColors.textSecondary }]}>Phiên bản 1.0.0 (TiếpTế)</Text>
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
  },
  settingText: {
    fontSize: UI_CONFIG.typography.sizes.md,
  },
  divider: {
    height: 30,
  },
  logoutText: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
  },
  versionText: {
    textAlign: 'center',
    marginTop: UI_CONFIG.spacing.xl,
    fontSize: UI_CONFIG.typography.sizes.sm,
  }
});
