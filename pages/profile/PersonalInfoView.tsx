import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Button } from '../../components/ui/Button';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { usersApi } from '../../lib/api/endpoints/users';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export function PersonalInfoView() {
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstname || '');
  const [lastName, setLastName] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [status, setStatus] = useState((user as any)?.status || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar || 'https://i.pravatar.cc/150');
  const [coverUri, setCoverUri] = useState((user as any)?.cover_image || 'https://via.placeholder.com/800x400');
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectImage = async (type: 'avatar' | 'cover') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      if (type === 'avatar') {
        setAvatarUri(uri);
      } else {
        setCoverUri(uri);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update user info
      const payload: any = {
        email,
        username: user?.username || '',
        address,
        firstname: firstName,
        lastname: lastName,
        status,
      };
      
      // Update avatar & cover_image if selected
      if (avatarUri && !avatarUri.includes('pravatar')) payload.avatar = avatarUri;
      if (coverUri && !coverUri.includes('placeholder')) {
        payload.cover_image = coverUri;
        payload.cover_image_web = coverUri;
      }

      await usersApi.setUserInfo(payload);

      alert('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Error saving info:', err);
      alert('Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="THÔNG TIN CÁ NHÂN" leftIcon="arrow-back" showNotification={false} />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
          <TouchableOpacity style={styles.editCoverBtn} onPress={() => handleSelectImage('cover')}>
            <Ionicons name="camera" size={16} color="#fff" />
            <Text style={styles.editCoverText}>Đổi ảnh nền</Text>
          </TouchableOpacity>
          
          {/* Avatar floating over cover */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => handleSelectImage('avatar')}>
               <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Adjust spacing since avatar overlaps */}
        <View style={{ marginTop: 60 }} />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Nhập họ"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Nhập tên"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.username || ''}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Trạng thái / Tiểu sử</Text>
          <TextInput
            style={styles.input}
            value={status}
            onChangeText={setStatus}
            placeholder="Nhập trạng thái của bạn"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Nhập địa chỉ email"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ chi tiết"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Cấp bậc</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.rank || 'Chưa cập nhật'}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Đơn vị</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.unit || 'Chưa cập nhật'}
            editable={false}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button text={isSaving ? "Đang lưu..." : "Lưu thay đổi"} onPress={handleSave} disabled={isSaving} />
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
  editCoverBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editCoverText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    transform: [{ translateX: -60 }], // half of width (100 + 10px padding * 2) = 120 -> 60
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
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: UI_CONFIG.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UI_CONFIG.colors.background,
  },
  formGroup: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  label: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    fontWeight: UI_CONFIG.typography.weights.medium,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: UI_CONFIG.borderRadius.md,
    padding: UI_CONFIG.spacing.md,
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
  },
  disabledInput: {
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    color: UI_CONFIG.colors.textSecondary,
  },
  buttonContainer: {
    marginTop: UI_CONFIG.spacing.xl,
  }
});
