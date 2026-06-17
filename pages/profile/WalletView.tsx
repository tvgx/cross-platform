import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
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

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.title || item.description || 'Giao dịch'}</Text>
        <Text style={styles.historyDate}>{item.created_at || item.time || ''}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyAmount, { color: Number(item.amount) > 0 ? UI_CONFIG.colors.success : Number(item.amount) < 0 ? UI_CONFIG.colors.danger : UI_CONFIG.colors.textSecondary }]}>
          {Number(item.amount) > 0 ? '+' : ''}{item.amount ? Number(item.amount).toLocaleString('vi-VN') : 0}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeArea edges={['top']}>
      <Header title="VÍ CỦA TÔI" leftIcon="arrow-back" showNotification={false} />

      <View style={styles.container}>
        {/* Số dư hiện tại */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceValue}>
            {currentBalance.toLocaleString('vi-VN')}
          </Text>
          <Text style={styles.currencyNote}>(Đơn vị tiền tệ ứng dụng)</Text>
        </View>

        {/* Lịch sử đơn đã mua / giao dịch */}
        <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>

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
    backgroundColor: UI_CONFIG.colors.primary,
    borderRadius: UI_CONFIG.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: UI_CONFIG.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: UI_CONFIG.typography.sizes.md,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  currencyNote: {
    color: '#fff',
    fontSize: UI_CONFIG.typography.sizes.xs,
    opacity: 0.8,
    marginTop: 4,
    fontStyle: 'italic',
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
