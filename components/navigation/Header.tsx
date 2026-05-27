import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { Button } from '../ui/Button';

export interface HeaderProps {
  leftIcon?: string;
  title?: string;
  rightIcon?: string;
  showNotification?: boolean;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  onPressNotification?: () => void;
}

export const Header = ({
  leftIcon = 'menu',
  title = 'App Title',
  rightIcon = 'search',
  showNotification = true,
  onPressLeft,
  onPressRight,
  onPressNotification,
}: HeaderProps) => {
  const router = require('expo-router').useRouter();
  const navigation = require('expo-router').useNavigation();
  
  const handlePressLeft = onPressLeft || (() => {
    // Nếu leftIcon là menu, mở drawer
    if (leftIcon === 'menu') {
      if ((navigation as any).toggleDrawer) {
        (navigation as any).toggleDrawer();
      } else if ((navigation as any).getParent()?.toggleDrawer) {
        (navigation as any).getParent().toggleDrawer();
      } else {
        router.push('/(main)/(drawer)' as any);
      }
    } else {
      router.back();
    }
  });

  const handlePressNotification = onPressNotification || (() => {
    const { ROUTES } = require('../../lib/navigation/routes');
    router.push(ROUTES.NOTIFICATIONS);
  });
  return (
    <View style={styles.container}>
      <Button 
        variant="icon" 
        iconName={leftIcon as any} 
        onPress={handlePressLeft} 
        textColor={UI_CONFIG.colors.text}
      />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightContainer}>
        {rightIcon && (
          <Button 
            variant="icon" 
            iconName={rightIcon as any} 
            onPress={onPressRight} 
            textColor={UI_CONFIG.colors.text}
          />
        )}
        {showNotification && (
          <Button 
            variant="icon" 
            iconName="notifications" 
            onPress={handlePressNotification} 
            textColor={UI_CONFIG.colors.text}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.spacing.md,
    height: 64,
    backgroundColor: UI_CONFIG.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});
