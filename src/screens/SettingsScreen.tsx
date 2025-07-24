import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useData } from '../context/DataContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { appSettings, updateAppSettings } = useData();
  const [showDefaultScreenModal, setShowDefaultScreenModal] = useState(false);

  const handleExportData = () => {
    Alert.alert('匯出數據', '數據匯出功能即將推出');
  };

  const handleBackupData = () => {
    Alert.alert('備份數據', '數據備份功能即將推出');
  };

  const handleClearData = () => {
    Alert.alert(
      '清除數據',
      '確定要清除所有數據嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', style: 'destructive', onPress: () => Alert.alert('成功', '數據已清除') }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert('關於', 'FanBookkeeping v1.0.0\n\n一個簡單易用的記帳應用程式');
  };

  const handleDefaultScreenSelect = (screen: 'mainSelect' | 'ledgerSelect' | 'posSystem') => {
    updateAppSettings({ defaultScreen: screen });
    setShowDefaultScreenModal(false);
  };

  const getDefaultScreenText = () => {
    switch (appSettings.defaultScreen) {
      case 'mainSelect':
        return '主選擇頁面';
      case 'ledgerSelect':
        return '帳本選擇';
      case 'posSystem':
        return 'POS系統';
      default:
        return '主選擇頁面';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>設定</Text>

        {/* 數據管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>數據管理</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingText}>匯出數據</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleBackupData}>
            <Text style={styles.settingText}>備份數據</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <Text style={[styles.settingText, { color: '#E74C3C' }]}>清除所有數據</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 應用程式設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>應用程式</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowDefaultScreenModal(true)}
          >
            <Text style={styles.settingText}>預設頁面</Text>
            <Text style={styles.settingValue}>{getDefaultScreenText()}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <Text style={styles.settingText}>關於</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>版本 1.0.0</Text>
        </View>
      </ScrollView>

      {/* 預設頁面選擇 Modal */}
      <Modal
        visible={showDefaultScreenModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDefaultScreenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>選擇預設頁面</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleDefaultScreenSelect('mainSelect')}
            >
              <Text style={styles.modalOptionText}>主選擇頁面</Text>
              {appSettings.defaultScreen === 'mainSelect' && (
                <Text style={styles.modalOptionCheck}>✓</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleDefaultScreenSelect('ledgerSelect')}
            >
              <Text style={styles.modalOptionText}>帳本選擇</Text>
              {appSettings.defaultScreen === 'ledgerSelect' && (
                <Text style={styles.modalOptionCheck}>✓</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleDefaultScreenSelect('posSystem')}
            >
              <Text style={styles.modalOptionText}>POS系統</Text>
              {appSettings.defaultScreen === 'posSystem' && (
                <Text style={styles.modalOptionCheck}>✓</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowDefaultScreenModal(false)}
            >
              <Text style={styles.modalCancelText}>取消</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: '#7F8C8D',
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 18,
    color: '#BDC3C7',
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
    width: '90%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#212529',
  },
  modalOptionCheck: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
  },
  modalCancel: {
    backgroundColor: '#fff',
    borderColor: '#6c757d',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    width: '100%',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default SettingsScreen; 