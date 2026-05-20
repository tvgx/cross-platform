import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Dimensions, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { MOCK_CATEGORIES } from '../../lib/mockDB';
import { ProductListItem } from '../../types';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useRouter, Href } from 'expo-router';
import { TacticalImage } from '../../components/ui/TacticalImage';
import { formatCurrency } from '../../lib/utils/format';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { useCatalogStore } from '../../store/catalog';

export function HomeView() {
  const router = useRouter();
  const storeProducts = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);

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

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push(`/(main)/detail?id=${item.id}` as Href)}
    >
      <TacticalImage uri={item.images[0]} categoryId={item.category_id} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.soldCount}>Đã bán {item.sold_count}</Text>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <CustomAppBar title="Army+ E-commerce" />
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
                <Text style={styles.heroTitle}>Giảm Giá Mùa Hè</Text>
                <Text style={styles.heroSubtitle}>Lên đến 50% cho Quân tư trang</Text>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {(categories && categories.length > 0 ? categories : MOCK_CATEGORIES).map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                    <View style={styles.categoryIconContainer}>
                      <IconSymbol name={(cat.icon || "folder") as any} size={24} color={UI_CONFIG.colors.primary} />
                    </View>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Products Grid Title */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
              {loading && <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} style={{ marginTop: 10 }} />}
            </View>
          </>
        }
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  heroContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    marginBottom: UI_CONFIG.spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: UI_CONFIG.spacing.lg,
  },
  heroTitle: {
    color: '#fff',
    fontSize: UI_CONFIG.typography.sizes.xxl,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: UI_CONFIG.typography.sizes.md,
    marginTop: UI_CONFIG.spacing.xs,
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
  categoryScroll: {
    gap: UI_CONFIG.spacing.lg,
    paddingRight: UI_CONFIG.spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: UI_CONFIG.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.xs,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  categoryName: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    textAlign: 'center',
  },
  productList: {
    gap: UI_CONFIG.spacing.md,
  },
  productRow: {
    gap: UI_CONFIG.spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: UI_CONFIG.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    minWidth: Platform.OS === 'web' ? 200 : '45%',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: UI_CONFIG.spacing.sm,
  },
  productTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: '500',
    marginBottom: UI_CONFIG.spacing.xs,
    height: 40, // fix height for 2 lines
  },
  productPrice: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.primary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soldCount: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    color: UI_CONFIG.colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: UI_CONFIG.typography.sizes.xs,
    color: UI_CONFIG.colors.textSecondary,
  }
});
