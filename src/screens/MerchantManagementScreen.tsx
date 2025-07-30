import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { NavigationProps } from '../types';
import { Merchant } from '../types';
import { 
  loadMerchants, 
  addMerchant, 
  updateMerchant, 
  deleteMerchant 
} from '../utils/merchantService';

const MerchantManagementScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  
  // 新增商家相關狀態
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantCode, setNewMerchantCode] = useState('');
  const [newMerchantDescription, setNewMerchantDescription] = useState('');
  
  // 編輯商家相關狀態
  const [editMerchantName, setEditMerchantName] = useState('');
  const [editMerchantCode, setEditMerchantCode] = useState('');
  const [editMerchantDescription, setEditMerchantDescription] = useState('');

  // 載入商家列表
  useEffect(() => {
    loadMerchantsList();
  }, []);

  const loadMerchantsList = async () => {
    try {
      const merchantsList = await loadMerchants();
      setMerchants(merchantsList);
    } catch (error) {
      Alert.alert('錯誤', '載入商家列表失敗');
    }
  };

  const handleAddMerchant = async () => {
    if (!newMerchantName.trim() || !newMerchantCode.trim()) {
      Alert.alert('錯誤', '請填寫商家名稱和代碼');
      return;
    }

    try {
      await addMerchant({
        name: newMerchantName.trim(),
        code: newMerchantCode.trim().toUpperCase(),
        description: newMerchantDescription.trim() || undefined,
      });
      
      setShowAddModal(false);
      setNewMerchantName('');
      setNewMerchantCode('');
      setNewMerchantDescription('');
      loadMerchantsList();
      Alert.alert('成功', '商家新增成功！');
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '新增商家失敗');
    }
  };

  const handleEditMerchant = async () => {
    if (!selectedMerchant || !editMerchantName.trim() || !editMerchantCode.trim()) {
      Alert.alert('錯誤', '請填寫商家名稱和代碼');
      return;
    }

    try {
      await updateMerchant(selectedMerchant.id, {
        name: editMerchantName.trim(),
        code: editMerchantCode.trim().toUpperCase(),
        description: editMerchantDescription.trim() || undefined,
      });
      
      setShowEditModal(false);
      setSelectedMerchant(null);
      setEditMerchantName('');
      setEditMerchantCode('');
      setEditMerchantDescription('');
      loadMerchantsList();
      Alert.alert('成功', '商家更新成功！');
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '更新商家失敗');
    }
  };

  const handleDeleteMerchant = (merchant: Merchant) => {
    Alert.alert(
      '確認刪除',
      `確定要刪除商家「${merchant.name}」嗎？\n此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMerchant(merchant.id);
              loadMerchantsList();
              Alert.alert('成功', '商家刪除成功！');
            } catch (error: any) {
              Alert.alert('錯誤', error.message || '刪除商家失敗');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setEditMerchantName(merchant.name);
    setEditMerchantCode(merchant.code);
    setEditMerchantDescription(merchant.description || '');
    setShowEditModal(true);
  };

  const renderMerchantItem = ({ item }: { item: Merchant }) => (
    <View style={styles.merchantItem}>
      <View style={styles.merchantInfo}>
        <Text style={styles.merchantName}>{item.name}</Text>
        <Text style={styles.merchantCode}>代碼: {item.code}</Text>
        {item.description && (
          <Text style={styles.merchantDescription}>{item.description}</Text>
        )}
        <Text style={styles.merchantDate}>
          建立時間: {item.createdAt.toLocaleDateString('zh-TW')}
        </Text>
      </View>
      <View style={styles.merchantActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionButtonText}>編輯</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteMerchant(item)}
        >
          <Text style={styles.actionButtonText}>刪除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('mainSelect')}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>商家管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ 新增</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={merchants}
        renderItem={renderMerchantItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      {/* 新增商家 Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新增商家</Text>
            
            <TextInput
              style={styles.input}
              placeholder="商家名稱"
              value={newMerchantName}
              onChangeText={setNewMerchantName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="商家代碼"
              value={newMerchantCode}
              onChangeText={setNewMerchantCode}
              autoCapitalize="characters"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="商家描述 (選填)"
              value={newMerchantDescription}
              onChangeText={setNewMerchantDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewMerchantName('');
                  setNewMerchantCode('');
                  setNewMerchantDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddMerchant}
              >
                <Text style={styles.confirmButtonText}>新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 編輯商家 Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>編輯商家</Text>
            
            <TextInput
              style={styles.input}
              placeholder="商家名稱"
              value={editMerchantName}
              onChangeText={setEditMerchantName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="商家代碼"
              value={editMerchantCode}
              onChangeText={setEditMerchantCode}
              autoCapitalize="characters"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="商家描述 (選填)"
              value={editMerchantDescription}
              onChangeText={setEditMerchantDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedMerchant(null);
                  setEditMerchantName('');
                  setEditMerchantCode('');
                  setEditMerchantDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEditMerchant}
              >
                <Text style={styles.confirmButtonText}>更新</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingHorizontal: 16,
  },
  merchantItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  merchantInfo: {
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  merchantCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  merchantDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  merchantDate: {
    fontSize: 12,
    color: '#999',
  },
  merchantActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  actionButton: {
    flex: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MerchantManagementScreen; 