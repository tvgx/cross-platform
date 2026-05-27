import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useCatalogStore } from '../../store/catalog';
import { ProductCard } from '../../components/product/ProductCard';

export function LikedProductsView() {
  const storeProducts = useCatalogStore(state => state.products);
  const likedProducts = storeProducts.filter(p => p.is_liked);

  return (
    <SafeArea edges={['top']}>
      <Header title="SẢN PHẨM ĐÃ THÍCH" leftIcon="arrow-back" showNotification={false} />
      {likedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={UI_CONFIG.colors.textSecondary} />
          <Text style={styles.emptyText}>Bạn chưa thích sản phẩm nào.</Text>
        </View>
      ) : (
        <FlatList
          data={likedProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: UI_CONFIG.spacing.lg },
  emptyText: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.textSecondary, marginTop: UI_CONFIG.spacing.md },
  listContainer: { padding: UI_CONFIG.spacing.md, paddingBottom: UI_CONFIG.spacing.xl },
  row: { gap: UI_CONFIG.spacing.md, marginBottom: UI_CONFIG.spacing.md },
});
