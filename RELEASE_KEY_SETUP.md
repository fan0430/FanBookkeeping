# Release Key 設定完成

## 📋 設定摘要

### Release Keystore 資訊
- **檔案位置**: `android/app/release.keystore`
- **別名**: `release-key-alias`
- **密碼**: `FanBookkeeping2024`
- **有效期**: 2025年7月25日 - 2052年12月10日

### SHA-1 指紋
```
A6:E4:FA:16:BA:05:D2:D8:64:FD:E6:E3:51:8C:C1:5B:98:7C:2C:B7
```

### 已更新的檔案
1. **android/gradle.properties** - 新增 release keystore 配置
2. **android/app/build.gradle** - 新增 release signing config
3. **android/app/release.keystore** - 新建立的 keystore 檔案

## 🔧 Google Cloud Console 設定

### 需要在 Google Cloud Console 中更新的資訊：

1. **前往 Google Cloud Console**
   - 網址: https://console.cloud.google.com/
   - 選擇您的專案

2. **更新 Android 憑證**
   - 前往「API 和服務」>「憑證」
   - 找到您的 Android OAuth 2.0 用戶端 ID
   - 更新 SHA-1 憑證指紋為：
     ```
     A6:E4:FA:16:BA:05:D2:D8:64:FD:E6:E3:51:8C:C1:5B:98:7C:2C:B7
     ```

3. **確認設定**
   - 套件名稱: `com.fanbookkeeping`
   - Web 用戶端 ID: `191329007466-b0qd5r92knb24pe4imh2vnjl2euk58cj.apps.googleusercontent.com`

## 🚀 建置指令

### Debug 版本（使用 debug keystore）
```bash
npx react-native run-android --variant=debug
```

### Release 版本（使用 release keystore）
```bash
npx react-native run-android --variant=release
```

### 或使用 Gradle 指令
```bash
# Debug
./gradlew assembleDebug

# Release
./gradlew assembleRelease
```

## 🔍 驗證設定

### 檢查簽名報告
```bash
cd android
./gradlew signingReport
```

您應該看到：
- **Debug 變體**: 使用 debug.keystore
- **Release 變體**: 使用 release.keystore

## ⚠️ 重要注意事項

1. **備份 keystore 檔案**
   - 請務必備份 `android/app/release.keystore` 檔案
   - 如果遺失，將無法更新應用程式

2. **密碼安全**
   - keystore 密碼: `FanBookkeeping2024`
   - 請妥善保管此密碼

3. **Google Cloud Console 更新**
   - 更新 SHA-1 指紋後，可能需要等待幾分鐘才能生效
   - 建議清除應用程式資料後重新測試

## 🧪 測試步驟

1. 更新 Google Cloud Console 中的 SHA-1 指紋
2. 建置 release 版本應用程式
3. 安裝到真機上測試
4. 測試 Google 登入功能

## 📞 故障排除

如果仍然遇到 `DEVELOPER_ERROR`：

1. **確認 SHA-1 指紋已更新**
2. **等待 Google Cloud Console 生效**（通常需要 5-10 分鐘）
3. **清除應用程式資料**
4. **重新安裝應用程式**
5. **檢查網路連線**

---

**設定完成時間**: 2025年7月25日
**下次需要更新**: 2052年12月10日（keystore 到期） 