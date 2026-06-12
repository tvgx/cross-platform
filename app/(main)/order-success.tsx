import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { UI_CONFIG } from '../../constants/config';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function OrderSuccessScreen() {
  const router = useRouter();

  return (
    <SafeArea edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconSymbol name="checkmark.shield.fill" size={80} color={UI_CONFIG.colors.success} />
        </View>
        
        <Text style={styles.title}>ĐƠN HÀNG CỦA BẠN ĐÃ ĐẶT THÀNH CÔNG</Text>

        <View style={styles.actionContainer}>
          <TacticalButton 
            text="XEM DANH SÁCH ĐƠN HÀNG" 
            variant="outline" 
            fullWidth 
            onPress={() => router.replace('/(main)/orders' as any)} 
            style={{ marginBottom: 15 }}
          />
          <TacticalButton 
            text="TIẾP TỤC MUA SẮM" 
            fullWidth 
            onPress={() => router.replace('/(main)/(tabs)')} 
          />
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: UI_CONFIG.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.background,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 40,
  },
  actionContainer: {
    width: '100%',
  },
});
