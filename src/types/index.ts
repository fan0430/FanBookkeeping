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
  category: string;
  categoryName: string;
  productCode: string;
  productName: string;
  productionDate: string;
  formattedDate: string;
  isValid: boolean;
  error?: string;
} 