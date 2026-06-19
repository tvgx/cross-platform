import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';

export interface TabItem {
  key: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export interface FooterProps {
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export const Footer = ({
  tabs = [
    { key: 'index', label: 'Trang chủ', iconName: 'home' },
    { key: 'news', label: 'Tin tức', iconName: 'newspaper' },
    { key: 'orders', label: 'Đơn hàng', iconName: 'receipt' },
    { key: 'wallet', label: 'Ví', iconName: 'wallet' },
    { key: 'profile', label: 'Hồ sơ', iconName: 'person' },
  ],
  activeTab = 'index',
  onTabChange,
}: FooterProps) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, UI_CONFIG.spacing.xs);
  const containerHeight = 60 + paddingBottom - UI_CONFIG.spacing.xs;

  return (
    <View style={[styles.container, { paddingBottom, height: containerHeight }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabChange?.(tab.key)}
          >
            <Ionicons
              name={tab.iconName}
              size={24}
              color={isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? UI_CONFIG.colors.primary : UI_CONFIG.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    marginTop: UI_CONFIG.spacing.xs,
  },
});
