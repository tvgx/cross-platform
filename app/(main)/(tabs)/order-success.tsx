import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { UI_CONFIG } from '../../../constants/config';
import { TacticalButton } from '../../../components/ui/TacticalButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '../../../components/ui/icon-symbol';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <SafeArea edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconSymbol name="checkmark.shield.fill" size={80} color={UI_CONFIG.colors.primary} />
        </View>
        
        <Text style={styles.title}>LỆNH MUA ĐÃ ĐƯỢC KHỞI TẠO</Text>
        <Text style={styles.orderId}>ID: {orderId}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Lệnh mua hàng của bạn đã được ghi nhận vào hệ thống cục bộ. 
            Đơn hàng sẽ tự động đồng bộ tới Bộ Quốc Phòng khi thiết bị có kết nối mạng.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <TacticalButton 
            text="XEM DANH SÁCH ĐƠN HÀNG" 
            variant="outline" 
            fullWidth 
            onPress={() => router.replace('/(main)/(tabs)')} 
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
    letterSpacing: 2,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    color: UI_CONFIG.colors.primary,
    fontWeight: '700',
    marginBottom: 40,
    letterSpacing: 1,
  },
  infoBox: {
    padding: 20,
    backgroundColor: UI_CONFIG.colors.surfaceLighter,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: UI_CONFIG.colors.primary,
    marginBottom: 60,
  },
  infoText: {
    color: UI_CONFIG.colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
    textAlign: 'center',
  },
  actionContainer: {
    width: '100%',
  },
});
