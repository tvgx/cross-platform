import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { socialApi } from '../../../lib/api/endpoints/social';
import { NewsItem } from '../../../types';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNewsDetail(String(id));
    }
  }, [id]);

  const fetchNewsDetail = async (newsId: string) => {
    try {
      setIsLoading(true);
      const res = await socialApi.getNews(newsId);
      if (res && res.success && res.data) {
        setNews(res.data);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết tin tức:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
      <CustomAppBar title="Chi tiết tin tức" showBack={true} />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      ) : news ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {news.image_url ? (
            <Image 
              source={{ uri: news.image_url }} 
              style={[styles.coverImage, { width, height: width * 0.6 }]} 
            />
          ) : null}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: currentColors.text }]}>{news.title}</Text>
            <Text style={[styles.date, { color: currentColors.textSecondary }]}>
              {new Date(news.created_at || Date.now()).toLocaleDateString('vi-VN')}
            </Text>
            
            {news.description ? (
              <Text style={[styles.description, { color: currentColors.text }]}>
                {news.description}
              </Text>
            ) : null}
            
            {/* Nếu API trả về content dạng HTML, bạn có thể dùng react-native-render-html ở đây.
                Tạm thời hiển thị text thuần nếu content là text. */}
            {news.content ? (
              <Text style={[styles.bodyContent, { color: currentColors.text }]}>
                {news.content}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={{ color: currentColors.textSecondary }}>Không tìm thấy bài viết.</Text>
        </View>
      )}
    </View>
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
  scrollContent: {
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  coverImage: {
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: UI_CONFIG.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.sm,
    lineHeight: 30,
  },
  date: {
    fontSize: 12,
    marginBottom: UI_CONFIG.spacing.md,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: UI_CONFIG.spacing.md,
    lineHeight: 24,
  },
  bodyContent: {
    fontSize: 16,
    lineHeight: 24,
  }
});
