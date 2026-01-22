export const Colors = {
  primary: '#2DD4BF',
  primaryLight: '#5EEAD4',
  primaryDark: '#14B8A6',
  
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  
  categoryPersonal: '#3B82F6',
  categoryWork: '#8B5CF6',
  categoryHealth: '#22C55E',
  categoryOther: '#F59E0B',
};

export const CategoryColors: Record<string, string> = {
  personal: Colors.categoryPersonal,
  work: Colors.categoryWork,
  health: Colors.categoryHealth,
  other: Colors.categoryOther,
};
