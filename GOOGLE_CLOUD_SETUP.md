# Google登入設定指南

## 1. Google Cloud Console 設定

### 1.1 建立專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Sheets API 和 Google Sign-In API

### 1.2 設定 OAuth 同意畫面
**重要：這是解決 DEVELOPER_ERROR 的關鍵步驟**

1. 在左側選單中選擇「API 和服務」>「OAuth 同意畫面」
2. 選擇「外部」用戶類型
3. 填寫必要資訊：
   - 應用程式名稱：`FanBookkeeping`
   - 用戶支援電子郵件：您的 Google 帳戶
   - 開發者聯絡資訊：您的電子郵件
4. 在「測試使用者」中新增您的 Google 帳戶
5. 點擊「儲存並繼續」
6. 在「範圍」頁面點擊「儲存並繼續」
7. 在「測試使用者」頁面點擊「儲存並繼續」

### 1.3 設定 OAuth 2.0 憑證
1. 在左側選單中選擇「API 和服務」>「憑證」
2. 點擊「建立憑證」>「OAuth 2.0 用戶端 ID」

#### Android 設定
1. 應用程式類型選擇「Android」
2. 輸入應用程式名稱：`FanBookkeeping`
3. 輸入套件名稱：`com.fanbookkeeping`
4. 輸入 SHA-1 憑證指紋（使用以下指令取得）：
   ```bash
   cd android && ./gradlew signingReport
   ```
   尋找 `SHA1` 值，應該類似：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
5. 點擊「建立」

#### iOS 設定
1. 應用程式類型選擇「iOS」
2. 輸入應用程式名稱：`FanBookkeeping`
3. 輸入 Bundle ID：`com.fanbookkeeping`
4. 點擊「建立」

#### Web 用戶端 ID
1. 再次點擊「建立憑證」>「OAuth 2.0 用戶端 ID」
2. 選擇「Web 應用程式」
3. 輸入名稱：`FanBookkeeping Web Client`
4. 在「已授權的重新導向 URI」中新增：
   - `http://localhost:8081`
   - `http://localhost:3000`
   - `http://localhost`
5. 點擊「建立」
6. **複製 Web 用戶端 ID**（這是你需要的 `YOUR_WEB_CLIENT_ID`）

### 1.4 啟用必要的 API
1. 前往「API 和服務」>「程式庫」
2. 搜尋並啟用以下 API：
   - Google Sign-In API
   - Google Sheets API
   - Google Drive API

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

## 3. 故障排除

### 3.1 常見錯誤和解決方案

#### DEVELOPER_ERROR (錯誤代碼 10)
**原因：** OAuth 同意畫面未正確設定
**解決方案：**
1. 確認 OAuth 同意畫面已設定為「測試中」或「生產環境」
2. 確認您的 Google 帳戶已加入測試使用者
3. 等待 24 小時讓設定生效

#### SIGN_IN_CANCELLED (錯誤代碼 12501)
**原因：** 使用者取消登入
**解決方案：** 這是正常行為，重新嘗試登入

#### PLAY_SERVICES_NOT_AVAILABLE (錯誤代碼 12502)
**原因：** Google Play Services 不可用
**解決方案：**
1. 更新 Google Play Services
2. 使用真機測試（不是模擬器）

#### IN_PROGRESS (錯誤代碼 12500)
**原因：** 登入流程正在進行中
**解決方案：** 等待當前流程完成

### 3.2 測試步驟

1. **清除應用程式資料**
   ```bash
   # Android
   adb shell pm clear com.fanbookkeeping
   
   # iOS
   # 在設定中清除應用程式資料
   ```

2. **重新安裝應用程式**
   ```bash
   # 清除建置快取
   npx react-native clean
   
   # 重新建置
   npx react-native run-android
   # 或
   npx react-native run-ios
   ```

3. **測試登入**
   - 開啟應用程式
   - 進入 POS 系統
   - 點擊「Google登入」
   - 選擇您的 Google 帳戶
   - 授權應用程式

### 3.3 驗證設定

使用應用程式內的診斷功能：
1. 點擊「🔍 診斷問題」按鈕
2. 檢查所有項目是否為 ✅
3. 如果有 ❌，按照建議進行修正

## 4. 重要注意事項

1. **測試環境**
   - 使用真機測試（模擬器可能有問題）
   - 確保網路連線穩定
   - 使用相同的 Google 帳戶進行測試

2. **設定生效時間**
   - OAuth 同意畫面設定可能需要 24 小時生效
   - 憑證設定通常立即生效

3. **安全性**
   - 不要將用戶端 ID 提交到公開版本控制
   - 使用環境變數管理敏感資訊

4. **版本控制**
   - 將 `google-services.json` 和 `GoogleService-Info.plist` 加入 `.gitignore`
   - 只提交範例檔案

## 5. 完成檢查清單

- [ ] Google Cloud Console 專案已建立
- [ ] OAuth 同意畫面已設定
- [ ] 測試使用者已加入
- [ ] Android 憑證已建立（包含正確的 SHA-1）
- [ ] iOS 憑證已建立
- [ ] Web 用戶端 ID 已取得
- [ ] 必要的 API 已啟用
- [ ] App.tsx 中的 webClientId 已更新
- [ ] Android strings.xml 已更新
- [ ] iOS Info.plist 已更新
- [ ] 應用程式已重新建置
- [ ] 登入測試成功

如果所有步驟都完成但仍然有問題，請檢查：
1. Google Cloud Console 的錯誤日誌
2. 應用程式的詳細錯誤訊息
3. 網路連線狀態
4. Google 帳戶設定 