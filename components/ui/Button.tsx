import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { UI_CONFIG } from '../../constants/config';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'icon';
  text?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number | 'round' | 'square';
}

export const Button = ({
  variant = 'primary',
  text,
  iconName,
  width,
  height,
  backgroundColor,
  textColor,
  borderRadius,
  style,
  ...props
}: ButtonProps) => {

  const getBorderRadius = () => {
    if (borderRadius === 'round') return UI_CONFIG.borderRadius.round;
    if (borderRadius === 'square') return 0;
    if (typeof borderRadius === 'number') return borderRadius;
    return UI_CONFIG.borderRadius.md;
  };

  const getBgColor = () => {
    if (backgroundColor) return backgroundColor;
    if (variant === 'secondary') return UI_CONFIG.colors.secondary;
    if (variant === 'icon') return 'transparent';
    return UI_CONFIG.colors.primary;
  };

  const getTextColor = () => {
    if (textColor) return textColor;
    if (variant === 'icon') return UI_CONFIG.colors.primary;
    return UI_CONFIG.colors.white;
  };

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      width: width as any,
      height: height as any,
      backgroundColor: getBgColor(),
      borderRadius: getBorderRadius(),
      paddingHorizontal: variant === 'icon' ? 0 : UI_CONFIG.spacing.md,
      paddingVertical: variant === 'icon' ? 0 : UI_CONFIG.spacing.sm,
    },
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.text,
    { color: getTextColor() },
  ];

  return (
    <TouchableOpacity style={buttonStyle} activeOpacity={0.8} {...props}>
      {variant === 'icon' && iconName ? (
        <Ionicons name={iconName} size={24} color={getTextColor()} />
      ) : (
        <Text style={textStyle}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.medium,
  },
});
