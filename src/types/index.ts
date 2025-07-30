export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
}

export interface Ledger {
  id: string;
  name: string;
  transactions: Transaction[];
  createdAt: Date;
  note?: string; // 可選的備註欄位
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface Product {
  id: string;
  category: string;
  categoryName: string;
  productCode: string;
  productName: string;
  productionDate: string;
  formattedDate: string;
  barcode: string;
}

export interface ParsedBarcode {
  merchantCode?: string;
  merchantName?: string;
  category: string;
  categoryName: string;
  productCode: string;
  productName: string;
  productionDate: string;
  formattedDate: string;
  isValid: boolean;
  error?: string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  accessToken?: string;
}

export interface GoogleAuthState {
  isSignedIn: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
}

export interface Merchant {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
}

export interface ProductWithMerchant extends Product {
  merchantId: string;
  merchantName: string;
} 