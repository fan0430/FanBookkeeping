import AsyncStorage from '@react-native-async-storage/async-storage';
import { Merchant } from '../types';

const MERCHANTS_STORAGE_KEY = 'merchants';

// 預設商家
const defaultMerchants: Merchant[] = [
  {
    id: '1',
    name: 'ANPIN',
    code: 'ANPIN',
    description: '安品商家',
    createdAt: new Date(),
  },
];

// 載入所有商家
export const loadMerchants = async (): Promise<Merchant[]> => {
  try {
    const merchantsJson = await AsyncStorage.getItem(MERCHANTS_STORAGE_KEY);
    if (merchantsJson) {
      const merchants = JSON.parse(merchantsJson);
      return merchants.map((merchant: any) => ({
        ...merchant,
        createdAt: new Date(merchant.createdAt),
      }));
    } else {
      // 如果沒有儲存的商家，使用預設商家
      await saveMerchants(defaultMerchants);
      return defaultMerchants;
    }
  } catch (error) {
    console.error('載入商家失敗:', error);
    return defaultMerchants;
  }
};

// 儲存商家列表
export const saveMerchants = async (merchants: Merchant[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(MERCHANTS_STORAGE_KEY, JSON.stringify(merchants));
  } catch (error) {
    console.error('儲存商家失敗:', error);
    throw error;
  }
};

// 新增商家
export const addMerchant = async (merchant: Omit<Merchant, 'id' | 'createdAt'>): Promise<Merchant> => {
  try {
    const merchants = await loadMerchants();
    
    // 檢查商家代碼是否已存在
    const existingMerchant = merchants.find(m => m.code === merchant.code);
    if (existingMerchant) {
      throw new Error('商家代碼已存在');
    }
    
    const newMerchant: Merchant = {
      ...merchant,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    const updatedMerchants = [...merchants, newMerchant];
    await saveMerchants(updatedMerchants);
    
    return newMerchant;
  } catch (error) {
    console.error('新增商家失敗:', error);
    throw error;
  }
};

// 更新商家
export const updateMerchant = async (id: string, updates: Partial<Merchant>): Promise<Merchant> => {
  try {
    const merchants = await loadMerchants();
    const merchantIndex = merchants.findIndex(m => m.id === id);
    
    if (merchantIndex === -1) {
      throw new Error('商家不存在');
    }
    
    // 檢查商家代碼是否與其他商家重複
    if (updates.code) {
      const existingMerchant = merchants.find(m => m.code === updates.code && m.id !== id);
      if (existingMerchant) {
        throw new Error('商家代碼已存在');
      }
    }
    
    const updatedMerchant = { ...merchants[merchantIndex], ...updates };
    merchants[merchantIndex] = updatedMerchant;
    
    await saveMerchants(merchants);
    return updatedMerchant;
  } catch (error) {
    console.error('更新商家失敗:', error);
    throw error;
  }
};

// 刪除商家
export const deleteMerchant = async (id: string): Promise<void> => {
  try {
    const merchants = await loadMerchants();
    const filteredMerchants = merchants.filter(m => m.id !== id);
    
    if (filteredMerchants.length === merchants.length) {
      throw new Error('商家不存在');
    }
    
    await saveMerchants(filteredMerchants);
  } catch (error) {
    console.error('刪除商家失敗:', error);
    throw error;
  }
};

// 根據ID取得商家
export const getMerchantById = async (id: string): Promise<Merchant | null> => {
  try {
    const merchants = await loadMerchants();
    return merchants.find(m => m.id === id) || null;
  } catch (error) {
    console.error('取得商家失敗:', error);
    return null;
  }
};

// 根據代碼取得商家
export const getMerchantByCode = async (code: string): Promise<Merchant | null> => {
  try {
    const merchants = await loadMerchants();
    return merchants.find(m => m.code === code) || null;
  } catch (error) {
    console.error('取得商家失敗:', error);
    return null;
  }
}; 