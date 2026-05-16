import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { Button } from '../ui/Button';

export interface HeaderProps {
  leftIcon?: string;
  title?: string;
  rightIcon?: string;
  onPressLeft?: () => void;
  onPressRight?: () => void;
}

export const Header = ({
  leftIcon = 'menu',
  title = 'App Title',
  rightIcon = 'search',
  onPressLeft,
  onPressRight,
}: HeaderProps) => {
  return (
    <View style={styles.container}>
      <Button 
        variant="icon" 
        iconName={leftIcon as any} 
        onPress={onPressLeft} 
        textColor={UI_CONFIG.colors.text}
      />
      <Text style={styles.title}>{title}</Text>
      <Button 
        variant="icon" 
        iconName={rightIcon as any} 
        onPress={onPressRight} 
        textColor={UI_CONFIG.colors.text}
      />
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
    backgroundColor: UI_CONFIG.colors.dark,
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
});
