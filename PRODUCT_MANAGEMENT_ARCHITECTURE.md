# 產品管理架構說明

## 概述

根據您的需求，我們已經重新設計了產品管理架構，讓產品列表變成每個商家獨立的，而產品類別保持全域共用。

## 架構變更

### 1. 產品類別 - 全域共用
- 所有商家共用同一套產品類別
- 包括預設類別（水果、蔬菜、肉類等）和用戶自定義類別
- 類別代碼和名稱在所有商家間共享

### 2. 產品列表 - 按商家獨立
- **ANPIN 商家**：包含所有預設產品 + 自定義產品
- **其他商家**：只包含自己新增的產品，初始時為空
- 每個商家的產品列表完全獨立，不會互相影響

### 3. 預設產品歸屬
- 所有預設產品（蘋果、香蕉、胡蘿蔔等）現在只歸屬於 ANPIN 商家
- 新增的商家初始時沒有任何產品，需要用戶自己新增

## 技術實現

### 資料結構變更

#### 舊結構（全域產品）
```javascript
// 所有商家共用同一套產品
const PRODUCT_CODES = {
  'FRU': {
    '001': { name: '蘋果', productId: 'FRU001' },
    // ...
  }
}
```

#### 新結構（商家獨立產品）
```javascript
// 預設產品只歸屬於 ANPIN
const DEFAULT_PRODUCT_CODES = {
  'FRU': {
    '001': { name: '蘋果', productId: 'FRU001' },
    // ...
  }
}

// 自定義產品按商家分組
const customProducts = {
  'merchantId1': {
    'FRU': {
      '001': { name: '自定義芒果', productId: 'FRU001' }
    }
  },
  'merchantId2': {
    'VEG': {
      '001': { name: '自定義白菜', productId: 'VEG001' }
    }
  }
}
```

### API 變更

#### 獲取產品列表
```javascript
// 舊 API
getProductsByCategory(category)

// 新 API
getProductsByCategory(merchantId, category)
```

#### 新增產品
```javascript
// 舊 API
saveCustomProduct(category, productCode, productName, productId)

// 新 API
saveCustomProduct(merchantId, category, productCode, productName, productId)
```

#### 獲取產品ID
```javascript
// 舊 API
getProductId(category, productCode)

// 新 API
getProductId(merchantId, category, productCode)
```

## 用戶體驗

### ANPIN 商家
- 可以看到所有預設產品（蘋果、香蕉、胡蘿蔔等）
- 可以新增自定義產品
- 產品列表豐富，適合作為示範

### 新增商家
- 初始時沒有任何產品
- 需要用戶自己新增產品
- 產品列表完全獨立，不會看到其他商家的產品

### 產品類別
- 所有商家都可以看到相同的產品類別
- 可以新增自定義類別，所有商家都能使用

## 測試結果

測試驗證了以下功能：

1. ✅ ANPIN 商家包含預設產品（蘋果、香蕉）
2. ✅ 新商家初始時產品列表為空
3. ✅ 新商家可以新增自己的產品
4. ✅ 商家產品列表完全獨立
5. ✅ ANPIN 可以新增自定義產品
6. ✅ 產品類別全域共用

## 遷移說明

這個變更是完全向後兼容的：
- 現有的條碼解析功能繼續正常工作
- 現有的產品資料會被保留
- 用戶界面會自動適應新的架構

## 總結

新的架構實現了您的需求：
- ✅ 產品類別全域共用
- ✅ 產品列表按商家獨立
- ✅ 預設產品歸屬於 ANPIN
- ✅ 新增商家初始時沒有產品
- ✅ 用戶需要自己為新商家新增產品 