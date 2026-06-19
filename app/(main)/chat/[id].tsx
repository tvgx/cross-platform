import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeArea } from '../../../components/layout/SafeArea';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { useAuthStore } from '../../../store/auth';
import { MessageRepository } from '../../../lib/repositories/MessageRepository';
import { messagingApi } from '../../../lib/api/endpoints/misc';
import { usersApi } from '../../../lib/api/endpoints/users';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { Message, User } from '../../../types';
import { uploadApi } from '../../../lib/api/endpoints/upload';
import { Ionicons } from '@expo/vector-icons';

export default function ChatDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const user = useAuthStore(state => state.user);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Custom header title logic here (could fetch participant info)
  const [partnerName, setPartnerName] = useState('Đang trò chuyện...');
  const [partner, setPartner] = useState<User | null>(null);

  useEffect(() => {
    if (id) {
      usersApi.getUserInfo(id).then(res => {
        if (res.success && res.data) {
          setPartner(res.data);
          const name = [res.data.lastname, res.data.firstname].filter(Boolean).join(' ').trim() || res.data.full_name || res.data.username || 'Người dùng';
          setPartnerName(name);
        }
      }).catch(err => console.log('Error fetching partner:', err));
    }
  }, [id]);

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

    setMessages(prev => [newMsg, ...prev]);
    setText('');
    Keyboard.dismiss();

    MessageRepository.sendMessage({
      id: msgId,
      conversation_id: id,
      sender_id: user.id,
      content: newMsg.content,
      created_at: Date.now()
    });
  };

  const handlePickImage = async () => {
    if (!user || !id) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        setIsUploading(true);
        // Upload file
        const uploadRes = await uploadApi.uploadFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });

        if (uploadRes && uploadRes.success && uploadRes.data?.url) {
          const imageUrl = uploadRes.data.url;
          const msgId = `local_${Date.now()}`;
          const newMsg = {
            id: msgId,
            conversation_id: id,
            sender_id: user.id,
            content: imageUrl, // có thể là URL hoặc mô tả
            type: 'image' as const,
            image_url: imageUrl,
            is_read: true,
            created_at: new Date().toISOString()
          };

          setMessages(prev => [newMsg, ...prev]);

          MessageRepository.sendMessage({
            id: msgId,
            conversation_id: id,
            sender_id: user.id,
            content: 'Hình ảnh', // Text preview
            type: 'image',
            image_url: imageUrl,
            created_at: Date.now()
          });
        }
      } catch (error) {
        console.error('Lỗi upload ảnh:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        <View style={[
          styles.bubble, 
          isMe ? { backgroundColor: currentColors.primary } : { backgroundColor: currentColors.surfaceLighter },
          item.type === 'image' && styles.bubbleImage
        ]}>
          {item.type === 'image' || (item as any).image_url ? (
            <Image source={{ uri: (item as any).image_url || item.content }} style={styles.messageImage} />
          ) : (
            <Text style={[styles.bubbleText, isMe ? { color: '#fff' } : { color: currentColors.text }]}>
              {item.content}
            </Text>
          )}
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
        {partner?.is_blocked ? (
          <View style={[styles.inputContainer, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border, justifyContent: 'center' }]}>
            <Text style={{ color: currentColors.textSecondary, textAlign: 'center', paddingVertical: 12 }}>Bạn không thể gửi tin nhắn cho người này</Text>
          </View>
        ) : (
          <View style={[styles.inputContainer, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} disabled={isUploading}>
              {isUploading ? <ActivityIndicator size="small" color={currentColors.primary} /> : <Ionicons name="image-outline" size={24} color={currentColors.textSecondary} />}
            </TouchableOpacity>
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
        )}
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
  bubbleImage: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
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
  attachButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginRight: 4,
    marginBottom: 4,
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
