import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { usersApi } from '../../lib/api/endpoints/users';
import { User } from '../../types';

interface SellerInfoViewProps {
  userId: string;
}

export function SellerInfoView({ userId }: SellerInfoViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const res = await usersApi.getUserInfo(userId);
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Error loading seller data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeArea edges={['top']}>
        <CustomAppBar title="Thông tin người bán" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      </SafeArea>
    );
  }

  if (!user) {
    return (
      <SafeArea edges={['top']}>
        <CustomAppBar title="Thông tin người bán" />
        <View style={styles.center}>
          <Text style={styles.errorText}>Không tìm thấy thông tin người bán</Text>
        </View>
      </SafeArea>
    );
  }

  // Combine firstname and lastname or fallback to username/full_name
  const fullName = [user.lastname, user.firstname].filter(Boolean).join(' ').trim() || user.full_name || user.username || 'Người bán';

  return (
    <SafeArea edges={['top']}>
      <CustomAppBar title="Thông tin người bán" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header section */}
        <View style={styles.headerContainer}>
          <View style={styles.coverContainer}>
            <Image
              source={user.cover_image ? { uri: user.cover_image } : require('../../assets/images/cover.jpg')}
              style={styles.coverImage}
            />
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: user.avatar || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              {user.email ? <Text style={styles.userSubText}>{user.email}</Text> : null}
              {user.phone ? <Text style={styles.userSubText}>{user.phone}</Text> : null}
              {user.address ? <Text style={styles.userSubText}>{user.address}</Text> : null}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: UI_CONFIG.colors.textSecondary,
  },
  container: { 
    paddingBottom: UI_CONFIG.spacing.xl, 
    backgroundColor: '#F5F5F5' 
  },
  headerContainer: { 
    backgroundColor: UI_CONFIG.colors.background, 
    marginBottom: UI_CONFIG.spacing.sm 
  },
  coverContainer: { 
    width: '100%', 
    height: 140 
  },
  coverImage: { 
    width: '100%', 
    height: '100%' 
  },
  profileHeader: { 
    flexDirection: 'row', 
    padding: UI_CONFIG.spacing.lg, 
    paddingTop: 0, 
    alignItems: 'flex-end', 
    marginTop: -30 
  },
  avatarWrapper: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginRight: UI_CONFIG.spacing.md, 
    backgroundColor: '#fff', 
    padding: 3, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4 
  },
  avatar: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 37 
  },
  userInfo: { 
    flex: 1, 
    paddingBottom: 10 
  },
  userName: { 
    fontSize: UI_CONFIG.typography.sizes.xl, 
    fontWeight: 'bold', 
    color: UI_CONFIG.colors.text, 
    marginBottom: 4 
  },
  userSubText: { 
    fontSize: UI_CONFIG.typography.sizes.sm, 
    color: UI_CONFIG.colors.textSecondary, 
    marginTop: 4 
  }
});
