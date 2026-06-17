import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeArea } from '../../components/layout/SafeArea';
import { UI_CONFIG } from '../../constants/config';
import { usersApi } from '../../lib/api/endpoints/users';
import { productsApi } from '../../lib/api/endpoints/products';
import { User, ProductListItem } from '../../types';
import { SellerInfoCard } from '../../components/seller/SellerInfoCard';
import { ProductCard } from '../../components/product/ProductCard';
import { useRouter } from 'expo-router';

interface ShopViewProps {
  sellerId: string;
}

export function ShopView({ sellerId }: ShopViewProps) {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc'>('popular');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (sellerId) {
      loadUserInfo();
    }
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      loadProducts(false);
    }
  }, [sellerId, submittedKeyword, sortBy]);

  const loadUserInfo = async () => {
    try {
      setLoadingUser(true);
      const res = await usersApi.getUserInfo(sellerId);
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Error loading seller info:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadProducts = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoadingProducts(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const res = await productsApi.getUserListings(sellerId, {
        page: currentPage,
        limit,
        keyword: submittedKeyword,
        order: sortBy === 'popular' ? undefined : sortBy
      });

      let items: ProductListItem[] = [];
      if (Array.isArray(res.data)) {
        items = res.data;
      } else if (res.data && (res.data as any).items) {
        items = (res.data as any).items;
      }

      if (isLoadMore) {
        setProducts(prev => [...prev, ...items]);
      } else {
        setProducts(items);
      }

      setHasMore(items.length >= limit);
      if (isLoadMore) setPage(currentPage);
    } catch (err) {
      console.error('Error loading shop products:', err);
    } finally {
      setLoadingProducts(false);
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = () => {
    setSubmittedKeyword(keyword.trim());
  };

  const renderHeader = () => {
    if (loadingUser) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      );
    }

    if (!user) return null;

    const fullName = [user.lastname, user.firstname].filter(Boolean).join(' ').trim() || user.full_name || user.username || 'Người bán';

    return (
      <View>
        <View style={styles.coverContainer}>
          <Image
            source={user.cover_image ? { uri: user.cover_image } : require('../../assets/images/cover.jpg')}
            style={styles.coverImage}
          />
        </View>
        
        <SellerInfoCard
          sellerId={user.id}
          sellerName={fullName}
          sellerAvatar={user.avatar}
          hideViewShopButton={true}
          onPressSeller={() => router.push({ pathname: '/(main)/seller/[id]', params: { id: user.id } } as any)}
          onPressFollow={() => {}}
          onPressChat={() => {}}
        />

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['popular', 'price_asc', 'price_desc'] as const).map((sort) => {
              const isActive = sortBy === sort;
              let label = 'Bán chạy';
              if (sort === 'price_asc') label = 'Giá ↑';
              if (sort === 'price_desc') label = 'Giá ↓';
              
              return (
                <TouchableOpacity
                  key={sort}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: UI_CONFIG.spacing.xxl }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} />
      </View>
    );
  };

  return (
    <SafeArea edges={['top']} style={{ flex: 1, backgroundColor: UI_CONFIG.colors.background }}>
      {/* Custom App Bar for Shop */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={UI_CONFIG.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trong shop..."
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); setSubmittedKeyword(''); }}>
              <Ionicons name="close-circle" size={20} color={UI_CONFIG.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard item={item} />
          </View>
        )}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasMore && !loadingProducts && !loadingMore) {
            loadProducts(true);
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          !loadingProducts && !loadingUser ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
            </View>
          ) : null
        )}
      />
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
    marginRight: UI_CONFIG.spacing.sm,
    fontSize: 16,
    paddingVertical: 0,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: { 
    width: '100%', 
    height: 140 
  },
  coverImage: { 
    width: '100%', 
    height: '100%' 
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: UI_CONFIG.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  filterScroll: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    gap: UI_CONFIG.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#FFF0F0',
    borderColor: UI_CONFIG.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: UI_CONFIG.colors.text,
  },
  filterChipTextActive: {
    color: UI_CONFIG.colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  row: {
    paddingHorizontal: UI_CONFIG.spacing.sm,
    paddingTop: UI_CONFIG.spacing.sm,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: UI_CONFIG.spacing.xs,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  footerLoader: {
    paddingVertical: UI_CONFIG.spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: UI_CONFIG.colors.textSecondary,
    fontSize: 16,
  }
});
