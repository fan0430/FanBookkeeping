import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ledger, Transaction } from '../types';

interface AppSettings {
  defaultScreen: 'mainSelect' | 'ledgerSelect' | 'posSystem';
}

interface DataContextType {
  ledgers: Ledger[];
  currentLedger: Ledger | null;
  appSettings: AppSettings;
  setCurrentLedger: (ledger: Ledger | null) => void;
  addLedger: (name: string, note?: string) => Promise<void>;
  updateLedger: (ledgerId: string, updates: { name?: string; note?: string }) => Promise<void>;
  deleteLedger: (ledgerId: string) => Promise<void>;
  moveLedger: (ledgerId: string, action: 'first' | 'prev' | 'next' | 'last') => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  loadLedgers: () => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadAppSettings: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = '@FanBookkeeping_ledgers';
const SETTINGS_KEY = '@FanBookkeeping_settings';

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    // defaultScreen: 'ledgerSelect'
    // defaultScreen: 'posSystem'
    defaultScreen: 'mainSelect'
  });

  // 載入帳本資料
  const loadLedgers = async () => {
    try {
      const storedLedgers = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLedgers) {
        const parsedLedgers = JSON.parse(storedLedgers);
        // 將日期字串轉換回 Date 物件
        const ledgersWithDates = parsedLedgers.map((ledger: any) => ({
          ...ledger,
          createdAt: new Date(ledger.createdAt),
          transactions: ledger.transactions.map((transaction: any) => ({
            ...transaction,
            date: new Date(transaction.date),
          })),
        }));
        setLedgers(ledgersWithDates);
      } else {
        // 如果沒有儲存的資料，創建預設帳本
        const defaultLedger: Ledger = {
          id: Date.now().toString(),
          name: '我的記帳本',
          transactions: [],
          createdAt: new Date(),
        };
        setLedgers([defaultLedger]);
        await saveLedgers([defaultLedger]);
      }
    } catch (error) {
      console.error('載入帳本失敗:', error);
    }
  };

  // 儲存帳本資料到 AsyncStorage
  const saveLedgers = async (ledgersToSave: Ledger[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ledgersToSave));
    } catch (error) {
      console.error('儲存帳本失敗:', error);
    }
  };

  // 新增帳本
  const addLedger = async (name: string, note?: string) => {
    const newLedger: Ledger = {
      id: Date.now().toString(),
      name: name.trim(),
      transactions: [],
      createdAt: new Date(),
      note: note?.trim() || undefined,
    };

    const updatedLedgers = [newLedger, ...ledgers];
    setLedgers(updatedLedgers);
    await saveLedgers(updatedLedgers);
  };

  // 更新帳本
  const updateLedger = async (ledgerId: string, updates: { name?: string; note?: string }) => {
    const updatedLedgers = ledgers.map(ledger => {
      if (ledger.id === ledgerId) {
        return {
          ...ledger,
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.note !== undefined && { note: updates.note.trim() || undefined }),
        };
      }
      return ledger;
    });
    
    setLedgers(updatedLedgers);
    await saveLedgers(updatedLedgers);
    
    // 如果更新的是當前帳本，也要更新 currentLedger
    if (currentLedger?.id === ledgerId) {
      const updatedCurrentLedger = updatedLedgers.find(ledger => ledger.id === ledgerId);
      if (updatedCurrentLedger) {
        setCurrentLedger(updatedCurrentLedger);
      }
    }
  };

  // 刪除帳本
  const deleteLedger = async (ledgerId: string) => {
    const updatedLedgers = ledgers.filter(ledger => ledger.id !== ledgerId);
    setLedgers(updatedLedgers);
    await saveLedgers(updatedLedgers);
    
    if (currentLedger?.id === ledgerId) {
      setCurrentLedger(null);
    }
  };

  // 移動帳本
  const moveLedger = async (ledgerId: string, action: 'first' | 'prev' | 'next' | 'last') => {
    const currentIndex = ledgers.findIndex(ledger => ledger.id === ledgerId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    
    switch (action) {
      case 'first':
        newIndex = 0;
        break;
      case 'prev':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'next':
        newIndex = Math.min(ledgers.length - 1, currentIndex + 1);
        break;
      case 'last':
        newIndex = ledgers.length - 1;
        break;
    }

    if (newIndex === currentIndex) return;

    const updatedLedgers = [...ledgers];
    const [movedLedger] = updatedLedgers.splice(currentIndex, 1);
    updatedLedgers.splice(newIndex, 0, movedLedger);
    
    setLedgers(updatedLedgers);
    await saveLedgers(updatedLedgers);
  };

  // 新增交易記錄
  const addTransaction = async (transaction: Transaction) => {
    if (!currentLedger) return;

    const updatedLedger = {
      ...currentLedger,
      transactions: [transaction, ...currentLedger.transactions],
    };
    
    const updatedLedgers = ledgers.map(ledger =>
      ledger.id === currentLedger.id ? updatedLedger : ledger
    );
    
    setLedgers(updatedLedgers);
    setCurrentLedger(updatedLedger);
    await saveLedgers(updatedLedgers);
  };

  // 刪除交易記錄
  const deleteTransaction = async (transactionId: string) => {
    if (!currentLedger) return;

    const updatedLedger = {
      ...currentLedger,
      transactions: currentLedger.transactions.filter(t => t.id !== transactionId),
    };
    
    const updatedLedgers = ledgers.map(ledger =>
      ledger.id === currentLedger.id ? updatedLedger : ledger
    );
    
    setLedgers(updatedLedgers);
    setCurrentLedger(updatedLedger);
    await saveLedgers(updatedLedgers);
  };

  // 載入應用程式設定
  const loadAppSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setAppSettings(parsedSettings);
      }
    } catch (error) {
      console.error('載入設定失敗:', error);
    }
  };

  // 更新應用程式設定
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...appSettings, ...settings };
      setAppSettings(updatedSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('更新設定失敗:', error);
    }
  };

  // 初始化載入資料
  useEffect(() => {
    loadLedgers();
    loadAppSettings();
  }, []);

  const value: DataContextType = {
    ledgers,
    currentLedger,
    appSettings,
    setCurrentLedger,
    addLedger,
    updateLedger,
    deleteLedger,
    moveLedger,
    addTransaction,
    deleteTransaction,
    loadLedgers,
    updateAppSettings,
    loadAppSettings,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 