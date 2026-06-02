import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { ProductCard } from '../../components/product/ProductCard';
import { UI_CONFIG } from '../../constants/config';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { ProductListItem } from '../../types';
import { useCatalogStore } from '../../store/catalog';

export function AllProductsView() {
  const storeProducts = useCatalogStore(state => state.products);
  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name_asc'>('newest');

  const loadData = async (isRefresh = false) => {
    setLoading(true);
    try {
      const data = await ProductRepository.getProducts();
      setProductsList(data);
    } catch (error) {
      console.error('[AllProductsView] Error loading products:', error);
    } finally {
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

  useEffect(() => {
    let result = [...productsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || p.name || '').toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    } else {
      result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }

    setFilteredProducts(result);
  }, [searchQuery, sortBy, productsList]);

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <CustomAppBar title="Tất cả sản phẩm" />

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={UI_CONFIG.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Mới nhất</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price_asc' && styles.sortButtonActive]}
            onPress={() => setSortBy('price_asc')}
          >
            <Text style={[styles.sortText, sortBy === 'price_asc' && styles.sortTextActive]}>Giá tăng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price_desc' && styles.sortButtonActive]}
            onPress={() => setSortBy('price_desc')}
          >
            <Text style={[styles.sortText, sortBy === 'price_desc' && styles.sortTextActive]}>Giá giảm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name_asc' && styles.sortButtonActive]}
            onPress={() => setSortBy('name_asc')}
          >
            <Text style={[styles.sortText, sortBy === 'name_asc' && styles.sortTextActive]}>Theo tên A-Z</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
  filterSection: {
    backgroundColor: '#fff',
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: UI_CONFIG.borderRadius.md,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.sm,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.sm,
  },
  sortButton: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: UI_CONFIG.colors.primary + '10',
  },
  sortText: {
    fontSize: 14,
    color: UI_CONFIG.colors.textSecondary,
  },
  sortTextActive: {
    color: UI_CONFIG.colors.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRow: {
    gap: UI_CONFIG.spacing.md,
  }
});
