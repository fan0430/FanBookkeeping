import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
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
  },
  settingArrow: {
    fontSize: 18,
    color: '#BDC3C7',
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