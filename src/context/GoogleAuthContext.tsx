import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleUser, GoogleAuthState } from '../types';

interface GoogleAuthContextType {
  authState: GoogleAuthState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  checkSignInStatus: () => Promise<boolean>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isSignedIn: false,
    user: null,
    accessToken: null,
  });

  // 檢查登入狀態
  const checkSignInStatus = async (): Promise<boolean> => {
    try {
      // 使用 getCurrentUser 來檢查是否已登入
      const userInfo = await GoogleSignin.getCurrentUser();
      if (userInfo) {
        const tokens = await GoogleSignin.getTokens();
        
        setAuthState({
          isSignedIn: true,
          user: {
            id: userInfo.user.id || '',
            name: userInfo.user.name || '',
            email: userInfo.user.email || '',
            photo: userInfo.user.photo || undefined,
            accessToken: tokens.accessToken,
          },
          accessToken: tokens.accessToken,
        });
        return true;
      } else {
        setAuthState({
          isSignedIn: false,
          user: null,
          accessToken: null,
        });
        return false;
      }
    } catch (error) {
      console.error('檢查登入狀態時發生錯誤:', error);
      setAuthState({
        isSignedIn: false,
        user: null,
        accessToken: null,
      });
      return false;
    }
  };

  // 登入
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (userInfo.type === 'success') {
        setAuthState({
          isSignedIn: true,
          user: {
            id: userInfo.data.user.id || '',
            name: userInfo.data.user.name || '',
            email: userInfo.data.user.email || '',
            photo: userInfo.data.user.photo || undefined,
            accessToken: tokens.accessToken,
          },
          accessToken: tokens.accessToken,
        });
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('使用者取消登入');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('登入進行中');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play Services 不可用');
      } else {
        console.error('登入錯誤:', error);
      }
      throw error;
    }
  };

  // 登出
  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setAuthState({
        isSignedIn: false,
        user: null,
        accessToken: null,
      });
    } catch (error) {
      console.error('登出錯誤:', error);
      throw error;
    }
  };

  // 取得存取權杖
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('取得存取權杖錯誤:', error);
      return null;
    }
  };

  // 初始化時檢查登入狀態
  useEffect(() => {
    checkSignInStatus();
  }, []);

  const value: GoogleAuthContextType = {
    authState,
    signIn,
    signOut,
    getAccessToken,
    checkSignInStatus,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}; 