import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';

import { ProductCard } from '../../components/product/ProductCard';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { useCatalogStore } from '../../store/catalog';

import { ProductListItem, Category } from '../../types';
import { useRouter } from 'expo-router';
import { SwipeWrapper } from '../../components/navigation/SwipeWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeView() {
  const storeProducts = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);
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
      // 1. Đồng bộ Danh mục và Thương hiệu dã chiến cục bộ/máy chủ
      await ProductRepository.syncCategoriesAndBrands(isForce);
      // 2. Lấy danh sách sản phẩm thông qua Repository (Offline-First SSoT)
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

  // Lắng nghe thay đổi của Zustand store (khi sync ngầm hoàn thành) để cập nhật UI tức thời
  useEffect(() => {
    if (storeProducts && storeProducts.length > 0) {
      // Lọc nhẹ hoặc gán thẳng từ store
      setProductsList(storeProducts);
    }
  }, [storeProducts]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleSearch = (query: string) => {
    // Navigate to a search page or filter the current list.
    console.log('Searching for:', query);
    // Placeholder navigation, you can adjust the route as needed
    // router.push({ pathname: '/search', params: { q: query } });
  };

  const handleCategoryPress = (category: Category) => {
    // router.push({ pathname: '/category/[id]', params: { id: category.id } });
    console.log('Category pressed:', category.name);
  };

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  return (
    <SwipeWrapper currentTab="index">
      <SafeArea edges={['top']} style={{ flex: 1 }}>
        <CustomAppBar title="Army+" showSearch={true} onSearch={handleSearch} />
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
            colors={[UI_CONFIG.colors.primary]}
            tintColor={UI_CONFIG.colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Hero Banner */}
            <View style={styles.heroContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800' }} 
                style={styles.heroImage} 
              />
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>Army+</Text>
              </View>
            </View>

            {/* Categories Slider */}
            {categories && categories.length > 0 && (
              <View style={styles.categoriesSection}>
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
                      <View style={styles.categoryIconContainer}>
                        {cat.image_url ? (
                          <Image source={{ uri: cat.image_url }} style={styles.categoryImage} />
                        ) : (
                          <Image source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(cat.name) + '&background=random&color=fff' }} style={styles.categoryImage} />
                        )}
                      </View>
                      <Text style={styles.categoryText} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Products Grid Title */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
              {loading && <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} style={{ marginTop: 10 }} />}
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
    height: 160,
    position: 'relative',
    backgroundColor: UI_CONFIG.colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  categoriesSection: {
    backgroundColor: UI_CONFIG.colors.background,
    paddingVertical: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  categoriesScrollContent: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.md,
  },
  categoryItem: {
    width: SCREEN_WIDTH * 0.2, // ~20% of screen width per item (5 items visible)
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryText: {
    fontSize: 11,
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },

  sectionContainer: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.xl,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.md,
    color: UI_CONFIG.colors.text,
  },
  productList: {
    gap: UI_CONFIG.spacing.md,
  },
  productRow: {
    gap: UI_CONFIG.spacing.md,
  }
});
