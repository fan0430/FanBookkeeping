# Google 登入快速修復指南

## 🚨 當前登入狀態 ❌ 和 權杖有效性 ❌ 的解決方案

### 問題分析
這兩個錯誤通常表示：
1. **DEVELOPER_ERROR** - Google Cloud Console 設定問題
2. **配置錯誤** - 應用程式配置問題
3. **網路問題** - 連線問題

## 🔧 快速修復步驟

### 步驟 1：檢查 Google Cloud Console 設定

**前往 Google Cloud Console：**
1. 網址: https://console.cloud.google.com/
2. 選擇您的專案

**檢查 Android 憑證：**
1. 前往「API 和服務」>「憑證」
2. 找到您的 Android OAuth 2.0 用戶端 ID
3. **確認 SHA-1 指紋**：
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
4. **確認套件名稱**：`com.fanbookkeeping`

### 步驟 2：檢查 OAuth 同意畫面

**前往「API 和服務」>「OAuth 同意畫面」：**
1. 確認應用程式狀態為「測試中」
2. 確認您的 Google 帳戶已加入測試使用者
3. 確認支援電子郵件已設定

### 步驟 3：檢查 API 啟用狀態

**前往「API 和服務」>「程式庫」：**
1. 搜尋並啟用「Google Sign-In API」
2. 搜尋並啟用「Google Sheets API」

### 步驟 4：清除應用程式資料

**在您的設備上：**
1. 前往「設定」>「應用程式」
2. 找到您的應用程式
3. 點擊「儲存空間」
4. 點擊「清除資料」
5. 重新安裝應用程式

### 步驟 5：重新建置應用程式

```bash
# 清除快取
cd android && ./gradlew clean

# 重新建置
cd .. && npx react-native run-android
```

## 🎯 常見問題解決方案

### 問題 1：DEVELOPER_ERROR
**原因：** SHA-1 指紋不匹配
**解決方案：**
1. 確認使用正確的 SHA-1：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
2. 等待 5-10 分鐘讓設定生效
3. 清除應用程式資料

### 問題 2：條碼解析錯誤
**原因：** 條碼格式不支援或類別/產品不存在
**解決方案：**
1. 確認條碼格式：`MERCHANT-CATEGORY-XXX-PRODUCTID-YYYYMMDD` 或 `CATEGORY-XXX-YYYYMMDD`
2. 系統支援寬鬆解析，未知類別/產品仍可正常解析
3. 商品ID為 `'0'` 或空時會顯示為「無」

### 問題 3：NETWORK_ERROR
**原因：** 網路連線問題
**解決方案：**
1. 檢查網路連線
2. 嘗試使用 WiFi 而不是行動網路
3. 重新啟動設備

### 問題 4：Play Services 不可用
**原因：** Google Play Services 問題
**解決方案：**
1. 更新 Google Play Services
2. 清除 Google Play Services 快取
3. 重新啟動設備

### 問題 5：OAuth 同意畫面問題
**原因：** 應用程式未驗證
**解決方案：**
1. 確認應用程式狀態為「測試中」
2. 確認您的 Google 帳戶已加入測試使用者
3. 等待設定生效

## 📱 測試步驟

### 1. 使用診斷工具
1. 開啟應用程式
2. 進入 POS 系統
3. 點擊「🔍 診斷問題」
4. 查看詳細診斷結果

### 2. 根據診斷結果修復
- 如果顯示 DEVELOPER_ERROR → 檢查 Google Cloud Console 設定
- 如果顯示 NETWORK_ERROR → 檢查網路連線
- 如果顯示 Play Services 問題 → 更新 Google Play Services

### 3. 測試登入
1. 點擊「🧪 測試登入」
2. 查看是否成功
3. 如果成功，嘗試正常登入

## ⚠️ 重要提醒

1. **等待時間**：Google Cloud Console 設定更改後需要 5-10 分鐘生效
2. **測試環境**：建議使用真機測試，模擬器可能有問題
3. **網路連線**：確保網路連線穩定
4. **應用程式資料**：每次設定更改後建議清除應用程式資料

## 📞 如果問題持續

如果按照以上步驟仍然無法解決，請提供：
1. 診斷工具的完整輸出
2. Google Cloud Console 設定截圖
3. 錯誤訊息的完整內容

---

**最後更新**: 2025年7月25日 