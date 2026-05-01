import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    { key: 'index', label: 'Feed', iconName: 'home' },
    { key: 'upload', label: 'Upload', iconName: 'add-circle' },
    { key: 'cart', label: 'Cart', iconName: 'cart' },
    { key: 'profile', label: 'Profile', iconName: 'person' },
  ],
  activeTab = 'index',
  onTabChange,
}: FooterProps) => {
  return (
    <View style={styles.container}>
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
    height: 60,
    backgroundColor: UI_CONFIG.colors.white,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.colors.border,
    paddingBottom: UI_CONFIG.spacing.xs, // for non-safearea devices as fallback
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
