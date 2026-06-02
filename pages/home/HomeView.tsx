import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';

import { ProductCard } from '../../components/product/ProductCard';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { useCatalogStore } from '../../store/catalog';
import { useAppStore } from '../../store/app';

import { ProductListItem, Category } from '../../types';
import { useRouter } from 'expo-router';
import { SwipeWrapper } from '../../components/navigation/SwipeWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeView() {
  const storeProducts = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const router = useRouter();

  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async (isForce = false) => {
    if (isForce) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await ProductRepository.syncCategoriesAndBrands(isForce);
      const data = await ProductRepository.getProducts(undefined, isForce);
      setProductsList(data);
    } catch (error) {
      console.error('[HomeView] Lỗi nạp dữ liệu dã chiến:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (storeProducts && storeProducts.length > 0) {
      setProductsList(storeProducts);
    }
  }, [storeProducts]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleCategoryPress = (category: Category) => {
    console.log('Category pressed:', category.name);
  };

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  return (
    <SwipeWrapper currentTab="index">
      <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: currentColors.background }}>
        <CustomAppBar title="TiếpTế" showSearch={true} onSearch={handleSearch} />
      <FlatList
        data={productsList}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        numColumns={Platform.OS === 'web' ? 4 : 2}
        key={Platform.OS === 'web' ? 'web' : 'mobile'} // Force re-render on platform change
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        columnWrapperStyle={styles.productRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentColors.primary]}
            tintColor={currentColors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Hero Banner */}
            <View style={[styles.heroContainer, { backgroundColor: currentColors.surface }]}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800' }} 
                style={styles.heroImage} 
              />
              <View style={[styles.heroOverlay, { backgroundColor: 'rgba(218, 37, 29, 0.4)' }]}>
                <Text style={styles.heroTitle}>TiếpTế</Text>
                <Text style={styles.heroSubTitle}>Nhân dân làm chủ</Text>
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
              {loading && <ActivityIndicator size="small" color={currentColors.primary} style={{ marginTop: 10 }} />}
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
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 4
  },
  heroSubTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
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
  productRow: {
    gap: 8, // 8px gap typical of Shopee
    paddingHorizontal: 8, // 8px padding on sides
  }
});
