import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { UI_CONFIG } from '../../constants/config';

export interface SafeAreaProps {
  children: React.ReactNode;
  edges?: Edge[];
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const SafeArea = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor = UI_CONFIG.colors.background,
  style,
}: SafeAreaProps) => {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor }, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
