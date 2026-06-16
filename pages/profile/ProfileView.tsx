import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useRouter, Href } from 'expo-router';
import { useRepositories } from '../../context/RepositoryProvider';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';
import { SwipeWrapper } from '../../components/navigation/SwipeWrapper';
import { ordersApi } from '../../lib/api/endpoints/orders';
import { balanceApi } from '../../lib/api/endpoints/misc';
import { useNetworkStore } from '../../store/network';

export function ProfileView() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();
  const { userRepository, postRepository } = useRepositories();

  const [orderCount, setOrderCount] = useState(0);
  const balance = useAuthStore(state => state.balance);

  const isOnline = useNetworkStore(state => state.isOnline);

  useEffect(() => {
    if (user?.id && isOnline) {
      loadUserData();
    }
  }, [user?.id, isOnline]);

  const loadUserData = async () => {
    if (!user?.id) return;
    try {
      // Load orders to get count from backend
      const ordersRes = await ordersApi.getPurchases({ index: 0, count: 1 });
      
      if (ordersRes.data?.total !== undefined) {
        setOrderCount(ordersRes.data.total);
      } else if (ordersRes.data?.items) {
        setOrderCount(ordersRes.data.items.length);
      }
    } catch (err) {
      console.error('Error loading user data in Profile:', err);
    }
  };

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
    <SwipeWrapper currentTab="profile">
      <SafeArea edges={['top']}>
        <CustomAppBar title="Tài khoản" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header section */}
        <View style={styles.headerContainer}>
          <View style={styles.coverContainer}>
            <Image 
              source={{ uri: (user as any)?.cover_image || 'https://via.placeholder.com/800x400' }} 
              style={styles.coverImage} 
            />
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {(user?.firstname || user?.lastname) ? `${user?.lastname || ''} ${user?.firstname || ''}`.trim() : (user?.full_name || user?.username || 'Khách')}
              </Text>
              <Text style={styles.userRole}>{user?.rank || 'Thành viên'}</Text>
              {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
              {user?.unit && <Text style={styles.userUnit}>{user.unit}</Text>}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text 
              style={[styles.statNumber, { color: UI_CONFIG.colors.primary }]} 
              numberOfLines={1} 
              ellipsizeMode="clip"
            >
              {balance >= 900000000000000000 ? '999999999999999999' : balance.toLocaleString('vi-VN')}
            </Text>
            <Text style={styles.statLabel}>Điểm thưởng</Text>
          </View>
        </View>

        {/* Tạm ẩn Lịch sử chiến tích theo yêu cầu */}

        {/* Menu list */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Mua sắm</Text>
          {renderMenuItem('grid', 'Tất cả sản phẩm', () => NavigationService.navigate(ROUTES.ALL_PRODUCTS))}
          {renderMenuItem('cart', 'Giỏ hàng của tôi', () => NavigationService.navigate(ROUTES.CART))}
          {renderMenuItem('receipt', 'Đơn hàng của tôi', () => NavigationService.navigate('/(main)/orders' as any))}
          {renderMenuItem('heart', 'Sản phẩm đã thích', () => NavigationService.navigate('/(main)/liked' as any))}
          
          <Text style={styles.menuSectionTitle}>Tài khoản</Text>
          {renderMenuItem('person', 'Thông tin cá nhân', () => NavigationService.navigate('/(main)/personal-info' as any))}
          {renderMenuItem('wallet', 'Ví của tôi', () => NavigationService.navigate('/(main)/wallet' as any))}
          {renderMenuItem('shield', 'Đổi mật khẩu', () => NavigationService.navigate('/(main)/change-password' as any))}
          {renderMenuItem('bell', 'Thông báo', () => NavigationService.navigate(ROUTES.NOTIFICATIONS))}
          {renderMenuItem('gear', 'Cài đặt', () => NavigationService.navigate('/(main)/settings' as any))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        </ScrollView>
      </SafeArea>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: UI_CONFIG.spacing.xl, backgroundColor: '#F5F5F5' },
  headerContainer: { backgroundColor: UI_CONFIG.colors.background, marginBottom: UI_CONFIG.spacing.sm },
  coverContainer: { width: '100%', height: 140 },
  coverImage: { width: '100%', height: '100%' },
  profileHeader: { flexDirection: 'row', padding: UI_CONFIG.spacing.lg, paddingTop: 0, alignItems: 'flex-end', marginTop: -30 },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, marginRight: UI_CONFIG.spacing.md, backgroundColor: '#fff', padding: 3, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 37 },
  userInfo: { flex: 1, paddingBottom: 10 },
  userName: { fontSize: UI_CONFIG.typography.sizes.xl, fontWeight: 'bold', color: UI_CONFIG.colors.text, marginBottom: 4 },
  userRole: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.primary, fontWeight: '500' },
  userEmail: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginTop: 4 },
  userUnit: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginTop: 2 },
  statsContainer: { flexDirection: 'row', backgroundColor: UI_CONFIG.colors.background, paddingVertical: UI_CONFIG.spacing.md, marginBottom: UI_CONFIG.spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: UI_CONFIG.colors.border },
  statNumber: { fontSize: UI_CONFIG.typography.sizes.lg, fontWeight: 'bold', color: UI_CONFIG.colors.text },
  statLabel: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginTop: 4 },
  menuContainer: { backgroundColor: UI_CONFIG.colors.background, paddingVertical: UI_CONFIG.spacing.sm, marginBottom: UI_CONFIG.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: UI_CONFIG.spacing.md },
  menuSectionTitle: { fontSize: UI_CONFIG.typography.sizes.md, fontWeight: 'bold', color: UI_CONFIG.colors.textSecondary, paddingHorizontal: UI_CONFIG.spacing.md, marginTop: UI_CONFIG.spacing.md, marginBottom: UI_CONFIG.spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: UI_CONFIG.spacing.md, paddingHorizontal: UI_CONFIG.spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemText: { flex: 1, fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.text, marginLeft: UI_CONFIG.spacing.md },
  logoutButton: { marginHorizontal: UI_CONFIG.spacing.md, backgroundColor: UI_CONFIG.colors.background, padding: UI_CONFIG.spacing.md, borderRadius: UI_CONFIG.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: UI_CONFIG.colors.danger },
  logoutText: { color: UI_CONFIG.colors.danger, fontSize: UI_CONFIG.typography.sizes.md, fontWeight: 'bold' },
  
  postItem: { flexDirection: 'row', padding: UI_CONFIG.spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  postMedia: { width: 60, height: 60, borderRadius: 8, marginRight: UI_CONFIG.spacing.md, backgroundColor: '#ddd' },
  postInfo: { flex: 1, justifyContent: 'center' },
  postTitle: { fontWeight: 'bold', fontSize: UI_CONFIG.typography.sizes.md, marginBottom: 4 },
  postStatus: { fontSize: UI_CONFIG.typography.sizes.sm, color: UI_CONFIG.colors.textSecondary, marginBottom: 2 },
  postDate: { fontSize: UI_CONFIG.typography.sizes.xs, color: UI_CONFIG.colors.textSecondary }
});
