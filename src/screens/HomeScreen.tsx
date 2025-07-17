import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationProps, Transaction } from '../types';
import { useData } from '../context/DataContext';
import { defaultCategories } from '../utils/categories';

const HomeScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { currentLedger, deleteTransaction } = useData();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const pageSize = 10;

  // 如果沒有選擇帳本，導航到帳本選擇頁面
  React.useEffect(() => {
    if (!currentLedger) {
      navigation.navigate('ledgerSelect');
    }
  }, [currentLedger, navigation]);

  // 當帳本改變時，重置分頁狀態並載入第一頁
  useEffect(() => {
    if (currentLedger) {
      setPage(1);
      setHasMore(true);
      setDisplayedTransactions([]);
      loadInitialTransactions();
    }
  }, [currentLedger]);

  // 當交易記錄數量改變時，重新載入第一頁
  useEffect(() => {
    if (currentLedger && displayedTransactions.length > 0) {
      const currentTransactionCount = currentLedger.transactions.length;
      const displayedTransactionCount = displayedTransactions.length;
      
      // 如果交易記錄數量有變化（新增或刪除），重新載入
      if (currentTransactionCount !== displayedTransactionCount + (page - 1) * pageSize) {
        loadInitialTransactions();
      }
    }
  }, [currentLedger?.transactions.length]);

  const loadInitialTransactions = () => {
    if (!currentLedger) return;
    
    const initialTransactions = currentLedger.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, pageSize);
    
    setDisplayedTransactions(initialTransactions);
    setHasMore(currentLedger.transactions.length > pageSize);
  };

  if (!currentLedger) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalIncome = currentLedger.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentLedger.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const loadMoreTransactions = () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // 模擬 API 載入延遲
    setTimeout(() => {
      const sortedTransactions = currentLedger.transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const newTransactions = sortedTransactions.slice(startIndex, endIndex);
      
      if (newTransactions.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setDisplayedTransactions(prev => [...prev, ...newTransactions]);
      setPage(prev => prev + 1);
      setHasMore(endIndex < sortedTransactions.length);
      setLoading(false);
    }, 500);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      '確認刪除',
      `確定要刪除「${transaction.description}」這筆交易嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              // 重新載入交易記錄以反映刪除後的狀態
              loadInitialTransactions();
            } catch (error) {
              Alert.alert('錯誤', '刪除交易失敗');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = defaultCategories.find(c => c.id === item.category);
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onLongPress={() => handleDeleteTransaction(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {item.date.toLocaleDateString('zh-TW')}
          </Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={[
            styles.transactionAmount,
            item.type === 'income' ? styles.incomeText : styles.expenseText
          ]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionCategory}>
            ({category?.name || '其他'})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>載入更多...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('ledgerSelect')}
        >
          <Text style={styles.backButtonText}>← 切換帳本</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentLedger.name}</Text>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => navigation.navigate('stats')}
        >
          <Text style={styles.statsButtonText}>統計</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        <Text style={styles.balanceLabel}>當前餘額</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>收入</Text>
            <Text style={[styles.statAmount, styles.incomeText]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>支出</Text>
            <Text style={[styles.statAmount, styles.expenseText]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={displayedTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.transactionsContainer}
        contentContainerStyle={styles.listContainer}
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>還沒有交易記錄</Text>
            <Text style={styles.emptySubText}>點擊下方按鈕新增第一筆交易</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('addTransaction')}
      >
        <Text style={styles.addButtonText}>+ 新增交易</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    width: '100%',
  },
  statsButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statsButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#28a745',
  },
  expenseText: {
    color: '#dc3545',
  },
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6c757d',
  },
  addButton: {
    backgroundColor: '#007bff',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#007bff',
    fontSize: 14,
  },
});

export default HomeScreen; 