import axios from 'axios';
import { ParsedBarcode } from '../types';

interface GoogleSheetsService {
  createSpreadsheet: (title: string) => Promise<string>;
  appendRow: (spreadsheetId: string, sheetName: string, data: any[]) => Promise<void>;
  readSheet: (spreadsheetId: string, sheetName: string) => Promise<any[]>;
  updateRow: (spreadsheetId: string, sheetName: string, rowIndex: number, data: any[]) => Promise<void>;
  deleteRow: (spreadsheetId: string, sheetName: string, rowIndex: number) => Promise<void>;
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
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z:append`,
        {
          values: [data],
        },
        {
          headers: this.getHeaders(),
          params: {
            valueInputOption: 'RAW',
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
            valueInputOption: 'RAW',
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

  // 將掃描的產品資料新增到試算表
  async addProductToSheet(spreadsheetId: string, product: ParsedBarcode): Promise<void> {
    if (!product.isValid) {
      throw new Error('產品資料無效');
    }

    const rowData = [
      new Date().toISOString(), // 掃描時間
      product.category,
      product.categoryName,
      product.productCode,
      product.productName,
      product.productionDate,
      product.formattedDate,
    ];

    await this.appendRow(spreadsheetId, '產品資料', rowData);
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
    ];
    
    await this.appendRow(spreadsheetId, '產品資料', headers);
    
    return spreadsheetId;
  }
}

export const googleSheetsService = new GoogleSheetsServiceImpl(); 