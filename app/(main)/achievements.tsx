import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { db } from '../../lib/storage/sqlite';
import { useAuthStore } from '../../store/auth';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { useRouter } from 'expo-router';

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    if (!user) return;
    try {
      const data = db.getAllSync<any>(
        'SELECT * FROM Posts WHERE author_id = ? ORDER BY created_at DESC',
        [user.id]
      );
      setAchievements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.media_url }} style={styles.thumbnail} />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.title.toUpperCase()}</Text>
          <StatusBadge status={item.sync_status} showText={false} />
        </View>
        
        <View style={styles.scoreRow}>
          <Text style={styles.label}>ĐỊNH GIÁ AI:</Text>
          <Text style={styles.score}>{item.ai_score.toLocaleString('vi-VN')} XU</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            TRẠNG THÁI: {item.status.toUpperCase()}
          </Text>
          {item.status === 'pending' && (
            <TacticalButton 
              text="KHIẾU NẠI" 
              variant="outline" 
              size="sm" 
              onPress={() => router.push({
                pathname: '/(main)/appeal-form',
                params: { postId: item.id }
              })}
            />
          )}
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return UI_CONFIG.colors.success;
      case 'rejected': return UI_CONFIG.colors.danger;
      case 'appealing': return UI_CONFIG.colors.accent;
      default: return UI_CONFIG.colors.textSecondary;
    }
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="LỊCH SỬ CHIẾN TÍCH" leftIcon="arrow-back" onPressLeft={() => router.back()} />
      <FlatList
        data={achievements}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>CHƯA CÓ CHIẾN TÍCH NÀO ĐƯỢC GHI NHẬN</Text>
          </View>
        }
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  list: { padding: UI_CONFIG.spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.light,
    borderRadius: 4,
    marginBottom: UI_CONFIG.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#000',
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
    flex: 1,
    marginRight: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  label: {
    fontSize: 10,
    color: UI_CONFIG.colors.textSecondary,
    fontWeight: '700',
  },
  score: {
    fontSize: 14,
    fontWeight: '900',
    color: UI_CONFIG.colors.primary,
    marginLeft: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  }
});
