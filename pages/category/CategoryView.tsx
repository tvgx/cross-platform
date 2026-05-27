import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ActivityIndicator } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { ProductListItem } from '../../types';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { useCatalogStore } from '../../store/catalog';

interface CategoryViewProps {
  categoryId: string;
}

export function CategoryView({ categoryId }: CategoryViewProps) {
  const storeProducts = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);

  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const categoryName = categories.find(c => String(c.id) === String(categoryId))?.name || 'Danh mục sản phẩm';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await ProductRepository.getProducts({ category_id: categoryId });
        setProductsList(data);
      } catch (error) {
        console.error('[CategoryView] Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  // Lắng nghe thay đổi từ Store (để cập nhật trạng thái Like realtime)
  useEffect(() => {
    if (storeProducts && storeProducts.length > 0) {
      setProductsList(storeProducts.filter(p => String(p.category_id) === String(categoryId)));
    }
  }, [storeProducts, categoryId]);

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <CustomAppBar title={categoryName} showBack />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : productsList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Chưa có sản phẩm nào trong danh mục này.</Text>
        </View>
      ) : (
        <FlatList
          data={productsList}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          key={Platform.OS === 'web' ? 'web' : 'mobile'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          columnWrapperStyle={styles.productRow}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.spacing.md,
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
  },
  productRow: {
    gap: UI_CONFIG.spacing.md,
  }
});
