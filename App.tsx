/**
 * 簡化版記帳應用程式
 * 避免使用 React Navigation 來解決 gesture handler 問題
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { DataProvider, useData } from './src/context/DataContext';
import { GoogleAuthProvider } from './src/context/GoogleAuthContext';

// 導入頁面
import MainSelectScreen from './src/screens/MainSelectScreen';
import LedgerSelectScreen from './src/screens/LedgerSelectScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import StatsScreen from './src/screens/StatsScreen';
import POSSystemScreen from './src/screens/POSSystemScreen';
import ProductManagementScreen from './src/screens/ProductManagementScreen';
import MerchantManagementScreen from './src/screens/MerchantManagementScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type ScreenType = 'mainSelect' | 'ledgerSelect' | 'home' | 'addTransaction' | 'stats' | 'posSystem' | 'productManagement' | 'merchantManagement' | 'settings';

// 在 App 啟動時初始化 Google Sign-In
GoogleSignin.configure({
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ],
  webClientId: '191329007466-3ep6o34nim2ouqg4kukre3irekh16t3q.apps.googleusercontent.com',
  offlineAccess: true,
});

function AppContent(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('mainSelect');
  const { appSettings } = useData();

  const navigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  // 當設定載入後，使用預設頁面
  useEffect(() => {
    if (appSettings.defaultScreen) {
      setCurrentScreen(appSettings.defaultScreen);
    }
  }, [appSettings.defaultScreen]);

  const renderScreen = () => {
    const navigationProps = {
      navigation: { navigate },
      route: { params: {} }
    };

    switch (currentScreen) {
      case 'mainSelect':
        return <MainSelectScreen {...navigationProps} />;
      case 'ledgerSelect':
        return <LedgerSelectScreen {...navigationProps} />;
      case 'home':
        return <HomeScreen {...navigationProps} />;
      case 'addTransaction':
        return <AddTransactionScreen {...navigationProps} />;
      case 'stats':
        return <StatsScreen {...navigationProps} />;
      case 'posSystem':
        return <POSSystemScreen {...navigationProps} />;
      case 'productManagement':
        return <ProductManagementScreen {...navigationProps} />;
      case 'merchantManagement':
        return <MerchantManagementScreen {...navigationProps} />;
      case 'settings':
        return <SettingsScreen {...navigationProps} />;
      default:
        return <MainSelectScreen {...navigationProps} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderScreen()}
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <GoogleAuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </GoogleAuthProvider>
  );
}

export default App;
