import axios from 'axios';
import { ParsedBarcode } from '../types';

// 試算表資訊介面
export interface SpreadsheetInfo {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
    timeZone?: string;
    autoRecalc?: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
      sheetType: string;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
  spreadsheetUrl: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface GoogleSheetsService {
  createSpreadsheet: (title: string) => Promise<string>;
  appendRow: (spreadsheetId: string, sheetName: string, data: any[]) => Promise<void>;
  appendRowToNextEmptyRow: (spreadsheetId: string, sheetName: string, data: any[]) => Promise<void>;
  readSheet: (spreadsheetId: string, sheetName: string) => Promise<any[]>;
  updateRow: (spreadsheetId: string, sheetName: string, rowIndex: number, data: any[]) => Promise<void>;
  deleteRow: (spreadsheetId: string, sheetName: string, rowIndex: number) => Promise<void>;
  renameSheet: (spreadsheetId: string, newName: string) => Promise<void>;
  listSpreadsheets: () => Promise<SpreadsheetInfo[]>;
  getSpreadsheetInfo: (spreadsheetId: string) => Promise<SpreadsheetInfo>;
  setColumnFormat: (spreadsheetId: string, sheetName: string, column: string, format: string) => Promise<void>;
}

class GoogleSheetsServiceImpl implements GoogleSheetsService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // 判斷是否為 release 模式
  private isReleaseMode(): boolean {
    return !__DEV__;
  }

  private getHeaders() {
    const baseHeaders = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    // 在 release 模式下添加額外的 header
    if (this.isReleaseMode()) {
      return {
        ...baseHeaders,
        'Accept': 'application/json',
        'User-Agent': 'FanBookkeeping/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
    }

    return baseHeaders;
  }

  // 建立新的試算表
  async createSpreadsheet(title: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          properties: {
            title: title,
          },
          sheets: [
            {
              properties: {
                title: '產品資料',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10,
                },
              },
            },
          ],
        },
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );

      return response.data.spreadsheetId;
    } catch (error) {
      console.error('建立試算表錯誤:', error);
      throw new Error('無法建立試算表');
    }
  }

  // 新增資料列
  async appendRow(spreadsheetId: string, sheetName: string, data: any[]): Promise<void> {
    try {
      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:append`,
        {
          values: [data],
        },
        {
          headers: this.getHeaders(),
          params: {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
          },
          timeout: 30000, // 30 秒超時
        }
      );
    } catch (error) {
      console.error('新增資料列錯誤:', error);
      throw new Error('無法新增資料列');
    }
  }

  // 新增資料到下一列空行，確保從 A 欄開始
  async appendRowToNextEmptyRow(spreadsheetId: string, sheetName: string, data: any[]): Promise<void> {
    try {
      // 先讀取試算表以獲取最後一列的位置
      const existingData = await this.readSheet(spreadsheetId, sheetName);
      const nextRowIndex = existingData.length + 1;
      
      // 使用精確的範圍來新增資料到下一列
      await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A${nextRowIndex}:${String.fromCharCode(65 + data.length - 1)}${nextRowIndex}`,
        {
          values: [data],
        },
        {
          headers: this.getHeaders(),
          params: {
            valueInputOption: 'USER_ENTERED',
          },
          timeout: 30000, // 30 秒超時
        }
      );
    } catch (error) {
      console.error('新增資料列錯誤:', error);
      throw new Error('無法新增資料列');
    }
  }

  // 讀取試算表資料
  async readSheet(spreadsheetId: string, sheetName: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );

      return response.data.values || [];
    } catch (error) {
      console.error('讀取試算表錯誤:', error);
      throw new Error('無法讀取試算表');
    }
  }

  // 更新資料列
  async updateRow(spreadsheetId: string, sheetName: string, rowIndex: number, data: any[]): Promise<void> {
    try {
      await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A${rowIndex}:Z${rowIndex}`,
        {
          values: [data],
        },
        {
          headers: this.getHeaders(),
          params: {
            valueInputOption: 'USER_ENTERED',
          },
          timeout: 30000, // 30 秒超時
        }
      );
    } catch (error) {
      console.error('更新資料列錯誤:', error);
      throw new Error('無法更新資料列');
    }
  }

  // 刪除資料列
  async deleteRow(spreadsheetId: string, sheetName: string, rowIndex: number): Promise<void> {
    try {
      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // 假設是第一個工作表
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );
    } catch (error) {
      console.error('刪除資料列錯誤:', error);
      throw new Error('無法刪除資料列');
    }
  }

  // 重新命名工作表
  async renameSheet(spreadsheetId: string, newName: string): Promise<void> {
    try {
      // 先獲取試算表資訊來取得正確的 sheetId
      const spreadsheetInfo = await this.getSpreadsheetInfo(spreadsheetId);
      const firstSheet = spreadsheetInfo.sheets[0];
      
      if (!firstSheet) {
        throw new Error('找不到工作表');
      }

      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: firstSheet.properties.sheetId,
                  title: newName,
                },
                fields: 'title',
              },
            },
          ],
        },
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );

      console.log('重新命名工作表成功:', response.data);
    } catch (error) {
      console.error('重新命名工作表錯誤:', error);
      throw new Error('重新命名工作表失敗');
    }
  }

  // 將掃描的產品資料新增到試算表
  async addProductToSheet(spreadsheetId: string, product: ParsedBarcode, amount?: string): Promise<void> {
    if (!product.isValid) {
      throw new Error('產品資料無效');
    }

    // 取得台灣時間 (UTC+8) - 使用 Date 物件而不是字串
    const now = new Date();
    const taiwanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8

    // 將金額轉換為數字格式，如果無法轉換則保持為空字串
    const numericAmount = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : '';

    // 將生產日期轉換為 Date 物件
    const productionDateObj = product.productionDate ? 
      new Date(
        parseInt(product.productionDate.substring(0, 4)),
        parseInt(product.productionDate.substring(4, 6)) - 1,
        parseInt(product.productionDate.substring(6, 8))
      ) : null;

    const rowData = [
      taiwanTime, // 掃描時間 (Date 物件，Google Sheets 會自動識別為日期時間)
      product.category,
      product.categoryName,
      `'${product.productCode}`, // 產品代碼：加上單引號強制文字格式
      product.productName,
      productionDateObj, // 生產日期 (Date 物件)
      product.formattedDate, // 格式化日期 (保持字串格式用於顯示)
      numericAmount, // 販售價格 (數字格式)
    ];

    await this.appendRowToNextEmptyRow(spreadsheetId, '產品資料', rowData);
  }

  // 建立產品資料試算表
  async createProductSpreadsheet(): Promise<string> {
    const spreadsheetId = await this.createSpreadsheet('POS系統產品資料');

    // 新增標題列
    const headers = [
      '掃描時間',
      '產品類別代碼',
      '產品類別名稱',
      '產品代碼',
      '產品名稱',
      '生產日期',
      '格式化日期',
      '販售價格',
    ];

    await this.appendRow(spreadsheetId, '產品資料', headers);

    // 設定時間欄位的日期時間格式
    await this.setColumnFormat(spreadsheetId, '產品資料', 'A', 'DATETIME');
    
    // 設定產品類別代碼欄位為文字格式
    await this.setColumnFormat(spreadsheetId, '產品資料', 'B', 'TEXT');
    
    // 設定產品代碼欄位為文字格式（確保 001 不會變成 1）
    await this.setColumnFormat(spreadsheetId, '產品資料', 'D', 'TEXT');
    
    // 設定生產日期欄位的日期格式
    await this.setColumnFormat(spreadsheetId, '產品資料', 'F', 'DATE');
    
    // 設定金額欄位的數字格式
    await this.setColumnFormat(spreadsheetId, '產品資料', 'H', 'NUMBER');

    return spreadsheetId;
  }

  // 列出用戶的所有試算表
  async listSpreadsheets(): Promise<SpreadsheetInfo[]> {
    try {
      // 使用 Google Drive API 來列出試算表
      const response = await axios.get(
        'https://www.googleapis.com/drive/v3/files',
        {
          headers: this.getHeaders(),
          params: {
            q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            fields: 'files(id,name,createdTime,modifiedTime,webViewLink)',
            orderBy: 'modifiedTime desc',
            pageSize: 50
          },
          timeout: 30000, // 30 秒超時
        }
      );

      // 轉換為 SpreadsheetInfo 格式
      const spreadsheets: SpreadsheetInfo[] = response.data.files.map((file: any) => ({
        spreadsheetId: file.id,
        properties: {
          title: file.name,
        },
        sheets: [], // 需要額外呼叫 API 來取得工作表資訊
        spreadsheetUrl: file.webViewLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
      }));

      return spreadsheets;
    } catch (error: any) {
      console.error('列出試算表錯誤:', error);
      
      // 提供更詳細的錯誤資訊
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403) {
          if (data?.error?.message?.includes('insufficient')) {
            throw new Error('權限不足：請確保已啟用 Google Drive API 並授權應用程式存取');
          } else if (data?.error?.message?.includes('quota')) {
            throw new Error('API 配額已用完：請稍後再試');
          } else {
            throw new Error(`權限錯誤 (403)：${data?.error?.message || '請檢查 Google Cloud Console 設定'}`);
          }
        } else if (status === 401) {
          throw new Error('認證失敗：請重新登入 Google 帳戶');
        } else {
          throw new Error(`API 錯誤 (${status})：${data?.error?.message || '請稍後再試'}`);
        }
      } else if (error.request) {
        throw new Error('網路連線錯誤：請檢查網路連線');
      } else {
        throw new Error(`未知錯誤：${error.message}`);
      }
    }
  }

  // 取得特定試算表的詳細資訊
  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetInfo> {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );

      return response.data;
    } catch (error) {
      console.error('取得試算表資訊錯誤:', error);
      throw new Error('無法取得試算表資訊');
    }
  }

  // 設定欄位格式
  async setColumnFormat(spreadsheetId: string, sheetName: string, column: string, format: string): Promise<void> {
    try {
      // 先獲取試算表資訊來取得正確的 sheetId
      const spreadsheetInfo = await this.getSpreadsheetInfo(spreadsheetId);
      const sheet = spreadsheetInfo.sheets.find(s => s.properties.title === sheetName);
      
      if (!sheet) {
        throw new Error(`找不到工作表：${sheetName}`);
      }

      const sheetId = sheet.properties.sheetId;
      const columnIndex = column.charCodeAt(0) - 65; // A=0, B=1, C=2, ...

      let numberFormat;
      switch (format.toUpperCase()) {
        case 'NUMBER':
          numberFormat = { type: 'NUMBER', pattern: '#,##0.00' };
          break;
        case 'CURRENCY':
          numberFormat = { type: 'CURRENCY', pattern: '"$"#,##0.00' };
          break;
        case 'PERCENT':
          numberFormat = { type: 'PERCENT', pattern: '0.00%' };
          break;
        case 'DATE':
          numberFormat = { type: 'DATE', pattern: 'yyyy-mm-dd' };
          break;
        case 'DATETIME':
          numberFormat = { type: 'DATE_TIME', pattern: 'yyyy-mm-dd hh:mm:ss' };
          break;
        case 'TEXT':
          numberFormat = { type: 'TEXT', pattern: '@' }; // 使用 @ 模式強制文字格式
          break;
        default:
          numberFormat = { type: 'TEXT', pattern: '@' };
      }

      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startColumnIndex: columnIndex,
                  endColumnIndex: columnIndex + 1,
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: numberFormat,
                  },
                },
                fields: 'userEnteredFormat.numberFormat',
              },
            },
          ],
        },
        {
          headers: this.getHeaders(),
          timeout: 30000, // 30 秒超時
        }
      );
    } catch (error) {
      console.error('設定欄位格式錯誤:', error);
      // 不拋出錯誤，因為格式設定不是關鍵功能
    }
  }
}

export const googleSheetsService = new GoogleSheetsServiceImpl(); 