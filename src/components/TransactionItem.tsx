import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { defaultCategories } from '../utils/categories';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const category = defaultCategories.find(c => c.id === transaction.category);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: category?.color || '#ccc' }]}>
          <Text style={styles.icon}>{category?.icon || '📝'}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.category}>{category?.name || '其他'}</Text>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={[
          styles.amount,
          { color: transaction.type === 'income' ? '#2ECC71' : '#E74C3C' }
        ]}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransactionItem; 