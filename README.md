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
- **預設頁面設定**: 自訂應用程式啟動頁面
- **環境檢測**: 自動檢測 Debug/Release 模式
- **智能 API 配置**: 根據環境自動調整 API 設定

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
- 預設頁面自訂
- 環境模式自動檢測
- Release 模式 API 優化

## 🆕 最新功能更新 (2025-01-XX)

### 🆕 商品ID系統 (2025-01-XX)
- **商品ID功能**: 新增商品ID欄位，記錄商家進貨時的商品ID
- **格式支援**: 支援英數字混合格式，例如：`P001`、`SKU123`、`ABC123`
- **預設值**: 如果沒有設定商品ID，系統自動使用 `'0'` 作為預設值
- **顯示邏輯**: 商品ID為 `'0'` 或空時顯示為「無」

### 🔄 條碼格式升級 (2025-01-XX)
- **新格式**: `MERCHANT-CATEGORY-XXX-PRODUCTID-YYYYMMDD`
  - 例如：`ANPIN-EARRINGS-001-P001-20241201`
- **舊格式**: `CATEGORY-XXX-YYYYMMDD` (保持向後相容)
  - 例如：`EARRINGS-001-20241201`
- **嚴格檢查**: 商品必須先在商品管理中登入才能進行掃描

### 📅 時間格式優化 (2025-01-XX)
- **掃描時間**: 從 `2024-12-31T16:00:00.000Z` 改為 `2024-12-31 16:00:00`
- **進貨日期**: 從 `2024-12-31T16:00:00.000Z` 改為 `2024-12-31`
- **台灣時間**: 統一使用台灣時間（UTC+8）格式

### 🔧 類別代碼限制移除 (2025-01-XX)
- **之前**: 限制為3位大寫字母
- **現在**: 支援任意長度的大寫字母
- **範例**: `ABC`、`FRUITS`、`VEGETABLES`、`DAIRY`

### 🗑️ 簡化試算表結構 (2025-01-XX)
- **移除重複欄位**: 移除多餘的「格式化日期」欄位
- **欄位優化**: 試算表從11欄減少到10欄
- **欄位順序**: 調整金額欄位位置，優化資料結構

## 🆕 功能更新 (2025-07-25)

### 1. 預設頁面設定
- **功能**: 可自訂應用程式啟動時顯示的頁面
- **選項**: 主選擇頁面、帳本選擇、POS 系統
- **位置**: 設定頁面 → 應用程式 → 預設頁面
- **用途**: 快速進入常用功能，提升使用效率

### 2. 環境檢測系統
- **自動檢測**: 應用程式自動判斷當前為 Debug 或 Release 模式
- **環境資訊**: 顯示平台、版本、模擬器狀態等詳細資訊
- **診斷工具**: 在 POS 系統中提供環境檢測功能
- **日誌記錄**: 詳細記錄環境變化和 API 活動

### 3. Release 模式 API 配置
- **智能配置**: 根據環境自動調整 API 請求配置
- **額外 Headers**: Release 模式下自動添加安全性和相容性 headers
- **超時保護**: 所有 API 請求都有 30 秒超時保護
- **快取控制**: Release 模式下禁用快取，確保資料即時性
- **錯誤處理**: 完善的錯誤處理和日誌記錄

### 4. 增強的 Google 整合
- **診斷工具**: 內建 Google 登入問題診斷
- **快速修復**: 提供常見問題的快速解決方案
- **環境資訊**: 顯示詳細的 Google 服務狀態
- **API 連線測試**: 測試 Google API 連線狀態

### 5. 改進的設定系統
- **持久化設定**: 應用程式設定自動保存和載入
- **即時更新**: 設定變更立即生效
- **預設值管理**: 智能的預設值處理

## 技術架構

### 使用技術
- **React Native 0.75.2**
- **TypeScript**
- **React Navigation** (底部導航 + 堆疊導航)
- **React Native Vector Icons**
- **React Native Camera** (條碼掃描)
- **Google Sign-In** (Google 登入)
- **Google Sheets API** (雲端同步)
- **AsyncStorage** (本地資料儲存)

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
    ├── helpers.ts                 # 通用工具函數
    ├── categories.ts              # 分類定義
    ├── productParser.ts           # 產品解析
    ├── googleSheetsService.ts     # Google Sheets 服務
    ├── googleAuthTest.ts          # Google 登入測試
    ├── spreadsheetStorage.ts      # 試算表儲存
    └── apiConfig.ts               # API 配置管理
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
- **預設頁面設定**: 選擇應用程式啟動時顯示的頁面
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

#### 環境檢測和診斷
1. 點擊「🔍 診斷問題」按鈕
2. 查看環境資訊和 Google 服務狀態
3. 使用「🧪 測試登入」功能測試 Google 登入
4. 查看「🌍 環境資訊」了解當前模式

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

#### 建立產品
1. 選擇產品類別
2. 點擊「新增產品」按鈕
3. 輸入產品名稱
4. 輸入商品ID（選填，可留空）
5. 系統自動生成產品代碼
6. 點擊「新增產品」儲存

#### 生成條碼
1. 選擇商家、產品類別和產品
2. 輸入進貨日期（YYYYMMDD 格式）
3. 系統自動從產品資料中獲取商品ID
4. 點擊「生成條碼」
5. 複製生成的條碼

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
- **診斷工具**: 內建問題診斷和快速修復
- **環境檢測**: 自動檢測 Google 服務狀態

### 設定指南
詳細的 Google 整合設定請參考：
- `GOOGLE_SETUP.md` - 完整設定指南
- `GOOGLE_INTEGRATION_SUMMARY.md` - 功能總結
- `GOOGLE_CLOUD_SETUP.md` - Google Cloud Console 設定
- `QUICK_FIX_GUIDE.md` - 快速修復指南

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
- ✅ 預設頁面設定
- ✅ 環境檢測系統
- ✅ Release 模式 API 配置
- ✅ 增強的 Google 整合診斷
- ✅ 商品ID系統
- ✅ 條碼格式升級
- ✅ 時間格式優化
- ✅ 類別代碼限制移除
- ✅ 試算表結構簡化

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
- **環境檢測問題**: 使用應用程式內診斷工具

### 除錯指南
- `DEBUG_KEY_SETUP.md` - 除錯金鑰設定
- `RELEASE_KEY_SETUP.md` - 發布金鑰設定
- `RELEASE_MODE_API_GUIDE.md` - Release 模式 API 配置

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案！

## 授權

MIT License
