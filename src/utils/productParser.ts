import { ParsedBarcode } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMerchantByCode } from './merchantService';

// 產品類別定義 - 全域共用
// const PRODUCT_CATEGORIES: { [key: string]: string } = {
//   'FRU': '水果',
//   'VEG': '蔬菜',
//   'MEA': '肉類',
//   'DAI': '乳製品',
//   'GRA': '穀物',
//   'BEV': '飲料',
//   'SNK': '零食',
//   'FRO': '冷凍食品',
//   'CAN': '罐頭食品',
//   'BAK': '烘焙食品',
// };
// 產品類別定義 - 全域共用
const PRODUCT_CATEGORIES: { [key: string]: string } = {
  
};

// 預設產品代碼對應表 - 只歸屬於 ANPIN 商家
const DEFAULT_PRODUCT_CODES: { [key: string]: { [key: string]: { name: string; productId: string } } } = {
  'FRU': {
    '001': { name: '蘋果', productId: 'FRU001' },
    '002': { name: '香蕉', productId: 'FRU002' },
    '003': { name: '橙子', productId: 'FRU003' },
    '004': { name: '葡萄', productId: 'FRU004' },
    '005': { name: '草莓', productId: 'FRU005' },
    '006': { name: '梨子', productId: 'FRU006' },
    '007': { name: '桃子', productId: 'FRU007' },
    '008': { name: '櫻桃', productId: 'FRU008' },
    '009': { name: '藍莓', productId: 'FRU009' },
    '010': { name: '奇異果', productId: 'FRU010' },
  },
  'VEG': {
    '001': { name: '胡蘿蔔', productId: 'VEG001' },
    '002': { name: '白菜', productId: 'VEG002' },
    '003': { name: '洋蔥', productId: 'VEG003' },
    '004': { name: '馬鈴薯', productId: 'VEG004' },
    '005': { name: '番茄', productId: 'VEG005' },
    '006': { name: '青椒', productId: 'VEG006' },
    '007': { name: '黃瓜', productId: 'VEG007' },
    '008': { name: '茄子', productId: 'VEG008' },
    '009': { name: '菠菜', productId: 'VEG009' },
    '010': { name: '芹菜', productId: 'VEG010' },
  },
  'MEA': {
    '001': { name: '豬肉', productId: 'MEA001' },
    '002': { name: '牛肉', productId: 'MEA002' },
    '003': { name: '雞肉', productId: 'MEA003' },
    '004': { name: '羊肉', productId: 'MEA004' },
    '005': { name: '魚肉', productId: 'MEA005' },
    '006': { name: '蝦仁', productId: 'MEA006' },
    '007': { name: '培根', productId: 'MEA007' },
    '008': { name: '火腿', productId: 'MEA008' },
    '009': { name: '香腸', productId: 'MEA009' },
    '010': { name: '鴨肉', productId: 'MEA010' },
  },
  'DAI': {
    '001': { name: '牛奶', productId: 'DAI001' },
    '002': { name: '優格', productId: 'DAI002' },
    '003': { name: '起司', productId: 'DAI003' },
    '004': { name: '奶油', productId: 'DAI004' },
    '005': { name: '酸奶', productId: 'DAI005' },
    '006': { name: '乳酪', productId: 'DAI006' },
    '007': { name: '鮮奶油', productId: 'DAI007' },
    '008': { name: '煉乳', productId: 'DAI008' },
    '009': { name: '奶粉', productId: 'DAI009' },
    '010': { name: '豆漿', productId: 'DAI010' },
  },
  'GRA': {
    '001': { name: '白米', productId: 'GRA001' },
    '002': { name: '糙米', productId: 'GRA002' },
    '003': { name: '麵粉', productId: 'GRA003' },
    '004': { name: '麵條', productId: 'GRA004' },
    '005': { name: '麵包', productId: 'GRA005' },
    '006': { name: '麥片', productId: 'GRA006' },
    '007': { name: '玉米', productId: 'GRA007' },
    '008': { name: '燕麥', productId: 'GRA008' },
    '009': { name: '藜麥', productId: 'GRA009' },
    '010': { name: '小米', productId: 'GRA010' },
  },
  'BEV': {
    '001': { name: '可樂', productId: 'BEV001' },
    '002': { name: '果汁', productId: 'BEV002' },
    '003': { name: '礦泉水', productId: 'BEV003' },
    '004': { name: '茶飲', productId: 'BEV004' },
    '005': { name: '咖啡', productId: 'BEV005' },
    '006': { name: '啤酒', productId: 'BEV006' },
    '007': { name: '紅酒', productId: 'BEV007' },
    '008': { name: '白酒', productId: 'BEV008' },
    '009': { name: '威士忌', productId: 'BEV009' },
    '010': { name: '伏特加', productId: 'BEV010' },
  },
  'SNK': {
    '001': { name: '洋芋片', productId: 'SNK001' },
    '002': { name: '巧克力', productId: 'SNK002' },
    '003': { name: '餅乾', productId: 'SNK003' },
    '004': { name: '糖果', productId: 'SNK004' },
    '005': { name: '堅果', productId: 'SNK005' },
    '006': { name: '爆米花', productId: 'SNK006' },
    '007': { name: '果凍', productId: 'SNK007' },
    '008': { name: '口香糖', productId: 'SNK008' },
    '009': { name: '冰淇淋', productId: 'SNK009' },
    '010': { name: '蛋糕', productId: 'SNK010' },
  },
  'FRO': {
    '001': { name: '冷凍蔬菜', productId: 'FRO001' },
    '002': { name: '冷凍肉類', productId: 'FRO002' },
    '003': { name: '冷凍海鮮', productId: 'FRO003' },
    '004': { name: '冷凍披薩', productId: 'FRO004' },
    '005': { name: '冷凍水餃', productId: 'FRO005' },
    '006': { name: '冷凍湯品', productId: 'FRO006' },
    '007': { name: '冷凍甜點', productId: 'FRO007' },
    '008': { name: '冷凍水果', productId: 'FRO008' },
    '009': { name: '冷凍麵食', productId: 'FRO009' },
    '010': { name: '冷凍飲料', productId: 'FRO010' },
  },
  'CAN': {
    '001': { name: '罐頭魚', productId: 'CAN001' },
    '002': { name: '罐頭蔬菜', productId: 'CAN002' },
    '003': { name: '罐頭水果', productId: 'CAN003' },
    '004': { name: '罐頭湯品', productId: 'CAN004' },
    '005': { name: '罐頭肉類', productId: 'CAN005' },
    '006': { name: '罐頭豆類', productId: 'CAN006' },
    '007': { name: '罐頭蘑菇', productId: 'CAN007' },
    '008': { name: '罐頭玉米', productId: 'CAN008' },
    '009': { name: '罐頭番茄', productId: 'CAN009' },
    '010': { name: '罐頭鳳梨', productId: 'CAN010' },
  },
  'BAK': {
    '001': { name: '吐司', productId: 'BAK001' },
    '002': { name: '蛋糕', productId: 'BAK002' },
    '003': { name: '餅乾', productId: 'BAK003' },
    '004': { name: '麵包', productId: 'BAK004' },
    '005': { name: '派', productId: 'BAK005' },
    '006': { name: '甜甜圈', productId: 'BAK006' },
    '007': { name: '馬芬', productId: 'BAK007' },
    '008': { name: '司康', productId: 'BAK008' },
    '009': { name: '可頌', productId: 'BAK009' },
    '010': { name: '貝果', productId: 'BAK010' },
  },
};

// 本地存儲的鍵名
const CUSTOM_PRODUCTS_KEY = 'custom_products';
const CUSTOM_CATEGORIES_KEY = 'custom_categories';
const CLEARING_FLAG_KEY = 'product_clearing_in_progress';

// 獲取本地存儲的自定義產品類別
export const getCustomCategories = async (): Promise<{ [key: string]: string }> => {
  try {
    const customCategoriesJson = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return customCategoriesJson ? JSON.parse(customCategoriesJson) : {};
  } catch (error) {
    console.error('讀取自定義產品類別失敗:', error);
    return {};
  }
};

// 保存自定義產品類別到本地存儲
export const saveCustomCategory = async (categoryCode: string, categoryName: string): Promise<boolean> => {
  try {
    const customCategories = await getCustomCategories();
    
    // 檢查類別代碼是否已存在
    if (customCategories[categoryCode] || PRODUCT_CATEGORIES[categoryCode]) {
      return false; // 類別代碼已存在
    }
    
    // 添加新類別
    customCategories[categoryCode] = categoryName;
    
    // 保存到本地存儲
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
    return true;
  } catch (error) {
    console.error('保存自定義產品類別失敗:', error);
    return false;
  }
};

// 獲取本地存儲的自定義產品（按商家分組）
export const getCustomProducts = async (): Promise<{ [merchantId: string]: { [category: string]: { [productCode: string]: { name: string; productId: string } } } }> => {
  try {
    const customProductsJson = await AsyncStorage.getItem(CUSTOM_PRODUCTS_KEY);
    return customProductsJson ? JSON.parse(customProductsJson) : {};
  } catch (error) {
    console.error('讀取自定義產品失敗:', error);
    return {};
  }
};

// 保存自定義產品到本地存儲（按商家分組）
export const saveCustomProduct = async (merchantId: string, category: string, productCode: string, productName: string, productId: string = '0'): Promise<boolean> => {
  try {
    const customProducts = await getCustomProducts();
    
    // 如果該商家不存在，創建它
    if (!customProducts[merchantId]) {
      customProducts[merchantId] = {};
    }
    
    // 如果該類別不存在，創建它
    if (!customProducts[merchantId][category]) {
      customProducts[merchantId][category] = {};
    }
    
    // 添加新產品（包含商品ID）
    customProducts[merchantId][category][productCode] = {
      name: productName,
      productId: productId
    };
    
    // 保存到本地存儲
    await AsyncStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
    return true;
  } catch (error) {
    console.error('保存自定義產品失敗:', error);
    return false;
  }
};

/**
 * 解析條碼格式
 * 格式：MERCHANT-CATEGORY-PRODUCTCODE-PRODUCTID-YYYYMMDD 或 CATEGORY-XXX-YYYYMMDD
 * MERCHANT: 商家代碼 (新格式)
 * CATEGORY: 類別代碼
 * PRODUCTCODE: 產品代碼 (可包含字母和數字，長度不固定)
 * PRODUCTID: 商品ID (新格式包含，舊格式從產品資料獲取)
 * YYYYMMDD: 進貨日期 (8位)
 */
export const parseBarcode = async (barcode: string): Promise<ParsedBarcode> => {
  // 基本驗證
  if (!barcode || typeof barcode !== 'string') {
    return {
      merchantCode: '',
      category: '',
      categoryName: '',
      productCode: '',
      productName: '',
      productId: '',
      productionDate: '',
      formattedDate: '',
      isValid: false,
      error: '條碼格式無效',
    };
  }

  // 檢查條碼格式 - 支援舊格式和新格式
  const oldBarcodePattern = /^([A-Z]+)-(\d{3})-(\d{8})$/;
  const newBarcodePattern = /^([A-Z]+)-([A-Z]+)-([A-Z0-9]+)-([A-Z0-9]+)-(\d{8})$/;
  
  let match = barcode.match(newBarcodePattern);
  let isNewFormat = true;
  
  if (!match) {
    // 嘗試舊格式
    match = barcode.match(oldBarcodePattern);
    isNewFormat = false;
  }

  if (!match) {
    return {
      merchantCode: '',
      category: '',
      categoryName: '',
      productCode: '',
      productName: '',
      productId: '',
      productionDate: '',
      formattedDate: '',
      isValid: false,
      error: '條碼格式不正確，應為：MERCHANT-CATEGORY-PRODUCTCODE-PRODUCTID-YYYYMMDD 或 CATEGORY-XXX-YYYYMMDD',
    };
  }

  let merchantCode = '';
  let category, productCode, productId, productionDate;

  if (isNewFormat) {
    [, merchantCode, category, productCode, productId, productionDate] = match;
  } else {
    [, category, productCode, productionDate] = match;
    productId = '0'; // 舊格式沒有商品ID，使用預設值
  }



  // 獲取所有產品類別（包括預設和自定義）
  const allCategories = await getProductCategories();
  
  // 檢查類別是否存在
  let categoryName = allCategories[category];
  if (!categoryName) {
    // 如果類別不存在，使用類別代碼作為名稱，並顯示警告
    categoryName = category;
    console.warn(`未知的產品類別：${category}，使用類別代碼作為名稱`);
  }

  // 獲取商家ID和名稱
  let merchantId = '';
  let merchantName = '';
  if (isNewFormat && merchantCode) {
    try {
      const merchant = await getMerchantByCode(merchantCode);
      if (merchant) {
        merchantId = merchant.id;
        merchantName = merchant.name;
      } else {
        // 即使商家不存在，也保留商家代碼，不讓整個解析失敗
        console.warn(`未知的商家代碼：${merchantCode}，但繼續解析條碼`);
      }
    } catch (error) {
      console.error('載入商家資訊失敗:', error);
      // 即使商家服務出錯，也繼續解析條碼
    }
  }

  // 獲取指定類別的所有產品（包括預設和自定義產品）
  const allProducts = await getProductsByCategory(merchantId, category);
  
  // 檢查產品代碼是否存在
  let productName = allProducts[productCode];
  
  if (!productName) {
    // 如果產品不存在，直接返回錯誤，不繼續後續處理
    return {
      merchantCode,
      merchantName,
      category,
      categoryName: category,
      productCode,
      productName: '',
      productId: '',
      productionDate,
      formattedDate: '',
      isValid: false,
      error: `商品未登入：${category}-${productCode}，請先在商品管理中新增此商品`,
    };
  }
  
  // 如果條碼中沒有商品ID，從產品資料中獲取
  if (!productId || productId === '0') {
    productId = await getProductId(merchantId, category, productCode);
    if (!productId || productId === '') {
      productId = '0';
    }
  }

  // 驗證日期格式
  const year = parseInt(productionDate.substring(0, 4));
  const month = parseInt(productionDate.substring(4, 6));
  const day = parseInt(productionDate.substring(6, 8));

  const date = new Date(year, month - 1, day);
  const isValidDate = date.getFullYear() === year &&
                     date.getMonth() === month - 1 &&
                     date.getDate() === day;

  if (!isValidDate) {
    return {
      merchantCode,
      merchantName,
      category,
      categoryName,
      productCode,
      productName,
      productId,
      productionDate,
      formattedDate: '',
      isValid: false,
      error: '進貨日期格式不正確',
    };
  }

  // 格式化日期
  const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;

  return {
    merchantCode,
    merchantName,
    category,
    categoryName,
    productCode,
    productName,
    productId,
    productionDate,
    formattedDate,
    isValid: true,
  };
};

/**
 * 獲取所有產品類別（包括預設和自定義）- 全域共用
 */
export const getProductCategories = async (): Promise<{ [key: string]: string }> => {
  const defaultCategories = PRODUCT_CATEGORIES;
  const customCategories = await getCustomCategories();
  
  // 合併預設類別和自定義類別
  return { ...defaultCategories, ...customCategories };
};

/**
 * 獲取指定商家和類別的所有產品
 */
export const getProductsByCategory = async (merchantId: string, category: string): Promise<{ [key: string]: string }> => {
  // 如果是 ANPIN 商家，包含預設產品
  const defaultProducts: { [key: string]: string } = {};
  if (merchantId === '1') { // ANPIN 的 ID
    const defaultCategoryProducts = DEFAULT_PRODUCT_CODES[category] || {};
    Object.keys(defaultCategoryProducts).forEach(productCode => {
      const product = defaultCategoryProducts[productCode];
      defaultProducts[productCode] = product.name;
    });
  }
  
  // 獲取自定義產品
  const customProducts = await getCustomProducts();
  const merchantCustomProducts = customProducts[merchantId] || {};
  const categoryCustomProducts = merchantCustomProducts[category] || {};
  
  // 處理自定義產品的資料結構
  const processedCustomProducts: { [key: string]: string } = {};
  Object.keys(categoryCustomProducts).forEach(productCode => {
    const product = categoryCustomProducts[productCode];
    if (typeof product === 'string') {
      // 舊格式：直接是字串
      processedCustomProducts[productCode] = product;
    } else {
      // 新格式：包含 name 和 productId
      processedCustomProducts[productCode] = product.name;
    }
  });
  
  // 合併預設產品和自定義產品
  return { ...defaultProducts, ...processedCustomProducts };
};

/**
 * 獲取產品的商品ID
 */
export const getProductId = async (merchantId: string, category: string, productCode: string): Promise<string> => {
  try {
    // 如果是 ANPIN 商家，先檢查預設產品
    if (merchantId === '1') {
      const defaultProducts = DEFAULT_PRODUCT_CODES[category] || {};
      const defaultProduct = defaultProducts[productCode];
      if (defaultProduct && defaultProduct.productId) {
        return defaultProduct.productId;
      }
    }
    
    // 再檢查自定義產品
    const customProducts = await getCustomProducts();
    const merchantProducts = customProducts[merchantId] || {};
    const categoryProducts = merchantProducts[category] || {};
    const customProduct = categoryProducts[productCode];
    
    if (customProduct && typeof customProduct === 'object' && customProduct.productId) {
      return customProduct.productId;
    }
    
    return '0'; // 如果沒有商品ID，返回預設值 '0'
  } catch (error) {
    console.error('獲取產品商品ID失敗:', error);
    return '0';
  }
};

/**
 * 生成產品條碼
 */
export const generateBarcode = (merchantCode: string, category: string, productCode: string, productId: string, productionDate: string): string => {
  return `${merchantCode}-${category}-${productCode}-${productId}-${productionDate}`;
};

// 測試函數 - 驗證新的商家產品管理邏輯
export const testMerchantProductLogic = async () => {
  console.log('=== 測試商家產品管理邏輯 ===');
  
  // 測試1: 獲取產品類別（應該全域共用）
  const categories = await getProductCategories();
  console.log('產品類別（全域共用）:', Object.keys(categories).length, '個類別');
  
  // 測試2: ANPIN 商家的產品（應該包含預設產品）
  const anpinProducts = await getProductsByCategory('1', 'FRU');
  console.log('ANPIN 商家水果類別產品:', Object.keys(anpinProducts).length, '個產品');
  console.log('ANPIN 產品範例:', anpinProducts);
  
  // 測試3: 新增商家的產品（應該為空）
  const newMerchantProducts = await getProductsByCategory('999', 'FRU');
  console.log('新商家水果類別產品:', Object.keys(newMerchantProducts).length, '個產品');
  
  // 測試4: 為新商家新增產品
  const success = await saveCustomProduct('999', 'FRU', '001', '測試芒果', 'FRU999001');
  console.log('為新商家新增產品成功:', success);
  
  // 測試5: 再次檢查新商家的產品
  const updatedNewMerchantProducts = await getProductsByCategory('999', 'FRU');
  console.log('新商家新增產品後的水果類別產品:', Object.keys(updatedNewMerchantProducts).length, '個產品');
  console.log('新商家產品:', updatedNewMerchantProducts);
  
  // 測試6: 驗證 ANPIN 商家的產品沒有被影響
  const anpinProductsAfter = await getProductsByCategory('1', 'FRU');
  console.log('ANPIN 商家產品數量（應該不變）:', Object.keys(anpinProductsAfter).length, '個產品');
  
  console.log('=== 測試完成 ===');
}; 

/**
 * 清除所有自定義產品類別
 */
export const clearAllCustomCategories = async (): Promise<boolean> => {
  try {
    console.log('開始清除自定義產品類別...');
    
    // 先讀取現有的資料，記錄清除前的狀態
    const existingCategories = await getCustomCategories();
    console.log('清除前的自定義類別數量:', Object.keys(existingCategories).length);
    console.log('清除前的自定義類別:', Object.keys(existingCategories));
    
    // 只清除自定義類別，不清除預設類別
    await AsyncStorage.removeItem(CUSTOM_CATEGORIES_KEY);
    
    // 驗證清除結果
    const afterClearCategories = await getCustomCategories();
    console.log('清除後的自定義類別數量:', Object.keys(afterClearCategories).length);
    
    console.log('所有自定義產品類別已清除');
    return true;
  } catch (error) {
    console.error('清除自定義產品類別失敗:', error);
    return false;
  }
};

/**
 * 清除所有自定義產品
 */
export const clearAllCustomProducts = async (): Promise<boolean> => {
  try {
    console.log('開始清除自定義產品...');
    
    // 先讀取現有的資料，記錄清除前的狀態
    const existingProducts = await getCustomProducts();
    console.log('清除前的自定義產品商家數量:', Object.keys(existingProducts).length);
    
    let totalProducts = 0;
    Object.keys(existingProducts).forEach(merchantId => {
      const merchantProducts = existingProducts[merchantId];
      Object.keys(merchantProducts).forEach(category => {
        const categoryProducts = merchantProducts[category];
        totalProducts += Object.keys(categoryProducts).length;
      });
    });
    console.log('清除前的自定義產品總數:', totalProducts);
    
    // 只清除自定義產品，不清除預設產品
    await AsyncStorage.removeItem(CUSTOM_PRODUCTS_KEY);
    
    // 驗證清除結果
    const afterClearProducts = await getCustomProducts();
    const afterTotalProducts = Object.keys(afterClearProducts).length;
    console.log('清除後的自定義產品商家數量:', afterTotalProducts);
    
    console.log('所有自定義產品已清除');
    return true;
  } catch (error) {
    console.error('清除自定義產品失敗:', error);
    return false;
  }
};

/**
 * 清除所有商品相關資料（類別和產品，但保留 Google 表單紀錄）
 */
export const clearAllProductData = async (): Promise<{ success: boolean; message: string; details: string }> => {
  try {
    console.log('=== 開始清除商品資料 ===');
    
    // 1. 設置清除標記，防止其他功能在清除過程中受影響
    console.log('1. 設置清除標記...');
    await AsyncStorage.setItem(CLEARING_FLAG_KEY, 'true');
    
    // 2. 清除前檢查其他重要資料
    console.log('2. 清除前檢查其他重要資料...');
    
    // 檢查自定義類別和產品
    const beforeCategories = await getCustomCategories();
    const beforeProducts = await getCustomProducts();
    
    const beforeCategoryCount = Object.keys(beforeCategories).length;
    let beforeProductCount = 0;
    Object.keys(beforeProducts).forEach(merchantId => {
      const merchantProducts = beforeProducts[merchantId];
      Object.keys(merchantProducts).forEach(category => {
        const categoryProducts = merchantProducts[category];
        beforeProductCount += Object.keys(categoryProducts).length;
      });
    });
    
    console.log(`清除前狀態: ${beforeCategoryCount} 個自定義類別, ${beforeProductCount} 個自定義產品`);
    
    // 3. 檢查預設資料是否完整
    console.log('3. 檢查預設資料完整性...');
    const defaultCategories = PRODUCT_CATEGORIES;
    const defaultProducts = DEFAULT_PRODUCT_CODES;
    
    console.log('預設類別數量:', Object.keys(defaultCategories).length);
    console.log('預設產品類別數量:', Object.keys(defaultProducts).length);
    
    // 4. 執行清除操作
    console.log('4. 執行清除操作...');
    const categoriesCleared = await clearAllCustomCategories();
    const productsCleared = await clearAllCustomProducts();
    
    // 5. 清除後檢查狀態
    console.log('5. 清除後檢查狀態...');
    const afterCategories = await getCustomCategories();
    const afterProducts = await getCustomProducts();
    
    const afterCategoryCount = Object.keys(afterCategories).length;
    let afterProductCount = 0;
    Object.keys(afterProducts).forEach(merchantId => {
      const merchantProducts = afterProducts[merchantId];
      Object.keys(merchantProducts).forEach(category => {
        const categoryProducts = merchantProducts[category];
        afterProductCount += Object.keys(categoryProducts).length;
      });
    });
    
    console.log(`清除後狀態: ${afterCategoryCount} 個自定義類別, ${afterProductCount} 個自定義產品`);
    
    // 6. 驗證預設資料是否保持完整
    console.log('6. 驗證預設資料完整性...');
    const defaultCategoriesAfter = PRODUCT_CATEGORIES;
    const defaultProductsAfter = DEFAULT_PRODUCT_CODES;
    
    console.log('清除後預設類別數量:', Object.keys(defaultCategoriesAfter).length);
    console.log('清除後預設產品類別數量:', Object.keys(defaultProductsAfter).length);
    
    // 7. 測試 ANPIN 商家的預設產品是否仍然可用
    console.log('7. 測試 ANPIN 商家預設產品...');
    const anpinProducts = await getProductsByCategory('1', 'FRU');
    console.log('ANPIN 商家水果類別產品數量:', Object.keys(anpinProducts).length);
    
    // 8. 生成結果報告
    console.log('8. 生成結果報告...');
    let details = '';
    let success = false;
    
    if (categoriesCleared && productsCleared) {
      // 檢查是否真的清除了自定義資料
      const customDataCleared = afterCategoryCount === 0 && afterProductCount === 0;
      
      // 檢查預設資料是否保持完整
      const defaultDataIntact = Object.keys(defaultCategoriesAfter).length > 0 && 
                               Object.keys(defaultProductsAfter).length > 0 &&
                               Object.keys(anpinProducts).length > 0;
      
      if (customDataCleared && defaultDataIntact) {
        success = true;
        details = `✅ 清除成功！\n已清除 ${beforeCategoryCount} 個自定義類別和 ${beforeProductCount} 個自定義產品\n預設資料保持完整，ANPIN 商家產品數量: ${Object.keys(anpinProducts).length}`;
        console.log('🎉 清除功能完全成功！只清除了自定義資料，預設資料保持完整。');
      } else {
        success = false;
        details = `⚠️ 清除結果異常\n自定義資料清除: ${customDataCleared ? '成功' : '失敗'}\n預設資料保持: ${defaultDataIntact ? '成功' : '失敗'}`;
        console.log('❌ 清除功能異常！可能有預設資料被意外清除。');
      }
    } else {
      success = false;
      details = `❌ 清除操作失敗\n類別清除: ${categoriesCleared ? '成功' : '失敗'}\n產品清除: ${productsCleared ? '成功' : '失敗'}`;
      console.log('❌ 清除操作失敗！');
    }
    
    // 9. 清除完成後移除標記
    console.log('9. 移除清除標記...');
    await AsyncStorage.removeItem(CLEARING_FLAG_KEY);
    
    console.log('=== 商品資料清除完成 ===');
    return {
      success,
      message: success ? '所有商品類別和商品已成功清除' : '清除過程中發生問題',
      details
    };
    
  } catch (error) {
    console.error('清除商品資料失敗:', error);
    
    // 發生錯誤時也要移除標記
    try {
      await AsyncStorage.removeItem(CLEARING_FLAG_KEY);
    } catch (removeError) {
      console.error('移除清除標記失敗:', removeError);
    }
    
    return {
      success: false,
      message: '清除商品資料時發生錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}; 

/**
 * 測試清除功能的安全性 - 確保只清除商品資料，不影響其他資料
 */
export const testClearFunctionSafety = async (): Promise<void> => {
  console.log('=== 測試清除功能安全性 ===');
  
  try {
    // 1. 檢查清除前的狀態
    console.log('1. 檢查清除前的狀態...');
    const beforeCategories = await getCustomCategories();
    const beforeProducts = await getCustomProducts();
    
    console.log('清除前的自定義類別:', Object.keys(beforeCategories));
    console.log('清除前的自定義產品商家數量:', Object.keys(beforeProducts).length);
    
    // 2. 執行清除操作
    console.log('2. 執行清除操作...');
    const clearResult = await clearAllProductData();
    console.log('清除結果:', clearResult);
    
    // 3. 檢查清除後的狀態
    console.log('3. 檢查清除後的狀態...');
    const afterCategories = await getCustomCategories();
    const afterProducts = await getCustomProducts();
    
    console.log('清除後的自定義類別:', Object.keys(afterCategories));
    console.log('清除後的自定義產品商家數量:', Object.keys(afterProducts).length);
    
    // 4. 驗證清除結果
    console.log('4. 驗證清除結果...');
    const categoriesCleared = Object.keys(afterCategories).length === 0;
    const productsCleared = Object.keys(afterProducts).length === 0;
    
    console.log('自定義類別是否已清除:', categoriesCleared);
    console.log('自定義產品是否已清除:', productsCleared);
    
    // 5. 檢查預設資料是否保持不變
    console.log('5. 檢查預設資料是否保持不變...');
    const defaultCategories = PRODUCT_CATEGORIES;
    const defaultProducts = DEFAULT_PRODUCT_CODES;
    
    console.log('預設類別數量:', Object.keys(defaultCategories).length);
    console.log('預設產品類別數量:', Object.keys(defaultProducts).length);
    
    // 6. 測試 ANPIN 商家的預設產品是否仍然可用
    console.log('6. 測試 ANPIN 商家的預設產品...');
    const anpinProducts = await getProductsByCategory('1', 'FRU');
    console.log('ANPIN 商家水果類別產品數量:', Object.keys(anpinProducts).length);
    
    // 7. 總結測試結果
    console.log('=== 測試結果總結 ===');
    console.log('✅ 自定義類別清除:', categoriesCleared ? '成功' : '失敗');
    console.log('✅ 自定義產品清除:', productsCleared ? '成功' : '失敗');
    console.log('✅ 預設類別保持:', Object.keys(defaultCategories).length > 0 ? '成功' : '失敗');
    console.log('✅ 預設產品保持:', Object.keys(defaultProducts).length > 0 ? '成功' : '失敗');
    console.log('✅ ANPIN 產品可用:', Object.keys(anpinProducts).length > 0 ? '成功' : '失敗');
    
    if (categoriesCleared && productsCleared && Object.keys(defaultCategories).length > 0 && Object.keys(defaultProducts).length > 0 && Object.keys(anpinProducts).length > 0) {
      console.log('🎉 清除功能安全性測試通過！只清除了自定義資料，預設資料保持完整。');
    } else {
      console.log('❌ 清除功能安全性測試失敗！可能有預設資料被意外清除。');
    }
    
  } catch (error) {
    console.error('測試清除功能安全性時發生錯誤:', error);
  }
}; 

/**
 * 檢查清除功能是否影響到 Google 表單設定
 */
export const checkGoogleFormSettingsIntegrity = async (): Promise<{ 
  spreadsheetSettingsIntact: boolean; 
  details: string; 
  recommendations: string[] 
}> => {
  console.log('=== 檢查 Google 表單設定完整性 ===');
  
  try {
    const recommendations: string[] = [];
    
    // 1. 檢查 AsyncStorage 中的 Google 表單設定
    console.log('1. 檢查 AsyncStorage 中的 Google 表單設定...');
    
    // 檢查試算表儲存鍵值是否存在
    const spreadsheetStorageKey = '@FanBookkeeping_spreadsheets';
    const spreadsheetData = await AsyncStorage.getItem(spreadsheetStorageKey);
    
    if (spreadsheetData) {
      console.log('✅ 試算表儲存資料存在');
      const parsedData = JSON.parse(spreadsheetData);
      console.log('試算表資料結構:', Object.keys(parsedData));
      
      if (parsedData.users && Array.isArray(parsedData.users)) {
        console.log('用戶試算表數量:', parsedData.users.length);
        parsedData.users.forEach((user: any, index: number) => {
          console.log(`用戶 ${index + 1}:`, {
            userId: user.userId,
            userEmail: user.userEmail,
            spreadsheetId: user.spreadsheetId,
            spreadsheetName: user.spreadsheetName
          });
        });
      }
    } else {
      console.log('❌ 試算表儲存資料不存在');
      recommendations.push('試算表儲存資料不存在，可能需要重新選擇資料表');
    }
    
    // 2. 檢查其他可能被影響的設定
    console.log('2. 檢查其他可能被影響的設定...');
    
    // 檢查應用程式設定
    const appSettingsKey = '@FanBookkeeping_app_settings';
    const appSettingsData = await AsyncStorage.getItem(appSettingsKey);
    
    if (appSettingsData) {
      console.log('✅ 應用程式設定存在');
    } else {
      console.log('⚠️ 應用程式設定不存在');
      recommendations.push('應用程式設定不存在，可能需要重新設定');
    }
    
    // 3. 檢查商品資料的清除狀態
    console.log('3. 檢查商品資料的清除狀態...');
    
    const customCategories = await getCustomCategories();
    const customProducts = await getCustomProducts();
    
    const categoryCount = Object.keys(customCategories).length;
    const productCount = Object.keys(customProducts).length;
    
    console.log('當前自定義類別數量:', categoryCount);
    console.log('當前自定義產品商家數量:', productCount);
    
    // 4. 檢查預設資料是否完整
    console.log('4. 檢查預設資料是否完整...');
    
    const defaultCategories = PRODUCT_CATEGORIES;
    const defaultProducts = DEFAULT_PRODUCT_CODES;
    
    const defaultCategoryCount = Object.keys(defaultCategories).length;
    const defaultProductCategoryCount = Object.keys(defaultProducts).length;
    
    console.log('預設類別數量:', defaultCategoryCount);
    console.log('預設產品類別數量:', defaultProductCategoryCount);
    
    // 5. 生成完整性報告
    console.log('5. 生成完整性報告...');
    
    const spreadsheetSettingsIntact = !!spreadsheetData;
    const appSettingsIntact = !!appSettingsData;
    const defaultDataIntact = defaultCategoryCount > 0 && defaultProductCategoryCount > 0;
    
    let details = '';
    details += `試算表設定: ${spreadsheetSettingsIntact ? '✅ 完整' : '❌ 缺失'}\n`;
    details += `應用程式設定: ${appSettingsIntact ? '✅ 完整' : '❌ 缺失'}\n`;
    details += `預設商品資料: ${defaultDataIntact ? '✅ 完整' : '❌ 缺失'}\n`;
    details += `自定義商品資料: ${categoryCount} 個類別, ${productCount} 個商家`;
    
    // 6. 提供建議
    if (!spreadsheetSettingsIntact) {
      recommendations.push('試算表設定已丟失，需要重新選擇 Google 表單');
    }
    
    if (!appSettingsIntact) {
      recommendations.push('應用程式設定已丟失，需要重新設定');
    }
    
    if (!defaultDataIntact) {
      recommendations.push('預設商品資料已丟失，這是不正常的，需要調查原因');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('所有設定都完整，清除功能沒有影響到其他資料');
    }
    
    console.log('=== Google 表單設定完整性檢查完成 ===');
    return {
      spreadsheetSettingsIntact,
      details,
      recommendations
    };
    
  } catch (error) {
    console.error('檢查 Google 表單設定完整性時發生錯誤:', error);
    return {
      spreadsheetSettingsIntact: false,
      details: `檢查過程中發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
      recommendations: ['檢查過程發生錯誤，無法確定設定完整性']
    };
  }
}; 

/**
 * 檢查是否正在進行清除操作
 */
export const isClearingInProgress = async (): Promise<boolean> => {
  try {
    const clearingFlag = await AsyncStorage.getItem(CLEARING_FLAG_KEY);
    return clearingFlag === 'true';
  } catch (error) {
    console.error('檢查清除標記失敗:', error);
    return false;
  }
};

/**
 * 強制移除清除標記（用於緊急情況）
 */
export const forceRemoveClearingFlag = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(CLEARING_FLAG_KEY);
    console.log('清除標記已強制移除');
    return true;
  } catch (error) {
    console.error('強制移除清除標記失敗:', error);
    return false;
  }
}; 