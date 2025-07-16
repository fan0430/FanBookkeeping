import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Transaction } from '../types';
import { formatCurrency, calculateTotal } from '../utils/helpers';
import TransactionItem from '../components/TransactionItem';
import AddButton from '../components/AddButton';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // 模擬一些初始數據
  useEffect(() => {
    loadInitialTransactions();
  }, []);

  const loadInitialTransactions = () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        amount: 150,
        type: 'expense',
        category: '1',
        description: '午餐',
        date: new Date(),
      },
      {
        id: '2',
        amount: 50000,
        type: 'income',
        category: '9',
        description: '月薪',
        date: new Date(),
      },
      {
        id: '3',
        amount: 200,
        type: 'expense',
        category: '2',
        description: '計程車',
        date: new Date(),
      },
      {
        id: '4',
        amount: 300,
        type: 'expense',
        category: '3',
        description: '晚餐',
        date: new Date(),
      },
      {
        id: '5',
        amount: 1000,
        type: 'expense',
        category: '4',
        description: '購物',
        date: new Date(),
      },
      {
        id: '6',
        amount: 800,
        type: 'income',
        category: '10',
        description: '兼職收入',
        date: new Date(),
      },
      {
        id: '7',
        amount: 150,
        type: 'expense',
        category: '5',
        description: '咖啡',
        date: new Date(),
      },
      {
        id: '8',
        amount: 500,
        type: 'expense',
        category: '6',
        description: '電影票',
        date: new Date(),
      },
      {
        id: '9',
        amount: 1200,
        type: 'expense',
        category: '7',
        description: '房租',
        date: new Date(),
      },
      {
        id: '10',
        amount: 300,
        type: 'expense',
        category: '8',
        description: '水電費',
        date: new Date(),
      },
    ];
    setTransactions(mockTransactions);
  };

  const loadMoreTransactions = () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // 模擬 API 載入延遲
    setTimeout(() => {
      const newTransactions: Transaction[] = [
        {
          id: `${page * pageSize + 1}`,
          amount: 250,
          type: 'expense',
          category: '1',
          description: '午餐',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 2}`,
          amount: 180,
          type: 'expense',
          category: '2',
          description: '交通費',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 3}`,
          amount: 400,
          type: 'expense',
          category: '3',
          description: '晚餐',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 4}`,
          amount: 1200,
          type: 'expense',
          category: '4',
          description: '購物',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 5}`,
          amount: 200,
          type: 'expense',
          category: '5',
          description: '咖啡',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 6}`,
          amount: 600,
          type: 'expense',
          category: '6',
          description: '娛樂',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 7}`,
          amount: 800,
          type: 'expense',
          category: '7',
          description: '房租',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 8}`,
          amount: 350,
          type: 'expense',
          category: '8',
          description: '水電費',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 9}`,
          amount: 1500,
          type: 'income',
          category: '9',
          description: '獎金',
          date: new Date(),
        },
        {
          id: `${page * pageSize + 10}`,
          amount: 900,
          type: 'income',
          category: '10',
          description: '投資收益',
          date: new Date(),
        },
      ];

      setTransactions(prev => [...prev, ...newTransactions]);
      setPage(prev => prev + 1);
      setLoading(false);
      
      // 模擬沒有更多數據的情況（第5頁後）
      if (page >= 4) {
        setHasMore(false);
      }
    }, 1000);
  };

  const totalIncome = calculateTotal(transactions, 'income');
  const totalExpense = calculateTotal(transactions, 'expense');
  const balance = totalIncome - totalExpense;

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#3498DB" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* 總覽卡片 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>本月總覽</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>餘額</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#2ECC71' : '#E74C3C' }]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>收入</Text>
            <Text style={[styles.statAmount, { color: '#2ECC71' }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>支出</Text>
            <Text style={[styles.statAmount, { color: '#E74C3C' }]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* 交易列表 */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>最近交易</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </View>

      <AddButton onPress={() => navigation.navigate('AddTransaction')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100, // 為固定按鈕留出空間
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default HomeScreen; 