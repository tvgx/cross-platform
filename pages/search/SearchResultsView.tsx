import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { ProductCard } from '../../components/product/ProductCard';
import { UI_CONFIG } from '../../constants/config';
import { ProductRepository } from '../../lib/repositories/ProductRepository';
import { ProductListItem } from '../../types';
import { ProductFilters } from '../../lib/api/endpoints/products';

export function SearchResultsView() {
  const params = useLocalSearchParams<{ q?: string; category_id?: string }>();
  const router = useRouter();

  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [submittedQuery, setSubmittedQuery] = useState(searchQuery);
  const [categoryId, setCategoryId] = useState(typeof params.category_id === 'string' ? params.category_id : '');
  
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 20;

  const loadData = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters: Omit<ProductFilters, 'keyword'> = {
        sort: sortBy,
      };
      
      if (categoryId) filters.category_id = categoryId;
      if (minPrice) filters.min_price = Number(minPrice);
      if (maxPrice) filters.max_price = Number(maxPrice);

      const currentPage = isLoadMore ? page + 1 : 1;
      const data = await ProductRepository.searchProducts(submittedQuery, filters, currentPage, forceRefresh);
      
      if (isLoadMore) {
        setProductsList(prev => {
          const newIds = new Set(data.map(d => d.id));
          return [...prev.filter(p => !newIds.has(p.id)), ...data];
        });
        setPage(currentPage);
      } else {
        setProductsList(data);
      }
      
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('[SearchResultsView] Error loading products:', error);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [submittedQuery, categoryId, sortBy, minPrice, maxPrice, page]);

  useEffect(() => {
    loadData();
  }, [submittedQuery, categoryId, sortBy, minPrice, maxPrice]); // loadData is triggered when filters change

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (q !== submittedQuery) {
      setSubmittedQuery(q);
      // optionally save to recent searches here
    }
  };

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={UI_CONFIG.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Mới nhất</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'popular' && styles.sortButtonActive]}
            onPress={() => setSortBy('popular')}
          >
            <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>Phổ biến</Text>
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
        </ScrollView>
        <View style={styles.priceFilterContainer}>
          <TextInput
            style={styles.priceInput}
            placeholder="Giá từ"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
            onBlur={() => loadData()}
          />
          <Text style={styles.priceDash}>-</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Giá đến"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
            onBlur={() => loadData()}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : productsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào cho '{submittedQuery}'</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadData(false, true)}
              colors={[UI_CONFIG.colors.primary]}
              tintColor={UI_CONFIG.colors.primary}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              loadData(true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  backButton: {
    marginRight: UI_CONFIG.spacing.sm,
    padding: UI_CONFIG.spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: UI_CONFIG.borderRadius.md,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.sm,
    fontSize: 16,
    paddingVertical: 0,
  },
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
  sortContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.md,
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
  priceFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.spacing.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: UI_CONFIG.borderRadius.sm,
    paddingHorizontal: UI_CONFIG.spacing.sm,
    paddingVertical: UI_CONFIG.spacing.xs,
    fontSize: 14,
  },
  priceDash: {
    color: UI_CONFIG.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
  },
  productRow: {
    gap: UI_CONFIG.spacing.md,
  },
  footerLoading: {
    paddingVertical: UI_CONFIG.spacing.md,
    alignItems: 'center',
  }
});
