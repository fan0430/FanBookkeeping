import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NavigationProps } from '../types';

const MainSelectScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const handleLedgerSelect = () => {
    navigation.navigate('ledgerSelect');
  };

  const handlePOSSelect = () => {
    navigation.navigate('posSystem');
  };

  const handleMerchantManagement = () => {
    navigation.navigate('merchantManagement');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FanBookkeeping</Text>
        <Text style={styles.subtitle}>選擇功能</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.optionButton, styles.ledgerButton]}
          onPress={handleLedgerSelect}
        >
          <Text style={styles.optionIcon}>📊</Text>
          <Text style={styles.optionTitle}>帳本</Text>
          <Text style={styles.optionDescription}>
            管理您的收支記錄，查看統計報表
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.posButton]}
          onPress={handlePOSSelect}
        >
          <Text style={styles.optionIcon}>📱</Text>
          <Text style={styles.optionTitle}>POS系統</Text>
          <Text style={styles.optionDescription}>
            掃描條碼，快速記錄交易
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.merchantButton]}
          onPress={handleMerchantManagement}
        >
          <Text style={styles.optionIcon}>🏪</Text>
          <Text style={styles.optionTitle}>商家管理</Text>
          <Text style={styles.optionDescription}>
            管理商家資訊，設定產品分類
          </Text>
        </TouchableOpacity>
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
    padding: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  buttonContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ledgerButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  posButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  merchantButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  optionDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MainSelectScreen; 