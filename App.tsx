/**
 * 簡化版記帳應用程式
 * 避免使用 React Navigation 來解決 gesture handler 問題
 */

import React, { useState } from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { DataProvider } from './src/context/DataContext';

// 導入頁面
import LedgerSelectScreen from './src/screens/LedgerSelectScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import StatsScreen from './src/screens/StatsScreen';

type ScreenType = 'ledgerSelect' | 'home' | 'addTransaction' | 'stats';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('ledgerSelect');

  const navigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    const navigationProps = {
      navigation: { navigate },
      route: { params: {} }
    };

    switch (currentScreen) {
      case 'ledgerSelect':
        return <LedgerSelectScreen {...navigationProps} />;
      case 'home':
        return <HomeScreen {...navigationProps} />;
      case 'addTransaction':
        return <AddTransactionScreen {...navigationProps} />;
      case 'stats':
        return <StatsScreen {...navigationProps} />;
      default:
        return <LedgerSelectScreen {...navigationProps} />;
    }
  };

  return (
    <DataProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        {renderScreen()}
      </SafeAreaView>
    </DataProvider>
  );
}

export default App;
