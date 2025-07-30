# Google登入設定指南

## 1. Google Cloud Console 設定

### 1.1 建立專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Sheets API 和 Google Sign-In API

### 1.2 設定 OAuth 2.0
1. 在左側選單中選擇「API 和服務」>「憑證」
2. 點擊「建立憑證」>「OAuth 2.0 用戶端 ID」
3. 選擇應用程式類型：
   - **Android**: 選擇「Android」
   - **iOS**: 選擇「iOS」

### 1.3 Android 設定
1. 應用程式類型選擇「Android」
2. 輸入應用程式名稱
3. 輸入套件名稱：`com.fanbookkeeping`
4. 輸入 SHA-1 憑證指紋（使用以下指令取得）：
   ```bash
   cd android && ./gradlew signingReport
   ```
5. 點擊「建立」

### 1.4 iOS 設定
1. 應用程式類型選擇「iOS」
2. 輸入應用程式名稱
3. 輸入 Bundle ID：`com.fanbookkeeping`
4. 點擊「建立」

### 1.5 Web 用戶端 ID
1. 再次點擊「建立憑證」>「OAuth 2.0 用戶端 ID」
2. 選擇「Web 應用程式」
3. 輸入名稱
4. 在「已授權的重新導向 URI」中新增：
   - `http://localhost:8081`
   - `http://localhost:3000`
5. 點擊「建立」
6. **複製 Web 用戶端 ID**（這是你需要的 `YOUR_WEB_CLIENT_ID`）

## 2. 更新應用程式設定

### 2.1 更新 App.tsx
將 `YOUR_WEB_CLIENT_ID` 替換為你從 Google Cloud Console 取得的 Web 用戶端 ID：

```typescript
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  webClientId: '你的Web用戶端ID', // 替換這裡
  offlineAccess: true,
});
```

### 2.2 Android 設定
在 `android/app/src/main/res/values/strings.xml` 中新增：

```xml
<resources>
    <string name="app_name">FanBookkeeping</string>
    <string name="server_client_id">你的Web用戶端ID</string>
</resources>
```

### 2.3 iOS 設定
在 `ios/FanBookkeeping/Info.plist` 中新增：

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.fanbookkeeping</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.你的用戶端ID</string>
        </array>
    </dict>
</array>
```

## 3. 功能說明

### 3.1 Google登入
- 點擊「Google登入」按鈕進行登入
- 登入成功後會顯示用戶資訊
- 可以建立新的 Google Sheets 試算表

### 3.2 雲端表格功能
- **建立試算表**: 建立新的 Google Sheets 試算表
- **上傳資料**: 將掃描的產品資料上傳到雲端試算表
- **試算表結構**:
  - 掃描時間
  - 產品類別代碼
  - 產品類別名稱
  - 產品代碼
  - 產品名稱
  - 進貨日期
  - 格式化日期
  - 販售價格

### 3.3 權限說明
應用程式需要以下權限：
- `https://www.googleapis.com/auth/spreadsheets`: 存取 Google Sheets
- 相機權限：用於掃描條碼

## 4. 故障排除

### 4.1 登入失敗
- 檢查 Web 用戶端 ID 是否正確
- 確認 Google Cloud Console 中的設定
- 檢查網路連線

### 4.2 試算表存取失敗
- 確認已啟用 Google Sheets API
- 檢查 OAuth 範圍設定
- 確認用戶已授權應用程式存取

### 4.3 Android 建置錯誤
- 確認 SHA-1 憑證指紋正確
- 檢查套件名稱設定
- 重新建置應用程式

## 5. 安全注意事項

1. **不要將用戶端 ID 提交到公開版本控制**
2. **使用環境變數或安全的配置管理**
3. **定期更新 OAuth 憑證**
4. **監控 API 使用量**

## 6. 測試

1. 建置並安裝應用程式
2. 進入 POS 系統
3. 點擊「Google登入」
4. 選擇 Google 帳戶並授權
5. 測試建立試算表功能
6. 掃描條碼並上傳到雲端

## 7. 支援

如果遇到問題，請檢查：
- Google Cloud Console 的錯誤日誌
- React Native 的除錯訊息
- 網路連線狀態
- 應用程式權限設定 