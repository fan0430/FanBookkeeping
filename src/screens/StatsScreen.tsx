import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NavigationProps } from '../types';
import { useData } from '../context/DataContext';

const StatsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { currentLedger } = useData();

  if (!currentLedger) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>統計</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>沒有帳本資料</Text>
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

  const incomeCount = currentLedger.transactions.filter(t => t.type === 'income').length;
  const expenseCount = currentLedger.transactions.filter(t => t.type === 'expense').length;

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={() => navigation.navigate('home')}>
          ← 返回
        </Text>
        <Text style={styles.title}>統計</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>

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

        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>交易筆數</Text>
          <Text style={styles.statValue}>{currentLedger.transactions.length} 筆</Text>
          <Text style={styles.statSubText}>
            收入 {incomeCount} 筆，支出 {expenseCount} 筆
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>帳本名稱</Text>
          <Text style={styles.statValue}>{currentLedger.name}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>建立時間</Text>
          <Text style={styles.statValue}>
            {currentLedger.createdAt.toLocaleDateString('zh-TW')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
  },
  statCardLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
    lineHeight: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    lineHeight: 32,
  },
  statSubText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
    lineHeight: 24,
  },
  incomeText: {
    color: '#28a745',
  },
  expenseText: {
    color: '#dc3545',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
  },
});

export default StatsScreen; 