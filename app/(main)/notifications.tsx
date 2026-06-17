import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { useAppStore } from '../../store/app';
import { useNotificationsStore } from '../../store/notifications';
import { NotificationRepository } from '../../lib/repositories/NotificationRepository';
import { ROUTES } from '../../lib/navigation/routes';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { AppNotification } from '../../types';

export default function NotificationsPage() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const router = useRouter();

  const notifications = useNotificationsStore(state => state.notifications);
  const setNotifications = useNotificationsStore(state => state.setNotifications);
  const markReadStore = useNotificationsStore(state => state.markRead);

  const loadNotifications = useCallback(() => {
    const storedNotifs = NotificationRepository.getNotifications(50);
    setNotifications(storedNotifs);
  }, [setNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handlePress = (item: AppNotification) => {
    // Đánh dấu đã đọc trong SQLite và Zustand
    NotificationRepository.markAsRead(item.id);
    markReadStore(item.id);

    // Điều hướng dựa trên type
    if (item.type === 'message' && item.data?.conversation_id) {
      router.push(ROUTES.CHAT_DETAIL(String(item.data.conversation_id)) as any);
    } else if (item.type === 'order') {
      router.push(ROUTES.ORDERS as any);
    }
  };

  const handleMarkAllAsRead = () => {
    NotificationRepository.markAllAsRead();
    markReadStore('all');
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { 
            backgroundColor: isUnread ? currentColors.surfaceLighter : currentColors.surface,
            borderBottomColor: currentColors.border 
          }
        ]}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: currentColors.primary + '20' }]}>
          <IconSymbol 
            name={item.type === 'message' ? "message.fill" : "shippingbox.fill"} 
            size={24} 
            color={currentColors.primary} 
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: currentColors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.body, { color: currentColors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
          <Text style={[styles.time, { color: currentColors.textLight }]}>
            {new Date(item.created_at).toLocaleString('vi-VN', {
               hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
            })}
          </Text>
        </View>
        {isUnread && <View style={[styles.unreadDot, { backgroundColor: currentColors.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: currentColors.background }}>
      <CustomAppBar title="Thông báo" showBack />
      
      {notifications.length > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Text style={[styles.markAllText, { color: currentColors.primary }]}>Đánh dấu tất cả đã đọc</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <IconSymbol name="bell.slash" size={48} color={currentColors.textLight} />
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>Không có thông báo nào.</Text>
          </View>
        )}
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  markAllButton: {
    padding: UI_CONFIG.spacing.md,
    alignItems: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: UI_CONFIG.spacing.sm,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  }
});
