# Google登入整合功能總結

## 已實作的功能

### 1. Google登入系統
- ✅ 在 `App.tsx` 中初始化 Google Sign-In 配置
- ✅ 建立 `GoogleAuthContext` 來管理登入狀態
- ✅ 實作登入、登出、權杖管理功能
- ✅ 在 POS 系統中整合 Google 登入介面

### 2. Google Sheets 雲端表格服務
- ✅ 建立 `googleSheetsService` 來處理 Google Sheets API
- ✅ 支援建立新試算表
- ✅ 支援新增、讀取、更新、刪除資料列
- ✅ 專門的產品資料上傳功能

### 3. POS系統整合
- ✅ 在 POS 系統中新增 Google 帳戶管理區塊
- ✅ 顯示登入狀態和用戶資訊
- ✅ 建立試算表功能
- ✅ 掃描資料上傳到雲端功能
- ✅ 試算表 ID 顯示和管理

### 4. 類型定義
- ✅ 新增 `GoogleUser` 和 `GoogleAuthState` 類型
- ✅ 完整的 TypeScript 支援

## 檔案結構

```
src/
├── context/
│   └── GoogleAuthContext.tsx     # Google登入狀態管理
├── screens/
│   └── POSSystemScreen.tsx       # 更新後的POS系統（含Google功能）
├── types/
│   └── index.ts                  # 新增Google相關類型
├── utils/
│   ├── googleSheetsService.ts    # Google Sheets API服務
│   └── googleAuthTest.ts         # 測試工具
└── App.tsx                       # 更新後的App（含Google初始化）

GOOGLE_SETUP.md                   # Google設定指南
GOOGLE_INTEGRATION_SUMMARY.md     # 本文件
```

## 功能流程

### 1. Google登入流程
1. 用戶點擊「Google登入」按鈕
2. 系統檢查 Play Services 可用性
3. 顯示 Google 帳戶選擇器
4. 用戶選擇帳戶並授權
5. 取得存取權杖
6. 更新應用程式狀態
7. 顯示用戶資訊

### 2. 雲端表格操作流程
1. 用戶登入後點擊「建立試算表」
2. 系統建立新的 Google Sheets 試算表
3. 自動新增標題列（掃描時間、產品類別等）
4. 顯示試算表 ID
5. 掃描條碼後可上傳到雲端試算表

### 3. 資料上傳流程
1. 掃描條碼或手動輸入
2. 解析產品資訊
3. 點擊「上傳到雲端」按鈕
4. 系統將資料新增到試算表
5. 顯示成功訊息

## 需要你提供的資訊

### 1. Google Cloud Console 設定
你需要提供以下資訊：

1. **Web 用戶端 ID**（最重要）
   - 前往 Google Cloud Console
   - 建立 OAuth 2.0 憑證
   - 選擇「Web 應用程式」類型
   - 複製用戶端 ID

2. **Android 設定**
   - 套件名稱：`com.fanbookkeeping`
   - SHA-1 憑證指紋（使用 `./gradlew signingReport` 取得）

3. **iOS 設定**
   - Bundle ID：`com.fanbookkeeping`

### 2. 需要更新的檔案

#### App.tsx
```typescript
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  webClientId: '你的Web用戶端ID', // 替換這裡
  offlineAccess: true,
});
```

#### android/app/src/main/res/values/strings.xml
```xml
<string name="server_client_id">你的Web用戶端ID</string>
```

#### ios/FanBookkeeping/Info.plist
```xml
<string>com.googleusercontent.apps.你的用戶端ID</string>
```

## 測試步驟

1. **設定 Google Cloud Console**
   - 建立專案
   - 啟用 Google Sheets API
   - 建立 OAuth 2.0 憑證
   - 取得 Web 用戶端 ID

2. **更新應用程式設定**
   - 替換 `YOUR_WEB_CLIENT_ID`
   - 更新 Android/iOS 設定

3. **建置和測試**
   - 建置應用程式
   - 進入 POS 系統
   - 測試 Google 登入
   - 測試建立試算表
   - 測試資料上傳

## 注意事項

1. **安全性**
   - 不要將用戶端 ID 提交到公開版本控制
   - 使用環境變數管理敏感資訊

2. **權限**
   - 確保已啟用 Google Sheets API
   - 確認 OAuth 範圍設定正確

3. **測試**
   - 在真機上測試（模擬器可能有問題）
   - 檢查網路連線
   - 確認 Google 帳戶設定

## 下一步

1. 提供你的 Google Cloud Console 設定資訊
2. 更新相關設定檔案
3. 建置並測試應用程式
4. 根據測試結果調整設定

## 支援

如果遇到問題，請檢查：
- `GOOGLE_SETUP.md` 中的詳細設定指南
- Google Cloud Console 的錯誤日誌
- React Native 的除錯訊息
- 網路連線和權限設定 