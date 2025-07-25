import React, { useState } from 'react';
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
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NavigationProps } from '../types';
import { getProductCategories, getProductsByCategory, generateBarcode } from '../utils/productParser';

const ProductManagementScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ code: string; name: string } | null>(null);
  const [productionDate, setProductionDate] = useState('');

  const categories = getProductCategories();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleProductSelect = (code: string, name: string) => {
    setSelectedProduct({ code, name });
    setShowBarcodeModal(true);
  };

  const generateProductBarcode = () => {
    if (!selectedProduct || !productionDate.trim()) {
      Alert.alert('錯誤', '請輸入生產日期');
      return;
    }

    // 驗證日期格式 (YYYYMMDD)
    const datePattern = /^\d{8}$/;
    if (!datePattern.test(productionDate)) {
      Alert.alert('錯誤', '生產日期格式應為：YYYYMMDD');
      return;
    }

    const barcode = generateBarcode(selectedCategory, selectedProduct.code, productionDate);
    Alert.alert(
      '產品條碼',
      `條碼：${barcode}\n\n產品：${selectedProduct.name}\n類別：${categories[selectedCategory]}\n生產日期：${productionDate}`,
      [
        { 
          text: '複製條碼', 
          onPress: () => {
            Clipboard.setString(barcode);
            Alert.alert('成功', '條碼已複製到剪貼簿！');
          }
        },
        { text: '確定', style: 'cancel' }
      ]
    );
    setShowBarcodeModal(false);
    setProductionDate('');
  };

  const renderCategoryItem = (categoryCode: string, categoryName: string) => (
    <TouchableOpacity
      key={categoryCode}
      style={[
        styles.categoryItem,
        selectedCategory === categoryCode && styles.categoryItemActive
      ]}
      onPress={() => handleCategorySelect(categoryCode)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === categoryCode && styles.categoryTextActive
      ]}>
        {categoryName}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = (code: string, name: string) => (
    <TouchableOpacity
      key={code}
      style={styles.productItem}
      onPress={() => handleProductSelect(code, name)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productCode}>{code}</Text>
        <Text style={styles.productName}>{name}</Text>
      </View>
      <Text style={styles.productArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('posSystem')}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>產品管理</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>選擇產品類別</Text>
          <View style={styles.categoriesContainer}>
            {Object.entries(categories).map(([code, name]) => 
              renderCategoryItem(code, name)
            )}
          </View>
        </View>

        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {categories[selectedCategory]} - 產品列表
            </Text>
            <View style={styles.productsContainer}>
              {Object.entries(getProductsByCategory(selectedCategory)).map(([code, name]) => 
                renderProductItem(code, name)
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 生成條碼 Modal */}
      <Modal
        visible={showBarcodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>生成產品條碼</Text>
            
            {selectedProduct && (
              <View style={styles.productDisplay}>
                <Text style={styles.productDisplayLabel}>產品資訊:</Text>
                <Text style={styles.productDisplayText}>
                  {selectedProduct.name} ({selectedProduct.code})
                </Text>
                <Text style={styles.productDisplayText}>
                  類別: {categories[selectedCategory]}
                </Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>生產日期 (YYYYMMDD):</Text>
              <TextInput
                style={styles.dateInput}
                value={productionDate}
                onChangeText={setProductionDate}
                placeholder="例如: 20250724"
                keyboardType="numeric"
                maxLength={8}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowBarcodeModal(false);
                  setProductionDate('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={generateProductBarcode}
              >
                <Text style={styles.modalButtonConfirmText}>生成條碼</Text>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryItemActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productCode: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  productArrow: {
    fontSize: 18,
    color: '#6c757d',
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  productDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  productDisplayLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  productDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
});

export default ProductManagementScreen; 