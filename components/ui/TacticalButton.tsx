import React from 'react';
import { 
  StyleProp, 
  StyleSheet, 
  Text, 
  TextStyle, 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ViewStyle,
  Platform 
} from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './icon-symbol';

export interface TacticalButtonProps extends TouchableOpacityProps {
  variant?: 'filled' | 'outline' | 'ghost' | 'danger';
  text?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const TacticalButton = ({
  variant = 'filled',
  text,
  icon,
  size = 'md',
  fullWidth = false,
  style,
  onPress,
  ...props
}: TacticalButtonProps) => {

  const handlePress = (e: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onPress) onPress(e);
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: UI_CONFIG.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: UI_CONFIG.colors.danger,
        };
      default:
        return {
          backgroundColor: UI_CONFIG.colors.primary,
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return UI_CONFIG.colors.primary;
    if (variant === 'ghost') return UI_CONFIG.colors.textSecondary;
    return UI_CONFIG.colors.white;
  };

  const containerStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[size],
    getVariantStyles(),
    fullWidth && { width: '100%' },
    style,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.text,
    styles[`text_${size}`],
    { color: getTextColor() },
  ];

  return (
    <TouchableOpacity 
      style={containerStyles} 
      activeOpacity={0.7} 
      onPress={handlePress}
      {...props}
    >
      {icon && (
        <IconSymbol 
          name={icon as any} 
          size={size === 'sm' ? 16 : 20} 
          color={getTextColor()} 
          style={{ marginRight: text ? 8 : 0 }} 
        />
      )}
      {text && <Text style={textStyles}>{text.toUpperCase()}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4, // More squared/tactical
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  text_sm: { fontSize: 12 },
  text_md: { fontSize: 14 },
  text_lg: { fontSize: 16 },
});
