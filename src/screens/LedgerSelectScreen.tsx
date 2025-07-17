import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NavigationProps, Ledger } from '../types';
import { useData } from '../context/DataContext';

const LedgerSelectScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { ledgers, setCurrentLedger, addLedger, deleteLedger, moveLedger } = useData();
  const [showNewLedgerModal, setShowNewLedgerModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerNote, setNewLedgerNote] = useState('');

  // 計算帳本餘額
  const calculateBalance = (ledger: Ledger): number => {
    return ledger.transactions.reduce((balance, transaction) => {
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      } else {
        return balance - transaction.amount;
      }
    }, 0);
  };

  const handleSelectLedger = (ledger: Ledger) => {
    setCurrentLedger(ledger);
    navigation.navigate('home');
  };

  const handleLongPressLedger = (ledger: Ledger) => {
    setSelectedLedger(ledger);
    setShowActionModal(true);
  };

  const handleMoveLedger = (action: 'first' | 'prev' | 'next' | 'last') => {
    if (!selectedLedger) return;
    
    try {
      moveLedger(selectedLedger.id, action);
      setShowMoveModal(false);
      setShowActionModal(false);
      setSelectedLedger(null);
    } catch (error) {
      Alert.alert('錯誤', '移動帳本失敗');
    }
  };

  const handleDeleteLedger = () => {
    if (!selectedLedger) return;
    
    setShowActionModal(false);
    Alert.alert(
      '確認刪除',
      `確定要刪除「${selectedLedger.name}」嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLedger(selectedLedger.id);
              setSelectedLedger(null);
            } catch (error) {
              Alert.alert('錯誤', '刪除帳本失敗');
            }
          },
        },
      ]
    );
  };

  const handleAddLedger = async () => {
    if (!newLedgerName.trim()) {
      Alert.alert('錯誤', '請輸入帳本名稱');
      return;
    }

    try {
      await addLedger(newLedgerName, newLedgerNote);
      setNewLedgerName('');
      setNewLedgerNote('');
      setShowNewLedgerModal(false);
      Alert.alert('成功', '帳本已新增');
    } catch (error) {
      Alert.alert('錯誤', '新增帳本失敗');
    }
  };

  const renderLedgerItem = ({ item }: { item: Ledger }) => {
    const balance = calculateBalance(item);
    const balanceColor = balance >= 0 ? '#28a745' : '#dc3545';
    
    return (
      <TouchableOpacity
        style={styles.ledgerItem}
        onPress={() => handleSelectLedger(item)}
        onLongPress={() => handleLongPressLedger(item)}
      >
        <View style={styles.ledgerInfo}>
          <Text style={styles.ledgerName}>{item.name}</Text>
          <Text style={styles.ledgerDetails}>
            {item.transactions.length} 筆交易 • 建立於 {item.createdAt.toLocaleDateString('zh-TW')}
          </Text>
          {item.note && (
            <Text style={styles.ledgerNote} numberOfLines={2}>
              {item.note}
            </Text>
          )}
          <Text style={[styles.ledgerBalance, { color: balanceColor }]}>
            餘額: {balance >= 0 ? '+' : ''}{balance.toLocaleString()} 元
          </Text>
        </View>
        <Text style={styles.ledgerArrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>選擇帳本</Text>
      </View>

      <FlatList
        data={ledgers}
        renderItem={renderLedgerItem}
        keyExtractor={(item) => item.id}
        style={styles.ledgerList}
        contentContainerStyle={styles.ledgerListContent}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewLedgerModal(true)}
      >
        <Text style={styles.addButtonText}>+ 新增帳本</Text>
      </TouchableOpacity>

      {/* 新增帳本 Modal */}
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
            <TextInput
              style={styles.modalInput}
              placeholder="帳本備註 (選填)"
              value={newLedgerNote}
              onChangeText={setNewLedgerNote}
              multiline={true}
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowNewLedgerModal(false);
                  setNewLedgerName('');
                  setNewLedgerNote('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddLedger}
              >
                <Text style={styles.modalButtonConfirmText}>新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 帳本操作選單 Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>
              {selectedLedger?.name}
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowActionModal(false);
                setShowMoveModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>移動帳本</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeleteLedger}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>刪除帳本</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setShowActionModal(false);
                setSelectedLedger(null);
              }}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 移動帳本選單 Modal */}
      <Modal
        visible={showMoveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.moveModalContent}>
            <Text style={styles.moveModalTitle}>移動帳本</Text>
            
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => handleMoveLedger('first')}
            >
              <Text style={styles.moveButtonText}>移到第一筆</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => handleMoveLedger('prev')}
            >
              <Text style={styles.moveButtonText}>往前一筆</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => handleMoveLedger('next')}
            >
              <Text style={styles.moveButtonText}>往後一筆</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => handleMoveLedger('last')}
            >
              <Text style={styles.moveButtonText}>移到最後面</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.moveButton, styles.cancelButton]}
              onPress={() => {
                setShowMoveModal(false);
                setSelectedLedger(null);
              }}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  ledgerList: {
    flex: 1,
  },
  ledgerListContent: {
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
  ledgerNote: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  ledgerBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  ledgerArrow: {
    fontSize: 20,
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
    marginBottom: 15,
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
  // 新增的樣式
  actionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  deleteButtonText: {
    color: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  moveModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  moveModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  moveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  moveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default LedgerSelectScreen; 