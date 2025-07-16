import { Category } from '../types';

export const defaultCategories: Category[] = [
  // 支出分類
  { id: '1', name: '飲食', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
  { id: '2', name: '交通', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: '3', name: '購物', icon: '🛍️', color: '#45B7D1', type: 'expense' },
  { id: '4', name: '娛樂', icon: '🎮', color: '#96CEB4', type: 'expense' },
  { id: '5', name: '醫療', icon: '💊', color: '#FFEAA7', type: 'expense' },
  { id: '6', name: '教育', icon: '📚', color: '#DDA0DD', type: 'expense' },
  { id: '7', name: '住房', icon: '🏠', color: '#98D8C8', type: 'expense' },
  { id: '8', name: '其他', icon: '📝', color: '#F7DC6F', type: 'expense' },
  
  // 收入分類
  { id: '9', name: '薪資', icon: '💰', color: '#2ECC71', type: 'income' },
  { id: '10', name: '投資', icon: '📈', color: '#3498DB', type: 'income' },
  { id: '11', name: '獎金', icon: '🎁', color: '#E74C3C', type: 'income' },
  { id: '12', name: '其他收入', icon: '💵', color: '#9B59B6', type: 'income' },
];

export const getCategoriesByType = (type: 'income' | 'expense'): Category[] => {
  return defaultCategories.filter(category => category.type === type);
}; 