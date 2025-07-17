import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { NavigationProps } from '../types';
import { useData } from '../context/DataContext';
import { defaultCategories } from '../utils/categories';

interface ChartDataItem {
  key: string;
  amount: number;
  color: string;
  category: string;
  percentage: number;
  startAngle: number;
  endAngle: number;
}

const { width } = Dimensions.get('window');
const chartSize = width - 80;
const radius = chartSize / 2 - 20;
const center = chartSize / 2;

const StatsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { currentLedger, updateLedger } = useData();
  const [editingField, setEditingField] = useState<'name' | 'note' | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleLongPress = (field: 'name' | 'note') => {
    if (!currentLedger) return;
    
    const currentValue = field === 'name' ? currentLedger.name : (currentLedger.note || '');
    setEditValue(currentValue);
    setEditingField(field);
  };

  const handleSave = async () => {
    if (!currentLedger || !editingField) return;

    try {
      const updates = editingField === 'name' 
        ? { name: editValue.trim() }
        : { note: editValue.trim() };
      
      await updateLedger(currentLedger.id, updates);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      Alert.alert('錯誤', '更新失敗，請重試');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

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

  // 計算收入分類統計
  const calculateChartData = (type: 'income' | 'expense', total: number): ChartDataItem[] => {
    const categories = defaultCategories.filter(cat => cat.type === type);
    const data = categories
      .map(category => {
        const amount = currentLedger.transactions
          .filter(t => t.type === type && t.category === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          key: category.id,
          amount,
          color: category.color,
          category: category.name,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .filter(item => item.amount > 0);

    // 計算角度
    let currentAngle = -90; // 從12開始
    return data.map(item => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      return {
        ...item,
        startAngle,
        endAngle,
      };
    });
  };

  const incomeStats = calculateChartData('income', totalIncome);
  const expenseStats = calculateChartData('expense', totalExpense);

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  // 將角度轉換為弧度
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  // 計算圓弧上的點座標
  const getPointOnCircle = (angle: number, radius: number) => {
    const rad = toRadians(angle);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  // 繪製圓餅圖的扇形
  const renderPieSlice = (item: ChartDataItem, index: number) => {
    // 如果角度為 0 或 360度，直接畫一個完整的圓
    if (item.endAngle - item.startAngle >= 360) {
      return (
        <Circle
          key={index}
          cx={center}
          cy={center}
          r={radius}
          fill={item.color}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }

    const startPoint = getPointOnCircle(item.startAngle, radius);
    const endPoint = getPointOnCircle(item.endAngle, radius);
    
    // 判斷是否需要畫大弧（角度大於180度）
    const largeArcFlag = item.endAngle - item.startAngle > 180 ? 1 : 0   
    // 構建 Path 的 d 屬性
    const pathData = [
      `M ${center} ${center}`, // 移動到圓心
      `L ${startPoint.x} ${startPoint.y}`, // 畫線到起始點
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`, // 畫弧到結束點
      'Z', // 閉合路徑
    ].join(' ');
    
    return (
      <Path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
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

          {/* 收入圓餅圖 */}
          {incomeStats.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>收入分類比例</Text>
              <View style={styles.chartContainer}>
                <Svg width={chartSize} height={chartSize}>
                  <G>
                    {incomeStats.map((item, index) => renderPieSlice(item, index))}
                  </G>
                </Svg>
              </View>
              <View style={styles.legendContainer}>
                {incomeStats.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.category} ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>收入分類比例</Text>
              <Text style={styles.debugText}>
                沒有收入資料
              </Text>
              <Text style={styles.debugText}>
                總收入: {formatCurrency(totalIncome)}
              </Text>
              <Text style={styles.debugText}>
                收入交易數: {incomeCount}
              </Text>
              <Text style={styles.debugText}>
                收入分類數: {incomeStats.length}
              </Text>
            </View>
          )}

          {/* 支出圓餅圖 */}
          {expenseStats.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>支出分類比例</Text>
              <View style={styles.chartContainer}>
                <Svg width={chartSize} height={chartSize}>
                  <G>
                    {expenseStats.map((item, index) => renderPieSlice(item, index))}
                  </G>
                </Svg>
              </View>
              <View style={styles.legendContainer}>
                {expenseStats.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.category} ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>支出分類比例</Text>
              <Text style={styles.debugText}>
                沒有支出資料
              </Text>
              <Text style={styles.debugText}>
                總支出: {formatCurrency(totalExpense)}
              </Text>
              <Text style={styles.debugText}>
                支出交易數: {expenseCount}
              </Text>
              <Text style={styles.debugText}>
                支出分類數: {expenseStats.length}
              </Text>
            </View>
          )}

          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>帳本名稱</Text>
            {editingField === 'name' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="輸入帳本名稱"
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editButton} onPress={handleSave}>
                    <Text style={styles.editButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={handleCancel}>
                    <Text style={styles.editButtonText}>✗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onLongPress={() => handleLongPress('name')}>
                <Text style={styles.statValue}>{currentLedger.name}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>建立時間</Text>
            <Text style={styles.statValue}>
              {currentLedger.createdAt.toLocaleDateString('zh-TW')}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>帳本備註</Text>
            {editingField === 'note' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, { fontSize: 16, fontStyle: 'italic' }]}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="輸入帳本備註"
                  multiline
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editButton} onPress={handleSave}>
                    <Text style={styles.editButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={handleCancel}>
                    <Text style={styles.editButtonText}>✗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onLongPress={() => handleLongPress('note')}>
                <Text style={styles.noteText}>
                  {currentLedger.note || '無'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
  scrollContent: {
    paddingBottom: 20, // Added paddingBottom to the scroll content
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
    // paddingBottom: 20,
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
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '33%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  debugText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 10,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  editInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
  },
  editButtons: {
    flexDirection: 'row',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StatsScreen; 