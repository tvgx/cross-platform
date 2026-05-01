import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { Comments } from '../../components/Comments';
import { UI_CONFIG } from '../../constants/config';
import { useRouter } from 'expo-router';

export default function DetailScreen() {
  const router = useRouter();

  return (
    <SafeArea edges={['top', 'bottom']}>
      <Header 
        leftIcon="arrow-back" 
        onPressLeft={() => router.back()} 
        title="Product Detail"
        rightIcon="cart"
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imagePlaceholder}>
          <Text>Product Image</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>Product Name Placeholder</Text>
          <Text style={styles.price}>$99.99</Text>
          <Text style={styles.description}>
            This is a placeholder for product description. The product details will safely go here in the skeleton UI.
          </Text>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {/* Skeleton Comments component */}
          <Comments comments={[]} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: UI_CONFIG.spacing.xxl,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: UI_CONFIG.colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: UI_CONFIG.spacing.md,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xl,
    fontWeight: UI_CONFIG.typography.weights.bold,
  },
  price: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    color: UI_CONFIG.colors.primary,
    marginTop: UI_CONFIG.spacing.xs,
  },
  description: {
    marginTop: UI_CONFIG.spacing.md,
    color: UI_CONFIG.colors.textSecondary,
    lineHeight: 22,
  },
  commentsSection: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    marginTop: UI_CONFIG.spacing.lg,
  },
  commentsTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    marginBottom: UI_CONFIG.spacing.sm,
  },
});
