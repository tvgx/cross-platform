import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useRouter, Href } from 'expo-router';
import { useRepositories } from '../../context/RepositoryProvider';

export function ProfileView() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();
  const { userRepository, postRepository } = useRepositories();

  const [posts, setPosts] = useState<any[]>([]);
  const [balance, setBalance] = useState(user?.virtual_balance || 0);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = () => {
    if (!user?.id) return;
    try {
      // Sync latest balance
      const u = userRepository.getUser(user.id);
      if (u) {
        setBalance(u.virtual_balance);
        updateUser({ virtual_balance: u.virtual_balance });
      }

      // Load user's posts (chiến tích)
      const userPosts = postRepository.getUserPosts(user.id);
      setPosts(userPosts);
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
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Chiến tích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: UI_CONFIG.colors.primary }]}>
              {balance.toLocaleString('vi-VN')}
            </Text>
            <Text style={styles.statLabel}>Điểm thưởng</Text>
          </View>
        </View>

        {/* Lịch sử chiến tích */}
        <View style={styles.menuContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.menuSectionTitle}>Chiến tích của tôi</Text>
            <TouchableOpacity onPress={loadUserData}><IconSymbol name="arrow.triangle.2.circlepath" size={20} color={UI_CONFIG.colors.primary} /></TouchableOpacity>
          </View>
          
          {posts.length === 0 ? (
            <Text style={{ padding: UI_CONFIG.spacing.md, color: UI_CONFIG.colors.textSecondary }}>Chưa có chiến tích nào.</Text>
          ) : (
            posts.map(post => (
              <View key={post.id} style={styles.postItem}>
                <Image source={{ uri: post.media_url }} style={styles.postMedia} />
                <View style={styles.postInfo}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postStatus}>
                    Trạng thái: {post.status === 'pending' ? '⏳ Đang chờ' : post.status === 'approved' ? '✅ Đã duyệt' : '❌ Bị từ chối'}
                  </Text>
                  <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Menu list */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Mua sắm</Text>
          {renderMenuItem('cart', 'Đơn hàng của tôi', () => {})}
          {renderMenuItem('star', 'Sản phẩm đã thích', () => {})}
          
          <Text style={styles.menuSectionTitle}>Tài khoản</Text>
          {renderMenuItem('person', 'Thông tin cá nhân', () => {})}
          {renderMenuItem('shield', 'Đổi mật khẩu', () => {})}
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
  container: { paddingBottom: UI_CONFIG.spacing.xl, backgroundColor: '#F5F5F5' },
  profileHeader: { flexDirection: 'row', padding: UI_CONFIG.spacing.lg, backgroundColor: UI_CONFIG.colors.background, alignItems: 'center', marginBottom: UI_CONFIG.spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: UI_CONFIG.spacing.md },
  userInfo: { flex: 1 },
  userName: { fontSize: UI_CONFIG.typography.sizes.xl, fontWeight: 'bold', color: UI_CONFIG.colors.text, marginBottom: 4 },
  userRole: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.primary, fontWeight: '500' },
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
