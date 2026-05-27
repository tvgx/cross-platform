import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { IconSymbol } from '../ui/icon-symbol';

interface CustomAppBarProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function CustomAppBar({ title, showBack = false, showSearch = false, onSearch }: CustomAppBarProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLeftPress = () => {
    if (showBack) {
      router.back();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  const handleSearchSubmit = () => {
    if (onSearch && searchQuery.trim() !== '') {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLeftPress} style={styles.iconButton}>
        <IconSymbol name={showBack ? "chevron.left" : "line.3.horizontal"} size={24} color={UI_CONFIG.colors.text} />
      </TouchableOpacity>

      {showSearch ? (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor={UI_CONFIG.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchIconButton} onPress={handleSearchSubmit}>
            <IconSymbol name="magnifyingglass" size={20} color={UI_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      )}

      <View style={styles.rightContainer}>
        {user && (
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="bell" size={24} color={UI_CONFIG.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'web' ? 60 : 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  iconButton: {
    padding: UI_CONFIG.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.text,
  },
  rightContainer: {
    flexDirection: 'row',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: 8,
    marginHorizontal: UI_CONFIG.spacing.md,
    paddingHorizontal: UI_CONFIG.spacing.sm,
    height: 36,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: UI_CONFIG.colors.text,
    fontSize: UI_CONFIG.typography.sizes.md,
    padding: 0, // override default padding
  },
  searchIconButton: {
    padding: UI_CONFIG.spacing.xs,
  }
});
