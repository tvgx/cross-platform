import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { useAppStore } from '../../store/app';
import { IconSymbol } from '../ui/icon-symbol';
import { ROUTES } from '../../lib/navigation/routes';

interface CustomAppBarProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function CustomAppBar({ title = "TiếpTế", showBack = false, showSearch = false, onSearch }: CustomAppBarProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
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
    <View style={[styles.container, { backgroundColor: currentColors.primary, borderBottomColor: currentColors.primary }]}>
      <TouchableOpacity onPress={handleLeftPress} style={styles.iconButton}>
        <IconSymbol name={showBack ? "chevron.left" : "line.3.horizontal"} size={24} color={currentColors.white} />
      </TouchableOpacity>

      {showSearch ? (
        <TouchableOpacity 
          style={[styles.searchContainer, { backgroundColor: currentColors.surface }]}
          onPress={() => router.push(ROUTES.SEARCH)}
        >
          <Text style={[styles.searchInput, { color: currentColors.textSecondary, paddingTop: Platform.OS === 'web' ? 8 : 6 }]}>
            Tìm kiếm sản phẩm...
          </Text>
          <View style={styles.searchIconButton}>
            <IconSymbol name="magnifyingglass" size={20} color={currentColors.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.title, { color: currentColors.white }]} numberOfLines={1}>{title}</Text>
      )}

      <View style={styles.rightContainer}>
        {user && (
          <>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push(ROUTES.CHAT)}>
              <IconSymbol name="message" size={24} color={currentColors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push(ROUTES.NOTIFICATIONS)}>
              <IconSymbol name="bell" size={24} color={currentColors.white} />
            </TouchableOpacity>
          </>
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
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: UI_CONFIG.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
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
    borderRadius: UI_CONFIG.borderRadius.sm, // Sharper border radius
    marginHorizontal: UI_CONFIG.spacing.md,
    paddingHorizontal: UI_CONFIG.spacing.sm,
    height: 36,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: UI_CONFIG.typography.sizes.md,
    padding: 0, // override default padding
  },
  searchIconButton: {
    padding: UI_CONFIG.spacing.xs,
  }
});
