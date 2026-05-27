import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { UI_CONFIG } from '../constants/config';

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface CommentsProps {
  comments?: CommentItem[];
  onAddComment?: (text: string) => void;
  height?: number | string;
}

export const Comments = ({ comments = [], onAddComment, height }: CommentsProps) => {

  const renderItem = ({ item }: { item: CommentItem }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatarPlaceholder} />
      <View style={styles.commentContent}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.text}>{item.content}</Text>
        <Text style={styles.time}>{item.createdAt}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, height ? { height: height as any } : {}]}>
      {comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.xl,
  },
  emptyText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: UI_CONFIG.typography.sizes.md,
  },
  listContent: {
    padding: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
  },
  commentContent: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
  },
  userName: {
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  text: {
    color: UI_CONFIG.colors.text,
    fontSize: UI_CONFIG.typography.sizes.sm,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  time: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: UI_CONFIG.typography.sizes.xs,
  },
});
