import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeArea } from '../../components/layout/SafeArea';
import { Header } from '../../components/navigation/Header';
import { UI_CONFIG } from '../../constants/config';
import { balanceApi } from '../../lib/api/endpoints/misc';
import { useAuthStore } from '../../store/auth';

export function WalletView() {
  const { setBalance, balance } = useAuthStore();
  const [currentBalance, setCurrentBalance] = useState<number>(balance);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // Gọi 2 api song song nhưng không để lỗi của 1 api làm sập toàn bộ
      const [balanceResult, historyResult] = await Promise.allSettled([
        balanceApi.getCurrent(),
        balanceApi.getHistory({ index: 0, count: 20 })
      ]);

      // Xử lý số dư hiện tại
      if (balanceResult.status === 'fulfilled' && balanceResult.value?.data) {
        setCurrentBalance(balanceResult.value.data.balance || 0);
        setBalance(balanceResult.value.data.balance || 0); // Cập nhật luôn store
      } else {
        console.warn('Lỗi lấy số dư:', balanceResult.status === 'rejected' ? balanceResult.reason : 'Không rõ');
      }

      // Xử lý lịch sử ví
      if (historyResult.status === 'fulfilled' && historyResult.value) {
        const historyRes = historyResult.value;
        if ((historyRes as any).code === '9994' || historyRes.data?.items?.length === 0) {
          setHistoryMessage('Chưa có giao dịch nào.');
          setHistory([]);
        } else if (historyRes.data?.items) {
          setHistory(historyRes.data.items);
          setHistoryMessage(null);
        } else {
          setHistoryMessage('Không có lịch sử giao dịch.');
        }
      } else {
        setHistoryMessage('Chưa có giao dịch nào.');
        console.warn('Lỗi lấy lịch sử:', historyResult.status === 'rejected' ? historyResult.reason : 'Không rõ');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin ví:', error);
      setHistoryMessage('Chưa có giao dịch nào.');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isEarn = Number(item.amount) > 0;
    return (
      <View style={styles.historyItem}>
        <View style={[styles.iconContainer, { backgroundColor: isEarn ? '#E8F5E9' : '#FFEBEE' }]}>
          <Ionicons name={isEarn ? 'arrow-down' : 'arrow-up'} size={20} color={isEarn ? UI_CONFIG.colors.success : UI_CONFIG.colors.danger} />
        </View>
        <View style={styles.historyLeft}>
          <Text style={styles.historyTitle} numberOfLines={1}>{item.title || item.description || (isEarn ? 'Nhận điểm chiến tích' : 'Sử dụng điểm')}</Text>
          <Text style={styles.historyDate}>{item.created_at || item.time || ''}</Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyAmount, { color: Number(item.amount) > 0 ? UI_CONFIG.colors.success : Number(item.amount) < 0 ? UI_CONFIG.colors.danger : UI_CONFIG.colors.textSecondary }]}>
            {Number(item.amount) > 0 ? '+' : ''}{item.amount ? Number(item.amount).toLocaleString('vi-VN') : 0}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeArea edges={['top']}>
      <Header title="VÍ CHIẾN TÍCH" leftIcon="arrow-back" showNotification={false} />

      <View style={styles.container}>
        {/* Số dư hiện tại */}
        <View style={styles.balanceCard}>
          <Ionicons name="shield-checkmark" size={40} color="#fff" style={styles.cardIcon} />
          <Text style={styles.balanceLabel}>Điểm chiến tích hiện có</Text>
          <Text style={styles.balanceValue}>
            {currentBalance.toLocaleString('vi-VN')}
          </Text>
          <Text style={styles.currencyNote}>*Quy đổi từ hệ thống kiểm duyệt chiến tích</Text>
          
          <TouchableOpacity style={styles.earnButton}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.earnButtonText}>Đăng chiến tích mới</Text>
          </TouchableOpacity>
        </View>

        {/* Lịch sử giao dịch */}
        <Text style={styles.sectionTitle}>Lịch sử biến động</Text>

        {loading ? (
          <ActivityIndicator size="large" color={UI_CONFIG.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{historyMessage || 'Không có dữ liệu'}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  balanceCard: {
    margin: UI_CONFIG.spacing.lg,
    padding: UI_CONFIG.spacing.xl,
    backgroundColor: '#2E4C3B', // Màu xanh lục quân sự
    borderRadius: UI_CONFIG.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.1,
    transform: [{ scale: 4 }],
  },
  balanceLabel: {
    color: '#E8F5E9',
    fontSize: UI_CONFIG.typography.sizes.md,
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currencyNote: {
    color: '#A5D6A7',
    fontSize: UI_CONFIG.typography.sizes.xs,
    marginTop: 6,
    fontStyle: 'italic',
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  earnButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: UI_CONFIG.typography.sizes.sm,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginHorizontal: UI_CONFIG.spacing.lg,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  listContainer: {
    paddingHorizontal: UI_CONFIG.spacing.lg,
    paddingBottom: UI_CONFIG.spacing.xl,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.colors.surface,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
    marginBottom: UI_CONFIG.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyLeft: {
    flex: 1,
    marginRight: UI_CONFIG.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.spacing.md,
  },
  historyTitle: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: UI_CONFIG.typography.sizes.sm,
    color: UI_CONFIG.colors.textSecondary,
  },
  historyRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: UI_CONFIG.typography.sizes.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: UI_CONFIG.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    fontStyle: 'italic',
  }
});
