import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';
import { db } from '../../lib/storage/sqlite';

export default function OfficerDashboard() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadPendingPosts();
  }, []);

  const loadPendingPosts = () => {
    try {
      const result = db.getAllSync<any>('SELECT * FROM Posts WHERE status = "pending" ORDER BY created_at DESC');
      setPosts(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = (postId: string, authorId: string, amount: number) => {
    try {
      // Update post status
      db.runSync('UPDATE Posts SET status = "approved" WHERE id = ?', [postId]);
      
      // Add balance to user
      const author = db.getFirstSync<any>('SELECT virtual_balance FROM Users WHERE id = ?', [authorId]);
      if (author) {
        db.runSync('UPDATE Users SET virtual_balance = ? WHERE id = ?', [author.virtual_balance + amount, authorId]);
      }
      
      Alert.alert('Thành công', 'Đã duyệt chiến tích và cộng tiền cho chiến sĩ.');
      loadPendingPosts();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể duyệt chiến tích');
    }
  };

  const handleReject = (postId: string) => {
    try {
      db.runSync('UPDATE Posts SET status = "rejected" WHERE id = ?', [postId]);
      Alert.alert('Thành công', 'Đã từ chối chiến tích.');
      loadPendingPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeArea>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Officer Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, Sĩ quan {user?.full_name || user?.username}</Text>
          </View>
          <Button text="Đăng xuất" onPress={handleLogout} style={styles.logoutBtn} />
        </View>

        <Text style={styles.sectionTitle}>Chiến tích chờ duyệt ({posts.length})</Text>

        {posts.length === 0 ? (
          <Text style={styles.emptyText}>Không có chiến tích nào cần duyệt.</Text>
        ) : (
          posts.map(post => (
            <View key={post.id} style={styles.card}>
              <View style={styles.mediaContainer}>
                {post.media_url ? (
                  <Image source={{ uri: post.media_url }} style={styles.media} />
                ) : (
                  <View style={styles.mediaPlaceholder}><Text>No Media</Text></View>
                )}
              </View>
              
              <View style={styles.info}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postDesc}>{post.description}</Text>
                <Text style={styles.aiScore}>Điểm AI đề xuất: {post.ai_score.toLocaleString('vi-VN')} ₫</Text>
                
                <View style={styles.actions}>
                  <Button text="Từ chối" onPress={() => handleReject(post.id)} style={styles.btn} backgroundColor={UI_CONFIG.colors.danger} />
                  <Button text="Duyệt mức AI" onPress={() => handleApprove(post.id, post.author_id, post.ai_score)} style={styles.btn} />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.lg,
    backgroundColor: UI_CONFIG.colors.background,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONFIG.spacing.xl,
  },
  logoutBtn: { paddingHorizontal: 15, height: 40 },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: UI_CONFIG.typography.weights.bold,
  },
  subtitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.md,
  },
  emptyText: { color: UI_CONFIG.colors.textSecondary, fontStyle: 'italic' },
  card: {
    backgroundColor: UI_CONFIG.colors.white,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    marginBottom: UI_CONFIG.spacing.lg,
    overflow: 'hidden'
  },
  mediaContainer: { height: 200, width: '100%', backgroundColor: '#000' },
  media: { width: '100%', height: '100%', resizeMode: 'contain' },
  mediaPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e1e1' },
  info: { padding: UI_CONFIG.spacing.md },
  postTitle: { fontSize: UI_CONFIG.typography.sizes.lg, fontWeight: 'bold' },
  postDesc: { color: UI_CONFIG.colors.textSecondary, marginVertical: 5 },
  aiScore: { color: UI_CONFIG.colors.primary, fontWeight: 'bold', marginBottom: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1 }
});
