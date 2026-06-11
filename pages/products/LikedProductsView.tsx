import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useProductStore } from '../../store/product';
import { ProductCard } from '../../components/product/ProductCard';

export function LikedProductsView() {
  const displayedProducts = useProductStore(state => state.displayedProducts);
  const localProductCache = useProductStore(state => state.localProductCache);
  
  // Combine all known products and filter liked ones
  const allProducts = [...displayedProducts, ...localProductCache];
  // Filter unique by ID
  const uniqueProductsMap = new Map();
  allProducts.forEach(p => {
    if (!uniqueProductsMap.has(p.id)) {
      uniqueProductsMap.set(p.id, p);
    }
  });
  
  const likedProducts = Array.from(uniqueProductsMap.values()).filter(p => p.is_liked);

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
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <View style={{ flex: 1, padding: 4 }}>
              <ProductCard item={item} />
            </View>
          )}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: UI_CONFIG.spacing.lg },
  emptyText: { fontSize: UI_CONFIG.typography.sizes.md, color: UI_CONFIG.colors.textSecondary, marginTop: UI_CONFIG.spacing.md },
  listContainer: { paddingHorizontal: 4, paddingBottom: UI_CONFIG.spacing.xl },
});
