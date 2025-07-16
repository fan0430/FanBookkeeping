import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Transaction } from '../types';
import { formatCurrency, calculateTotal } from '../utils/helpers';
import { defaultCategories } from '../utils/categories';

interface StatsScreenProps {
  navigation: any;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 模擬數據
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      { id: '1', amount: 150, type: 'expense', category: '1', description: '午餐', date: new Date() },
      { id: '2', amount: 50000, type: 'income', category: '9', description: '月薪', date: new Date() },
      { id: '3', amount: 200, type: 'expense', category: '2', description: '計程車', date: new Date() },
      { id: '4', amount: 300, type: 'expense', category: '3', description: '購物', date: new Date() },
      { id: '5', amount: 1000, type: 'expense', category: '4', description: '電影', date: new Date() },
    ];
    setTransactions(mockTransactions);
  }, []);

  const totalIncome = calculateTotal(transactions, 'income');
  const totalExpense = calculateTotal(transactions, 'expense');

  const getCategoryStats = (type: 'income' | 'expense') => {
    const filteredTransactions = transactions.filter(t => t.type === type);
    const categoryMap = new Map<string, number>();

    filteredTransactions.forEach(transaction => {
      const current = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, current + transaction.amount);
    });

    return Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
      const category = defaultCategories.find(c => c.id === categoryId);
      return {
        category,
        amount,
        percentage: (amount / (type === 'income' ? totalIncome : totalExpense)) * 100
      };
    }).sort((a, b) => b.amount - a.amount);
  };

  const expenseStats = getCategoryStats('expense');
  const incomeStats = getCategoryStats('income');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 總覽 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>本月統計</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>總收入</Text>
              <Text style={[styles.summaryAmount, { color: '#2ECC71' }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>總支出</Text>
              <Text style={[styles.summaryAmount, { color: '#E74C3C' }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* 支出分類統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支出分類</Text>
          {expenseStats.map((stat, index) => (
            <View key={index} style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: stat.category?.color || '#ccc' }]}>
                  <Text style={styles.icon}>{stat.category?.icon || '📝'}</Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.categoryName}>{stat.category?.name || '其他'}</Text>
                  <Text style={styles.statAmount}>{formatCurrency(stat.amount)}</Text>
                </View>
              </View>
              <Text style={styles.percentage}>{stat.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {/* 收入分類統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入分類</Text>
          {incomeStats.map((stat, index) => (
            <View key={index} style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: stat.category?.color || '#ccc' }]}>
                  <Text style={styles.icon}>{stat.category?.icon || '📝'}</Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.categoryName}>{stat.category?.name || '其他'}</Text>
                  <Text style={styles.statAmount}>{formatCurrency(stat.amount)}</Text>
                </View>
              </View>
              <Text style={styles.percentage}>{stat.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  statInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
  },
});

export default StatsScreen; 