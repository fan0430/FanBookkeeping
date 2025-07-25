import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const testGoogleAuth = async () => {
  try {
    console.log('開始測試 Google 登入...');
    
    // 檢查是否已登入
    const userInfo = await GoogleSignin.getCurrentUser();
    console.log('是否已登入:', !!userInfo);
    
    if (userInfo) {
      // 取得當前用戶資訊
      console.log('當前用戶資訊:', userInfo);
      
      // 取得存取權杖
      const tokens = await GoogleSignin.getTokens();
      console.log('存取權杖:', tokens.accessToken ? '已取得' : '未取得');
      
      return {
        success: true,
        message: '已登入',
        user: userInfo,
        token: tokens.accessToken ? '已取得' : '未取得',
      };
    } else {
      return {
        success: false,
        message: '未登入',
        user: null,
        token: null,
      };
    }
  } catch (error) {
    console.error('Google 登入測試錯誤:', error);
    return {
      success: false,
      message: `錯誤: ${error}`,
      user: null,
      token: null,
    };
  }
};

export const testGoogleSignIn = async () => {
  try {
    console.log('開始測試 Google 登入流程...');
    
    // 檢查 Play Services
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    console.log('Play Services 可用:', hasPlayServices);
    
    if (!hasPlayServices) {
      throw new Error('Play Services 不可用');
    }
    
    // 執行登入
    const userInfo = await GoogleSignin.signIn();
    console.log('登入成功，用戶資訊:', userInfo);
    
    // 取得權杖
    const tokens = await GoogleSignin.getTokens();
    console.log('權杖取得成功:', tokens.accessToken ? '是' : '否');
    
    return {
      success: true,
      message: '登入成功',
      user: userInfo,
      token: tokens.accessToken,
    };
  } catch (error: any) {
    console.error('Google 登入測試失敗:', error);
    
    let errorMessage = '未知錯誤';
    if (error.code) {
      switch (error.code) {
        case 'SIGN_IN_CANCELLED':
          errorMessage = '使用者取消登入';
          break;
        case 'IN_PROGRESS':
          errorMessage = '登入進行中';
          break;
        case 'PLAY_SERVICES_NOT_AVAILABLE':
          errorMessage = 'Play Services 不可用';
          break;
        case 'DEVELOPER_ERROR':
          errorMessage = '開發者設定錯誤 - 檢查 Google Cloud Console 設定';
          break;
        default:
          errorMessage = `錯誤代碼: ${error.code}`;
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      user: null,
      token: null,
    };
  }
};

export const testGoogleSignOut = async () => {
  try {
    console.log('開始測試 Google 登出...');
    
    await GoogleSignin.signOut();
    console.log('登出成功');
    
    // 確認登出狀態
    const userInfo = await GoogleSignin.getCurrentUser();
    console.log('登出後登入狀態:', !!userInfo);
    
    return {
      success: true,
      message: '登出成功',
      isSignedIn: !!userInfo,
    };
  } catch (error) {
    console.error('Google 登出測試失敗:', error);
    return {
      success: false,
      message: `登出失敗: ${error}`,
      isSignedIn: null,
    };
  }
};

// 新增：詳細的錯誤代碼解釋
const getErrorCodeExplanation = (code: number): string => {
  switch (code) {
    case 0:
      return 'SUCCESS - 成功';
    case 1:
      return 'CANCELLED - 使用者取消';
    case 2:
      return 'IN_PROGRESS - 登入進行中';
    case 3:
      return 'PLAY_SERVICES_NOT_AVAILABLE - Play Services 不可用';
    case 4:
      return 'SIGN_IN_REQUIRED - 需要登入';
    case 5:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 6:
      return 'SIGN_IN_CURRENTLY_IN_PROGRESS - 登入正在進行中';
    case 7:
      return 'SIGN_IN_FAILED - 登入失敗';
    case 8:
      return 'SIGN_OUT_FAILED - 登出失敗';
    case 9:
      return 'SIGN_IN_REQUIRED - 需要登入';
    case 10:
      return 'DEVELOPER_ERROR - 開發者設定錯誤（OAuth 同意畫面問題）';
    case 11:
      return 'NETWORK_ERROR - 網路錯誤';
    case 12:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 13:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 14:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 15:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 16:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 17:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 18:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 19:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    case 20:
      return 'SIGN_IN_CANCELLED - 登入被取消';
    default:
      return `未知錯誤代碼: ${code}`;
  }
};

// 新增：詳細診斷功能
export const diagnoseGoogleAuth = async () => {
  console.log('開始診斷 Google 登入設定...');
  
  const diagnosis = {
    playServices: false,
    currentUser: null as any,
    tokens: null as any,
    configuration: null as any,
    errors: [] as string[],
    suggestions: [] as string[],
  };

  try {
    // 1. 檢查 Play Services
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      diagnosis.playServices = hasPlayServices;
      console.log('Play Services 檢查:', hasPlayServices ? '✅ 可用' : '❌ 不可用');
      
      if (!hasPlayServices) {
        diagnosis.suggestions.push('Play Services 不可用 - 請更新 Google Play Services');
        diagnosis.suggestions.push('建議使用真機測試，模擬器可能有問題');
      }
    } catch (error: any) {
      diagnosis.errors.push(`Play Services 檢查錯誤: ${error.message || error}`);
      diagnosis.suggestions.push('Play Services 檢查失敗 - 可能是網路問題或設定錯誤');
      console.error('Play Services 檢查錯誤:', error);
    }

    // 2. 檢查當前用戶
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      diagnosis.currentUser = userInfo;
      console.log('當前用戶檢查:', userInfo ? '✅ 已登入' : '❌ 未登入');
      
      if (!userInfo) {
        diagnosis.suggestions.push('未檢測到登入用戶 - 這是正常的，如果從未登入過');
      }
    } catch (error: any) {
      const errorMessage = error.message || error;
      diagnosis.errors.push(`當前用戶檢查錯誤: ${errorMessage}`);
      
      // 根據錯誤類型提供建議
      if (errorMessage.includes('DEVELOPER_ERROR')) {
        diagnosis.suggestions.push('DEVELOPER_ERROR - 請檢查 Google Cloud Console 設定：');
        diagnosis.suggestions.push('1. 確認 OAuth 同意畫面已設定為「測試中」或「生產環境」');
        diagnosis.suggestions.push('2. 確認您的 Google 帳戶已加入測試使用者');
        diagnosis.suggestions.push('3. 確認 SHA-1 指紋正確：5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
        diagnosis.suggestions.push('4. 確認套件名稱正確：com.fanbookkeeping');
        diagnosis.suggestions.push('5. 等待 24 小時讓設定生效');
      } else if (errorMessage.includes('NETWORK_ERROR')) {
        diagnosis.suggestions.push('網路錯誤 - 請檢查網路連線');
      } else {
        diagnosis.suggestions.push('用戶檢查失敗 - 可能是配置問題或網路問題');
      }
      
      console.error('當前用戶檢查錯誤:', error);
    }

    // 3. 檢查權杖
    try {
      const tokens = await GoogleSignin.getTokens();
      diagnosis.tokens = tokens;
      console.log('權杖檢查:', tokens.accessToken ? '✅ 有效' : '❌ 無效');
      
      if (!tokens.accessToken) {
        diagnosis.suggestions.push('無法取得存取權杖 - 需要先成功登入');
      }
    } catch (error: any) {
      const errorMessage = error.message || error;
      diagnosis.errors.push(`權杖檢查錯誤: ${errorMessage}`);
      
      // 根據錯誤類型提供建議
      if (errorMessage.includes('DEVELOPER_ERROR')) {
        diagnosis.suggestions.push('權杖取得失敗 - 通常是因為未登入或配置錯誤');
        diagnosis.suggestions.push('請先嘗試登入，如果失敗請檢查 OAuth 同意畫面設定');
      } else if (errorMessage.includes('NETWORK_ERROR')) {
        diagnosis.suggestions.push('權杖取得網路錯誤 - 請檢查網路連線');
      } else {
        diagnosis.suggestions.push('權杖檢查失敗 - 需要先成功登入');
      }
      
      console.error('權杖檢查錯誤:', error);
    }

    // 4. 檢查配置
    try {
      // 這裡我們無法直接檢查配置，但可以記錄已知配置
      diagnosis.configuration = {
        webClientId: '191329007466-3ep6o34nim2ouqg4kukre3irekh16t3q.apps.googleusercontent.com',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        offlineAccess: true,
      };
      console.log('配置檢查: 完成');
      
      // 提供配置檢查建議
      diagnosis.suggestions.push('配置檢查完成 - 請確認 App.tsx 中的配置正確');
    } catch (error) {
      diagnosis.errors.push(`配置檢查錯誤: ${error}`);
      diagnosis.suggestions.push('配置檢查失敗 - 請檢查 App.tsx 中的 GoogleSignin.configure 設定');
      console.error('配置檢查錯誤:', error);
    }

    console.log('診斷完成:', diagnosis);
    return diagnosis;

  } catch (error) {
    console.error('診斷過程發生錯誤:', error);
    diagnosis.errors.push(`診斷過程錯誤: ${error}`);
    return diagnosis;
  }
};

// 新增：測試登入流程（包含詳細錯誤處理）
export const testSignInWithDiagnosis = async () => {
  console.log('開始帶診斷的登入測試...');

  // 先進行診斷
  const diagnosis = await diagnoseGoogleAuth();
  console.log('診斷結果:', diagnosis);

  // 如果 Play Services 不可用，直接返回錯誤
  if (!diagnosis.playServices) {
    return {
      success: false,
      message: 'Play Services 不可用',
      diagnosis,
    };
  }

  // 嘗試登入
  try {
    console.log('嘗試登入...');
    const userInfo = await GoogleSignin.signIn();
    console.log('登入成功:', userInfo);
    
    // 嘗試取得權杖
    try {
      const tokens = await GoogleSignin.getTokens();
      console.log('權杖取得成功:', tokens.accessToken ? '是' : '否');
      
      return {
        success: true,
        message: '登入成功',
        user: userInfo,
        token: tokens.accessToken,
        diagnosis,
      };
    } catch (tokenError: any) {
      console.error('權杖取得失敗:', tokenError);
      return {
        success: false,
        message: `登入成功但權杖取得失敗: ${tokenError.message || tokenError}`,
        user: userInfo,
        token: null,
        diagnosis,
      };
    }
  } catch (error: any) {
    console.error('登入失敗:', error);
    
    let errorMessage = '未知錯誤';
    if (error.code !== undefined) {
      errorMessage = `錯誤代碼: ${error.code} - ${getErrorCodeExplanation(error.code)}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      user: null,
      token: null,
      diagnosis,
    };
  }
};

// 新增：快速修復建議
export const getQuickFixSuggestions = (errorCode?: number): string[] => {
  const suggestions = [];
  
  if (errorCode === 10) { // DEVELOPER_ERROR
    suggestions.push('🔧 快速修復步驟：');
    suggestions.push('1. 前往 Google Cloud Console');
    suggestions.push('2. 選擇您的專案');
    suggestions.push('3. 前往「API 和服務」>「OAuth 同意畫面」');
    suggestions.push('4. 確認應用程式狀態為「測試中」或「生產環境」');
    suggestions.push('5. 在「測試使用者」中新增您的 Google 帳戶');
    suggestions.push('6. 等待 24 小時讓設定生效');
    suggestions.push('7. 清除應用程式資料並重新測試');
  } else if (errorCode === 3) { // PLAY_SERVICES_NOT_AVAILABLE
    suggestions.push('🔧 快速修復步驟：');
    suggestions.push('1. 更新 Google Play Services');
    suggestions.push('2. 使用真機測試（不是模擬器）');
    suggestions.push('3. 重新啟動裝置');
  } else {
    suggestions.push('🔧 一般修復步驟：');
    suggestions.push('1. 清除應用程式資料');
    suggestions.push('2. 重新安裝應用程式');
    suggestions.push('3. 檢查網路連線');
    suggestions.push('4. 確認 Google 帳戶設定');
  }
  
  return suggestions;
}; 

// 新增：強制重新登入（清除所有快取）
export const forceSignIn = async () => {
  try {
    console.log('開始強制重新登入...');
    
    // 1. 先登出（清除任何現有狀態）
    try {
      await GoogleSignin.signOut();
      console.log('已登出');
    } catch (error) {
      console.log('登出時發生錯誤（可能是正常的）:', error);
    }
    
    // 2. 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 檢查 Play Services
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    if (!hasPlayServices) {
      throw new Error('Play Services 不可用');
    }
    
    // 4. 強制登入
    console.log('開始登入...');
    const userInfo = await GoogleSignin.signIn();
    console.log('登入成功:', userInfo);
    
    // 5. 取得權杖
    const tokens = await GoogleSignin.getTokens();
    console.log('權杖取得成功:', tokens.accessToken ? '是' : '否');
    
    return {
      success: true,
      message: '強制登入成功',
      user: userInfo,
      token: tokens.accessToken,
    };
  } catch (error: any) {
    console.error('強制登入失敗:', error);
    
    let errorMessage = '未知錯誤';
    if (error.code !== undefined) {
      errorMessage = `錯誤代碼: ${error.code} - ${getErrorCodeExplanation(error.code)}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      user: null,
      token: null,
    };
  }
};

// 新增：檢查 OAuth 同意畫面狀態
export const checkOAuthConsentScreen = async () => {
  try {
    // 嘗試登入，如果失敗會顯示具體錯誤
    const result = await forceSignIn();
    
    if (result.success) {
      return {
        status: 'success',
        message: 'OAuth 同意畫面設定正確',
        details: result,
      };
    } else {
      // 分析錯誤訊息
      let oauthStatus = 'unknown';
      let suggestions: string[] = [];
      
      if (result.message.includes('DEVELOPER_ERROR')) {
        oauthStatus = 'developer_error';
        suggestions = [
          '1. 確認 OAuth 同意畫面已設定',
          '2. 確認您的 Google 帳戶已加入測試使用者',
          '3. 確認應用程式狀態為「測試中」',
          '4. 清除應用程式資料並重試',
        ];
      } else if (result.message.includes('SIGN_IN_CANCELLED')) {
        oauthStatus = 'user_cancelled';
        suggestions = [
          '使用者取消登入 - 請重新嘗試',
          '確保選擇正確的 Google 帳戶',
        ];
      } else if (result.message.includes('NETWORK_ERROR')) {
        oauthStatus = 'network_error';
        suggestions = [
          '網路連線問題',
          '請檢查網路設定',
          '嘗試使用不同的網路',
        ];
      }
      
      return {
        status: 'error',
        oauthStatus,
        message: result.message,
        suggestions,
        details: result,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      oauthStatus: 'unknown',
      message: `檢查失敗: ${error}`,
      suggestions: ['請檢查網路連線和應用程式設定'],
    };
  }
}; 