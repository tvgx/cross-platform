import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeArea } from '../components/layout/SafeArea';
import { Header } from '../components/navigation/Header';
import { UI_CONFIG } from '../constants/config';
import { useRouter } from 'expo-router';
import { messagingApi } from '../lib/api/endpoints/misc';
import type { Conversation } from '../types';

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await messagingApi.getConversationList();
      if (res.success && res.data) {
        setConversations(res.data.items || []);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách cuộc trò chuyện:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationItem} activeOpacity={0.7}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{item.participants[0]?.username?.charAt(0) || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.participants[0]?.username || 'Người dùng'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message?.content || 'Chưa có tin nhắn'}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header 
        leftIcon="arrow-back" 
        onPressLeft={() => router.back()} 
        title="Tin nhắn"
        showNotification={false}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào.</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 16,
  },
  list: {
    padding: UI_CONFIG.spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: UI_CONFIG.borderRadius.md,
    marginBottom: UI_CONFIG.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI_CONFIG.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.spacing.md,
  },
  avatarText: {
    color: UI_CONFIG.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: UI_CONFIG.colors.textSecondary,
  },
  badge: {
    backgroundColor: UI_CONFIG.colors.danger,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: UI_CONFIG.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
