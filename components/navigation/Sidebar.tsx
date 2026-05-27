import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalogStore } from '../../store/catalog';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';

export interface MenuItem {
  key: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export interface SidebarProps {
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  menuItems?: MenuItem[];
  onMenuSelect?: (key: string) => void;
  activeItem?: string;
}

export const Sidebar = ({
  userInfo = { name: 'Guest User', email: 'guest@example.com' },
  onMenuSelect,
  activeItem = 'home',
}: SidebarProps) => {
  const insets = useSafeAreaInsets();
  const categories = useCatalogStore(state => state.categories);

  const topPadding = Math.max(insets.top, 60);
  const bottomPadding = Math.max(insets.bottom, UI_CONFIG.spacing.md);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{userInfo.name}</Text>
        <Text style={styles.userEmail}>{userInfo.email}</Text>
      </View>

      <ScrollView style={styles.menuContainer} contentContainerStyle={{ paddingBottom: bottomPadding }}>
        {/* Core Items */}
        <TouchableOpacity
          style={[styles.menuItem, activeItem === 'home' && styles.activeMenuItem]}
          onPress={() => onMenuSelect?.('home')}
        >
          <Ionicons name="home-outline" size={24} color={activeItem === 'home' ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text} />
          <Text style={[styles.menuLabel, { color: activeItem === 'home' ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text }]}>Trang chủ</Text>
        </TouchableOpacity>


        <Text style={styles.sectionHeader}>Danh mục</Text>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const itemKey = `cat_${cat.id}`;
          const isActive = activeItem === itemKey;
          return (
            <TouchableOpacity
              key={itemKey}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => onMenuSelect?.(itemKey)}
            >
              <Ionicons
                name={(cat.icon as any) || 'folder-outline'}
                size={24}
                color={isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text}
              />
              <Text style={[styles.menuLabel, { color: isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  header: {
    padding: UI_CONFIG.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
    paddingTop: 60, // overwritten via inline style based on safe area
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: UI_CONFIG.colors.primary,
    marginBottom: UI_CONFIG.spacing.md,
  },
  userName: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.text,
  },
  userEmail: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
  },
  menuContainer: {
    paddingVertical: UI_CONFIG.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
    paddingHorizontal: UI_CONFIG.spacing.lg,
    gap: UI_CONFIG.spacing.md,
  },
  activeMenuItem: {
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
  },
  menuLabel: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: UI_CONFIG.colors.border,
    marginVertical: UI_CONFIG.spacing.sm,
  },
  sectionHeader: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: UI_CONFIG.spacing.lg,
    paddingVertical: UI_CONFIG.spacing.sm,
  }
});
