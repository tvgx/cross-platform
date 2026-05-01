import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useRouter, Href } from 'expo-router';

export function ProfileView() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Đồng ý', 
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome' as Href);
        }
      }
    ]);
  };

  const renderMenuItem = (icon: any, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <IconSymbol name={icon} size={24} color={UI_CONFIG.colors.text} />
      <Text style={styles.menuItemText}>{title}</Text>
      <IconSymbol name="chevron.right" size={20} color={UI_CONFIG.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeArea edges={['top']}>
      <CustomAppBar title="Tài khoản" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header section */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} 
            style={styles.avatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || user?.username || 'Khách'}</Text>
            <Text style={styles.userRole}>{user?.rank || 'Thành viên'}</Text>
            {user?.unit && <Text style={styles.userUnit}>{user.unit}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.virtual_balance?.toLocaleString('vi-VN') || 0}</Text>
            <Text style={styles.statLabel}>Điểm thưởng</Text>
          </View>
        </View>

        {/* Menu list */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Mua sắm</Text>
          {renderMenuItem('cart', 'Đơn hàng của tôi', () => {})}
          {renderMenuItem('star', 'Sản phẩm đã thích', () => {})}
          
          <Text style={styles.menuSectionTitle}>Tài khoản</Text>
          {renderMenuItem('person', 'Thông tin cá nhân', () => {})}
          {renderMenuItem('shield', 'Đổi mật khẩu', () => {})}
          {renderMenuItem('map', 'Địa chỉ nhận hàng', () => {})}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: UI_CONFIG.spacing.xl,
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.background,
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: UI_CONFIG.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.primary,
    fontWeight: '500',
  },
  userUnit: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.background,
    paddingVertical: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: UI_CONFIG.colors.border,
  },
  statNumber: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
  },
  statLabel: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: 4,
  },
  menuContainer: {
    backgroundColor: UI_CONFIG.colors.background,
    paddingVertical: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  menuSectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.textSecondary,
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginTop: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
    paddingHorizontal: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    flex: 1,
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
    marginLeft: UI_CONFIG.spacing.md,
  },
  logoutButton: {
    marginHorizontal: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.danger,
  },
  logoutText: {
    color: UI_CONFIG.colors.danger,
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  }
});
