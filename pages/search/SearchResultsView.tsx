import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, Image } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { ProductCard } from '../../components/product/ProductCard';
import { UI_CONFIG } from '../../constants/config';
import { ProductListItem, UserProfile } from '../../types';
import { socialApi } from '../../lib/api/endpoints/social';

export function SearchResultsView() {
  const params = useLocalSearchParams<{ q?: string; category_id?: string }>();
  const router = useRouter();

  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [submittedQuery, setSubmittedQuery] = useState(searchQuery);
  const [categoryId, setCategoryId] = useState(typeof params.category_id === 'string' ? params.category_id : '');
  
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
      const currentPage = isLoadMore ? page + 1 : 1;
      const res = await socialApi.search({
        q: submittedQuery,
        category_id: categoryId,
        page: currentPage,
        limit
      });
      
      const serverItems = Array.isArray((res as any).data) ? (res as any).data : ((res as any).data?.items || []);
      
      const newProducts = serverItems.filter((i: any) => i.type === 'product').map((i: any) => i.item as ProductListItem);
      const newUsers = serverItems.filter((i: any) => i.type === 'user').map((i: any) => i.item as UserProfile);

      if (isLoadMore) {
        setProductsList(prev => {
          const newIds = new Set(newProducts.map((d: ProductListItem) => d.id));
          return [...prev.filter(p => !newIds.has(p.id)), ...newProducts];
        });
        setUsersList(prev => {
          const newIds = new Set(newUsers.map((d: UserProfile) => d.id));
          return [...prev.filter(p => !newIds.has(p.id)), ...newUsers];
        });
        setPage(currentPage);
      } else {
        setProductsList(newProducts);
        setUsersList(newUsers);
      }
      
      if (serverItems.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('[SearchResultsView] Error loading search results:', error);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [submittedQuery, categoryId, page]);

  useEffect(() => {
    loadData();
  }, [submittedQuery, categoryId]);

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (q !== submittedQuery) {
      setSubmittedQuery(q);
      // Ghi lại lịch sử tìm kiếm
      socialApi.saveSearch(q).catch(() => {});
    }
  };

  const renderProduct = ({ item }: { item: ProductListItem }) => (
    <ProductCard item={item} />
  );

  const renderUser = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => router.push(`/user/${item.id}` as any)}>
      <Image 
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }} 
        style={styles.userAvatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.full_name || item.username || 'Đồng đội'}</Text>
        <Text style={styles.userRole} numberOfLines={1}>{item.rank || 'Chiến sĩ'}</Text>
      </View>
      <View style={styles.followBtn}>
        <Text style={styles.followText}>Theo dõi</Text>
      </View>
    </TouchableOpacity>
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
            placeholder="Tìm kiếm đồng đội, vũ khí..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} />
        </View>
      ) : productsList.length === 0 && usersList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy kết quả nào cho '{submittedQuery}'</Text>
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
          ListHeaderComponent={
            usersList.length > 0 ? (
              <View style={styles.usersSection}>
                <Text style={styles.sectionTitle}>Đồng đội & Shop</Text>
                <FlatList
                  horizontal
                  data={usersList}
                  keyExtractor={item => item.id}
                  renderItem={renderUser}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.usersList}
                />
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Khí tài & Chiến tích</Text>
              </View>
            ) : null
          }
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
  },
  usersSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: 10,
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 10,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
  },
  followBtn: {
    backgroundColor: UI_CONFIG.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
