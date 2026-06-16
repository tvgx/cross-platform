import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';

import { ProductCard } from '../../components/product/ProductCard';
import { useAppStore } from '../../store/app';
import { useProductStore } from '../../store/product';
import { useNetworkStore } from '../../store/network';

import { useRouter } from 'expo-router';
import { SwipeWrapper } from '../../components/navigation/SwipeWrapper';
import { Category, ProductListItem } from '../../types';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeView() {
  const categories = useProductStore(state => state.categories);
  const displayedProducts = useProductStore(state => state.displayedProducts);
  const isLoadingInitial = useProductStore(state => state.isLoadingInitial);
  const isFetchingMore = useProductStore(state => state.isFetchingMore);
  const hasMore = useProductStore(state => state.hasMore);

  const fetchInitialData = useProductStore(state => state.fetchInitialData);
  const loadNextPage = useProductStore(state => state.loadNextPage);
  const addInterest = useProductStore(state => state.addInterest);

  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const router = useRouter();

  const isOnline = useNetworkStore(state => state.isOnline);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isOnline && displayedProducts.length === 0) {
      fetchInitialData();
    }
  }, [isOnline]);

  const handleRefresh = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // TODO: implement search navigation
  };

  const handleCategoryPress = (category: Category) => {
    // Lưu lịch sử quan tâm
    addInterest(Number(category.id));
    console.log('Category pressed:', category.name);
    // TODO: Navigate to category products screen
  };

  const renderProduct = useCallback(({ item }: { item: ProductListItem }) => (
    <View style={{ flex: 1, padding: 4 }}>
      <ProductCard item={item} />
    </View>
  ), []);

  const handleLoadMore = () => {
    if (!isLoadingInitial && !isFetchingMore && hasMore) {
      loadNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={currentColors.primary} />
        <Text style={[styles.footerText, { color: currentColors.textLight }]}>Đang tải thêm...</Text>
      </View>
    );
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const diffClamp = Animated.diffClamp(scrollY, 0, Platform.OS === 'web' ? 60 : 56);
  const translateY = diffClamp.interpolate({
    inputRange: [0, Platform.OS === 'web' ? 60 : 56],
    outputRange: [0, -(Platform.OS === 'web' ? 60 : 56)],
  });

  return (
    <SwipeWrapper currentTab="index">
      <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: currentColors.background }}>
        <Animated.View style={{ transform: [{ translateY }], position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <CustomAppBar title="TiếpTế" showSearch={true} onSearch={handleSearch} />
        </Animated.View>
        <AnimatedFlashList
          data={displayedProducts}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderProduct as any}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.container, { paddingHorizontal: 4, paddingTop: Platform.OS === 'web' ? 60 : 56 }]}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingInitial}
              onRefresh={handleRefresh}
              colors={[currentColors.primary]}
              tintColor={currentColors.primary}
              progressViewOffset={Platform.OS === 'web' ? 60 : 56}
            />
          }
          ListHeaderComponent={
            <>
              {/* Hero Banner */}
              <View style={[styles.heroContainer, { backgroundColor: currentColors.surface }]}>
                <Image
                  source={require('../../assets/images/cover.jpg')}
                  style={styles.heroImage}
                />
                <View style={[styles.heroOverlay, { backgroundColor: 'rgba(218, 37, 29, 0.4)' }]}>
                  <Text style={styles.heroTitle}>TiếpTế</Text>
                  <Text style={styles.heroSubTitle}>Nhanh chóng - Đơn giản - Tiện lợi</Text>
                </View>
              </View>

              {/* Categories Slider */}
              {categories && categories.length > 0 && (
                <View style={[styles.categoriesSection, { backgroundColor: currentColors.surface }]}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScrollContent}
                  >
                    {categories.map((cat, index) => (
                      <TouchableOpacity
                        key={cat.id || index.toString()}
                        style={styles.categoryItem}
                        onPress={() => handleCategoryPress(cat)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.categoryIconContainer, { backgroundColor: currentColors.surfaceLighter, borderColor: currentColors.border }]}>
                          {cat.image_url ? (
                            <Image source={{ uri: cat.image_url }} style={styles.categoryImage} />
                          ) : (
                            <Image source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(cat.name) + '&background=random&color=fff' }} style={styles.categoryImage} />
                          )}
                        </View>
                        <Text style={[styles.categoryText, { color: currentColors.text }]} numberOfLines={2}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Products Grid Title */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: currentColors.primary }]}>SẢN PHẨM NỔI BẬT</Text>
                {isLoadingInitial && displayedProducts.length === 0 && (
                  <ActivityIndicator size="small" color={currentColors.primary} style={{ marginTop: 20 }} />
                )}
              </View>
            </>
          }
        />
      </SafeArea>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  heroContainer: {
    width: '100%',
    height: 140, // Slightly shorter for a tighter feel
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFDE00', // Gold color for Communism theme
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4
  },
  heroSubTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4
  },
  categoriesSection: {
    paddingVertical: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  categoriesScrollContent: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.sm, // Tighter gap
  },
  categoryItem: {
    width: SCREEN_WIDTH * 0.2, // ~20% of screen width per item (5 items visible)
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  sectionContainer: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm, // Tighter
    marginTop: UI_CONFIG.spacing.md,
    alignItems: 'center', // Center title for a more classic feel
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.xs,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  }
});
