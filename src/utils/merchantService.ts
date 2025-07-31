import AsyncStorage from '@react-native-async-storage/async-storage';
import { Merchant } from '../types';

const MERCHANTS_STORAGE_KEY = 'merchants';

// 預設商家
const defaultMerchants: Merchant[] = [
  {
    id: '1',
    name: 'ANPIN',
    code: 'ANPIN',
    description: '安蘋批發',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: '15P',
    code: '15P',
    description: '15P',
    createdAt: new Date(),
  },
];

// 載入所有商家
export const loadMerchants = async (): Promise<Merchant[]> => {
  try {
    const merchantsJson = await AsyncStorage.getItem(MERCHANTS_STORAGE_KEY);
    let storedMerchants: Merchant[] = [];
    
    if (merchantsJson) {
      storedMerchants = JSON.parse(merchantsJson).map((merchant: any) => ({
        ...merchant,
        createdAt: new Date(merchant.createdAt),
      }));
    }
    
    // 合併預設商家和已儲存的商家
    const allMerchants = [...defaultMerchants];
    
    // 只加入不在預設商家中的已儲存商家
    storedMerchants.forEach(storedMerchant => {
      const isDefault = defaultMerchants.some(defaultMerchant => 
        defaultMerchant.code === storedMerchant.code
      );
      if (!isDefault) {
        allMerchants.push(storedMerchant);
      }
    });
    
    // 如果是首次使用（沒有儲存資料），則儲存合併後的結果
    if (!merchantsJson) {
      await saveMerchants(allMerchants);
    }
    
    return allMerchants;
  } catch (error) {
    console.error('載入商家失敗:', error);
    return defaultMerchants;
  }
};

// 儲存商家列表（只儲存非預設商家）
export const saveMerchants = async (merchants: Merchant[]): Promise<void> => {
  try {
    // 只儲存非預設商家
    const nonDefaultMerchants = merchants.filter(merchant => 
      !defaultMerchants.some(defaultMerchant => defaultMerchant.code === merchant.code)
    );
    await AsyncStorage.setItem(MERCHANTS_STORAGE_KEY, JSON.stringify(nonDefaultMerchants));
  } catch (error) {
    console.error('儲存商家失敗:', error);
    throw error;
  }
};

// 新增商家
export const addMerchant = async (merchant: Omit<Merchant, 'id' | 'createdAt'>): Promise<Merchant> => {
  try {
    const merchants = await loadMerchants();
    
    // 檢查商家代碼是否已存在（包括預設商家）
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
    
    // 檢查是否為預設商家
    const merchant = merchants[merchantIndex];
    const isDefaultMerchant = defaultMerchants.some(defaultMerchant => 
      defaultMerchant.code === merchant.code
    );
    
    if (isDefaultMerchant) {
      throw new Error('預設商家無法編輯');
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
    const merchantToDelete = merchants.find(m => m.id === id);
    
    if (!merchantToDelete) {
      throw new Error('商家不存在');
    }
    
    // 檢查是否為預設商家
    const isDefaultMerchant = defaultMerchants.some(defaultMerchant => 
      defaultMerchant.code === merchantToDelete.code
    );
    
    if (isDefaultMerchant) {
      throw new Error('預設商家無法刪除');
    }
    
    const filteredMerchants = merchants.filter(m => m.id !== id);
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