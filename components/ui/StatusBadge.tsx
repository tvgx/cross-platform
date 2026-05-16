import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { IconSymbol } from './icon-symbol';

export interface StatusBadgeProps {
  status: 'pending_sync' | 'synced' | 'error';
  showText?: boolean;
}

export const StatusBadge = ({ status, showText = true }: StatusBadgeProps) => {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (status === 'pending_sync') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending_sync':
        return {
          color: UI_CONFIG.colors.accent,
          icon: 'clock.fill',
          text: 'Chờ đồng bộ',
        };
      case 'synced':
        return {
          color: UI_CONFIG.colors.success,
          icon: 'checkmark.circle.fill',
          text: 'Đã đồng bộ',
        };
      case 'error':
        return {
          color: UI_CONFIG.colors.danger,
          icon: 'exclamationmark.triangle.fill',
          text: 'Lỗi',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { borderColor: config.color, opacity: pulseAnim }
      ]}
    >
      <IconSymbol name={config.icon as any} size={12} color={config.color} />
      {showText && <Text style={[styles.text, { color: config.color }]}>{config.text.toUpperCase()}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
  },
});
