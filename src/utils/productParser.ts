import { ParsedBarcode } from '../types';

// 產品類別定義
const PRODUCT_CATEGORIES: { [key: string]: string } = {
  'FRU': '水果',
  'VEG': '蔬菜',
  'MEA': '肉類',
  'DAI': '乳製品',
  'GRA': '穀物',
  'BEV': '飲料',
  'SNK': '零食',
  'FRO': '冷凍食品',
  'CAN': '罐頭食品',
  'BAK': '烘焙食品',
};

// 產品代碼對應表
const PRODUCT_CODES: { [key: string]: { [key: string]: string } } = {
  'FRU': {
    '001': '蘋果',
    '002': '香蕉',
    '003': '橙子',
    '004': '葡萄',
    '005': '草莓',
    '006': '梨子',
    '007': '桃子',
    '008': '櫻桃',
    '009': '藍莓',
    '010': '奇異果',
  },
  'VEG': {
    '001': '胡蘿蔔',
    '002': '白菜',
    '003': '洋蔥',
    '004': '馬鈴薯',
    '005': '番茄',
    '006': '青椒',
    '007': '黃瓜',
    '008': '茄子',
    '009': '菠菜',
    '010': '芹菜',
  },
  'MEA': {
    '001': '豬肉',
    '002': '牛肉',
    '003': '雞肉',
    '004': '羊肉',
    '005': '魚肉',
    '006': '蝦仁',
    '007': '培根',
    '008': '火腿',
    '009': '香腸',
    '010': '鴨肉',
  },
  'DAI': {
    '001': '牛奶',
    '002': '優格',
    '003': '起司',
    '004': '奶油',
    '005': '酸奶',
    '006': '乳酪',
    '007': '鮮奶油',
    '008': '煉乳',
    '009': '奶粉',
    '010': '豆漿',
  },
  'GRA': {
    '001': '白米',
    '002': '糙米',
    '003': '麵粉',
    '004': '麵條',
    '005': '麵包',
    '006': '麥片',
    '007': '玉米',
    '008': '燕麥',
    '009': '藜麥',
    '010': '小米',
  },
  'BEV': {
    '001': '可樂',
    '002': '果汁',
    '003': '礦泉水',
    '004': '茶飲',
    '005': '咖啡',
    '006': '啤酒',
    '007': '紅酒',
    '008': '白酒',
    '009': '威士忌',
    '010': '伏特加',
  },
  'SNK': {
    '001': '洋芋片',
    '002': '巧克力',
    '003': '餅乾',
    '004': '糖果',
    '005': '堅果',
    '006': '爆米花',
    '007': '果凍',
    '008': '口香糖',
    '009': '冰淇淋',
    '010': '蛋糕',
  },
  'FRO': {
    '001': '冷凍蔬菜',
    '002': '冷凍肉類',
    '003': '冷凍海鮮',
    '004': '冷凍披薩',
    '005': '冷凍水餃',
    '006': '冷凍湯品',
    '007': '冷凍甜點',
    '008': '冷凍水果',
    '009': '冷凍麵食',
    '010': '冷凍飲料',
  },
  'CAN': {
    '001': '罐頭魚',
    '002': '罐頭蔬菜',
    '003': '罐頭水果',
    '004': '罐頭湯品',
    '005': '罐頭肉類',
    '006': '罐頭豆類',
    '007': '罐頭蘑菇',
    '008': '罐頭玉米',
    '009': '罐頭番茄',
    '010': '罐頭鳳梨',
  },
  'BAK': {
    '001': '吐司',
    '002': '蛋糕',
    '003': '餅乾',
    '004': '麵包',
    '005': '派',
    '006': '甜甜圈',
    '007': '馬芬',
    '008': '司康',
    '009': '可頌',
    '010': '貝果',
  },
};

/**
 * 解析條碼格式
 * 格式：CAT-XXX-YYYYMMDD
 * CAT: 類別代碼 (3位)
 * XXX: 產品代碼 (3位)
 * YYYYMMDD: 生產日期 (8位)
 */
export const parseBarcode = (barcode: string): ParsedBarcode => {
  // 基本驗證
  if (!barcode || typeof barcode !== 'string') {
    return {
      category: '',
      categoryName: '',
      productCode: '',
      productName: '',
      productionDate: '',
      formattedDate: '',
      isValid: false,
      error: '條碼格式無效',
    };
  }

  // 檢查條碼格式
  const barcodePattern = /^([A-Z]{3})-(\d{3})-(\d{8})$/;
  const match = barcode.match(barcodePattern);

  if (!match) {
    return {
      category: '',
      categoryName: '',
      productCode: '',
      productName: '',
      productionDate: '',
      formattedDate: '',
      isValid: false,
      error: '條碼格式不正確，應為：CAT-XXX-YYYYMMDD',
    };
  }

  const [, category, productCode, productionDate] = match;

  // 檢查類別是否存在
  if (!PRODUCT_CATEGORIES[category]) {
    return {
      category,
      categoryName: '',
      productCode,
      productName: '',
      productionDate,
      formattedDate: '',
      isValid: false,
      error: `未知的產品類別：${category}`,
    };
  }

  const categoryName = PRODUCT_CATEGORIES[category];

  // 檢查產品代碼是否存在
  if (!PRODUCT_CODES[category] || !PRODUCT_CODES[category][productCode]) {
    return {
      category,
      categoryName,
      productCode,
      productName: '',
      productionDate,
      formattedDate: '',
      isValid: false,
      error: `未知的產品代碼：${productCode}`,
    };
  }

  const productName = PRODUCT_CODES[category][productCode];

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
      category,
      categoryName,
      productCode,
      productName,
      productionDate,
      formattedDate: '',
      isValid: false,
      error: '生產日期格式不正確',
    };
  }

  // 格式化日期
  const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;

  return {
    category,
    categoryName,
    productCode,
    productName,
    productionDate,
    formattedDate,
    isValid: true,
  };
};

/**
 * 獲取所有產品類別
 */
export const getProductCategories = () => {
  return PRODUCT_CATEGORIES;
};

/**
 * 獲取指定類別的所有產品
 */
export const getProductsByCategory = (category: string) => {
  return PRODUCT_CODES[category] || {};
};

/**
 * 生成產品條碼
 */
export const generateBarcode = (category: string, productCode: string, productionDate: string): string => {
  return `${category}-${productCode}-${productionDate}`;
}; 