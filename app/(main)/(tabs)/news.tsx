import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { socialApi } from '../../../lib/api/endpoints/social';
import { NewsItem } from '../../../types';
import { SwipeWrapper } from '../../../components/navigation/SwipeWrapper';

export default function NewsScreen() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNews(1, false);
  }, []);

  const fetchNews = async (pageNum: number, isRefresh: boolean) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const res = await socialApi.getNewsList({ page: pageNum, limit: 10 });
      if (res && res.success && res.data) {
        // Handle variations in API response format
        const items = (res.data as any).list_news || (res.data as any).items || (Array.isArray(res.data) ? res.data : []);
        
        if (items.length < 10) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (isRefresh) {
          setNews(items);
        } else {
          setNews(prev => [...prev, ...items]);
        }
      }
    } catch (error) {
      console.error('Lỗi tải tin tức:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchNews(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage, false);
    }
  };

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity 
      style={[styles.newsItem, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      onPress={() => router.push(`/(main)/news/${item.id}` as any)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.newsImage} />
      ) : (
        <View style={[styles.newsImagePlaceholder, { backgroundColor: currentColors.surfaceLighter }]} />
      )}
      <View style={styles.newsContent}>
        <Text style={[styles.newsTitle, { color: currentColors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[styles.newsDesc, { color: currentColors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text style={[styles.newsDate, { color: currentColors.textSecondary }]}>
          {new Date(item.created_at || Date.now()).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SwipeWrapper currentTab="news">
      <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
        <CustomAppBar title="Tin Tức" showSearch={true} showBack={false} />
        
        {isLoading && page === 1 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
          </View>
        ) : (
          <FlatList
            data={news}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoading && page > 1 ? (
                <ActivityIndicator size="small" color={currentColors.primary} style={{ marginVertical: 20 }} />
              ) : null
            }
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 50, color: currentColors.textSecondary }}>
                Chưa có tin tức nào.
              </Text>
            }
          />
        )}
      </View>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.md,
    paddingBottom: 100, // For footer
  },
  newsItem: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  newsImagePlaceholder: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: UI_CONFIG.spacing.md,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.xs,
    lineHeight: 22,
  },
  newsDesc: {
    fontSize: 14,
    marginBottom: UI_CONFIG.spacing.sm,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
  }
});
