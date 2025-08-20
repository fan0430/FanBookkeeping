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
import { loadMerchants } from '../utils/merchantService';
import { saveCustomProduct, getCustomProducts, getProductsByCategory, saveCustomCategory, isClearingInProgress, clearAllProductData } from '../utils/productParser';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [note, setNote] = useState<string>('');
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [showSpreadsheetsModal, setShowSpreadsheetsModal] = useState(false);
  const [showCreateSpreadsheetModal, setShowCreateSpreadsheetModal] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [sharedFormContent, setSharedFormContent] = useState<string | null>(null);
  const [columnDataCount, setColumnDataCount] = useState<number | null>(null);
  const [sharedSpreadsheetId, setSharedSpreadsheetId] = useState('1hk08GAdEqrw__4eqgfqc6upQCiroYJUPT2r-zQMsTl0');
  const [sharedSheetName, setSharedSheetName] = useState('20250520安蘋批發');
  const [autoImportSpreadsheetId, setAutoImportSpreadsheetId] = useState('1hk08GAdEqrw__4eqgfqc6upQCiroYJUPT2r-zQMsTl0');
  const [autoImportSheetName, setAutoImportSheetName] = useState('20250520安蘋批發');
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showMerchantSelector, setShowMerchantSelector] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    productId: 'A',
    category: 'B',
    productName: 'C',
    productCode: 'D',
    sellingPrice: 'E',
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [merchants, setMerchants] = useState<any[]>([]);

  const { authState, signIn, signOut, getAccessToken } = useGoogleAuth();

  // 當登入狀態改變時載入試算表資訊
  React.useEffect(() => {
    if (authState.isSignedIn) {
      loadUserSpreadsheetInfo();
      loadMerchantsList();
    } else {
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
    }
  }, [authState.isSignedIn, authState.user?.id]);

  // 載入商家列表
  const loadMerchantsList = async () => {
    try {
      const merchantsList = await loadMerchants();
      setMerchants(merchantsList);
    } catch (error) {
      console.error('載入商家列表失敗:', error);
    }
  };

  // 根據類別名稱生成英文三位數代碼
  const generateCategoryCode = (categoryName: string): string => {
    if (!categoryName || categoryName.trim() === '') {
      return 'GEN'; // 預設代碼
    }

    // 移除空格和特殊字符，只保留中英文和數字
    const cleanName = categoryName.replace(/[^\w\u4e00-\u9fa5]/g, '');
    
    if (cleanName.length === 0) {
      return 'GEN';
    }

    // 如果是純英文，取前3個字符並轉大寫
    if (/^[a-zA-Z]+$/.test(cleanName)) {
      return cleanName.substring(0, 3).toUpperCase();
    }

    // 如果是中文或混合，使用更智能的邏輯
    const englishWords = cleanName.match(/[a-zA-Z]+/g);
    if (englishWords && englishWords.length > 0) {
      // 取每個英文單字的首字母
      const initials = englishWords.map(word => word.charAt(0)).join('');
      if (initials.length >= 3) {
        return initials.substring(0, 3).toUpperCase();
      } else {
        // 如果首字母不夠3個，用單字補充
        const code = initials + englishWords[0].substring(1, 3 - initials.length);
        return code.toUpperCase();
      }
    }

    // 如果是純中文，使用智能的拼音首字母映射
    if (/^[\u4e00-\u9fa5]+$/.test(cleanName)) {
      // 為常見的中文類別提供自定義代碼
      const categoryMapping: { [key: string]: string } = {
        '男款手鍊': 'MAL', // Male Accessory
        '女款手鍊': 'FAL', // Female Accessory
        '項鍊': 'NEC',     // Necklace
        '耳環': 'EAR',     // Earring
        '戒指': 'RIN',     // Ring
        '手錶': 'WAT',     // Watch
        '包包': 'BAG',     // Bag
        '鞋子': 'SHO',     // Shoe
        '衣服': 'CLO',     // Clothing
        '褲子': 'PAN',     // Pants
        '帽子': 'HAT',     // Hat
        '眼鏡': 'GLA',     // Glasses
        '水果': 'FRU',     // Fruit
        '蔬菜': 'VEG',     // Vegetable
        '肉類': 'MEA',     // Meat
        '海鮮': 'SEA',     // Seafood
        '飲料': 'BEV',     // Beverage
        '零食': 'SNA',     // Snack
        '化妝品': 'COS',   // Cosmetics
        '保養品': 'SKI',   // Skincare
      };

      // 檢查是否有預設映射
      if (categoryMapping[cleanName]) {
        return categoryMapping[cleanName];
      }

      // 使用中文字符的規律生成代碼
      // 方法1：使用前3個字符的拼音首字母（如果可用）
      // 方法2：使用字符的Unicode值和位置生成唯一代碼
      const code = generateChineseCode(cleanName);
      return code;
    }

    // 如果無法處理，使用預設代碼
    return 'GEN';
  };

  // 根據中文字符生成智能代碼
  const generateChineseCode = (chineseText: string): string => {
    if (chineseText.length === 0) return 'GEN';
    
    // 方法1：使用字符的Unicode值和位置生成代碼
    let code = '';
    
    // 取前3個字符（如果不足3個，重複最後一個字符）
    const chars = chineseText.substring(0, 3).split('');
    while (chars.length < 3) {
      chars.push(chars[chars.length - 1] || '中');
    }
    
    // 為每個字符生成代碼
    chars.forEach((char, index) => {
      const unicode = char.charCodeAt(0);
      // 使用Unicode值、位置和字符長度來生成更唯一的代碼
      const charCode = 65 + ((unicode + index * 100 + chineseText.length * 10) % 26);
      code += String.fromCharCode(charCode);
    });
    
    return code;
  };

  // 生成商品排序ID（根據資料順序）
  const generateProductId = (index: number): string => {
    return String(index + 1).padStart(3, '0');
  };

  // 將欄位代號（如 A、B、C）轉換為陣列索引
  const getColumnIndex = (columnCode: string): number => {
    if (!columnCode || columnCode.length === 0) {
      return 0; // 預設為第一欄
    }
    
    // 將欄位代號轉換為大寫
    const upperCode = columnCode.toUpperCase();
    
    // 如果是單一字母（A-Z），轉換為 0-25
    if (upperCode.length === 1 && /^[A-Z]$/.test(upperCode)) {
      return upperCode.charCodeAt(0) - 65; // A=0, B=1, C=2...
    }
    
    // 如果是雙字母（AA-ZZ），轉換為 26-701
    if (upperCode.length === 2 && /^[A-Z]{2}$/.test(upperCode)) {
      const first = upperCode.charCodeAt(0) - 65;
      const second = upperCode.charCodeAt(1) - 65;
      return (first + 1) * 26 + second;
    }
    
    // 如果無法解析，預設為第一欄
    console.warn(`無法解析欄位代號: ${columnCode}，使用預設值 0`);
    return 0;
  };

  // 載入用戶的試算表資訊
  const loadUserSpreadsheetInfo = async () => {
    if (!authState.isSignedIn || !authState.user?.id) {
      // 只有在用戶未登入時才清空狀態
      setSpreadsheetId('');
      setSpreadsheetInfo(null);
      return;
    }

    // 檢查是否正在進行清除操作，如果是則跳過載入
    try {
      const clearingInProgress = await isClearingInProgress();
      if (clearingInProgress) {
        console.log('檢測到正在進行清除操作，跳過試算表資訊載入');
        return;
      }
    } catch (error) {
      console.error('檢查清除狀態失敗:', error);
      // 如果檢查失敗，繼續正常載入流程
    }

    try {
      const savedSpreadsheetId = await getUserSpreadsheetId(authState.user.id);
      const savedSpreadsheetInfo = await getUserSpreadsheetInfo(authState.user.id);
      
      if (savedSpreadsheetId && savedSpreadsheetInfo) {
        // 成功載入試算表資訊
        setSpreadsheetId(savedSpreadsheetId);
        setSpreadsheetInfo(savedSpreadsheetInfo);
        console.log('載入用戶試算表資訊:', savedSpreadsheetInfo);
      } else {
        // 如果沒有找到試算表資訊，但用戶已登入，保留現有狀態
        // 不要清空現有的 spreadsheetId 和 spreadsheetInfo
        console.log('未找到試算表資訊，保留現有狀態');
        console.log('當前狀態 - spreadsheetId:', spreadsheetId);
        console.log('當前狀態 - spreadsheetInfo:', spreadsheetInfo);
      }
    } catch (error) {
      console.error('載入用戶試算表資訊失敗:', error);
      // 載入失敗時，保留現有狀態，不要清空
      console.log('載入失敗，保留現有狀態');
      console.log('當前狀態 - spreadsheetId:', spreadsheetId);
      console.log('當前狀態 - spreadsheetInfo:', spreadsheetInfo);
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
    setNote('');
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
        '備註',
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
      
      // 設定備註欄位為文字格式
      try {
        await googleSheetsService.setColumnFormat(newSpreadsheetId, '產品資料', 'K', 'TEXT');
      } catch (error) {
        console.log('設定備註欄位格式失敗，但不影響功能:', error);
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

      await googleSheetsService.addProductToSheet(spreadsheetId, parsedProduct, amount, note);
      
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

  const handleReadSharedForm = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      // 驗證輸入
      if (!sharedSpreadsheetId.trim()) {
        Alert.alert('錯誤', '請輸入試算表 ID');
        return;
      }

      if (!sharedSheetName.trim()) {
        Alert.alert('錯誤', '請輸入頁籤名稱');
        return;
      }

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      Alert.alert('讀取中', '正在讀取共用表單內容...');
      
      const content = await googleSheetsService.getCellValue(sharedSpreadsheetId.trim(), sharedSheetName.trim(), 'C3');
      setSharedFormContent(content);
      
      Alert.alert('成功', '共用表單內容已成功讀取！');
    } catch (error) {
      console.error('讀取共用表單錯誤:', error);
      
      let errorMessage = '讀取共用表單失敗';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = '找不到試算表或頁籤，請檢查 ID 和頁籤名稱是否正確';
        } else if (error.message.includes('403')) {
          errorMessage = '權限不足，請確認試算表的存取權限';
        } else if (error.message.includes('400')) {
          errorMessage = '試算表 ID 或頁籤名稱格式錯誤';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('錯誤', errorMessage);
    }
  };

  // 新增：獲取 A 欄位資料筆數
  const handleGetColumnDataCount = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      // 驗證輸入
      if (!sharedSpreadsheetId.trim()) {
        Alert.alert('錯誤', '請輸入試算表 ID');
        return;
      }

      if (!sharedSheetName.trim()) {
        Alert.alert('錯誤', '請輸入頁籤名稱');
        return;
      }

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      Alert.alert('計算中', '正在計算 A 欄位資料筆數...');
      
      const count = await googleSheetsService.getColumnDataCount(sharedSpreadsheetId.trim(), sharedSheetName.trim(), 'A');
      setColumnDataCount(count);
      
      Alert.alert('成功', `A 欄位總共有 ${count} 筆資料！`);
    } catch (error) {
      console.error('獲取欄位資料筆數錯誤:', error);
      
      let errorMessage = '獲取欄位資料筆數失敗';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = '找不到試算表或頁籤，請檢查 ID 和頁籤名稱是否正確';
        } else if (error.message.includes('403')) {
          errorMessage = '權限不足，請確認試算表的存取權限';
        } else if (error.message.includes('400')) {
          errorMessage = '試算表 ID 或頁籤名稱格式錯誤';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('錯誤', errorMessage);
    }
  };

  const handleAutoImportProducts = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      if (!autoImportSpreadsheetId.trim()) {
        Alert.alert('錯誤', '請輸入試算表 ID');
        return;
      }

      if (!autoImportSheetName.trim()) {
        Alert.alert('錯誤', '請輸入頁籤名稱');
        return;
      }

      if (!selectedMerchant) {
        Alert.alert('錯誤', '請選擇商家');
        return;
      }

      console.log('選擇的商家資訊:', selectedMerchant);
      console.log('商家ID:', selectedMerchant.id);
      console.log('商家名稱:', selectedMerchant.name);

      setIsUploading(true);

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      // 讀取試算表資料
      const range = `${autoImportSheetName}!A:E`;
      const response = await googleSheetsService.readSheet(autoImportSpreadsheetId, autoImportSheetName);
      
      if (!response || response.length < 2) {
        throw new Error('試算表中沒有資料或資料格式不正確');
      }

      // 跳過標題行，處理資料行
      const dataRows = response.slice(1);
      const importedProducts = [];
      let successCount = 0;
      let failureCount = 0;
      let duplicateCategoryCount = 0;
      let saveSuccessCount = 0;
      let saveFailureCount = 0;
      let newCategoryCount = 0;
      let duplicateProductCount = 0;

      // 取得當前日期作為預設進貨日期
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式

      // 用於追蹤已處理的類別和產品，避免重複
      const processedCategories = new Set();
      const processedProducts = new Set(); // 用於檢查商品是否重複

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          if (row.length >= 5) {
            // 使用用戶設定的欄位對應關係
            const productId = row[getColumnIndex(columnMapping.productId)] || '';
            const categoryName = row[getColumnIndex(columnMapping.category)] || '';
            const productName = row[getColumnIndex(columnMapping.productName)] || '';
            const productCode = row[getColumnIndex(columnMapping.productCode)] || '';
            const sellingPrice = row[getColumnIndex(columnMapping.sellingPrice)] || '';

            // 檢查必要欄位
            if (productName && productCode) {
              console.log(`\n=== 處理第 ${i + 1} 行資料 ===`);
              console.log(`類別名稱: ${categoryName}`);
              console.log(`產品名稱: ${productName}`);
              console.log(`產品代碼: ${productCode}`);
              
              // 生成類別代碼
              const categoryCode = generateCategoryCode(categoryName);
              console.log(`生成的類別代碼: ${categoryCode}`);
              
              // 生成商品排序ID（根據資料順序）
              const generatedProductId = generateProductId(i);
              console.log(`生成的商品ID: ${generatedProductId}`);
              
              // 檢查商品是否已經存在（使用商家ID+類別+產品代碼作為唯一標識）
              const merchantId = selectedMerchant.id || selectedMerchant;
              const productKey = `${merchantId}-${categoryCode}-${productCode}`;
              console.log(`商品唯一標識: ${productKey}`);
              console.log(`是否已處理過此商品: ${processedProducts.has(productKey)}`);
              
              if (processedProducts.has(productKey)) {
                duplicateProductCount++;
                console.log(`❌ 跳過重複商品: ${productName} (${productCode}) - 類別: ${categoryName}`);
                continue; // 跳過重複的商品
              }

              // 檢查類別是否已經處理過，如果沒有則新增類別
              console.log(`是否已處理過此類別: ${processedCategories.has(categoryName)}`);
              if (categoryName && !processedCategories.has(categoryName)) {
                // 新類別，先新增到類別管理
                console.log(`🆕 新增類別: ${categoryName} -> ${categoryCode}`);
                try {
                  const categorySuccess = await saveCustomCategory(categoryCode, categoryName);
                  if (categorySuccess) {
                    newCategoryCount++;
                    console.log(`✅ 成功新增類別: ${categoryName} -> ${categoryCode}`);
                  } else {
                    console.log(`⚠️ 類別已存在或新增失敗: ${categoryName} -> ${categoryCode}`);
                  }
                } catch (categoryError) {
                  console.error(`新增類別時發生錯誤: ${categoryName}`, categoryError);
                }
                
                // 標記類別已處理（但商品仍可以繼續處理）
                processedCategories.add(categoryName);
                console.log(`已標記類別 ${categoryName} 為已處理`);
              } else if (categoryName) {
                console.log(`📋 使用現有類別: ${categoryName} -> ${categoryCode}`);
              }

              // 嘗試保存產品到產品管理系統
              try {
                console.log(`準備保存產品: 商家ID=${merchantId}, 類別=${categoryCode}, 代碼=${productCode}, 名稱=${productName}, ID=${generatedProductId}`);
                console.log(`欄位對應: 商品ID=${columnMapping.productId}, 類別=${columnMapping.category}, 名稱=${columnMapping.productName}, 代碼=${columnMapping.productCode}, 價格=${columnMapping.sellingPrice}`);
                
                const saveSuccess = await saveCustomProduct(
                  merchantId,           // 商家ID
                  categoryCode,         // 生成的類別代碼
                  productCode,          // 產品代碼
                  productName,          // 產品名稱
                  generatedProductId    // 生成的商品排序ID
                );

                console.log(`保存結果: ${saveSuccess ? '成功' : '失敗'}`);

                if (saveSuccess) {
                  saveSuccessCount++;
                  processedProducts.add(productKey); // 標記為已處理
                  console.log(`✅ 成功保存產品: ${productName} (${productCode}) - 類別: ${categoryCode} - ID: ${generatedProductId}`);
                } else {
                  saveFailureCount++;
                  console.log(`❌ 保存產品失敗: ${productName} (${productCode})`);
                }
              } catch (saveError) {
                saveFailureCount++;
                console.error(`❌ 保存產品時發生錯誤: ${productName}`, saveError);
              }

              const product = {
                productId: productId,
                category: categoryCode,
                categoryName: categoryName,
                productName: productName,
                productCode: productCode,
                purchaseDate: currentDate,
                sellingPrice: sellingPrice,
                generatedProductId: generatedProductId,
              };

              importedProducts.push(product);
              successCount++;
            } else {
              failureCount++;
            }
          }
        } catch (error) {
          failureCount++;
          console.error('處理行資料時發生錯誤:', error);
        }
      }

      const result = {
        success: true,
        message: `成功讀取 ${importedProducts.length} 筆商品資料`,
        successCount,
        failureCount,
        duplicateCategoryCount,
        saveSuccessCount,
        saveFailureCount,
        newCategoryCount,
        duplicateProductCount,
        previewData: importedProducts
      };

      setImportResult(result);
      setPreviewData(importedProducts);

      // 驗證資料是否真的保存到了AsyncStorage
      try {
        const savedProducts = await getCustomProducts();
        console.log('AsyncStorage中的產品資料:', savedProducts);
        
        if (selectedMerchant && (selectedMerchant.id || selectedMerchant)) {
          const merchantId = selectedMerchant.id || selectedMerchant;
          const merchantProducts = savedProducts[merchantId] || {};
          console.log(`商家 ${selectedMerchant.name || '未知'} 的產品資料:`, merchantProducts);
          
          // 計算該商家的總產品數量
          let totalProductCount = 0;
          Object.values(merchantProducts).forEach(categoryProducts => {
            totalProductCount += Object.keys(categoryProducts).length;
          });
          console.log(`商家 ${selectedMerchant.name || '未知'} 總共有 ${totalProductCount} 個產品`);
        }
      } catch (verifyError) {
        console.error('驗證保存資料時發生錯誤:', verifyError);
      }

      setIsUploading(false);
      
      let alertMessage = `成功讀取 ${importedProducts.length} 筆商品資料！`;
      if (saveSuccessCount > 0) {
        alertMessage += `\n\n✅ 已成功保存 ${saveSuccessCount} 筆產品到產品管理系統`;
        if (newCategoryCount > 0) {
          alertMessage += `\n🆕 新增了 ${newCategoryCount} 個產品類別`;
        }
        if (duplicateProductCount > 0) {
          alertMessage += `\n🔄 跳過了 ${duplicateProductCount} 個重複商品`;
        }
        alertMessage += `\n\n📝 處理邏輯說明:`;
        alertMessage += `\n• 類別處理：遇到新類別時自動新增，相同類別跳過`;
        alertMessage += `\n• 商品處理：每個類別下檢查商品是否重複，不重複則新增`;
        alertMessage += `\n• 類別代碼：根據類別名稱自動生成英文三位數代碼`;
        alertMessage += `\n• 商品排序ID：按資料順序自動生成 001, 002, 003...`;
        alertMessage += `\n\n現在您可以在產品管理頁面查看這些產品了！`;
      }
      if (saveFailureCount > 0) {
        alertMessage += `\n\n❌ 有 ${saveFailureCount} 筆產品保存失敗，請檢查產品資料格式`;
      }
      
      Alert.alert('自動登入完成', alertMessage);
    } catch (error) {
      console.error('匯入商品資料錯誤:', error);
      Alert.alert('錯誤', `匯入商品資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      setIsUploading(false);
    }
  };

  const handlePreviewImport = async () => {
    try {
      if (!authState.isSignedIn) {
        Alert.alert('錯誤', '請先登入Google帳戶');
        return;
      }

      if (!autoImportSpreadsheetId.trim()) {
        Alert.alert('錯誤', '請輸入試算表 ID');
        return;
      }

      if (!autoImportSheetName.trim()) {
        Alert.alert('錯誤', '請輸入頁籤名稱');
        return;
      }

      Alert.alert('預覽中', '正在讀取試算表資料...');

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      // 讀取試算表資料進行預覽
      const response = await googleSheetsService.readSheet(autoImportSpreadsheetId, autoImportSheetName);
      
      if (!response || response.length < 2) {
        throw new Error('試算表中沒有資料或資料格式不正確');
      }

      // 跳過標題行，處理前5行資料進行預覽
      const previewRows = response.slice(1, 6);
      const previewProducts = [];

      // 取得當前日期作為預設進貨日期
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式

      // 用於追蹤已處理的類別，避免重複
      const processedCategories = new Set();
      // 用於追蹤每個類別的產品計數
      const categoryProductCounts: { [key: string]: number } = {};

      for (let i = 0; i < previewRows.length; i++) {
        const row = previewRows[i];
        if (row.length >= 5) {
          // 使用用戶設定的欄位對應關係
          const productId = row[getColumnIndex(columnMapping.productId)] || '';
          const categoryName = row[getColumnIndex(columnMapping.category)] || '';
          const productName = row[getColumnIndex(columnMapping.productName)] || '';
          const productCode = row[getColumnIndex(columnMapping.productCode)] || '';
          const sellingPrice = row[getColumnIndex(columnMapping.sellingPrice)] || '';

          // 檢查類別是否已經處理過，如果沒有則新增類別
          if (categoryName && !processedCategories.has(categoryName)) {
            processedCategories.add(categoryName);
            categoryProductCounts[categoryName] = 0;
          }

          // 生成類別代碼
          const categoryCode = generateCategoryCode(categoryName);
          
          // 生成商品排序ID（根據資料順序）
          if (categoryName) {
            const generatedProductId = generateProductId(i);
            
            const product = {
              productId: productId,
              category: categoryCode, // 使用生成的類別代碼
              categoryName: categoryName, // 保留原始類別名稱
              productName: productName,
              productCode: productCode,
              purchaseDate: currentDate,
              sellingPrice: sellingPrice,
              generatedProductId: generatedProductId, // 生成的商品排序ID
            };

            previewProducts.push(product);
          }
        }
      }

      setPreviewData(previewProducts);
      Alert.alert('預覽完成', `找到 ${previewProducts.length} 筆商品資料`);
    } catch (error) {
      console.error('預覽資料錯誤:', error);
      Alert.alert('錯誤', `預覽資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 測試保存產品功能
  const handleTestSaveProduct = async () => {
    try {
      if (!selectedMerchant) {
        Alert.alert('錯誤', '請先選擇商家');
        return;
      }

      Alert.alert('測試中', '正在測試保存產品功能...');

      // 測試保存一個產品
      const merchantId = selectedMerchant.id || selectedMerchant;
      console.log('=== 測試保存產品 ===');
      console.log('選擇的商家物件:', selectedMerchant);
      console.log('使用的商家ID:', merchantId);
      console.log('商家類型:', typeof merchantId);

      const testSuccess = await saveCustomProduct(
        merchantId,
        'TEST',
        '001',
        '測試產品',
        'TEST001'
      );

      console.log('保存結果:', testSuccess);

      if (testSuccess) {
        // 驗證是否真的保存了
        const savedProducts = await getCustomProducts();
        console.log('測試後 AsyncStorage 中的產品資料:', savedProducts);
        
        if (selectedMerchant && (selectedMerchant.id || selectedMerchant)) {
          const merchantId = selectedMerchant.id || selectedMerchant;
          const merchantProducts = savedProducts[merchantId] || {};
          console.log(`商家 ${selectedMerchant.name || '未知'} 的產品資料:`, merchantProducts);
          
          // 計算該商家的總產品數量
          let totalProductCount = 0;
          Object.values(merchantProducts).forEach(categoryProducts => {
            totalProductCount += Object.keys(categoryProducts).length;
          });
          console.log(`商家 ${selectedMerchant.name || '未知'} 總共有 ${totalProductCount} 個產品`);
        }

        // 測試讀取功能
        console.log('=== 測試讀取功能 ===');
        const testReadProducts = await getProductsByCategory(merchantId, 'TEST');
        console.log('使用 getProductsByCategory 讀取的產品:', testReadProducts);
        console.log('產品數量:', Object.keys(testReadProducts).length);

        Alert.alert('測試成功', '產品已成功保存到 AsyncStorage！\n請查看控制台日誌確認資料。');
      } else {
        Alert.alert('測試失敗', '保存產品失敗，請檢查錯誤日誌。');
      }
    } catch (error) {
      console.error('測試保存產品時發生錯誤:', error);
      Alert.alert('測試失敗', `測試過程發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 清除全部資料功能
  const handleClearAllData = async () => {
    try {
      // 顯示確認對話框
      Alert.alert(
        '⚠️ 危險操作',
        '此操作將清除所有自定義類別和產品資料！\n\n⚠️ 注意：此操作不會影響 Google 表單設定和交易紀錄。\n\n此操作不可逆轉，請確認您真的要清除所有商品資料。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確認清除',
            style: 'destructive',
            onPress: async () => {
              try {
                Alert.alert('清除中', '正在清除商品資料...');
                
                // 使用安全的清除函數，只清除商品資料，不影響試算表設定
                const clearResult = await clearAllProductData();
                
                if (clearResult.success) {
                  // 清除預覽和匯入結果
                  setPreviewData([]);
                  setImportResult(null);
                  
                  // 重新載入商家列表
                  await loadMerchantsList();
                  
                  Alert.alert(
                    '清除完成',
                    clearResult.message + '\n\n' + clearResult.details,
                    [
                      {
                        text: '確定',
                        onPress: () => {
                          console.log('商品資料清除完成');
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert(
                    '清除失敗',
                    clearResult.message + '\n\n' + clearResult.details,
                    [{ text: '確定', style: 'default' }]
                  );
                }
              } catch (clearError) {
                console.error('清除資料時發生錯誤:', clearError);
                Alert.alert('清除失敗', `清除資料時發生錯誤: ${clearError instanceof Error ? clearError.message : '未知錯誤'}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('清除資料確認時發生錯誤:', error);
      Alert.alert('錯誤', `操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 測試類別代碼生成功能
  const handleTestCategoryCodeGeneration = () => {
    const testCategories = [
      '男款手鍊',
      '女款手鍊', 
      '項鍊',
      '耳環',
      '戒指',
      '手錶',
      '包包',
      '鞋子',
      '衣服',
      '褲子',
      '帽子',
      '眼鏡',
      '水果',
      '蔬菜',
      '肉類',
      '海鮮',
      '飲料',
      '零食',
      '化妝品',
      '保養品',
      '測試類別1',
      '測試類別2',
      'Test Category',
      'Mixed 混合類別'
    ];

    console.log('=== 測試類別代碼生成 ===');
    console.log('📊 預設映射類別:');
    testCategories.slice(0, 20).forEach(category => {
      const code = generateCategoryCode(category);
      console.log(`${category} → ${code}`);
    });
    
    console.log('\n🔤 自定義生成類別:');
    testCategories.slice(20, 22).forEach(category => {
      const code = generateCategoryCode(category);
      console.log(`${category} → ${code}`);
    });
    
    console.log('\n🌍 英文類別:');
    testCategories.slice(22, 23).forEach(category => {
      const code = generateCategoryCode(category);
      console.log(`${category} → ${code}`);
    });
    
    console.log('\n🔀 混合類別:');
    testCategories.slice(23, 24).forEach(category => {
      const code = generateCategoryCode(category);
      console.log(`${category} → ${code}`);
    });

    // 測試中文字符代碼生成規律
    console.log('\n🔍 中文字符代碼生成規律測試:');
    const chineseTest = ['男', '女', '項', '耳', '戒', '手', '包', '鞋', '衣', '褲'];
    chineseTest.forEach(char => {
      const code = generateChineseCode(char);
      console.log(`字符 "${char}" (Unicode: ${char.charCodeAt(0)}) → ${code}`);
    });

    Alert.alert(
      '測試完成',
      '類別代碼生成測試完成！\n\n請查看控制台日誌確認：\n' +
      '1. 預設映射類別（如男款手鍊→MAL）\n' +
      '2. 自定義生成類別（根據字符規律）\n' +
      '3. 英文類別（取前3字母）\n' +
      '4. 混合類別（英文+中文）\n' +
      '5. 中文字符代碼生成規律\n\n' +
      '注意：相同類別名稱應該生成相同代碼，不同類別名稱應該生成不同代碼。'
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

        <View style={styles.sharedFormSection}>
          <Text style={styles.sectionTitle}>共用表單讀取</Text>
          <Text style={styles.sectionDescription}>
            讀取共用表單內的內容
          </Text>

          {/* 新增：輸入欄位 */}
          <View style={styles.inputFieldsContainer}>
            <View style={styles.inputFieldRow}>
              <Text style={styles.inputFieldLabel}>試算表 ID:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="請輸入試算表 ID"
                value={sharedSpreadsheetId}
                onChangeText={setSharedSpreadsheetId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputFieldRow}>
              <Text style={styles.inputFieldLabel}>頁籤名稱:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="請輸入頁籤名稱"
                value={sharedSheetName}
                onChangeText={setSharedSheetName}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.sharedFormButtonsContainer}>
            <TouchableOpacity
              style={styles.readSharedFormButton}
              onPress={handleReadSharedForm}
            >
              <Text style={styles.readSharedFormButtonIcon}>📖</Text>
              <Text style={styles.readSharedFormButtonText}>讀取共用表單</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.getColumnCountButton}
              onPress={handleGetColumnDataCount}
            >
              <Text style={styles.getColumnCountButtonIcon}>📊</Text>
              <Text style={styles.getColumnCountButtonText}>獲取 A 欄位筆數</Text>
            </TouchableOpacity>
          </View>

          {sharedFormContent && (
            <View style={styles.sharedFormResultCard}>
              <Text style={styles.sharedFormResultTitle}>讀取結果</Text>
              <Text style={styles.sharedFormResultLabel}>A2欄位內容:</Text>
              <Text style={styles.sharedFormResultData}>{sharedFormContent}</Text>
            </View>
          )}

          {columnDataCount !== null && (
            <View style={styles.sharedFormResultCard}>
              <Text style={styles.sharedFormResultTitle}>欄位統計</Text>
              <Text style={styles.sharedFormResultLabel}>A 欄位總筆數:</Text>
              <Text style={styles.sharedFormResultData}>{columnDataCount} 筆</Text>
            </View>
          )}
        </View>

        <View style={styles.autoImportSection}>
          <Text style={styles.sectionTitle}>自動登入商品資訊</Text>
          <Text style={styles.sectionDescription}>
            從試算表自動登入商品相關資訊，設定欄位對應關係
          </Text>

          {/* 試算表設定 */}
          <View style={styles.importInputFieldsContainer}>
            <View style={styles.importInputFieldRow}>
              <Text style={styles.importInputFieldLabel}>試算表 ID:</Text>
              <TextInput
                style={styles.importInputField}
                placeholder="請輸入試算表 ID"
                value={autoImportSpreadsheetId}
                onChangeText={setAutoImportSpreadsheetId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.importInputFieldRow}>
              <Text style={styles.importInputFieldLabel}>頁籤名稱:</Text>
              <TextInput
                style={styles.importInputField}
                placeholder="請輸入頁籤名稱"
                value={autoImportSheetName}
                onChangeText={setAutoImportSheetName}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* 商家選擇器 */}
          <View style={styles.merchantSelectorContainer}>
            <Text style={styles.merchantSelectorLabel}>選擇商家:</Text>
            <TouchableOpacity
              style={styles.merchantSelectorButton}
              onPress={() => setShowMerchantSelector(true)}
            >
              <Text style={styles.merchantSelectorButtonText}>
                {selectedMerchant ? `${selectedMerchant.name} (${selectedMerchant.code})` : '請選擇商家'}
              </Text>
              <Text style={styles.merchantSelectorButtonIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* 欄位對應設定 */}
          <View style={styles.columnMappingContainer}>
            <Text style={styles.columnMappingTitle}>欄位對應設定:</Text>
            <Text style={styles.columnMappingSubtitle}>請指定各欄位在試算表中的位置 (例如: A, B, C...)</Text>
            
            <View style={styles.columnMappingGrid}>
              <View style={styles.columnMappingRow}>
                <Text style={styles.columnMappingLabel}>商品ID:</Text>
                <TextInput
                  style={styles.columnMappingInput}
                  placeholder="A"
                  value={columnMapping.productId}
                  onChangeText={(text) => setColumnMapping(prev => ({ ...prev, productId: text.toUpperCase() }))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
              
              <View style={styles.columnMappingRow}>
                <Text style={styles.columnMappingLabel}>產品類別:</Text>
                <TextInput
                  style={styles.columnMappingInput}
                  placeholder="B"
                  value={columnMapping.category}
                  onChangeText={(text) => setColumnMapping(prev => ({ ...prev, category: text.toUpperCase() }))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
              
              <View style={styles.columnMappingRow}>
                <Text style={styles.columnMappingLabel}>產品名稱:</Text>
                <TextInput
                  style={styles.columnMappingInput}
                  placeholder="C"
                  value={columnMapping.productName}
                  onChangeText={(text) => setColumnMapping(prev => ({ ...prev, productName: text.toUpperCase() }))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
              
              <View style={styles.columnMappingRow}>
                <Text style={styles.columnMappingLabel}>產品代碼:</Text>
                <TextInput
                  style={styles.columnMappingInput}
                  placeholder="D"
                  value={columnMapping.productCode}
                  onChangeText={(text) => setColumnMapping(prev => ({ ...prev, productCode: text.toUpperCase() }))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
              
              <View style={styles.columnMappingRow}>
                <Text style={styles.columnMappingLabel}>販售價格:</Text>
                <TextInput
                  style={styles.columnMappingInput}
                  placeholder="E"
                  value={columnMapping.sellingPrice}
                  onChangeText={(text) => setColumnMapping(prev => ({ ...prev, sellingPrice: text.toUpperCase() }))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* 操作按鈕 */}
          <View style={styles.autoImportButtonsContainer}>
            <TouchableOpacity
              style={styles.autoImportButton}
              onPress={handleAutoImportProducts}
            >
              <Text style={styles.autoImportButtonIcon}>📥</Text>
              <Text style={styles.autoImportButtonText}>開始自動登入</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreviewImport}
            >
              <Text style={styles.previewButtonIcon}>👁️</Text>
              <Text style={styles.previewButtonText}>預覽資料</Text>
            </TouchableOpacity>
          </View>

          {/* 測試按鈕 */}
          <View style={styles.testButtonContainer}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestSaveProduct}
            >
              <Text style={styles.testButtonIcon}>🧪</Text>
              <Text style={styles.testButtonText}>測試保存產品</Text>
            </TouchableOpacity>
          </View>

          {/* 測試類別代碼生成按鈕 */}
          <View style={styles.testCategoryCodeButtonContainer}>
            <TouchableOpacity
              style={styles.testCategoryCodeButton}
              onPress={handleTestCategoryCodeGeneration}
            >
              <Text style={styles.testCategoryCodeButtonIcon}>🔤</Text>
              <Text style={styles.testCategoryCodeButtonText}>測試類別代碼</Text>
            </TouchableOpacity>
          </View>

          {/* 清除資料按鈕 */}
          <View style={styles.clearDataButtonContainer}>
            <TouchableOpacity
              style={styles.clearDataButton}
              onPress={handleClearAllData}
            >
              <Text style={styles.clearDataButtonIcon}>🗑️</Text>
              <Text style={styles.clearDataButtonText}>清除全部資料</Text>
            </TouchableOpacity>
          </View>

          {/* 預覽結果 */}
          {previewData && (
            <View style={styles.previewResultCard}>
              <Text style={styles.previewResultTitle}>預覽結果</Text>
              <Text style={styles.previewResultSubtitle}>
                找到 {previewData.length} 筆商品資料
              </Text>
              
              {/* 顯示欄位對應資訊 */}
              <View style={styles.columnMappingInfo}>
                <Text style={styles.columnMappingInfoTitle}>使用的欄位對應:</Text>
                <Text style={styles.columnMappingInfoText}>
                  商品ID: {columnMapping.productId} | 類別: {columnMapping.category} | 名稱: {columnMapping.productName}
                </Text>
                <Text style={styles.columnMappingInfoText}>
                  代碼: {columnMapping.productCode} | 價格: {columnMapping.sellingPrice}
                </Text>
              </View>
              
              <ScrollView style={styles.previewDataList} showsVerticalScrollIndicator={false}>
                {previewData.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.previewDataItem}>
                    <Text style={styles.previewDataLabel}>商品 {index + 1}:</Text>
                    <Text style={styles.previewDataValue}>
                      {item.productName || '無名稱'} - {item.productCode || '無代碼'}
                    </Text>
                    <Text style={styles.previewDataDetails}>
                      類別: {item.categoryName || '無類別'} → {item.category || '無代碼'}
                    </Text>
                    <Text style={styles.previewDataDetails}>
                      商品ID: {item.generatedProductId || '無ID'}
                    </Text>
                  </View>
                ))}
                {previewData.length > 5 && (
                  <Text style={styles.previewDataMore}>
                    ... 還有 {previewData.length - 5} 筆資料
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* 匯入結果 */}
          {importResult && (
            <View style={styles.importResultCard}>
              <Text style={styles.importResultTitle}>匯入結果</Text>
              <Text style={styles.importResultMessage}>{importResult.message}</Text>
              {importResult.success && (
                <Text style={styles.importResultStats}>
                  成功匯入: {importResult.successCount} 筆 | 失敗: {importResult.failureCount} 筆
                  {importResult.duplicateCategoryCount > 0 && (
                    <Text style={styles.duplicateCategoryStats}>
                      {'\n'}跳過重複類別: {importResult.duplicateCategoryCount} 個
                    </Text>
                  )}
                  {importResult.newCategoryCount > 0 && (
                    <Text style={styles.newCategoryStats}>
                      {'\n'}🆕 新增類別: {importResult.newCategoryCount} 個
                    </Text>
                  )}
                  {importResult.duplicateProductCount > 0 && (
                    <Text style={styles.duplicateProductStats}>
                      {'\n'}🔄 跳過重複商品: {importResult.duplicateProductCount} 個
                    </Text>
                  )}
                  {importResult.saveSuccessCount > 0 && (
                    <Text style={styles.saveSuccessStats}>
                      {'\n'}✅ 成功保存到產品管理: {importResult.saveSuccessCount} 筆
                    </Text>
                  )}
                  {importResult.saveFailureCount > 0 && (
                    <Text style={styles.saveFailureStats}>
                      {'\n'}❌ 保存到產品管理失敗: {importResult.saveFailureCount} 筆
                    </Text>
                  )}
                </Text>
              )}
            </View>
          )}
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
                
                {/* 備註輸入欄位 */}
                {parsedProduct.isValid && (
                  <View style={styles.noteInputContainer}>
                    <Text style={styles.noteInputLabel}>備註 (可選):</Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="請輸入備註 (可選)"
                      value={note}
                      onChangeText={setNote}
                      multiline={true}
                      numberOfLines={3}
                      maxLength={200}
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

                    {/* 備註輸入欄位 */}
                    {parsedProduct.isValid && (
                      <View style={styles.modalNoteInputContainer}>
                        <Text style={styles.modalNoteInputLabel}>備註 (可選):</Text>
                        <TextInput
                          style={styles.modalNoteInput}
                          placeholder="請輸入備註 (可選)"
                          value={note}
                          onChangeText={setNote}
                          multiline={true}
                          numberOfLines={3}
                          maxLength={200}
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

      {/* 商家選擇器 Modal */}
      <Modal
        visible={showMerchantSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMerchantSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.merchantSelectorModalContent}>
            <View style={styles.merchantSelectorModalHeader}>
              <Text style={styles.merchantSelectorModalTitle}>選擇商家</Text>
              <TouchableOpacity
                style={styles.merchantSelectorModalCloseButton}
                onPress={() => setShowMerchantSelector(false)}
              >
                <Text style={styles.merchantSelectorModalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.merchantSelectorModalBody}>
              {merchants.length === 0 ? (
                <View style={styles.merchantSelectorEmptyContainer}>
                  <Text style={styles.merchantSelectorEmptyText}>📁 沒有找到商家</Text>
                  <Text style={styles.merchantSelectorEmptySubText}>
                    請先在商家管理頁面新增商家。
                  </Text>
                </View>
              ) : (
                merchants.map((merchant) => (
                  <TouchableOpacity
                    key={merchant.id}
                    style={[
                      styles.merchantSelectorItem,
                      selectedMerchant?.id === merchant.id && styles.merchantSelectorItemActive
                    ]}
                    onPress={() => {
                      setSelectedMerchant(merchant);
                      setShowMerchantSelector(false);
                    }}
                  >
                    <View style={styles.merchantSelectorItemInfo}>
                      <Text style={styles.merchantSelectorItemName}>{merchant.name}</Text>
                      <Text style={styles.merchantSelectorItemCode}>代碼: {merchant.code}</Text>
                      {merchant.description && (
                        <Text style={styles.merchantSelectorItemDescription}>{merchant.description}</Text>
                      )}
                    </View>
                    {selectedMerchant?.id === merchant.id && (
                      <Text style={styles.merchantSelectorItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
              {/* 底部間距元素 */}
              <View style={styles.merchantSelectorListBottomSpacer} />
            </ScrollView>
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
  noteInputContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  noteInputLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  modalNoteInputContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalNoteInputLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 8,
  },
  modalNoteInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#212529',
  },
  sharedFormSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readSharedFormButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  readSharedFormButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  readSharedFormButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sharedFormResultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sharedFormResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  sharedFormResultLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  sharedFormResultData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  sharedFormButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  getColumnCountButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  getColumnCountButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  getColumnCountButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputFieldsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputFieldRow: {
    flex: 1,
  },
  inputFieldLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  inputField: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#212529',
  },
  autoImportSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  importInputFieldsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  importInputFieldRow: {
    flex: 1,
  },
  importInputFieldLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  importInputField: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#212529',
  },
  merchantSelectorContainer: {
    marginBottom: 15,
  },
  merchantSelectorLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  merchantSelectorButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  merchantSelectorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  merchantSelectorButtonIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  columnMappingContainer: {
    marginBottom: 15,
  },
  columnMappingTitle: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  columnMappingSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 10,
  },
  columnMappingGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  columnMappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnMappingLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
    flex: 1,
  },
  columnMappingInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#212529',
    width: 60,
    textAlign: 'center',
  },
  autoImportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  autoImportButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  autoImportButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  autoImportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  previewButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewResultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  previewResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  previewResultSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  previewDataList: {
    maxHeight: 150,
  },
  previewDataItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  previewDataLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  previewDataValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
  },
  previewDataMore: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 5,
  },
  importResultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  importResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  importResultMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  importResultStats: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  duplicateCategoryStats: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  saveSuccessStats: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  saveFailureStats: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  newCategoryStats: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  duplicateProductStats: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  merchantSelectorModalContent: {
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
  merchantSelectorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  merchantSelectorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  merchantSelectorModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantSelectorModalCloseButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  merchantSelectorModalBody: {
    padding: 20,
  },
  merchantSelectorEmptyContainer: {
    padding: 60,
    alignItems: 'center',
    minHeight: 200,
  },
  merchantSelectorEmptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 10,
    textAlign: 'center',
  },
  merchantSelectorEmptySubText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  merchantSelectorItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  merchantSelectorItemInfo: {
    marginBottom: 5,
  },
  merchantSelectorItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  merchantSelectorItemCode: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  merchantSelectorItemDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  merchantSelectorItemCheck: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
    textAlign: 'right',
    marginLeft: 10,
  },
  merchantSelectorListBottomSpacer: {
    height: 20,
  },
  merchantSelectorItemActive: {
    backgroundColor: '#e9ecef',
  },
  previewDataDetails: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
  },
  testButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  testButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  testButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  columnMappingInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  columnMappingInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  columnMappingInfoText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5,
  },
  clearDataButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearDataButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  clearDataButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  clearDataButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testCategoryCodeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  testCategoryCodeButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '48%',
  },
  testCategoryCodeButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testCategoryCodeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default POSSystemScreen; 