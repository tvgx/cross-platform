import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { UI_CONFIG } from '../../constants/config';
import { SafeArea } from '../../components/layout/SafeArea';

export function LandingView() {
  const router = useRouter();

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Army+ E-commerce</Text>
          <Text style={styles.subtitle}>Nền tảng thương mại điện tử chuyên dụng dành cho Quân nhân.</Text>
          
          <View style={styles.buttonContainer}>
            <Button 
              text="Đăng nhập" 
              onPress={() => router.push('/(auth)/login' as Href)} 
            />
            <Button 
              text="Đăng ký" 
              variant="secondary"
              onPress={() => router.push('/(auth)/signup' as Href)} 
            />
          </View>
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.background,
    padding: UI_CONFIG.spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400, // Grid style max-width for Web
    alignItems: 'center',
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.xxl,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.primary,
    marginBottom: UI_CONFIG.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xxl,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: UI_CONFIG.spacing.md,
  }
});
