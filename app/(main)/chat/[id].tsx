import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeArea } from '../../../components/layout/SafeArea';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { useAuthStore } from '../../../store/auth';
import { MessageRepository } from '../../../lib/repositories/MessageRepository';
import { messagingApi } from '../../../lib/api/endpoints/misc';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { Message } from '../../../types';

export default function ChatDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const user = useAuthStore(state => state.user);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Custom header title logic here (could fetch participant info)
  const [partnerName, setPartnerName] = useState('Đang trò chuyện...');

  const loadMessages = useCallback(async () => {
    if (!id || !user) return;
    
    // Load from local DB
    const localMsgs = MessageRepository.getMessages(id);
    // Sort descending for inverted FlatList
    localMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setMessages(localMsgs);

    try {
      const res = await messagingApi.getConversationDetail(id, { page: 0, limit: 50 });
      if (res && res.success && res.data?.items) {
        // Save to local
        for (const msg of res.data.items) {
          MessageRepository.saveMessageFromServer(msg);
        }
        // Reload local
        const updatedMsgs = MessageRepository.getMessages(id);
        updatedMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMessages(updatedMsgs);
      }
    } catch (e) {
      console.log('Error fetching messages:', e);
    }
  }, [id, user]);

  useEffect(() => {
    loadMessages();
    // A simple poller for the active chat
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = () => {
    if (!text.trim() || !user || !id) return;
    
    const msgId = `local_${Date.now()}`;
    const newMsg = {
      id: msgId,
      conversation_id: id,
      sender_id: user.id,
      content: text.trim(),
      type: 'text' as const,
      is_read: true,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [newMsg, ...prev]);
    setText('');
    Keyboard.dismiss();

    // Save to SQLite & Queue (MessageRepository handles this)
    MessageRepository.sendMessage({
      id: msgId,
      conversation_id: id,
      sender_id: user.id,
      content: newMsg.content,
      created_at: Date.now()
    });
    
    // Attempt immediate send if online
    // Actually, backgroundSync or SyncQueue processor will handle it,
    // but we could also call api here directly for better UX.
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        <View style={[
          styles.bubble, 
          isMe ? { backgroundColor: currentColors.primary } : { backgroundColor: currentColors.surfaceLighter }
        ]}>
          <Text style={[styles.bubbleText, isMe ? { color: '#fff' } : { color: currentColors.text }]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: currentColors.textLight }]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeArea edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: currentColors.background }}>
      <CustomAppBar title={partnerName} showBack />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContainer}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
          <TextInput
            style={[styles.input, { color: currentColors.text, backgroundColor: currentColors.background }]}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={currentColors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: currentColors.primary }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: UI_CONFIG.spacing.sm,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  bubbleText: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: UI_CONFIG.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  }
});
