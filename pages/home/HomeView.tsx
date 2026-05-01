import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { CustomAppBar } from '../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../constants/config';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../lib/mockDB';
import { Product } from '../../types';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useRouter, Href } from 'expo-router';

export function HomeView() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading data
    setProducts(MOCK_PRODUCTS);
  }, []);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push(`/(main)/detail?id=${item.id}` as Href)}
    >
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')} ₫</Text>
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
    <SafeArea edges={['top']}>
      <CustomAppBar title="Army+ E-commerce" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            {MOCK_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryIconContainer}>
                  {/* Using generic icon since icon string map isn't fully defined, default to folder if missing */}
                  <IconSymbol name={"folder"} size={24} color={UI_CONFIG.colors.primary} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Best Sellers / Products Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
          {/* For web we want a grid, for mobile FlatList numColumns is fine */}
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            renderItem={renderProduct}
            numColumns={Platform.OS === 'web' ? 4 : 2}
            scrollEnabled={false} // Since it's inside ScrollView
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            key={Platform.OS === 'web' ? 'web' : 'mobile'} // Force re-render on platform change
          />
        </View>
      </ScrollView>
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
