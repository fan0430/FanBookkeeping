import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Clipboard from '@react-native-clipboard/clipboard';
import { NavigationProps, ParsedBarcode } from '../types';
import { parseBarcode } from '../utils/productParser';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { googleSheetsService, SpreadsheetInfo } from '../utils/googleSheetsService';
import { diagnoseGoogleAuth, testSignInWithDiagnosis, getQuickFixSuggestions, forceSignIn, checkOAuthConsentScreen } from '../utils/googleAuthTest';
import { 
  getUserSpreadsheetId, 
  saveUserSpreadsheetId, 
  getUserSpreadsheetInfo,
  updateUserSpreadsheetLastUsed,
  UserSpreadsheet 
} from '../utils/spreadsheetStorage';
import { isReleaseMode, isDebugMode, getEnvironmentInfo, logEnvironmentInfo } from '../utils/helpers';
import { testApiConnection, logApiEnvironmentInfo } from '../utils/apiConfig';

const { width: screenWidth } = Dimensions.get('window');

const POSSystemScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [parsedProduct, setParsedProduct] = useState<ParsedBarcode | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<UserSpreadsheet | null>(null);
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectingSpreadsheet, setIsSelectingSpreadsheet] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [showSpreadsheetsModal, setShowSpreadsheetsModal] = useState(false);
  const [showCreateSpreadsheetModal, setShowCreateSpreadsheetModal] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');

  const { authState, signIn, signOut, getAccessToken } = useGoogleAuth();

  // 當登入狀態改變時載入試算表資訊
  React.useEffect(() => {
    if (authState.isSignedIn) {
      loadUserSpreadsheetInfo();
    } else {
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
    }
  }, [authState.isSignedIn, authState.user?.id]);

  // 載入用戶的試算表資訊
  const loadUserSpreadsheetInfo = async () => {
    if (!authState.isSignedIn || !authState.user?.id) {
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
      return;
    }

    try {
      const savedSpreadsheetId = await getUserSpreadsheetId(authState.user.id);
      const savedSpreadsheetInfo = await getUserSpreadsheetInfo(authState.user.id);
      
      if (savedSpreadsheetId && savedSpreadsheetInfo) {
        setSpreadsheetId(savedSpreadsheetId);
        setSpreadsheetInfo(savedSpreadsheetInfo);
        console.log('載入用戶試算表資訊:', savedSpreadsheetInfo);
      } else {
        setSpreadsheetId('');
        setSpreadsheetInfo(null);
      }
    } catch (error) {
      console.error('載入用戶試算表資訊失敗:', error);
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
    }
  };

  // 檢查相機權限
  const checkCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);

      switch (result) {
        case RESULTS.UNAVAILABLE:
          Alert.alert('錯誤', '此設備不支援相機功能');
          return false;
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          if (requestResult === RESULTS.GRANTED) {
            return true;
          } else {
            Alert.alert('權限被拒絕', '需要相機權限才能使用掃描功能');
            return false;
          }
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
          return true;
        case RESULTS.BLOCKED:
          Alert.alert(
            '權限被阻擋',
            '相機權限已被阻擋，請在設定中開啟相機權限',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '開啟設定', onPress: () => {
                  Linking.openSettings();
                }
              }
            ]
          );
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      Alert.alert('錯誤', '檢查相機權限時發生錯誤');
      return false;
    }
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      Alert.alert('錯誤', '請輸入條碼內容');
      return;
    }
    const parsed = await parseBarcode(manualInput);
    setScannedData(manualInput);
    setParsedProduct(parsed);
    setShowResultModal(true);
  };

  const handleScanAgain = () => {
    setScannedData('');
    setParsedProduct(null);
    setManualInput('');
    setAmount('');
    setShowResultModal(false);
    setShowCameraModal(false);
  };

  const handleCameraScan = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      setShowCameraModal(true);
    }
  };

  const onBarcodeRead = async (event: any) => {
    console.log('Barcode read event:', event);
    const { data } = event;
    if (data) {
      const parsed = await parseBarcode(data);
      setScannedData(data);
      setParsedProduct(parsed);
      setShowCameraModal(false);
      setShowResultModal(true);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }
      
      // 登入成功後載入用戶的試算表資訊
      await loadUserSpreadsheetInfo();
      
      Alert.alert('成功', 'Google登入成功！');
    } catch (error) {
      console.error('Google登入錯誤:', error);
      Alert.alert('錯誤', 'Google登入失敗，請重試');
    }
  };

  // 新增：診斷 Google 登入問題
  const handleDiagnoseGoogleAuth = async () => {
    try {
      Alert.alert('診斷中', '正在檢查 Google 登入設定...');
      
      const diagnosis = await diagnoseGoogleAuth();
      console.log('診斷結果:', diagnosis);
      
      let message = '診斷結果:\n\n';
      message += `Play Services: ${diagnosis.playServices ? '✅ 可用' : '❌ 不可用'}\n`;
      message += `當前用戶: ${diagnosis.currentUser ? '✅ 已登入' : '❌ 未登入'}\n`;
      message += `權杖: ${diagnosis.tokens ? '✅ 有效' : '❌ 無效'}\n`;
      
      if (diagnosis.errors.length > 0) {
        message += `\n❌ 錯誤:\n${diagnosis.errors.join('\n')}`;
      }
      
      if (diagnosis.suggestions.length > 0) {
        message += `\n\n💡 建議:\n${diagnosis.suggestions.join('\n')}`;
      }
      
      // 如果訊息太長，分段顯示
      if (message.length > 1000) {
        const parts = message.split('\n\n');
        for (let i = 0; i < parts.length; i++) {
          setTimeout(() => {
            Alert.alert(
              i === 0 ? '診斷結果 (1/2)' : '診斷結果 (2/2)',
              parts[i],
              [{ text: '確定', onPress: () => {} }]
            );
          }, i * 100);
        }
      } else {
        Alert.alert('診斷完成', message);
      }
    } catch (error) {
      console.error('診斷錯誤:', error);
      Alert.alert('診斷失敗', `診斷過程發生錯誤: ${error}`);
    }
  };

  // 新增：測試登入流程
  const handleTestSignIn = async () => {
    try {
      Alert.alert('測試中', '正在測試 Google 登入流程...');
      
      const result = await testSignInWithDiagnosis();
      console.log('測試結果:', result);
      
      let message = `測試結果: ${result.success ? '✅ 成功' : '❌ 失敗'}\n\n`;
      message += `訊息: ${result.message}\n\n`;
      
      if (result.diagnosis) {
        message += `診斷資訊:\n`;
        message += `Play Services: ${result.diagnosis.playServices ? '✅' : '❌'}\n`;
        message += `當前用戶: ${result.diagnosis.currentUser ? '✅' : '❌'}\n`;
        message += `權杖: ${result.diagnosis.tokens ? '✅' : '❌'}\n`;
        
        if (result.diagnosis.errors.length > 0) {
          message += `\n錯誤:\n${result.diagnosis.errors.join('\n')}`;
        }
      }
      
      // 如果是錯誤代碼 10，提供快速修復建議
      if (!result.success && result.message.includes('錯誤代碼: 10')) {
        const quickFix = getQuickFixSuggestions(10);
        message += `\n\n🔧 快速修復:\n${quickFix.join('\n')}`;
      }
      
      Alert.alert('測試完成', message);
    } catch (error) {
      console.error('測試錯誤:', error);
      Alert.alert('測試失敗', `測試過程發生錯誤: ${error}`);
    }
  };

  // 新增：強制登入
  const handleForceSignIn = async () => {
    try {
      Alert.alert('強制登入中', '正在清除快取並重新登入...');
      
      const result = await forceSignIn();
      console.log('強制登入結果:', result);
      
      let message = `強制登入結果: ${result.success ? '✅ 成功' : '❌ 失敗'}\n\n`;
      message += `訊息: ${result.message}`;
      
      if (result.success) {
        message += '\n\n🎉 登入成功！現在可以正常使用 Google 功能了。';
      } else {
        message += '\n\n💡 如果還是失敗，請嘗試：';
        message += '\n1. 清除應用程式資料';
        message += '\n2. 重新安裝應用程式';
        message += '\n3. 檢查 Google Cloud Console 設定';
      }
      
      Alert.alert('強制登入完成', message);
    } catch (error) {
      console.error('強制登入錯誤:', error);
      Alert.alert('強制登入失敗', `強制登入過程發生錯誤: ${error}`);
    }
  };

  // 新增：檢查 OAuth 設定
  const handleCheckOAuth = async () => {
    try {
      Alert.alert('檢查中', '正在檢查 OAuth 同意畫面設定...');
      
      const result = await checkOAuthConsentScreen();
      console.log('OAuth 檢查結果:', result);
      
      let message = `OAuth 檢查結果: ${result.status === 'success' ? '✅ 正常' : '❌ 有問題'}\n\n`;
      message += `訊息: ${result.message}`;
      
      if (result.status === 'error' && result.suggestions) {
        message += '\n\n🔧 建議修復步驟:\n';
        message += result.suggestions.join('\n');
      }
      
      Alert.alert('OAuth 檢查完成', message);
    } catch (error) {
      console.error('OAuth 檢查錯誤:', error);
      Alert.alert('OAuth 檢查失敗', `檢查過程發生錯誤: ${error}`);
    }
  };

  // 新增：顯示環境資訊
  const handleShowEnvironmentInfo = () => {
    const envInfo = getEnvironmentInfo();
    logEnvironmentInfo();
    logApiEnvironmentInfo();
    
    let message = `🌍 環境資訊\n\n`;
    message += `模式: ${envInfo.isDebug ? 'Debug' : 'Release'}\n`;
    message += `平台: ${envInfo.platform}\n`;
    message += `版本: ${envInfo.version}\n`;
    message += `模擬器: ${envInfo.isSimulator ? '是' : '否'}\n\n`;
    
    if (isReleaseMode()) {
      message += `📱 Release 模式注意事項:\n`;
      message += `• 已啟用額外的 HTTP headers\n`;
      message += `• 已設定 30 秒請求超時\n`;
      message += `• 已添加快取控制標頭\n`;
    } else {
      message += `🔧 Debug 模式:\n`;
      message += `• 使用基本 headers\n`;
      message += `• 已設定 30 秒請求超時\n`;
    }
    
    Alert.alert('環境資訊', message);
  };

  // 新增：測試 API 連線
  const handleTestApiConnection = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        Alert.alert('錯誤', '無法取得存取權杖');
        return;
      }

      Alert.alert('測試中', '正在測試 API 連線...');
      
      const result = await testApiConnection(token);
      
      let message = `API 連線測試結果: ${result.success ? '✅ 成功' : '❌ 失敗'}\n\n`;
      message += `訊息: ${result.message}\n`;
      message += `狀態碼: ${result.status || 'N/A'}\n\n`;
      
      if (result.success) {
        message += `🎉 API 連線正常！\n`;
        message += `當前模式: ${isReleaseMode() ? 'Release' : 'Debug'}\n`;
        message += `已啟用額外 headers: ${isReleaseMode() ? '是' : '否'}`;
      } else {
        message += `💡 建議檢查:\n`;
        message += `• 網路連線\n`;
        message += `• Google 帳戶權限\n`;
        message += `• API 設定`;
      }
      
      Alert.alert('API 測試完成', message);
    } catch (error) {
      console.error('API 測試錯誤:', error);
      Alert.alert('API 測試失敗', `測試過程發生錯誤: ${error}`);
    }
  };

  // 新增：測試 Google Drive API
  const handleTestDriveApi = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        Alert.alert('錯誤', '無法取得存取權杖');
        return;
      }

      Alert.alert('測試中', '正在測試 Google Drive API...');
      
      // 設定權杖
      googleSheetsService.setAccessToken(token);
      
      // 測試列出試算表
      const spreadsheets = await googleSheetsService.listSpreadsheets();
      
      let message = `✅ Google Drive API 測試成功！\n\n`;
      message += `找到 ${spreadsheets.length} 個試算表\n\n`;
      
      if (spreadsheets.length > 0) {
        message += `試算表列表:\n`;
        spreadsheets.slice(0, 5).forEach((sheet, index) => {
          message += `${index + 1}. ${sheet.properties.title}\n`;
        });
        
        if (spreadsheets.length > 5) {
          message += `... 還有 ${spreadsheets.length - 5} 個試算表`;
        }
      } else {
        message += `您的 Google Drive 中沒有試算表`;
      }
      
      Alert.alert('Google Drive API 測試完成', message);
    } catch (error: any) {
      console.error('Google Drive API 測試錯誤:', error);
      
      let errorMessage = 'Google Drive API 測試失敗\n\n';
      
      if (error.message) {
        errorMessage += `錯誤訊息: ${error.message}\n\n`;
      }
      
      errorMessage += `🔧 解決方案:\n`;
      errorMessage += `1. 前往 Google Cloud Console\n`;
      errorMessage += `2. 啟用 Google Drive API\n`;
      errorMessage += `3. 重新登入 Google 帳戶\n`;
      errorMessage += `4. 重新授權應用程式`;
      
      Alert.alert('Google Drive API 測試失敗', errorMessage);
    }
  };

  // 新增：查看雲端資料夾
  const handleViewCloudFolder = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      setIsLoadingSpreadsheets(true);
      setShowSpreadsheetsModal(true);

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      const spreadsheetsList = await googleSheetsService.listSpreadsheets();
      setSpreadsheets(spreadsheetsList);
      
      console.log('載入試算表列表:', spreadsheetsList);
    } catch (error) {
      console.error('載入試算表列表錯誤:', error);
      Alert.alert('錯誤', '無法載入試算表列表，請重試');
      setShowSpreadsheetsModal(false);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  // 新增：選擇試算表
  const handleSelectSpreadsheet = async (spreadsheet: SpreadsheetInfo) => {
    try {
      if (!authState.user?.id) {
        Alert.alert('錯誤', '用戶資訊不完整');
        return;
      }

      // 先關閉 Modal 並顯示 loading
      setShowSpreadsheetsModal(false);
      
      // 顯示 loading 遮罩
      setIsSelectingSpreadsheet(true);

      // 儲存選擇的試算表資訊
      await saveUserSpreadsheetId(
        authState.user.id,
        authState.user.email,
        authState.user.name,
        spreadsheet.spreadsheetId,
        spreadsheet.properties.title
      );
      
      setSpreadsheetId(spreadsheet.spreadsheetId);
      
      // 重新載入試算表資訊
      await loadUserSpreadsheetInfo();
      
      // 隱藏 loading 遮罩
      setIsSelectingSpreadsheet(false);
      
      Alert.alert('成功', `已選擇試算表：${spreadsheet.properties.title}`);
    } catch (error) {
      console.error('選擇試算表錯誤:', error);
      setIsSelectingSpreadsheet(false);
      Alert.alert('錯誤', '選擇試算表失敗，請重試');
    }
  };

  // 新增：開啟試算表
  const handleOpenSpreadsheet = (spreadsheet: SpreadsheetInfo) => {
    if (spreadsheet.spreadsheetUrl) {
      Linking.openURL(spreadsheet.spreadsheetUrl);
    } else {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}`;
      Linking.openURL(url);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut();
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
      Alert.alert('成功', '已登出Google帳戶');
    } catch (error) {
      console.error('Google登出錯誤:', error);
      Alert.alert('錯誤', '登出失敗，請重試');
    }
  };

  // 建立新的試算表
  const handleCreateSpreadsheet = async () => {
    try {
      if (!authState.isSignedIn || !authState.user) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      // 如果已有試算表，詢問是否要建立新的
      if (spreadsheetId) {
        Alert.alert(
          '建立新試算表',
          '您已經有一個試算表了，確定要建立新的試算表嗎？\n\n注意：新試算表會替換現有的試算表設定。',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '確定建立', 
              style: 'destructive',
              onPress: () => showCreateSpreadsheetDialog()
            }
          ]
        );
        return;
      }

      showCreateSpreadsheetDialog();
    } catch (error) {
      console.error('建立試算表錯誤:', error);
      Alert.alert('錯誤', '建立試算表失敗，請重試');
    }
  };

  // 顯示建立試算表對話框
  const showCreateSpreadsheetDialog = () => {
    setShowCreateSpreadsheetModal(true);
  };

  // 實際建立試算表的函數
  const createNewSpreadsheet = async (customName?: string) => {
    try {
      setIsCreatingSpreadsheet(true);
      
      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      // 使用自訂名稱或預設名稱
      const spreadsheetName = customName?.trim() || 'POS系統產品資料';
      
      // 建立試算表並設定工作表名稱
      const newSpreadsheetId = await googleSheetsService.createSpreadsheet(spreadsheetName);
      
      // 重新命名第一個工作表為「產品資料」
      await googleSheetsService.renameSheet(newSpreadsheetId, '產品資料');
      
      // 為新試算表添加標題列
      const headers = [
        '掃描時間',
        '商家代碼',
        '商家名稱',
        '產品類別代碼',
        '產品類別名稱',
        '產品代碼',
        '產品名稱',
        '商品ID',
        '進貨日期',
        '販售價格',
      ];
      await googleSheetsService.appendRow(newSpreadsheetId, '產品資料', headers);
      
      // 設定時間欄位為文字格式 (因為使用 YYYY-MM-DD HH:mm:ss 字串)
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'A', 'TEXT');
      } catch (error) {
        console.log('設定時間欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定商家代碼欄位為文字格式
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'B', 'TEXT');
      } catch (error) {
        console.log('設定商家代碼欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定商家名稱欄位為文字格式
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'C', 'TEXT');
      } catch (error) {
        console.log('設定商家名稱欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定產品代碼欄位為文字格式（確保 001 不會變成 1）
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'F', 'TEXT');
      } catch (error) {
        console.log('設定產品代碼欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定商品ID欄位為文字格式
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'H', 'TEXT');
      } catch (error) {
        console.log('設定商品ID欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定進貨日期欄位為文字格式 (因為使用 YYYY-MM-DD 字串)
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'I', 'TEXT');
      } catch (error) {
        console.log('設定進貨日期欄位格式失敗，但不影響功能:', error);
      }
      
      // 設定金額欄位的數字格式
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'J', 'NUMBER');
      } catch (error) {
        console.log('設定金額欄位格式失敗，但不影響功能:', error);
      }
      
      // 儲存試算表資訊到本地
      await saveUserSpreadsheetId(
        authState.user!.id,
        authState.user!.email,
        authState.user!.name,
        newSpreadsheetId,
        spreadsheetName
      );
      
      setSpreadsheetId(newSpreadsheetId);
      
      // 重新載入試算表資訊
      await loadUserSpreadsheetInfo();
      
      Alert.alert('成功', `已建立新的試算表：${spreadsheetName}\n試算表ID: ${newSpreadsheetId}`);
    } catch (error) {
      console.error('建立試算表錯誤:', error);
      Alert.alert('錯誤', '建立試算表失敗，請重試');
    } finally {
      setIsCreatingSpreadsheet(false);
    }
  };

  // 上傳掃描資料到雲端
  const handleUploadToCloud = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      if (!parsedProduct) {
        Alert.alert('錯誤', '沒有可上傳的產品資料');
        return;
      }

      if (!spreadsheetId) {
        Alert.alert('錯誤', '請先建立試算表');
        return;
      }

      // 檢查販售金額是否已輸入
      if (!amount.trim()) {
        Alert.alert('錯誤', '請輸入販售金額');
        return;
      }

      setIsUploading(true);

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      await googleSheetsService.addProductToSheet(spreadsheetId, parsedProduct, amount);
      
      // 更新試算表的最後使用時間
      if (authState.user?.id) {
        await updateUserSpreadsheetLastUsed(authState.user.id);
      }
      
      Alert.alert('成功', '產品資料已上傳到雲端試算表！');
    } catch (error) {
      console.error('上傳資料錯誤:', error);
      Alert.alert('錯誤', '上傳資料失敗，請重試');
    } finally {
      setIsUploading(false);
    }
  };

  // 上傳到雲端按鈕元件
  const UploadButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.uploadButton,
        isUploading && styles.uploadButtonDisabled
      ]}
      onPress={onPress}
      disabled={isUploading}
    >
      <Text style={styles.uploadButtonText}>
        {isUploading ? '⏳ 上傳中...' : '☁️ 上傳到雲端'}
      </Text>
    </TouchableOpacity>
  );

  // 複製試算表網址
  const handleCopySpreadsheetUrl = () => {
    if (!spreadsheetId) {
      Alert.alert('錯誤', '沒有可用的試算表');
      return;
    }

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    Clipboard.setString(url);
    Alert.alert('成功', '試算表網址已複製到剪貼簿！');
  };

  // 顯示試算表管理選項
  const showSpreadsheetOptions = () => {
    if (!spreadsheetInfo) return;

    Alert.alert(
      '試算表管理',
      `試算表: ${spreadsheetInfo.spreadsheetName}\nID: ${spreadsheetInfo.spreadsheetId}\n建立時間: ${new Date(spreadsheetInfo.createdAt).toLocaleDateString('zh-TW')}`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '建立新試算表', 
          style: 'destructive',
          onPress: () => {
            if (!isCreatingSpreadsheet) {
              handleCreateSpreadsheet();
            }
          }
        },
        { 
          text: '選擇其他試算表', 
          onPress: () => handleViewCloudFolder()
        },
        { 
          text: '開啟試算表', 
          onPress: () => {
            const url = `https://docs.google.com/spreadsheets/d/${spreadsheetInfo.spreadsheetId}`;
            Linking.openURL(url);
          }
        },
        { 
          text: '複製網址', 
          onPress: () => handleCopySpreadsheetUrl()
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('mainSelect')}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>POS系統</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Google登入狀態 */}
        <View style={styles.googleAuthSection}>
          <Text style={styles.sectionTitle}>Google帳戶</Text>
          <Text style={styles.sectionDescription}>
            登入Google帳戶以存取雲端表格
          </Text>

          {authState.isSignedIn ? (
            <View style={styles.signedInContainer}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{authState.user?.name}</Text>
                <Text style={styles.userEmail}>{authState.user?.email}</Text>
              </View>

              <View style={styles.cloudActions}>
                {!spreadsheetId ? (
                  <View style={styles.spreadsheetActions}>
                    <TouchableOpacity
                      style={[
                        styles.createSheetButton,
                        isCreatingSpreadsheet && styles.createSheetButtonDisabled
                      ]}
                      onPress={handleCreateSpreadsheet}
                      disabled={isCreatingSpreadsheet}
                    >
                      <Text style={styles.createSheetButtonText}>
                        {isCreatingSpreadsheet ? '⏳ 建立中...' : '📊 建立試算表'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.spreadsheetInfo}>
                    <View style={styles.spreadsheetInfoDisplay}>
                      <Text style={styles.spreadsheetLabel}>當前試算表:</Text>
                      <Text style={styles.spreadsheetName}>{spreadsheetInfo?.spreadsheetName || '產品掃描記錄'}</Text>
                      
                      {/* 快速操作按鈕 */}
                      <View style={[styles.spreadsheetActions, { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }]}>
                        <TouchableOpacity
                          style={styles.spreadsheetActionButton}
                          onPress={handleCopySpreadsheetUrl}
                        >
                          <Text style={styles.spreadsheetActionButtonText}>📋 複製網址</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.spreadsheetActionButton}
                          onPress={() => {
                            const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
                            Linking.openURL(url);
                          }}
                        >
                          <Text style={styles.spreadsheetActionButtonText}>🔗 開啟試算表</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* 管理選項 */}
                      <TouchableOpacity 
                        style={styles.spreadsheetActionButton}
                        onPress={showSpreadsheetOptions}
                      >
                        <Text style={styles.spreadsheetActionButtonText}>⚙️ 管理試算表</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* 查看雲端資料夾按鈕 - 始終顯示，讓用戶可以切換試算表 */}
                <TouchableOpacity
                  style={styles.viewFolderButton}
                  onPress={handleViewCloudFolder}
                >
                  <Text style={styles.viewFolderButtonText}>
                    📁 {spreadsheetId ? '切換試算表' : '查看雲端資料夾'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleGoogleSignOut}
              >
                <Text style={styles.signOutButtonText}>登出</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleGoogleSignIn}
              >
                <Text style={styles.signInButtonIcon}>🔐</Text>
                <Text style={styles.signInButtonText}>Google登入</Text>
              </TouchableOpacity>
              
              {/* 診斷按鈕 */}
              <View style={styles.diagnosticButtons}>
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleDiagnoseGoogleAuth}
                >
                  <Text style={styles.diagnosticButtonText}>🔍 診斷問題</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleTestSignIn}
                >
                  <Text style={styles.diagnosticButtonText}>🧪 測試登入</Text>
                </TouchableOpacity>
              </View>
              
              {/* 快速修復按鈕 */}
              <View style={styles.diagnosticButtons}>
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleForceSignIn}
                >
                  <Text style={styles.diagnosticButtonText}>⚡ 強制登入</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleCheckOAuth}
                >
                  <Text style={styles.diagnosticButtonText}>🔧 檢查設定</Text>
                </TouchableOpacity>
              </View>
              
              {/* 環境資訊按鈕 */}
              <View style={styles.diagnosticButtons}>
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleShowEnvironmentInfo}
                >
                  <Text style={styles.diagnosticButtonText}>🌍 環境資訊</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleTestApiConnection}
                >
                  <Text style={styles.diagnosticButtonText}>🌐 API 測試</Text>
                </TouchableOpacity>
              </View>
              
              {/* Google Drive API 測試按鈕 */}
              <View style={styles.diagnosticButtons}>
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={handleTestDriveApi}
                >
                  <Text style={styles.diagnosticButtonText}>📁 Drive API 測試</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>條碼掃描</Text>
          <Text style={styles.sectionDescription}>
            選擇手動輸入或使用相機掃描商品條碼
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.scanButton, styles.manualButton]}
              onPress={() => setShowResultModal(true)}
            >
              <Text style={styles.scanButtonIcon}>⌨️</Text>
              <Text style={styles.scanButtonText}>手動輸入</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanButton, styles.cameraButton]}
              onPress={handleCameraScan}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>相機掃描</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>管理功能</Text>
          <Text style={styles.sectionDescription}>
            管理商家和產品資訊
          </Text>

          <View style={styles.managementButtonsContainer}>
            <TouchableOpacity
              style={[styles.managementButton, styles.merchantButton]}
              onPress={() => navigation.navigate('merchantManagement')}
            >
              <Text style={styles.managementButtonIcon}>🏪</Text>
              <Text style={styles.managementButtonText}>商家管理</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.managementButton, styles.productButton]}
              onPress={() => navigation.navigate('productManagement')}
            >
              <Text style={styles.managementButtonIcon}>📋</Text>
              <Text style={styles.managementButtonText}>產品管理</Text>
            </TouchableOpacity>
          </View>
        </View>

        {scannedData && parsedProduct && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>掃描結果</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>條碼內容:</Text>
              <Text style={styles.resultData}>{scannedData}</Text>
            </View>
                            {parsedProduct && (
                  <View style={styles.productInfoCard}>
                    <Text style={styles.productInfoTitle}>產品資訊</Text>
                    {parsedProduct.isValid ? (
                      <View style={styles.productInfoTable}>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>商家:</Text>
                          <Text style={styles.productInfoValue}>
                            {parsedProduct.merchantName || parsedProduct.merchantCode || '無'}
                          </Text>
                        </View>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>產品類別:</Text>
                          <Text style={styles.productInfoValue}>{parsedProduct.categoryName} ({parsedProduct.category})</Text>
                        </View>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>產品代碼:</Text>
                          <Text style={styles.productInfoValue}>{parsedProduct.productCode}</Text>
                        </View>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>產品名稱:</Text>
                          <Text style={styles.productInfoValue}>{parsedProduct.productName}</Text>
                        </View>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>商品ID:</Text>
                          <Text style={styles.productInfoValue}>{parsedProduct.productId && parsedProduct.productId !== '0' ? parsedProduct.productId : '無'}</Text>
                        </View>
                        <View style={styles.productInfoRow}>
                          <Text style={styles.productInfoLabel}>進貨日期:</Text>
                          <Text style={styles.productInfoValue}>{parsedProduct.formattedDate}</Text>
                        </View>

                      </View>
                    ) : (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>❌ {parsedProduct.error}</Text>
                      </View>
                    )}
                
                {/* 金額輸入欄位 */}
                {parsedProduct.isValid && (
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountInputLabel}>販售價格: <Text style={styles.requiredText}>*</Text></Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="請輸入金額 (必填)"
                      value={amount}
                      onChangeText={(text) => {
                        // 只允許數字和小數點
                        const numericText = text.replace(/[^0-9.]/g, '');
                        
                        // 確保只有一個小數點
                        const parts = numericText.split('.');
                        if (parts.length > 2) {
                          return; // 如果有多個小數點，不更新
                        }
                        
                        // 限制小數位數為2位
                        if (parts.length === 2 && parts[1].length > 2) {
                          return; // 如果小數位數超過2位，不更新
                        }
                        
                        setAmount(numericText);
                      }}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>
                )}
                
                {/* 只有登入、資料正確且有試算表才顯示上傳按鈕 */}
                {authState.isSignedIn && parsedProduct.isValid && spreadsheetId && (
                  <UploadButton onPress={handleUploadToCloud} />
                )}
                
                {/* 如果登入但沒有試算表，顯示提示 */}
                {authState.isSignedIn && parsedProduct.isValid && !spreadsheetId && (
                  <View style={styles.noSpreadsheetWarning}>
                    <Text style={styles.noSpreadsheetWarningText}>
                      ⚠️ 請先建立試算表才能上傳資料
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(scannedData);
                    Alert.alert('成功', '條碼已複製到剪貼簿！');
                  }}
                >
                  <Text style={styles.copyButtonText}>📋 複製條碼</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 手動輸入 Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {scannedData ? '掃描結果' : '手動輸入條碼'}
            </Text>

            {!scannedData && (
              <TextInput
                style={styles.modalInput}
                placeholder="輸入條碼內容"
                value={manualInput}
                onChangeText={setManualInput}
                autoFocus={true}
                multiline={true}
              />
            )}

            {scannedData && (
              <View style={styles.resultDisplay}>
                <Text style={styles.resultLabel}>條碼內容:</Text>
                <Text style={styles.resultText}>{scannedData}</Text>

                {parsedProduct && (
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductInfoTitle}>產品資訊</Text>
                    {parsedProduct.isValid ? (
                      <View style={styles.modalProductInfoTable}>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>商家:</Text>
                          <Text style={styles.modalProductInfoValue}>
                            {parsedProduct.merchantName || parsedProduct.merchantCode || '無'}
                          </Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品類別:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.categoryName} ({parsedProduct.category})</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品代碼:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.productCode}</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品名稱:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.productName}</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>商品ID:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.productId && parsedProduct.productId !== '0' ? parsedProduct.productId : '無'}</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>進貨日期:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.formattedDate}</Text>
                        </View>

                      </View>
                    ) : (
                      <View style={styles.modalErrorContainer}>
                        <Text style={styles.modalErrorText}>❌ {parsedProduct.error}</Text>
                      </View>
                    )}

                    {/* 金額輸入欄位 */}
                    {parsedProduct.isValid && (
                      <View style={styles.modalAmountInputContainer}>
                        <Text style={styles.modalAmountInputLabel}>販售價格: <Text style={styles.requiredText}>*</Text></Text>
                        <TextInput
                          style={styles.modalAmountInput}
                          placeholder="請輸入金額 (必填)"
                          value={amount}
                          onChangeText={(text) => {
                            // 只允許數字和小數點
                            const numericText = text.replace(/[^0-9.]/g, '');
                            
                            // 確保只有一個小數點
                            const parts = numericText.split('.');
                            if (parts.length > 2) {
                              return; // 如果有多個小數點，不更新
                            }
                            
                            // 限制小數位數為2位
                            if (parts.length === 2 && parts[1].length > 2) {
                              return; // 如果小數位數超過2位，不更新
                            }
                            
                            setAmount(numericText);
                          }}
                          keyboardType="numeric"
                          returnKeyType="done"
                        />
                      </View>
                    )}

                    {/* 只有登入、資料正確且有試算表才顯示上傳按鈕 */}
                    {authState.isSignedIn && parsedProduct.isValid && spreadsheetId && (
                      <TouchableOpacity
                        style={[
                          styles.modalUploadButton,
                          isUploading && styles.modalUploadButtonDisabled
                        ]}
                        onPress={handleUploadToCloud}
                        disabled={isUploading}
                      >
                        <Text style={styles.modalUploadButtonText}>
                          {isUploading ? '⏳ 上傳中...' : '☁️ 上傳到雲端'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* 如果登入但沒有試算表，顯示提示 */}
                    {authState.isSignedIn && parsedProduct.isValid && !spreadsheetId && (
                      <View style={styles.modalNoSpreadsheetWarning}>
                        <Text style={styles.modalNoSpreadsheetWarningText}>
                          ⚠️ 請先建立試算表才能上傳資料
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.modalCopyButton}
                      onPress={() => {
                        Clipboard.setString(scannedData);
                        Alert.alert('成功', '條碼已複製到剪貼簿！');
                      }}
                    >
                      <Text style={styles.modalCopyButtonText}>📋 複製條碼</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalButtons}>
              {!scannedData ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowResultModal(false);
                      setManualInput('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleManualInput}
                  >
                    <Text style={styles.modalButtonConfirmText}>確認</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowResultModal(false);
                      setScannedData('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>清除</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleScanAgain}
                  >
                    <Text style={styles.modalButtonConfirmText}>重新掃描</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 相機掃描 Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          <RNCamera
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.auto}
            onBarCodeRead={onBarcodeRead}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: '相機權限',
              message: '需要相機權限來掃描條碼',
              buttonPositive: '確定',
              buttonNegative: '取消',
            }}
          />

          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCameraModal(false)}
              >
                <Text style={styles.cameraCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>掃描條碼</Text>
              <View style={styles.cameraPlaceholder} />
            </View>

            <View style={styles.scanFrame}>
              {/* 左上角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerTopLeft]} />
              {/* 右上角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerTopRight]} />
              {/* 左下角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomLeft]} />
              {/* 右下角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomRight]} />
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraInstruction}>
                將條碼對準框內進行掃描
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 載入遮罩 */}
      {(isCreatingSpreadsheet || isUploading || isSelectingSpreadsheet) && (
        <Modal
          visible={isCreatingSpreadsheet || isUploading || isSelectingSpreadsheet}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingSpinner}>⏳</Text>
              <Text style={styles.loadingText}>
                {isCreatingSpreadsheet ? '正在建立試算表...' : 
                 isSelectingSpreadsheet ? '正在設定試算表...' : 
                 '正在上傳資料...'}
              </Text>
              <Text style={styles.loadingSubText}>請稍候，不要關閉應用程式</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* 建立試算表 Modal */}
      <Modal
        visible={showCreateSpreadsheetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateSpreadsheetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createSpreadsheetModalContent}>
            <View style={styles.createSpreadsheetModalHeader}>
              <Text style={styles.createSpreadsheetModalTitle}>建立新試算表</Text>
              <TouchableOpacity
                style={styles.createSpreadsheetModalCloseButton}
                onPress={() => {
                  setShowCreateSpreadsheetModal(false);
                  setNewSpreadsheetName('');
                }}
              >
                <Text style={styles.createSpreadsheetModalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createSpreadsheetModalBody}>
              <Text style={styles.createSpreadsheetModalLabel}>
                試算表名稱 (可選):
              </Text>
              <TextInput
                style={styles.createSpreadsheetModalInput}
                placeholder="POS系統產品資料"
                value={newSpreadsheetName}
                onChangeText={setNewSpreadsheetName}
                autoFocus={true}
                maxLength={50}
              />
              <Text style={styles.createSpreadsheetModalHint}>
                如果沒有輸入名稱，將使用預設名稱「POS系統產品資料」
              </Text>
            </View>

            <View style={styles.createSpreadsheetModalActions}>
              <TouchableOpacity
                style={[styles.createSpreadsheetModalButton, styles.createSpreadsheetModalButtonCancel]}
                onPress={() => {
                  setShowCreateSpreadsheetModal(false);
                  setNewSpreadsheetName('');
                }}
              >
                <Text style={styles.createSpreadsheetModalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createSpreadsheetModalButton, 
                  styles.createSpreadsheetModalButtonConfirm,
                  isCreatingSpreadsheet && styles.createSpreadsheetModalButtonDisabled
                ]}
                onPress={() => {
                  createNewSpreadsheet(newSpreadsheetName);
                  setShowCreateSpreadsheetModal(false);
                  setNewSpreadsheetName('');
                }}
                disabled={isCreatingSpreadsheet}
              >
                <Text style={styles.createSpreadsheetModalButtonConfirmText}>
                  {isCreatingSpreadsheet ? '建立中...' : '建立試算表'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 試算表列表 Modal */}
      <Modal
        visible={showSpreadsheetsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpreadsheetsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.spreadsheetsModalContent}>
            <View style={styles.spreadsheetsModalHeader}>
              <Text style={styles.spreadsheetsModalTitle}>雲端試算表</Text>
              <TouchableOpacity
                style={styles.spreadsheetsModalCloseButton}
                onPress={() => setShowSpreadsheetsModal(false)}
              >
                <Text style={styles.spreadsheetsModalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingSpreadsheets ? (
              <View style={styles.spreadsheetsLoadingContainer}>
                <Text style={styles.spreadsheetsLoadingSpinner}>⏳</Text>
                <Text style={styles.spreadsheetsLoadingText}>正在載入試算表...</Text>
              </View>
            ) : spreadsheets.length === 0 ? (
              <View style={styles.spreadsheetsEmptyContainer}>
                <Text style={styles.spreadsheetsEmptyText}>📁 沒有找到試算表</Text>
                <Text style={styles.spreadsheetsEmptySubText}>
                  您的 Google Drive 中還沒有試算表，請先建立一個試算表。
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.spreadsheetsList}>
                {spreadsheets.map((spreadsheet, index) => (
                  <View key={spreadsheet.spreadsheetId} style={styles.spreadsheetItem}>
                    <View style={styles.spreadsheetItemHeader}>
                      <Text style={styles.spreadsheetItemTitle}>
                        📊 {spreadsheet.properties.title}
                      </Text>
                      <Text style={styles.spreadsheetItemId}>
                        ID: {spreadsheet.spreadsheetId}
                      </Text>
                    </View>
                    
                    {spreadsheet.modifiedTime && (
                      <Text style={styles.spreadsheetItemDate}>
                        修改時間: {new Date(spreadsheet.modifiedTime).toLocaleDateString('zh-TW')}
                      </Text>
                    )}
                    
                    <View style={styles.spreadsheetItemActions}>
                      <TouchableOpacity
                        style={[
                          styles.spreadsheetItemActionButton,
                          isSelectingSpreadsheet && styles.spreadsheetItemActionButtonDisabled
                        ]}
                        onPress={() => handleSelectSpreadsheet(spreadsheet)}
                        disabled={isSelectingSpreadsheet}
                      >
                        <Text style={styles.spreadsheetItemActionButtonText}>
                          {isSelectingSpreadsheet ? '⏳ 設定中...' : '✅ 選擇'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.spreadsheetItemActionButton,
                          isSelectingSpreadsheet && styles.spreadsheetItemActionButtonDisabled
                        ]}
                        onPress={() => handleOpenSpreadsheet(spreadsheet)}
                        disabled={isSelectingSpreadsheet}
                      >
                        <Text style={styles.spreadsheetItemActionButtonText}>🔗 開啟</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {/* 底部間距元素 */}
                <View style={styles.spreadsheetListBottomSpacer} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    // paddingBottom: 40, // 大幅增加底部 padding 確保有足夠間距
  },
  googleAuthSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 22,
  },
  signedInContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  userInfo: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cloudActions: {
    marginTop: 15,
    marginBottom: 20,
  },
  createSheetButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  createSheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createSheetButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  spreadsheetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
  },
  spreadsheetInfoDisplay: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  spreadsheetLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginRight: 5,
  },
  spreadsheetId: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
  },
  spreadsheetName: {
    fontSize: 16,
    color: '#212529',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  spreadsheetDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  createNewSheetButton: {
    backgroundColor: '#17a2b8',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  createNewSheetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spreadsheetInfoTouchable: {
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    // 添加點擊效果
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  spreadsheetHint: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  scanSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  scanButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualButton: {
    backgroundColor: '#28a745',
  },
  cameraButton: {
    backgroundColor: '#007bff',
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  resultData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  resultDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalButtonConfirm: {
    backgroundColor: '#007bff',
  },
  modalButtonCancelText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCloseButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraPlaceholder: {
    width: 40,
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  scanFrameCornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  scanFrameCornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  scanFrameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  scanFrameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraInstruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 8,
  },
  productInfoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  productInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  productInfoTable: {
    gap: 8,
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  productInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  modalProductInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalProductInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  modalProductInfoTable: {
    gap: 6,
  },
  modalProductInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  modalProductInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalProductInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  modalErrorContainer: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  modalErrorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  managementSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  managementButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  managementButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  merchantButton: {
    backgroundColor: '#ff9500',
  },
  productButton: {
    backgroundColor: '#28a745',
  },
  managementButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  managementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCopyButton: {
    backgroundColor: '#17a2b8',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCopyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalUploadButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  modalUploadButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  modalUploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noSpreadsheetWarning: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginTop: 10,
  },
  noSpreadsheetWarningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalNoSpreadsheetWarning: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginTop: 10,
  },
  modalNoSpreadsheetWarningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  spreadsheetActions: {
    flexDirection: 'column',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  spreadsheetActionButton: {
    backgroundColor: '#17a2b8',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  spreadsheetActionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  viewFolderButton: {
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  viewFolderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  diagnosticButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    width: '100%',
  },
  diagnosticButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  diagnosticButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 載入遮罩樣式
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    minWidth: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingSpinner: {
    fontSize: 40,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 金額輸入欄位樣式
  amountInputContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  amountInputLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 8,
  },
  requiredText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  amountInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  // Modal 中金額輸入欄位樣式
  modalAmountInputContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalAmountInputLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 8,
  },
  modalAmountInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#212529',
  },
  // 試算表列表 Modal 樣式
  spreadsheetsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    minHeight: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spreadsheetsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  spreadsheetsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  spreadsheetsModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spreadsheetsModalCloseButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  spreadsheetsLoadingContainer: {
    padding: 60,
    alignItems: 'center',
    minHeight: 200,
  },
  spreadsheetsLoadingSpinner: {
    fontSize: 40,
    marginBottom: 15,
  },
  spreadsheetsLoadingText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  spreadsheetsEmptyContainer: {
    padding: 60,
    alignItems: 'center',
    minHeight: 200,
  },
  spreadsheetsEmptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 10,
    textAlign: 'center',
  },
  spreadsheetsEmptySubText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  spreadsheetsList: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    minHeight: 300,
  },
  spreadsheetItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  spreadsheetItemHeader: {
    marginBottom: 8,
  },
  spreadsheetItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 6,
  },
  spreadsheetItemId: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  spreadsheetItemDate: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
  },
  spreadsheetItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  spreadsheetItemActionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
  },
  spreadsheetItemActionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  spreadsheetItemActionButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  spreadsheetListBottomSpacer: {
    height: 20,
  },
  // 建立試算表 Modal 樣式
  createSpreadsheetModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createSpreadsheetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  createSpreadsheetModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  createSpreadsheetModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createSpreadsheetModalCloseButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  createSpreadsheetModalBody: {
    padding: 20,
  },
  createSpreadsheetModalLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 10,
  },
  createSpreadsheetModalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#212529',
    marginBottom: 10,
  },
  createSpreadsheetModalHint: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  createSpreadsheetModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    gap: 15,
  },
  createSpreadsheetModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createSpreadsheetModalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  createSpreadsheetModalButtonConfirm: {
    backgroundColor: '#007bff',
  },
  createSpreadsheetModalButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  createSpreadsheetModalButtonCancelText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  createSpreadsheetModalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default POSSystemScreen; 