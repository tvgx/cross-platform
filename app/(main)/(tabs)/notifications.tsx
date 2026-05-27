import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { UI_CONFIG } from '../../../constants/config';

export default function NotificationsScreen() {
  return (
    <SafeArea edges={['top']}>
      <Header title="THÔNG BÁO" leftIcon="arrow-back" showNotification={false} />
      <View style={styles.container}>
        <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
  },
  emptyText: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    fontWeight: '500',
  },
});
