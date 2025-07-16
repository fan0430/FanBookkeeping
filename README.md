# FanBookkeeping - 記帳應用程式

一個簡單易用的 React Native 記帳應用程式，幫助您追蹤日常收支。

## 功能特色

### 📱 主要功能
- **交易記錄**: 輕鬆記錄收入和支出
- **分類管理**: 預設多種常用分類（飲食、交通、購物等）
- **統計分析**: 查看收支統計和分類分析
- **簡潔介面**: 現代化的 UI 設計，操作直觀

### 🎯 核心頁面
1. **首頁**: 顯示本月總覽和最近交易記錄
2. **統計**: 查看收支分類統計和百分比分析
3. **設定**: 應用程式設定和數據管理

### 💰 支援功能
- 收入/支出分類
- 金額格式化（新台幣）
- 日期記錄
- 交易描述
- 餘額計算

## 技術架構

### 使用技術
- **React Native 0.75.2**
- **TypeScript**
- **React Navigation** (底部導航 + 堆疊導航)
- **React Native Vector Icons**

### 專案結構
```
src/
├── components/          # 可重用組件
│   ├── TransactionItem.tsx
│   └── AddButton.tsx
├── screens/            # 頁面組件
│   ├── HomeScreen.tsx
│   ├── AddTransactionScreen.tsx
│   ├── StatsScreen.tsx
│   └── SettingsScreen.tsx
├── types/              # TypeScript 類型定義
│   └── index.ts
└── utils/              # 工具函數
    ├── helpers.ts
    └── categories.ts
```

## 安裝與運行

### 前置需求
- Node.js >= 18
- React Native CLI
- iOS Simulator (macOS) 或 Android Emulator

### 安裝步驟

1. **安裝依賴**
```bash
npm install
```

2. **iOS 額外安裝**
```bash
cd ios && pod install && cd ..
```

3. **啟動應用程式**

iOS:
```bash
npm run ios
```

Android:
```bash
npm run android
```

## 使用說明

### 新增交易
1. 點擊首頁右下角的 "+" 按鈕
2. 選擇交易類型（收入/支出）
3. 輸入金額
4. 填寫描述
5. 選擇分類
6. 點擊儲存

### 查看統計
- 切換到「統計」頁面
- 查看各分類的支出/收入統計
- 了解收支比例

### 管理設定
- 在「設定」頁面管理應用程式選項
- 匯出/備份數據（即將推出）
- 清除所有數據

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

## 開發計劃

### 即將推出
- [ ] 數據持久化存儲
- [ ] 數據匯出功能
- [ ] 雲端備份
- [ ] 預算設定
- [ ] 圖表分析
- [ ] 多幣別支援
- [ ] 深色模式

### 技術改進
- [ ] 狀態管理 (Redux/Context)
- [ ] 本地數據庫 (SQLite/Realm)
- [ ] 單元測試
- [ ] E2E 測試

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案！

## 授權

MIT License
