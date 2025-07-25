# Debug 版本 Google 登入設定指南

## 📋 Debug 版本資訊

### Debug Keystore 資訊
- **檔案位置**: `android/app/debug.keystore` ⭐ **重要：這是專案自訂的 keystore**
- **別名**: `androiddebugkey`
- **密碼**: `android`
- **SHA-1 指紋**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` ⭐ **使用這個！**

### ⚠️ 注意：不要使用系統預設的 debug keystore
- 系統預設位置: `~/.android/debug.keystore`
- 系統預設 SHA-1: `B7:40:0D:FC:5A:F8:4D:05:2A:A3:FF:A7:A1:A5:9C:E7:03:C0:ED:1C`
- **您的專案使用的是專案內的 keystore，不是系統預設的！**

## 🔧 Google Cloud Console 設定

### 需要在 Google Cloud Console 中更新的資訊：

1. **前往 Google Cloud Console**
   - 網址: https://console.cloud.google.com/
   - 選擇您的專案

2. **更新 Android 憑證**
   - 前往「API 和服務」>「憑證」
   - 找到您的 Android OAuth 2.0 用戶端 ID
   - **更新 SHA-1 憑證指紋為**：
     ```
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
     ```
     ⭐ **重要：使用專案內的 keystore 指紋，不是系統預設的！**

3. **確認設定**
   - 套件名稱: `com.fanbookkeeping`
   - Web 用戶端 ID: `191329007466-b0qd5r92knb24pe4imh2vnjl2euk58cj.apps.googleusercontent.com`

## 🚀 建置指令

### Debug 版本（推薦用於開發）
```bash
npx react-native run-android
# 或
npx react-native run-android --variant=debug
```

### 或使用 Gradle 指令
```bash
cd android
./gradlew assembleDebug
```

## 🔍 驗證設定

### 檢查簽名報告
```bash
cd android
./gradlew signingReport
```

您應該看到 Debug 變體使用：
- **Store**: `/Users/fan-addx3/FanBookkeeping/android/app/debug.keystore` ⭐
- **SHA1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` ⭐

## 🧪 測試步驟

1. **更新 Google Cloud Console 中的 SHA-1 指紋** ⭐
   - 使用：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - 不要使用：`B7:40:0D:FC:5A:F8:4D:05:2A:A3:FF:A7:A1:A5:9C:E7:03:C0:ED:1C`
2. **等待 5-10 分鐘讓設定生效**
3. **建置 Debug 版本**：
   ```bash
   npx react-native run-android
   ```
4. **清除應用程式資料**（如果之前安裝過）
5. **測試 Google 登入功能**

## 📱 應用程式配置

您的 `App.tsx` 中的 Google Sign-In 配置：
```typescript
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  webClientId: '191329007466-b0qd5r92knb24pe4imh2vnjl2euk58cj.apps.googleusercontent.com',
  offlineAccess: true,
});
```

## ⚠️ 重要注意事項

1. **Debug 版本僅用於開發和測試**
   - 不要用於 Google Play Store 發布
   - 僅用於開發階段測試

2. **Google Cloud Console 設定**
   - 確保 OAuth 同意畫面已設定
   - 確保您的 Google 帳戶已加入測試使用者
   - 確保已啟用 Google Sign-In API 和 Google Sheets API

3. **測試環境**
   - 建議在真機上測試（模擬器可能有問題）
   - 確保網路連線穩定

4. **SHA-1 指紋確認** ⭐
   - 您的專案使用專案內的 debug.keystore
   - 正確的 SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

## 🔄 從 Debug 切換到 Release

當您準備發布時，需要：
1. 使用 Release SHA-1: `A6:E4:FA:16:BA:05:D2:D8:64:FD:E6:E3:51:8C:C1:5B:98:7C:2C:B7`
2. 建置 Release 版本: `npx react-native run-android --variant=release`

## 📞 故障排除

如果仍然遇到 `DEVELOPER_ERROR`：

1. **確認 SHA-1 指紋已更新** ⭐
   - 使用正確的指紋：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
2. **等待 Google Cloud Console 生效**（5-10 分鐘）
3. **清除應用程式資料**
4. **重新安裝應用程式**
5. **檢查網路連線**
6. **確認 OAuth 同意畫面設定**

---

**設定完成時間**: 2025年7月25日
**適用版本**: Debug 版本（開發測試用）
**重要提醒**: 使用專案內的 debug.keystore，不是系統預設的！ 