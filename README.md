# FanBookkeeping - 記帳應用程式

一個功能完整的 React Native 記帳應用程式，包含傳統記帳功能和現代化的 POS 系統，幫助您追蹤日常收支並管理產品資訊。

## 功能特色

### 📱 主要功能
- **交易記錄**: 輕鬆記錄收入和支出
- **分類管理**: 預設多種常用分類（飲食、交通、購物等）
- **統計分析**: 查看收支統計和分類分析
- **POS 系統**: 掃描條碼快速記錄交易
- **產品管理**: 管理產品類別和條碼生成
- **Google 整合**: 雲端同步和 Google Sheets 支援
- **簡潔介面**: 現代化的 UI 設計，操作直觀

### 🎯 核心頁面
1. **主選擇頁面**: 選擇使用帳本或 POS 系統
2. **帳本功能**:
   - **首頁**: 顯示本月總覽和最近交易記錄
   - **統計**: 查看收支分類統計和百分比分析
   - **設定**: 應用程式設定和數據管理
3. **POS 系統**:
   - **條碼掃描**: 掃描產品條碼自動解析資訊
   - **手動輸入**: 支援手動輸入條碼
   - **Google 登入**: 整合 Google 帳戶管理
   - **雲端同步**: 上傳資料到 Google Sheets
   - **產品管理**: 管理產品類別和新增產品

### 💰 支援功能
- 收入/支出分類
- 金額格式化（新台幣）
- 日期記錄
- 交易描述
- 餘額計算
- 條碼掃描和解析
- 產品資訊管理
- Google Sheets 雲端同步

## 技術架構

### 使用技術
- **React Native 0.75.2**
- **TypeScript**
- **React Navigation** (底部導航 + 堆疊導航)
- **React Native Vector Icons**
- **React Native Camera** (條碼掃描)
- **Google Sign-In** (Google 登入)
- **Google Sheets API** (雲端同步)

### 專案結構
```
src/
├── components/          # 可重用組件
│   ├── TransactionItem.tsx
│   └── AddButton.tsx
├── screens/            # 頁面組件
│   ├── MainSelectScreen.tsx      # 主選擇頁面
│   ├── LedgerSelectScreen.tsx    # 帳本選擇頁面
│   ├── HomeScreen.tsx            # 帳本首頁
│   ├── AddTransactionScreen.tsx  # 新增交易
│   ├── StatsScreen.tsx           # 統計頁面
│   ├── SettingsScreen.tsx        # 設定頁面
│   ├── POSSystemScreen.tsx       # POS 系統
│   └── ProductManagementScreen.tsx # 產品管理
├── context/            # Context 管理
│   ├── DataContext.tsx           # 數據管理
│   └── GoogleAuthContext.tsx     # Google 登入管理
├── types/              # TypeScript 類型定義
│   └── index.ts
└── utils/              # 工具函數
    ├── helpers.ts
    ├── categories.ts
    ├── productParser.ts          # 產品解析
    ├── googleSheetsService.ts    # Google Sheets 服務
    ├── googleAuthTest.ts         # Google 登入測試
    ├── spreadsheetStorage.ts     # 試算表儲存
    └── apiConfig.ts              # API 配置
```

## 安裝與運行

### 前置需求
- Node.js >= 18
- React Native CLI
- iOS Simulator (macOS) 或 Android Emulator
- Google Cloud Console 專案（用於 Google 整合功能）

### 安裝步驟

1. **安裝依賴**
```bash
npm install
```

2. **iOS 額外安裝**
```bash
cd ios && pod install && cd ..
```

3. **Google 整合設定**
   - 參考 `GOOGLE_SETUP.md` 進行 Google Cloud Console 設定
   - 更新 `App.tsx` 中的 Web 用戶端 ID
   - 設定 Android/iOS 的 OAuth 憑證

4. **啟動應用程式**

iOS:
```bash
npm run ios
```

Android:
```bash
npm run android
```

## 使用說明

### 帳本功能

#### 新增交易
1. 選擇「帳本」功能
2. 點擊首頁右下角的 "+" 按鈕
3. 選擇交易類型（收入/支出）
4. 輸入金額
5. 填寫描述
6. 選擇分類
7. 點擊儲存

#### 查看統計
- 切換到「統計」頁面
- 查看各分類的支出/收入統計
- 了解收支比例

#### 管理設定
- 在「設定」頁面管理應用程式選項
- 匯出/備份數據（即將推出）
- 清除所有數據

### POS 系統

#### 條碼掃描
1. 選擇「POS系統」功能
2. 點擊「掃描條碼」按鈕
3. 允許相機權限
4. 對準產品條碼進行掃描
5. 系統自動解析產品資訊
6. 輸入販售價格
7. 點擊「上傳到雲端」儲存到 Google Sheets

#### 手動輸入
1. 點擊「手動輸入」按鈕
2. 輸入產品條碼
3. 系統解析產品資訊
4. 輸入販售價格並儲存

#### Google 整合
1. 點擊「Google登入」按鈕
2. 選擇 Google 帳戶並授權
3. 登入成功後可建立 Google Sheets 試算表
4. 掃描的產品資料會自動上傳到雲端

### 產品管理

#### 管理產品類別
1. 進入「產品管理」頁面
2. 查看現有產品類別
3. 點擊「新增類別」新增自訂類別
4. 輸入類別代碼和名稱

#### 管理產品
1. 選擇產品類別
2. 查看該類別下的所有產品
3. 點擊「新增產品」新增自訂產品
4. 輸入產品代碼和名稱

#### 生成條碼
1. 選擇產品和類別
2. 輸入生產日期（YYYYMMDD 格式）
3. 點擊「生成條碼」
4. 複製生成的條碼

## 預設分類

### 支出分類
- 🍽️ 飲食
- 🚗 交通
- 🛍️ 購物
- 🎮 娛樂
- 💊 醫療
- 📚 教育
- 🏠 住房
- 📝 其他

### 收入分類
- 💰 薪資
- 📈 投資
- 🎁 獎金
- 💵 其他收入

## Google 整合功能

### 支援功能
- **Google 登入**: 安全的帳戶認證
- **Google Sheets 同步**: 自動上傳產品資料到雲端
- **試算表管理**: 建立和管理 Google Sheets 試算表
- **資料備份**: 雲端備份重要資料

### 設定指南
詳細的 Google 整合設定請參考：
- `GOOGLE_SETUP.md` - 完整設定指南
- `GOOGLE_INTEGRATION_SUMMARY.md` - 功能總結
- `GOOGLE_CLOUD_SETUP.md` - Google Cloud Console 設定

## 開發計劃

### 已完成
- ✅ 基本記帳功能
- ✅ 統計分析
- ✅ POS 系統
- ✅ 條碼掃描
- ✅ 產品管理
- ✅ Google 登入整合
- ✅ Google Sheets 同步
- ✅ 試算表管理

### 即將推出
- [ ] 數據持久化存儲
- [ ] 數據匯出功能
- [ ] 預算設定
- [ ] 圖表分析
- [ ] 多幣別支援
- [ ] 深色模式
- [ ] 離線模式

### 技術改進
- [ ] 狀態管理 (Redux/Context)
- [ ] 本地數據庫 (SQLite/Realm)
- [ ] 單元測試
- [ ] E2E 測試

## 故障排除

### 常見問題
- **Google 登入失敗**: 參考 `TROUBLESHOOTING_GUIDE.md`
- **條碼掃描問題**: 檢查相機權限設定
- **建置錯誤**: 參考 `QUICK_FIX_GUIDE.md`
- **發布模式問題**: 參考 `RELEASE_MODE_API_GUIDE.md`

### 除錯指南
- `DEBUG_KEY_SETUP.md` - 除錯金鑰設定
- `RELEASE_KEY_SETUP.md` - 發布金鑰設定

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案！

## 授權

MIT License
