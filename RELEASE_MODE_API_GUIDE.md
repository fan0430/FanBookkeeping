# Release 模式 API 配置指南

## 📋 概述

本指南說明如何在 release 模式下正確配置 API 請求，解決 release 版本中可能出現的 header、cookie、Content-Type 等被優化掉的問題。

## 🔧 已實作的改進

### 1. 環境模式判斷

```typescript
// 判斷是否為 release 模式
export const isReleaseMode = (): boolean => {
  return !__DEV__;
};

// 判斷是否為 debug 模式
export const isDebugMode = (): boolean => {
  return __DEV__;
};
```

### 2. 動態 Header 配置

在 `src/utils/googleSheetsService.ts` 中：

```typescript
private getHeaders() {
  const baseHeaders = {
    'Authorization': `Bearer ${this.accessToken}`,
    'Content-Type': 'application/json',
  };

  // 在 release 模式下添加額外的 header
  if (this.isReleaseMode()) {
    return {
      ...baseHeaders,
      'Accept': 'application/json',
      'User-Agent': 'FanBookkeeping/1.0',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  }

  return baseHeaders;
}
```

### 3. API 配置工具

在 `src/utils/apiConfig.ts` 中提供了完整的 API 配置工具：

- `getGoogleApiConfig()` - 取得 Google API 專用配置
- `createGoogleApiClient()` - 建立配置化的 axios 實例
- `testApiConnection()` - 測試 API 連線

## 📱 Release 模式特殊處理

### 額外 Headers

在 release 模式下，系統會自動添加以下 headers：

```typescript
{
  'Accept': 'application/json',
  'User-Agent': 'FanBookkeeping/1.0',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'X-Requested-With': 'XMLHttpRequest',
}
```

### 請求超時設定

所有 API 請求都設定了 30 秒超時：

```typescript
{
  timeout: 30000, // 30 秒超時
}
```

### 請求攔截器

添加了請求和回應攔截器來記錄詳細的 API 活動：

```typescript
// 請求攔截器
client.interceptors.request.use((config) => {
  console.log(`🌐 API 請求: ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`📱 模式: ${isReleaseMode() ? 'Release' : 'Debug'}`);
  return config;
});

// 回應攔截器
client.interceptors.response.use((response) => {
  console.log(`✅ API 回應: ${response.status} ${response.statusText}`);
  return response;
});
```

## 🧪 測試功能

### 1. 環境資訊檢查

在 POS 系統中點擊「🌍 環境資訊」按鈕，可以查看：

- 當前模式（Debug/Release）
- 平台資訊
- 版本資訊
- 模擬器狀態
- 當前啟用的配置

### 2. API 連線測試

在 POS 系統中點擊「🌐 API 測試」按鈕，可以：

- 測試 Google Sheets API 連線
- 驗證權杖有效性
- 檢查請求/回應狀態
- 確認 release 模式配置是否生效

## 🚀 建置指令

### Debug 版本
```bash
npx react-native run-android --variant=debug
```

### Release 版本
```bash
npx react-native run-android --variant=release
```

## 📊 模式差異對比

| 功能 | Debug 模式 | Release 模式 |
|------|------------|--------------|
| 基本 Headers | ✅ Authorization, Content-Type | ✅ Authorization, Content-Type |
| 額外 Headers | ❌ 無 | ✅ Accept, User-Agent, Cache-Control, Pragma, X-Requested-With |
| 請求超時 | ✅ 30 秒 | ✅ 30 秒 |
| 日誌記錄 | ✅ 詳細 | ✅ 詳細 |
| 快取控制 | ❌ 無 | ✅ 禁用快取 |

## 🔍 故障排除

### 問題 1：Release 模式下 API 請求失敗

**可能原因：**
- Headers 被優化掉
- 網路連線問題
- 權杖過期

**解決方案：**
1. 使用「🌐 API 測試」功能檢查連線
2. 確認已啟用額外 headers
3. 重新登入取得新權杖

### 問題 2：請求超時

**可能原因：**
- 網路連線慢
- Google API 回應慢
- 設備效能問題

**解決方案：**
1. 檢查網路連線
2. 等待重試
3. 使用 WiFi 而非行動網路

### 問題 3：Headers 不正確

**可能原因：**
- Release 模式判斷錯誤
- 配置未生效

**解決方案：**
1. 使用「🌍 環境資訊」確認模式
2. 檢查控制台日誌
3. 重新建置應用程式

## 📝 使用範例

### 基本使用

```typescript
import { isReleaseMode, getGoogleApiConfig } from '../utils/apiConfig';

// 判斷當前模式
if (isReleaseMode()) {
  console.log('當前為 Release 模式，已啟用額外 headers');
}

// 取得 API 配置
const config = getGoogleApiConfig(accessToken);
```

### 建立 API 客戶端

```typescript
import { createGoogleApiClient } from '../utils/apiConfig';

const client = createGoogleApiClient(accessToken);

// 使用客戶端發送請求
const response = await client.get('https://sheets.googleapis.com/v4/spreadsheets');
```

### 測試連線

```typescript
import { testApiConnection } from '../utils/apiConfig';

const result = await testApiConnection(accessToken);
if (result.success) {
  console.log('API 連線正常');
} else {
  console.error('API 連線失敗:', result.message);
}
```

## ⚠️ 重要注意事項

1. **Release 模式自動啟用**：系統會自動判斷並啟用 release 模式的額外配置
2. **向後相容**：Debug 模式保持原有行為，不會受到影響
3. **日誌記錄**：所有 API 活動都會記錄到控制台，方便除錯
4. **超時處理**：所有請求都有 30 秒超時保護
5. **快取控制**：Release 模式下禁用快取，確保資料即時性

## 🔄 更新日誌

- **2025-07-25**: 初始版本，實作 release 模式 API 配置
- **2025-07-25**: 添加環境資訊檢查功能
- **2025-07-25**: 添加 API 連線測試功能
- **2025-07-25**: 完善錯誤處理和日誌記錄

---

**最後更新**: 2025年7月25日
**適用版本**: React Native 0.75.2
**測試狀態**: ✅ Debug 模式已測試，✅ Release 模式已測試 