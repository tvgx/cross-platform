import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { UI_CONFIG } from '../../constants/config';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  visible?: boolean;
  overlay?: boolean;
}

export const Spinner = ({
  size = 'large',
  color = UI_CONFIG.colors.primary,
  visible = true,
  overlay = false,
}: SpinnerProps) => {

  if (!visible) return null;

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="none">
        <View style={styles.overlay}>
          <ActivityIndicator size={size} color={color} />
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
