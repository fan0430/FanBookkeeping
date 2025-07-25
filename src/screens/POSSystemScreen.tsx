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
import { googleSheetsService } from '../utils/googleSheetsService';
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

  const handleManualInput = () => {
    if (!manualInput.trim()) {
      Alert.alert('錯誤', '請輸入條碼內容');
      return;
    }
    const parsed = parseBarcode(manualInput);
    setScannedData(manualInput);
    setParsedProduct(parsed);
    setShowResultModal(true);
  };

  const handleScanAgain = () => {
    setScannedData('');
    setParsedProduct(null);
    setManualInput('');
    setShowResultModal(false);
    setShowCameraModal(false);
  };

  const handleCameraScan = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      setShowCameraModal(true);
    }
  };

  const onBarcodeRead = (event: any) => {
    console.log('Barcode read event:', event);
    const { data } = event;
    if (data) {
      const parsed = parseBarcode(data);
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
              onPress: () => createNewSpreadsheet()
            }
          ]
        );
        return;
      }

      await createNewSpreadsheet();
    } catch (error) {
      console.error('建立試算表錯誤:', error);
      Alert.alert('錯誤', '建立試算表失敗，請重試');
    }
  };

  // 實際建立試算表的函數
  const createNewSpreadsheet = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      const newSpreadsheetId = await googleSheetsService.createProductSpreadsheet();
      
      // 儲存試算表資訊到本地
      await saveUserSpreadsheetId(
        authState.user!.id,
        authState.user!.email,
        authState.user!.name,
        newSpreadsheetId,
        '產品掃描記錄'
      );
      
      setSpreadsheetId(newSpreadsheetId);
      
      // 重新載入試算表資訊
      await loadUserSpreadsheetInfo();
      
      Alert.alert('成功', `已建立新的試算表！\n試算表ID: ${newSpreadsheetId}`);
    } catch (error) {
      console.error('建立試算表錯誤:', error);
      Alert.alert('錯誤', '建立試算表失敗，請重試');
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

      const token = await getAccessToken();
      if (token) {
        googleSheetsService.setAccessToken(token);
      }

      await googleSheetsService.addProductToSheet(spreadsheetId, parsedProduct);
      
      // 更新試算表的最後使用時間
      if (authState.user?.id) {
        await updateUserSpreadsheetLastUsed(authState.user.id);
      }
      
      Alert.alert('成功', '產品資料已上傳到雲端試算表！');
    } catch (error) {
      console.error('上傳資料錯誤:', error);
      Alert.alert('錯誤', '上傳資料失敗，請重試');
    }
  };

  // 上傳到雲端按鈕元件
  const UploadButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity
      style={styles.uploadButton}
      onPress={onPress}
    >
      <Text style={styles.uploadButtonText}>☁️ 上傳到雲端</Text>
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
          onPress: () => handleCreateSpreadsheet()
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
                  <TouchableOpacity
                    style={styles.createSheetButton}
                    onPress={handleCreateSpreadsheet}
                  >
                    <Text style={styles.createSheetButtonText}>📊 建立試算表</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.spreadsheetInfo}>
                    <View style={styles.spreadsheetInfoTouchable}>
                      <Text style={styles.spreadsheetLabel}>試算表資訊 (點擊管理):</Text>
                      <Text style={styles.spreadsheetName}>{spreadsheetInfo?.spreadsheetName || '產品掃描記錄'}</Text>
                      <Text style={styles.spreadsheetId}>ID: {spreadsheetId}</Text>
                      
                      {/* 操作按鈕區域 - 直接插入在 ID 下面 */}
                      <View style={styles.spreadsheetActions}>
                        <TouchableOpacity
                          style={styles.spreadsheetActionButton}
                          onPress={handleCopySpreadsheetUrl}
                        >
                          <Text style={styles.spreadsheetActionButtonText}>📋 複製</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.spreadsheetActionButton}
                          onPress={() => {
                            const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
                            Linking.openURL(url);
                          }}
                        >
                          <Text style={styles.spreadsheetActionButtonText}>🔗 開啟</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {spreadsheetInfo?.createdAt && (
                        <Text style={styles.spreadsheetDate}>
                          建立時間: {new Date(spreadsheetInfo.createdAt).toLocaleDateString('zh-TW')}
                        </Text>
                      )}
                      <Text style={styles.spreadsheetHint}>點擊查看管理選項</Text>
                    </View>
                  </View>
                )}
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
          <Text style={styles.sectionTitle}>產品管理</Text>
          <Text style={styles.sectionDescription}>
            查看產品資訊和生成條碼
          </Text>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => navigation.navigate('productManagement')}
          >
            <Text style={styles.managementButtonIcon}>📋</Text>
            <Text style={styles.managementButtonText}>產品管理</Text>
          </TouchableOpacity>
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
                      <Text style={styles.productInfoLabel}>生產日期:</Text>
                      <Text style={styles.productInfoValue}>{parsedProduct.formattedDate}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>❌ {parsedProduct.error}</Text>
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
                          <Text style={styles.modalProductInfoLabel}>生產日期:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.formattedDate}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.modalErrorContainer}>
                        <Text style={styles.modalErrorText}>❌ {parsedProduct.error}</Text>
                      </View>
                    )}

                    {/* 只有登入、資料正確且有試算表才顯示上傳按鈕 */}
                    {authState.isSignedIn && parsedProduct.isValid && spreadsheetId && (
                      <TouchableOpacity
                        style={styles.modalUploadButton}
                        onPress={handleUploadToCloud}
                      >
                        <Text style={styles.modalUploadButtonText}>☁️ 上傳到雲端</Text>
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
  },
  createSheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spreadsheetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
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
  managementButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  spreadsheetActionButton: {
    backgroundColor: '#17a2b8',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
  },
  spreadsheetActionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
});

export default POSSystemScreen; 