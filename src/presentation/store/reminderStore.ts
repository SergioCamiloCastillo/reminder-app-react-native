import { create } from 'zustand';
import { Category } from '../../domain/entities/Reminder';

interface ReminderUIState {
  selectedCategory: Category | 'all';
  isAddModalVisible: boolean;
  selectedReminderId: string | null;
  
  setSelectedCategory: (category: Category | 'all') => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  setSelectedReminder: (id: string | null) => void;
}

export const useReminderStore = create<ReminderUIState>((set) => ({
  selectedCategory: 'all',
  isAddModalVisible: false,
  selectedReminderId: null,

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  openAddModal: () => set({ isAddModalVisible: true }),
  closeAddModal: () => set({ isAddModalVisible: false }),
  setSelectedReminder: (id) => set({ selectedReminderId: id }),
}));
