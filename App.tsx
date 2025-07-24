/**
 * 簡化版記帳應用程式
 * 避免使用 React Navigation 來解決 gesture handler 問題
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { DataProvider, useData } from './src/context/DataContext';

// 導入頁面
import MainSelectScreen from './src/screens/MainSelectScreen';
import LedgerSelectScreen from './src/screens/LedgerSelectScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import StatsScreen from './src/screens/StatsScreen';
import POSSystemScreen from './src/screens/POSSystemScreen';
import ProductManagementScreen from './src/screens/ProductManagementScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type ScreenType = 'mainSelect' | 'ledgerSelect' | 'home' | 'addTransaction' | 'stats' | 'posSystem' | 'productManagement' | 'settings';

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
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
