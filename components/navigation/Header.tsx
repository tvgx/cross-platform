import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/app';

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
  rightIcon,
  showNotification = true,
  onPressLeft,
  onPressRight,
  onPressNotification,
}: HeaderProps) => {
  const router = require('expo-router').useRouter();
  const navigation = require('expo-router').useNavigation();
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  
  const handlePressLeft = onPressLeft || (() => {
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
    <View style={[styles.container, { backgroundColor: currentColors.primary, borderBottomColor: currentColors.primary }]}>
      <Button 
        variant="icon" 
        iconName={leftIcon as any} 
        onPress={handlePressLeft} 
        textColor={currentColors.white}
      />
      <Text style={[styles.title, { color: currentColors.white }]}>{title}</Text>
      <View style={styles.rightContainer}>
        {rightIcon && (
          <Button 
            variant="icon" 
            iconName={rightIcon as any} 
            onPress={onPressRight} 
            textColor={currentColors.white}
          />
        )}
        {showNotification && (
          <>
            <Button 
              variant="icon" 
              iconName="chatbubbles" 
              onPress={() => router.push('/chat' as any)} 
              textColor={currentColors.white}
            />
            <Button 
              variant="icon" 
              iconName="notifications" 
              onPress={handlePressNotification} 
              textColor={currentColors.white}
            />
          </>
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});
