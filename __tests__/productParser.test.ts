/**
 * @format
 */

import 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAllCustomCategories,
  clearAllCustomProducts,
  clearAllProductData,
  saveCustomCategory,
  saveCustomProduct,
  getCustomCategories,
  getCustomProducts
} from '../src/utils/productParser';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Product Parser Clear Functions', () => {
  beforeEach(() => {
    // 清除所有 mock 的調用記錄
    jest.clearAllMocks();
  });

  describe('clearAllCustomCategories', () => {
    it('should clear all custom categories successfully', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockResolvedValue();

      const result = await clearAllCustomCategories();

      expect(result).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_categories');
    });

    it('should handle errors when clearing categories', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockRejectedValue(new Error('Storage error'));

      const result = await clearAllCustomCategories();

      expect(result).toBe(false);
    });
  });

  describe('clearAllCustomProducts', () => {
    it('should clear all custom products successfully', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockResolvedValue();

      const result = await clearAllCustomProducts();

      expect(result).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_products');
    });

    it('should handle errors when clearing products', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockRejectedValue(new Error('Storage error'));

      const result = await clearAllCustomProducts();

      expect(result).toBe(false);
    });
  });

  describe('clearAllProductData', () => {
    it('should clear both categories and products successfully', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockResolvedValue();

      const result = await clearAllProductData();

      expect(result.success).toBe(true);
      expect(result.message).toBe('所有商品類別和商品已成功清除');
      expect(mockRemoveItem).toHaveBeenCalledTimes(2);
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_categories');
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_products');
    });

    it('should handle partial failure when clearing data', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem
        .mockResolvedValueOnce() // 第一次調用成功（清除類別）
        .mockRejectedValueOnce(new Error('Storage error')); // 第二次調用失敗（清除產品）

      const result = await clearAllProductData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('清除過程中發生錯誤，部分資料可能未完全清除');
    });

    it('should handle complete failure when clearing data', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
      mockRemoveItem.mockRejectedValue(new Error('Storage error'));

      const result = await clearAllProductData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('清除過程中發生錯誤，部分資料可能未完全清除');
    });
  });

  describe('Integration test', () => {
    it('should save and then clear custom data completely', async () => {
      // 先保存一些測試資料
      const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
      const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;

      // Mock 保存操作
      mockSetItem.mockResolvedValue();
      
      // Mock 讀取操作 - 模擬有資料存在
      mockGetItem
        .mockResolvedValueOnce(JSON.stringify({ 'TEST': '測試類別' })) // 讀取類別
        .mockResolvedValueOnce(JSON.stringify({ '999': { 'TEST': { '001': { name: '測試產品', productId: 'TEST001' } } } })); // 讀取產品

      // Mock 清除操作
      mockRemoveItem.mockResolvedValue();

      // 保存自定義類別
      const categorySaved = await saveCustomCategory('TEST', '測試類別');
      expect(categorySaved).toBe(true);

      // 保存自定義產品
      const productSaved = await saveCustomProduct('999', 'TEST', '001', '測試產品', 'TEST001');
      expect(productSaved).toBe(true);

      // 清除所有資料
      const clearResult = await clearAllProductData();
      expect(clearResult.success).toBe(true);

      // 驗證清除操作被調用
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_categories');
      expect(mockRemoveItem).toHaveBeenCalledWith('custom_products');
    });
  });
});
