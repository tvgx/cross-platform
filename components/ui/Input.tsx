import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';

export interface InputProps extends TextInputProps {
  variant?: 'text' | 'password' | 'search';
  borderColor?: string;
  borderRadius?: number;
}

export const Input = ({
  variant = 'text',
  borderColor = UI_CONFIG.colors.border,
  borderRadius = UI_CONFIG.borderRadius.md,
  style,
  ...props
}: InputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          borderRadius,
        },
      ]}
    >
      {variant === 'search' && (
        <Ionicons name="search" size={20} color={UI_CONFIG.colors.textSecondary} style={styles.leftIcon} />
      )}
      
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={UI_CONFIG.colors.textSecondary}
        secureTextEntry={variant === 'password' && !isPasswordVisible}
        {...props}
      />

      {variant === 'password' && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.rightIcon}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={20}
            color={UI_CONFIG.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: UI_CONFIG.colors.surface,
    paddingHorizontal: UI_CONFIG.spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
  },
  leftIcon: {
    marginRight: UI_CONFIG.spacing.sm,
  },
  rightIcon: {
    marginLeft: UI_CONFIG.spacing.sm,
  },
});
