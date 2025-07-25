import AsyncStorage from '@react-native-async-storage/async-storage';

// 儲存鍵值
const SPREADSHEET_STORAGE_KEY = '@FanBookkeeping_spreadsheets';

// 用戶試算表資料介面
export interface UserSpreadsheet {
  userId: string;
  userEmail: string;
  userName: string;
  spreadsheetId: string;
  spreadsheetName: string;
  createdAt: string;
  lastUsed: string;
}

// 所有用戶試算表資料
interface SpreadsheetStorage {
  users: UserSpreadsheet[];
}

// 載入所有用戶的試算表資料
export const loadUserSpreadsheets = async (): Promise<UserSpreadsheet[]> => {
  try {
    const stored = await AsyncStorage.getItem(SPREADSHEET_STORAGE_KEY);
    if (stored) {
      const data: SpreadsheetStorage = JSON.parse(stored);
      return data.users || [];
    }
    return [];
  } catch (error) {
    console.error('載入用戶試算表資料失敗:', error);
    return [];
  }
};

// 儲存用戶試算表資料
export const saveUserSpreadsheets = async (users: UserSpreadsheet[]): Promise<void> => {
  try {
    const data: SpreadsheetStorage = { users };
    await AsyncStorage.setItem(SPREADSHEET_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('儲存用戶試算表資料失敗:', error);
    throw error;
  }
};

// 取得特定用戶的試算表 ID
export const getUserSpreadsheetId = async (userId: string): Promise<string | null> => {
  try {
    const users = await loadUserSpreadsheets();
    const user = users.find(u => u.userId === userId);
    return user ? user.spreadsheetId : null;
  } catch (error) {
    console.error('取得用戶試算表 ID 失敗:', error);
    return null;
  }
};

// 儲存用戶的試算表 ID
export const saveUserSpreadsheetId = async (
  userId: string,
  userEmail: string,
  userName: string,
  spreadsheetId: string,
  spreadsheetName: string = '產品掃描記錄'
): Promise<void> => {
  try {
    const users = await loadUserSpreadsheets();
    const now = new Date().toISOString();
    
    // 檢查是否已存在該用戶的記錄
    const existingUserIndex = users.findIndex(u => u.userId === userId);
    
    if (existingUserIndex >= 0) {
      // 更新現有用戶的試算表資料
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        spreadsheetId,
        spreadsheetName,
        lastUsed: now,
      };
    } else {
      // 新增新用戶的試算表資料
      const newUser: UserSpreadsheet = {
        userId,
        userEmail,
        userName,
        spreadsheetId,
        spreadsheetName,
        createdAt: now,
        lastUsed: now,
      };
      users.push(newUser);
    }
    
    await saveUserSpreadsheets(users);
  } catch (error) {
    console.error('儲存用戶試算表 ID 失敗:', error);
    throw error;
  }
};

// 刪除用戶的試算表資料
export const deleteUserSpreadsheet = async (userId: string): Promise<void> => {
  try {
    const users = await loadUserSpreadsheets();
    const filteredUsers = users.filter(u => u.userId !== userId);
    await saveUserSpreadsheets(filteredUsers);
  } catch (error) {
    console.error('刪除用戶試算表資料失敗:', error);
    throw error;
  }
};

// 取得用戶的試算表資訊
export const getUserSpreadsheetInfo = async (userId: string): Promise<UserSpreadsheet | null> => {
  try {
    const users = await loadUserSpreadsheets();
    return users.find(u => u.userId === userId) || null;
  } catch (error) {
    console.error('取得用戶試算表資訊失敗:', error);
    return null;
  }
};

// 更新用戶試算表的最後使用時間
export const updateUserSpreadsheetLastUsed = async (userId: string): Promise<void> => {
  try {
    const users = await loadUserSpreadsheets();
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex >= 0) {
      users[userIndex].lastUsed = new Date().toISOString();
      await saveUserSpreadsheets(users);
    }
  } catch (error) {
    console.error('更新用戶試算表最後使用時間失敗:', error);
  }
};

// 清除所有試算表資料（用於測試或重置）
export const clearAllSpreadsheetData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SPREADSHEET_STORAGE_KEY);
  } catch (error) {
    console.error('清除所有試算表資料失敗:', error);
    throw error;
  }
}; 