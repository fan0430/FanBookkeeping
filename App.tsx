/**
 * 簡化版記帳應用程式
 * 避免使用 React Navigation 來解決 gesture handler 問題
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

interface Ledger {
  id: string;
  name: string;
  transactions: Transaction[];
  createdAt: Date;
}

const categories = {
  expense: ['飲食', '交通', '購物', '娛樂', '醫療', '其他'],
  income: ['薪資', '獎金', '投資', '其他'],
};

const STORAGE_KEY = '@FanBookkeeping_ledgers';

function App(): React.JSX.Element {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'ledgerSelect' | 'home' | 'add' | 'stats'>('ledgerSelect');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
  });
  const [showNewLedgerModal, setShowNewLedgerModal] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // 載入帳本資料
  useEffect(() => {
    loadLedgers();
  }, []);

  // 從 AsyncStorage 載入帳本資料
  const loadLedgers = async () => {
    try {
      const storedLedgers = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLedgers) {
        const parsedLedgers = JSON.parse(storedLedgers);
        // 將日期字串轉換回 Date 物件
        const ledgersWithDates = parsedLedgers.map((ledger: any) => ({
          ...ledger,
          createdAt: new Date(ledger.createdAt),
          transactions: ledger.transactions.map((transaction: any) => ({
            ...transaction,
            date: new Date(transaction.date),
          })),
        }));
        setLedgers(ledgersWithDates);
      } else {
        // 如果沒有儲存的資料，創建預設帳本
        const defaultLedger: Ledger = {
          id: Date.now().toString(),
          name: '我的記帳本',
          transactions: [],
          createdAt: new Date(),
        };
        setLedgers([defaultLedger]);
        await saveLedgers([defaultLedger]);
      }
    } catch (error) {
      console.error('載入帳本失敗:', error);
      Alert.alert('錯誤', '載入帳本資料失敗');
    }
  };

  // 儲存帳本資料到 AsyncStorage
  const saveLedgers = async (ledgersToSave: Ledger[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ledgersToSave));
    } catch (error) {
      console.error('儲存帳本失敗:', error);
      Alert.alert('錯誤', '儲存帳本資料失敗');
    }
  };

  // 新增帳本
  const addLedger = async () => {
    if (!newLedgerName.trim()) {
      Alert.alert('錯誤', '請輸入帳本名稱');
      return;
    }

    const newLedger: Ledger = {
      id: Date.now().toString(),
      name: newLedgerName.trim(),
      transactions: [],
      createdAt: new Date(),
    };

    const updatedLedgers = [...ledgers, newLedger];
    setLedgers(updatedLedgers);
    await saveLedgers(updatedLedgers);
    setNewLedgerName('');
    setShowNewLedgerModal(false);
    Alert.alert('成功', '帳本已新增');
  };

  // 選擇帳本
  const selectLedger = (ledger: Ledger) => {
    setCurrentLedger(ledger);
    setCurrentScreen('home');
    setPage(1); // 切換帳本時重置頁碼
    setHasMore(true); // 切換帳本時重置是否有更多資料
  };

  // 刪除帳本
  const deleteLedger = async (ledgerId: string) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這個帳本嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            const updatedLedgers = ledgers.filter(ledger => ledger.id !== ledgerId);
            setLedgers(updatedLedgers);
            await saveLedgers(updatedLedgers);
            
            if (currentLedger?.id === ledgerId) {
              setCurrentLedger(null);
              setCurrentScreen('ledgerSelect');
            }
          },
        },
      ]
    );
  };

  // 更新當前帳本的交易記錄
  const updateCurrentLedger = (updatedTransactions: Transaction[]) => {
    if (!currentLedger) return;
    
    const updatedLedger = {
      ...currentLedger,
      transactions: updatedTransactions,
    };
    
    const updatedLedgers = ledgers.map(ledger =>
      ledger.id === currentLedger.id ? updatedLedger : ledger
    );
    
    setLedgers(updatedLedgers);
    setCurrentLedger(updatedLedger);
    saveLedgers(updatedLedgers);
  };

  const totalIncome = currentLedger?.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalExpense = currentLedger?.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const balance = totalIncome - totalExpense;

  const addTransaction = () => {
    if (!currentLedger) return;
    
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.description) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category: newTransaction.category,
      description: newTransaction.description,
      date: new Date(),
    };

    const updatedTransactions = [transaction, ...currentLedger.transactions];
    updateCurrentLedger(updatedTransactions);
    
    setNewTransaction({ amount: '', type: 'expense', category: '', description: '' });
    setCurrentScreen('home');
    Alert.alert('成功', '交易記錄已新增');
  };

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const loadMoreTransactions = () => {
    if (loading || !hasMore || !currentLedger) return;

    setLoading(true);
    
    // 模擬 API 載入延遲
    setTimeout(() => {
      const currentPage = page;
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const allTransactions = currentLedger.transactions;
      
      if (startIndex >= allTransactions.length) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setPage(prev => prev + 1);
      setLoading(false);
    }, 500);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        item.type === 'income' ? styles.incomeText : styles.expenseText
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
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

  const renderLedgerItem = ({ item }: { item: Ledger }) => (
    <TouchableOpacity
      style={styles.ledgerItem}
      onPress={() => selectLedger(item)}
      onLongPress={() => deleteLedger(item.id)}
    >
      <View style={styles.ledgerInfo}>
        <Text style={styles.ledgerName}>{item.name}</Text>
        <Text style={styles.ledgerDetails}>
          {item.transactions.length} 筆交易 • 
          建立於 {item.createdAt.toLocaleDateString('zh-TW')}
        </Text>
      </View>
      <Text style={styles.ledgerArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderLedgerSelectScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>選擇帳本</Text>
      </View>

      <View style={styles.ledgerListContainer}>
        <FlatList
          data={ledgers}
          renderItem={renderLedgerItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ledgerListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewLedgerModal(true)}
      >
        <Text style={styles.addButtonText}>+ 新增帳本</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('ledgerSelect')}>
          <Text style={styles.backButton}>← 帳本</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentLedger?.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setCurrentScreen('stats')}
          >
            <Text style={styles.headerButtonText}>統計</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setCurrentScreen('ledgerSelect')}
          >
            <Text style={styles.headerButtonText}>切換帳本</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>帳本總覽</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>餘額</Text>
          <Text style={[styles.balanceAmount, balance >= 0 ? styles.incomeText : styles.expenseText]}>
            {formatCurrency(balance)}
          </Text>
        </View>
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

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>最近交易</Text>
        <FlatList
          data={currentLedger?.transactions || []}
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

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setCurrentScreen('add')}
      >
        <Text style={styles.addButtonText}>+ 新增交易</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>新增交易</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              newTransaction.type === 'expense' && styles.typeButtonActive
            ]}
            onPress={() => setNewTransaction({...newTransaction, type: 'expense'})}
          >
            <Text style={[
              styles.typeButtonText,
              newTransaction.type === 'expense' && styles.typeButtonTextActive
            ]}>支出</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              newTransaction.type === 'income' && styles.typeButtonActive
            ]}
            onPress={() => setNewTransaction({...newTransaction, type: 'income'})}
          >
            <Text style={[
              styles.typeButtonText,
              newTransaction.type === 'income' && styles.typeButtonTextActive
            ]}>收入</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="金額"
          value={newTransaction.amount}
          onChangeText={(text) => setNewTransaction({...newTransaction, amount: text})}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="描述"
          value={newTransaction.description}
          onChangeText={(text) => setNewTransaction({...newTransaction, description: text})}
        />

        <Text style={styles.label}>分類</Text>
        <View style={styles.categoryGrid}>
          {categories[newTransaction.type].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                newTransaction.category === category && styles.categoryButtonActive
              ]}
              onPress={() => setNewTransaction({...newTransaction, category})}
            >
              <Text style={[
                styles.categoryButtonText,
                newTransaction.category === category && styles.categoryButtonTextActive
              ]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={addTransaction}>
          <Text style={styles.saveButtonText}>儲存</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStatsScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>統計</Text>
      </View>

      <View style={styles.statsScreenContainer}>
        <Text style={styles.sectionTitle}>本月統計</Text>
        
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>總收入</Text>
          <Text style={styles.incomeText}>{formatCurrency(totalIncome)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>總支出</Text>
          <Text style={styles.expenseText}>{formatCurrency(totalExpense)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>淨額</Text>
          <Text style={[styles.statValue, balance >= 0 ? styles.incomeText : styles.expenseText]}>
            {formatCurrency(balance)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderNewLedgerModal = () => (
    <Modal
      visible={showNewLedgerModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNewLedgerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>新增帳本</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="帳本名稱"
            value={newLedgerName}
            onChangeText={setNewLedgerName}
            autoFocus={true}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => {
                setShowNewLedgerModal(false);
                setNewLedgerName('');
              }}
            >
              <Text style={styles.modalButtonCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={addLedger}
            >
              <Text style={styles.modalButtonConfirmText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {currentScreen === 'ledgerSelect' && renderLedgerSelectScreen()}
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'add' && renderAddScreen()}
      {currentScreen === 'stats' && renderStatsScreen()}
      
      {renderNewLedgerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    fontSize: 16,
    color: '#007bff',
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 10,
  },
  summary: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  incomeText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0056b3',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6c757d',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsScreenContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statCardLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ledgerList: {
    padding: 20,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  ledgerDetails: {
    fontSize: 14,
    color: '#6c757d',
  },
  ledgerArrow: {
    fontSize: 20,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalButtonConfirm: {
    backgroundColor: '#007bff',
  },
  modalButtonCancelText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirmText: {
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
    color: '#3498DB',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20, // Add some padding at the bottom for the footer
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  headerButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100, // 為固定按鈕留出空間
  },
  ledgerListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100, // 為固定按鈕留出空間
    marginTop: 20,
  },
  ledgerListContent: {
    paddingBottom: 20,
  },
});

export default App;
