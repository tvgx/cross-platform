import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAppBar } from '../../../components/navigation/CustomAppBar';
import { UI_CONFIG } from '../../../constants/config';
import { useAppStore } from '../../../store/app';
import { SwipeWrapper } from '../../../components/navigation/SwipeWrapper';
import { balanceApi } from '../../../lib/api/endpoints/misc';
import { BalanceTransaction } from '../../../types';
import { IconSymbol } from '../../../components/ui/icon-symbol';

export default function WalletScreen() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const currentColors = isDarkMode ? UI_CONFIG.darkColors : UI_CONFIG.lightColors;
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0); // backend uses index = 0, 1, 2... ? Actually it uses index directly or offset
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;

  useEffect(() => {
    fetchWalletData(0, false);
  }, []);

  const fetchWalletData = async (index: number, isRefresh: boolean) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch balance if it's the first load or a refresh
      if (index === 0) {
        const balanceRes = await balanceApi.getCurrent();
        if (balanceRes && balanceRes.success && balanceRes.data) {
          setBalance(balanceRes.data.balance || 0);
        }
      }

      // Fetch history
      const historyRes = await balanceApi.getHistory({ index, count: limit });
      if (historyRes && historyRes.success && historyRes.data) {
        const items = historyRes.data.items || (historyRes.data as any).history || Array.isArray(historyRes.data) ? historyRes.data : [];
        const fetchedItems = Array.isArray(items) ? items : [];

        if (fetchedItems.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (isRefresh || index === 0) {
          setTransactions(fetchedItems);
        } else {
          setTransactions(prev => [...prev, ...fetchedItems]);
        }
      } else if (historyRes?.success === false) {
          setHasMore(false);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu ví:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchWalletData(0, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextIndex = page + limit;
      setPage(nextIndex);
      fetchWalletData(nextIndex, false);
    }
  };

  const renderTransaction = ({ item }: { item: BalanceTransaction }) => {
    const isCredit = item.type === 'credit';
    const amountColor = isCredit ? UI_CONFIG.colors.success : UI_CONFIG.colors.danger;
    const amountPrefix = isCredit ? '+' : '-';

    return (
      <View style={[styles.transactionItem, { backgroundColor: currentColors.surface, borderBottomColor: currentColors.border }]}>
        <View style={styles.transactionIconContainer}>
          <IconSymbol 
            name={isCredit ? 'arrow.down.left.circle.fill' : 'arrow.up.right.circle.fill'} 
            size={36} 
            color={amountColor} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionDesc, { color: currentColors.text }]} numberOfLines={2}>
            {item.description || 'Giao dịch'}
          </Text>
          <Text style={[styles.transactionDate, { color: currentColors.textSecondary }]}>
            {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}
          </Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {amountPrefix}{item.amount.toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.balanceCard, { backgroundColor: currentColors.primary }]}>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
        <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
          {balance.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VND</Text>
        </Text>
      </View>
      <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
        Lịch sử giao dịch
      </Text>
    </View>
  );

  return (
    <SwipeWrapper currentTab="wallet">
      <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
        <CustomAppBar title="Ví của tôi" />
        
        {isLoading && page === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
            renderItem={renderTransaction}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[currentColors.primary]} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoading && page > 0 ? (
                <ActivityIndicator size="small" color={currentColors.primary} style={{ marginVertical: 20 }} />
              ) : null
            }
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 50, color: currentColors.textSecondary }}>
                Chưa có giao dịch nào.
              </Text>
            }
          />
        )}
      </View>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 100, // Account for bottom tab
  },
  headerContainer: {
    padding: UI_CONFIG.spacing.md,
  },
  balanceCard: {
    padding: UI_CONFIG.spacing.xl,
    borderRadius: UI_CONFIG.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UI_CONFIG.spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currencyUnit: {
    fontSize: 18,
    fontWeight: 'normal',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  transactionIconContainer: {
    marginRight: UI_CONFIG.spacing.md,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionDesc: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: UI_CONFIG.spacing.sm,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
