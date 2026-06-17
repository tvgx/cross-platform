import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeArea } from '../../../components/layout/SafeArea';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { useAuthStore } from '../../../store/auth';
import { MessageRepository } from '../../../lib/repositories/MessageRepository';
import { messagingApi } from '../../../lib/api/endpoints/misc';
import { ROUTES } from '../../../lib/navigation/routes';
import { Conversation } from '../../../types';

export default function ChattingPage() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    // Load local first
    const localConvos = MessageRepository.getConversations(user.id);
    setConversations(localConvos as any);

    // Sync from server
    try {
      setRefreshing(true);
      const res = await messagingApi.getConversationList({ page: 0, limit: 50 });
      if (res && res.success && res.data?.items) {
        MessageRepository.saveConversations(user.id, res.data.items);
        // Reload local
        const updatedLocal = MessageRepository.getConversations(user.id);
        setConversations(updatedLocal as any);
      }
    } catch (e) {
      console.log('Error fetching conversations:', e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    // Find the other participant
    const otherParticipant = item.participants?.find(p => p.id !== user?.id) || item.participants?.[0];
    const name = otherParticipant?.full_name || (otherParticipant?.firstname && otherParticipant?.lastname ? `${otherParticipant.firstname} ${otherParticipant.lastname}` : otherParticipant?.username) || 'Người dùng';
    const avatar = otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    const lastMsg = item.last_message;

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, { backgroundColor: currentColors.surface, borderBottomColor: currentColors.border }]}
        onPress={() => router.push(ROUTES.CHAT_DETAIL(item.id))}
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.infoContainer}>
          <Text style={[styles.nameText, { color: currentColors.text }]} numberOfLines={1}>{name}</Text>
          {lastMsg && (
            <Text 
              style={[
                styles.lastMsgText, 
                { color: lastMsg.sender_id === user?.id ? currentColors.textSecondary : currentColors.text }
              ]} 
              numberOfLines={1}
            >
              {lastMsg.sender_id === user?.id ? 'Bạn: ' : ''}{lastMsg.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: currentColors.background }}>
      <CustomAppBar title="Tin nhắn" showBack />
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={loadConversations}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ color: currentColors.textSecondary }}>Chưa có tin nhắn nào.</Text>
          </View>
        )}
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: UI_CONFIG.spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    height: 72, // Kích thước cố định theo yêu cầu
    paddingHorizontal: UI_CONFIG.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: UI_CONFIG.spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMsgText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  }
});
