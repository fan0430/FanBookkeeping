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
import { clearAllProductData, testClearFunctionSafety, checkGoogleFormSettingsIntegrity } from '../utils/productParser';

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

  const handleClearProductData = async () => {
    Alert.alert(
      '清除商品資料',
      '確定要清除所有商品類別和商品嗎？\n\n注意：此操作只會清除商品相關資料，不會影響 Google 表單的交易紀錄。此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '確定清除', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const result = await clearAllProductData();
              if (result.success) {
                Alert.alert('清除成功', `${result.message}\n\n${result.details}`);
              } else {
                Alert.alert('清除失敗', `${result.message}\n\n${result.details}`);
              }
            } catch (error) {
              Alert.alert('清除失敗', '清除商品資料時發生錯誤');
            }
          }
        }
      ]
    );
  };

  const handleTestClearFunction = async () => {
    Alert.alert(
      '測試清除功能安全性',
      '此功能將測試清除功能是否只清除商品資料，而不影響其他資料（如 Google 表單設定）。\n\n測試過程中會執行一次清除操作，請確認您已備份重要資料。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '開始測試', 
          style: 'default', 
          onPress: async () => {
            try {
              Alert.alert('測試開始', '正在執行清除功能安全性測試，請查看控制台日誌...');
              await testClearFunctionSafety();
              Alert.alert('測試完成', '測試已完成，請查看控制台日誌了解詳細結果。');
            } catch (error) {
              Alert.alert('測試失敗', '測試過程中發生錯誤');
            }
          }
        }
      ]
    );
  };

  const handleCheckGoogleFormSettings = async () => {
    try {
      Alert.alert('檢查中', '正在檢查 Google 表單設定完整性...');
      
      const result = await checkGoogleFormSettingsIntegrity();
      
      let message = 'Google 表單設定完整性檢查結果:\n\n';
      message += result.details;
      
      if (result.recommendations.length > 0) {
        message += '\n\n💡 建議:\n';
        result.recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec}\n`;
        });
      }
      
      Alert.alert(
        result.spreadsheetSettingsIntact ? '✅ 設定完整' : '❌ 設定缺失',
        message
      );
      
    } catch (error) {
      Alert.alert('檢查失敗', '檢查 Google 表單設定完整性時發生錯誤');
    }
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

        {/* 商品資料管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品資料管理</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingText}>匯出商品資料</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleBackupData}>
            <Text style={styles.settingText}>備份商品資料</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearProductData}>
            <Text style={[styles.settingText, { color: '#E74C3C' }]}>清除商品資料</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleTestClearFunction}>
            <Text style={[styles.settingText, { color: '#3498DB' }]}>測試清除功能安全性</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleCheckGoogleFormSettings}>
            <Text style={[styles.settingText, { color: '#27AE60' }]}>檢查 Google 表單設定</Text>
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