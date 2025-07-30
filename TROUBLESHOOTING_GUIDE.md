# Google 登入 DEVELOPER_ERROR 故障排除指南

## 🔍 問題診斷步驟

### 1. OAuth 同意畫面設定檢查

**前往 Google Cloud Console：**
1. 網址: https://console.cloud.google.com/
2. 選擇您的專案
3. 前往「API 和服務」>「OAuth 同意畫面」

**檢查項目：**
- ✅ 應用程式狀態是否為「測試中」或「生產環境」
- ✅ 您的 Google 帳戶是否已加入測試使用者
- ✅ 應用程式名稱是否正確設定
- ✅ 支援電子郵件是否正確

### 2. API 啟用狀態檢查

**前往「API 和服務」>「程式庫」：**
- ✅ Google Sign-In API 已啟用
- ✅ Google Sheets API 已啟用

### 3. 憑證設定檢查

**前往「API 和服務」>「憑證」：**
- ✅ Android 用戶端 ID 存在
- ✅ SHA-1 指紋正確：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- ✅ 套件名稱正確：`com.fanbookkeeping`
- ✅ Web 用戶端 ID 正確：`191329007466-b0qd5r92knb24pe4imh2vnjl2euk58cj.apps.googleusercontent.com`

### 4. 應用程式配置檢查

**檢查 App.tsx 中的配置：**
```typescript
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  webClientId: '191329007466-b0qd5r92knb24pe4imh2vnjl2euk58cj.apps.googleusercontent.com',
  offlineAccess: true,
});
```

### 5. 測試環境檢查

**建議測試環境：**
- ✅ 使用真機測試（不是模擬器）
- ✅ 確保網路連線穩定
- ✅ 清除應用程式資料
- ✅ 重新安裝應用程式

## 🚨 常見問題和解決方案

### 問題 1：OAuth 同意畫面未設定
**症狀：** 登入時顯示「此應用程式未驗證」
**解決方案：** 設定 OAuth 同意畫面，加入測試使用者

### 問題 2：API 未啟用
**症狀：** 各種 API 錯誤
**解決方案：** 啟用 Google Sign-In API 和 Google Sheets API

### 問題 3：憑證設定錯誤
**症狀：** DEVELOPER_ERROR
**解決方案：** 檢查 SHA-1 指紋、套件名稱、用戶端 ID

### 問題 4：條碼解析問題
**症狀：** 條碼掃描後顯示「商品未登入」或「條碼格式不正確」
**解決方案：** 
- **商品必須先登入**：如果顯示「商品未登入」錯誤，請先在商品管理中新增該商品
- 商品ID為 `'0'` 或空時會顯示為「無」
- 確認條碼格式：`MERCHANT-CATEGORY-XXX-PRODUCTID-YYYYMMDD` 或 `CATEGORY-XXX-YYYYMMDD`

### 問題 5：測試環境問題
**症狀：** 模擬器上的各種錯誤
**解決方案：** 使用真機測試

### 問題 6：快取問題
**症狀：** 設定更新後仍然有問題
**解決方案：** 清除應用程式資料，重新安裝

## 🔧 進階診斷

### 檢查 Google Play Services
```typescript
// 在登入前檢查 Play Services
const hasPlayServices = await GoogleSignin.hasPlayServices();
console.log('Play Services 可用:', hasPlayServices);
```

### 檢查當前登入狀態
```typescript
// 檢查是否已經登入
const userInfo = await GoogleSignin.getCurrentUser();
console.log('當前用戶:', userInfo);
```

### 檢查權杖
```typescript
// 檢查權杖是否有效
try {
  const tokens = await GoogleSignin.getTokens();
  console.log('權杖有效:', !!tokens.accessToken);
} catch (error) {
  console.log('權杖錯誤:', error);
}
```

## 📱 測試步驟

### 步驟 1：基本檢查
1. 確認 Google Cloud Console 設定
2. 確認應用程式配置
3. 確認測試環境

### 步驟 2：清除和重新安裝
1. 清除應用程式資料
2. 解除安裝應用程式
3. 重新建置和安裝

### 步驟 3：測試登入
1. 開啟應用程式
2. 進入 POS 系統
3. 點擊 Google 登入
4. 觀察錯誤訊息

### 步驟 4：檢查日誌
1. 查看 React Native 日誌
2. 查看 Google Sign-In 錯誤訊息
3. 記錄詳細錯誤資訊

## 📞 需要提供的資訊

如果問題持續，請提供：
1. 完整的錯誤訊息
2. Google Cloud Console 設定截圖
3. 測試環境資訊（真機/模擬器）
4. 應用程式版本資訊

---

**最後更新**: 2025年7月25日 