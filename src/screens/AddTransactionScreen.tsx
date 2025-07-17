import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProps, Transaction } from '../types';
import { useData } from '../context/DataContext';
import { generateId } from '../utils/helpers';
import { getCategoriesByType } from '../utils/categories';

const AddTransactionScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { addTransaction } = useData();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 驗證金額輸入，只允許數字和小數點
  const handleAmountChange = (text: string) => {
    // 只允許數字和一個小數點
    const numericText = text.replace(/[^0-9.]/g, '');
    
    // 確保只有一個小數點
    const parts = numericText.split('.');
    if (parts.length > 2) {
      return; // 如果有多個小數點，不更新
    }
    
    // 限制小數位數為2位
    if (parts.length === 2 && parts[1].length > 2) {
      return; // 如果小數位數超過2位，不更新
    }
    
    setAmount(numericText);
  };

  const categories = getCategoriesByType(type);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleSave = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('錯誤', '請填寫所有必要欄位');
      return;
    }

    const newTransaction: Transaction = {
      id: generateId(),
      amount: parseFloat(amount),
      type,
      category: selectedCategory,
      description,
      date: selectedDate,
    };

    try {
      await addTransaction(newTransaction);
          Alert.alert('成功', '交易已新增', [
      { text: '確定', onPress: () => navigation.navigate('home') }
    ]);
    } catch (error) {
      Alert.alert('錯誤', '新增交易失敗');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('home')}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>新增交易</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>儲存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 類型選擇 */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'expense' && styles.typeButtonTextActive
            ]}>
              支出
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.typeButtonActive
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'income' && styles.typeButtonTextActive
            ]}>
              收入
            </Text>
          </TouchableOpacity>
        </View>

        {/* 金額輸入 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>金額</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
          />
        </View>

        {/* 描述輸入 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="輸入交易描述"
          />
        </View>

        {/* 日期選擇 - 測試版本 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>日期選擇</Text>
          <View style={styles.testDateContainer}>
            <Text style={styles.testDateText}>當前日期: {formatDate(selectedDate)}</Text>
            <TouchableOpacity
              style={styles.testDateButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.testDateButtonText}>點擊選擇日期</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 分類選擇 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>分類</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  saveButton: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3498DB',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  testDateContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3498DB',
    borderStyle: 'dashed',
  },
  testDateText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  testDateButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  testDateButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'white',
  },
});

export default AddTransactionScreen; 