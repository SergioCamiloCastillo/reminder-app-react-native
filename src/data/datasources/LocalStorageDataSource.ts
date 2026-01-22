import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, ReminderTemplate } from '../../domain/entities/Reminder';

const REMINDERS_KEY = '@reminders';
const TEMPLATES_KEY = '@templates';

export class LocalStorageDataSource {
  async getReminders(): Promise<Reminder[]> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_KEY);
      if (!data) return [];
      const reminders = JSON.parse(data);
      return reminders.map((r: any) => ({
        ...r,
        date: new Date(r.date),
        time: new Date(r.time),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  async getTemplates(): Promise<ReminderTemplate[]> {
    try {
      const data = await AsyncStorage.getItem(TEMPLATES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async saveTemplates(templates: ReminderTemplate[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }
}
