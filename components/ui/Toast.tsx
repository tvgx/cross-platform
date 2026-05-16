import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants/config';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onHide) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, fadeAnim, onHide]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return UI_CONFIG.colors.success;
      case 'error':
        return UI_CONFIG.colors.danger;
      case 'info':
      default:
        return UI_CONFIG.colors.info;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name={getIconName()} size={24} color={UI_CONFIG.colors.white} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: UI_CONFIG.spacing.lg,
    right: UI_CONFIG.spacing.lg,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.spacing.md,
    zIndex: 9999,
    shadowColor: UI_CONFIG.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    color: UI_CONFIG.colors.white,
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: UI_CONFIG.typography.weights.medium,
    flex: 1,
  },
});
