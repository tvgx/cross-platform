import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  menuItems = [
    { key: 'home', label: 'Home', iconName: 'home-outline' },
    { key: 'orders', label: 'My Orders', iconName: 'receipt-outline' },
    { key: 'settings', label: 'Settings', iconName: 'settings-outline' },
  ],
  onMenuSelect,
  activeItem = 'home',
}: SidebarProps) => {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{userInfo.name}</Text>
        <Text style={styles.userEmail}>{userInfo.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = activeItem === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => onMenuSelect?.(item.key)}
            >
              <Ionicons
                name={item.iconName}
                size={24}
                color={isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text}
              />
              <Text
                style={[
                  styles.menuLabel,
                  { color: isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.white,
  },
  header: {
    padding: UI_CONFIG.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
    paddingTop: 60, // approximate top padding for drawer
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
    backgroundColor: UI_CONFIG.colors.light,
  },
  menuLabel: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.medium,
  },
});
