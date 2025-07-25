import { Transaction } from '../types';
import { Platform } from 'react-native';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const calculateTotal = (transactions: Transaction[], type: 'income' | 'expense'): number => {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * 判斷當前是否為 release 模式
 * @returns {boolean} true 如果是 release 模式，false 如果是 debug 模式
 */
export const isReleaseMode = (): boolean => {
  return !__DEV__;
};

/**
 * 判斷當前是否為 debug 模式
 * @returns {boolean} true 如果是 debug 模式，false 如果是 release 模式
 */
export const isDebugMode = (): boolean => {
  return __DEV__;
};

/**
 * 取得當前環境資訊
 * @returns {object} 包含環境資訊的物件
 */
export const getEnvironmentInfo = () => {
  return {
    isDebug: __DEV__,
    isRelease: !__DEV__,
    platform: Platform.OS,
    version: Platform.Version,
    isSimulator: Platform.isTV,
  };
};

/**
 * 根據環境模式取得適當的 API 配置
 * @returns {object} API 配置物件
 */
export const getApiConfig = () => {
  const baseConfig = {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (isReleaseMode()) {
    return {
      ...baseConfig,
      headers: {
        ...baseConfig.headers,
        'Accept': 'application/json',
        'User-Agent': 'FanBookkeeping/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    };
  }

  return baseConfig;
};

/**
 * 記錄環境資訊到控制台
 */
export const logEnvironmentInfo = () => {
  const envInfo = getEnvironmentInfo();
  console.log('🌍 環境資訊:', {
    模式: envInfo.isDebug ? 'Debug' : 'Release',
    平台: envInfo.platform,
    版本: envInfo.version,
    模擬器: envInfo.isSimulator ? '是' : '否',
  });
}; 