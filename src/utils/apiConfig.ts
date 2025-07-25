import axios, { AxiosRequestConfig } from 'axios';

/**
 * 判斷當前是否為 release 模式
 */
export const isReleaseMode = (): boolean => {
  return !__DEV__;
};

/**
 * 判斷當前是否為 debug 模式
 */
export const isDebugMode = (): boolean => {
  return __DEV__;
};

/**
 * 取得基礎 API 配置
 */
export const getBaseApiConfig = (): AxiosRequestConfig => {
  return {
    timeout: 30000, // 30 秒超時
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

/**
 * 取得 Google API 專用的配置
 * @param accessToken Google 存取權杖
 */
export const getGoogleApiConfig = (accessToken: string): AxiosRequestConfig => {
  const baseConfig = getBaseApiConfig();
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 在 release 模式下添加額外的 header
  if (isReleaseMode()) {
    return {
      ...baseConfig,
      headers: {
        ...headers,
        'Accept': 'application/json',
        'User-Agent': 'FanBookkeeping/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
  }

  return {
    ...baseConfig,
    headers,
  };
};

/**
 * 建立配置化的 axios 實例
 * @param accessToken Google 存取權杖
 */
export const createGoogleApiClient = (accessToken: string) => {
  const config = getGoogleApiConfig(accessToken);
  
  const client = axios.create(config);
  
  // 添加請求攔截器
  client.interceptors.request.use(
    (config) => {
      console.log(`🌐 API 請求: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📱 模式: ${isReleaseMode() ? 'Release' : 'Debug'}`);
      return config;
    },
    (error) => {
      console.error('❌ 請求錯誤:', error);
      return Promise.reject(error);
    }
  );

  // 添加回應攔截器
  client.interceptors.response.use(
    (response) => {
      console.log(`✅ API 回應: ${response.status} ${response.statusText}`);
      return response;
    },
    (error) => {
      console.error('❌ 回應錯誤:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * 記錄當前環境資訊
 */
export const logApiEnvironmentInfo = () => {
  const envInfo = {
    mode: isReleaseMode() ? 'Release' : 'Debug',
    timeout: 30000,
    hasExtraHeaders: isReleaseMode(),
  };

  console.log('🔧 API 環境配置:', envInfo);
  
  if (isReleaseMode()) {
    console.log('📱 Release 模式已啟用額外 headers:');
    console.log('  - Accept: application/json');
    console.log('  - User-Agent: FanBookkeeping/1.0');
    console.log('  - Cache-Control: no-cache');
    console.log('  - Pragma: no-cache');
    console.log('  - X-Requested-With: XMLHttpRequest');
  }
};

/**
 * 測試 API 連線
 * @param accessToken Google 存取權杖
 */
export const testApiConnection = async (accessToken: string) => {
  try {
    const client = createGoogleApiClient(accessToken);
    
    // 測試 Google Sheets API
    const response = await client.get('https://sheets.googleapis.com/v4/spreadsheets');
    
    return {
      success: true,
      message: 'API 連線測試成功',
      status: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `API 連線測試失敗: ${error.message}`,
      status: error.response?.status,
    };
  }
}; 