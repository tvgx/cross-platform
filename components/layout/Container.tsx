import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { UI_CONFIG } from '../../constants/config';

export interface ContainerProps {
  children: React.ReactNode;
  padding?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const Container = ({
  children,
  padding = UI_CONFIG.spacing.md,
  backgroundColor = UI_CONFIG.colors.background,
  style,
}: ContainerProps) => {
  return (
    <View style={[styles.container, { padding, backgroundColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
