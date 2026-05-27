import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export function MyOrdersView() {
  return (
    <SafeArea edges={['top']}>
      <Header title="ĐƠN HÀNG CỦA TÔI" leftIcon="arrow-back" showNotification={false} />
      <View style={styles.container}>
        <Ionicons name="receipt-outline" size={64} color={UI_CONFIG.colors.textSecondary} />
        <Text style={styles.text}>Chưa có đơn hàng nào.</Text>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: UI_CONFIG.spacing.lg },
  text: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.textSecondary, marginTop: UI_CONFIG.spacing.md }
});
