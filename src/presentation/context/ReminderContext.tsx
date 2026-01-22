import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder, ReminderTemplate, Category, RepeatDay } from '../../domain/entities/Reminder';
import { ReminderRepositoryImpl } from '../../data/repositories/ReminderRepositoryImpl';
import { TemplateRepositoryImpl } from '../../data/repositories/TemplateRepositoryImpl';
import { LocalStorageDataSource } from '../../data/datasources/LocalStorageDataSource';
import { scheduleReminderNotification, cancelReminderNotification } from '../../core/utils/notifications';

interface ReminderContextType {
  reminders: Reminder[];
  templates: ReminderTemplate[];
  loading: boolean;
  selectedCategory: Category | 'all';
  setSelectedCategory: (category: Category | 'all') => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
  getUpcomingReminders: () => Reminder[];
  getTodayReminders: () => Reminder[];
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

const dataSource = new LocalStorageDataSource();
const reminderRepository = new ReminderRepositoryImpl(dataSource);
const templateRepository = new TemplateRepositoryImpl(dataSource);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedReminders, loadedTemplates] = await Promise.all([
        reminderRepository.getAll(),
        templateRepository.getAll(),
      ]);
      setReminders(loadedReminders);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newReminder = await reminderRepository.create(reminderData);
      const notificationId = await scheduleReminderNotification(newReminder);
      await reminderRepository.update(newReminder.id, { notificationId });
      await loadData();
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (reminder?.notificationId) {
        await cancelReminderNotification(reminder.notificationId);
      }
      await reminderRepository.update(id, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (reminder?.notificationId) {
        await cancelReminderNotification(reminder.notificationId);
      }
      await reminderRepository.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      await reminderRepository.toggleComplete(id);
      await loadData();
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const refreshReminders = async () => {
    await loadData();
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    return reminders
      .filter(r => !r.isCompleted && new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getTodayReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reminders.filter(r => {
      const reminderDate = new Date(r.date);
      return reminderDate >= today && reminderDate < tomorrow;
    });
  };

  const filteredReminders = selectedCategory === 'all' 
    ? reminders 
    : reminders.filter(r => r.category === selectedCategory);

  return (
    <ReminderContext.Provider
      value={{
        reminders: filteredReminders,
        templates,
        loading,
        selectedCategory,
        setSelectedCategory,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleComplete,
        refreshReminders,
        getUpcomingReminders,
        getTodayReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}
