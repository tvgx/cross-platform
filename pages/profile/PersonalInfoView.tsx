import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { userApi } from '../../lib/api/endpoints/user';
import { Button } from '../../components/ui/Button';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';

export function PersonalInfoView() {
  const { user, updateUser } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  useEffect(() => {
    loadUserInfo();
    loadAddresses();
  }, []);

  const loadUserInfo = async () => {
    if (!user?.id) return;
    try {
      const res = await userApi.getUserInfo(user.id);
      if (res && res.data) {
        updateUser(res.data as any);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await userApi.getMyAddresses();
      if (res.data) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const coverUri = (user as any)?.cover_image || 'https://via.placeholder.com/800x400';
  const avatarUri = user?.avatar || 'https://i.pravatar.cc/150';

  const defaultAddressStr = addresses.length > 0 
    ? (addresses.find(a => a.is_default)?.full_address || addresses[0].full_address || addresses[0].address)
    : (user?.address || 'Chưa cập nhật địa chỉ');

  const fullName = (user?.lastname || user?.firstname) 
    ? `${user?.lastname || ''} ${user?.firstname || ''}`.trim()
    : (user?.full_name || 'Chưa cập nhật');

  return (
    <SafeArea edges={['top']}>
      <Header 
        title="THÔNG TIN CÁ NHÂN" 
        leftIcon="arrow-back" 
        showNotification={false} 
        rightIcon="pencil"
        onPressRight={() => NavigationService.navigate(ROUTES.EDIT_PERSONAL_INFO)}
      />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
          
          {/* Avatar floating over cover */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Adjust spacing since avatar overlaps */}
        <View style={{ marginTop: 60 }} />

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Họ và Tên</Text>
            <Text style={styles.value}>{fullName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số điện thoại</Text>
            <Text style={styles.value}>{user?.username || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái / Tiểu sử</Text>
            <Text style={styles.value}>{(user as any)?.status || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Cấp bậc</Text>
            <Text style={styles.value}>{user?.rank || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Đơn vị</Text>
            <Text style={styles.value}>{user?.unit || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sổ địa chỉ</Text>
          <Button 
            text="Quản lý" 
            variant="secondary"
            onPress={() => NavigationService.navigate('/(main)/my-addresses' as any)} 
          />
        </View>
        <View style={styles.infoCard}>
          {isLoadingAddresses ? (
            <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} />
          ) : addresses.length === 0 ? (
            <Text style={styles.addressValue}>Bạn chưa có địa chỉ giao hàng nào.</Text>
          ) : (
            <>
              <Text style={styles.addressValue}>{defaultAddressStr}</Text>
              {addresses.length > 1 && (
                <Text style={styles.moreAddressText}>và {addresses.length - 1} địa chỉ khác</Text>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.lg,
  },
  coverContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 12,
    marginBottom: UI_CONFIG.spacing.lg,
    overflow: 'visible',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: UI_CONFIG.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  infoCard: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: 12,
    padding: UI_CONFIG.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  infoRow: {
    flexDirection: 'column',
    paddingVertical: 8,
  },
  label: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
    fontWeight: '500',
  },
  addressValue: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
    fontWeight: '400',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: UI_CONFIG.colors.border,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  moreAddressText: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  }
});
