import * as Crypto from 'expo-crypto';
import { Reminder } from '../../domain/entities/Reminder';
import { ReminderRepository } from '../../domain/repositories/ReminderRepository';
import { LocalStorageDataSource } from '../datasources/LocalStorageDataSource';
import { isToday, isFuture, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export class ReminderRepositoryImpl implements ReminderRepository {
  constructor(private dataSource: LocalStorageDataSource) {}

  async getAll(): Promise<Reminder[]> {
    return this.dataSource.getReminders();
  }

  async getById(id: string): Promise<Reminder | null> {
    const reminders = await this.dataSource.getReminders();
    return reminders.find((r) => r.id === id) || null;
  }

  async create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    const reminders = await this.dataSource.getReminders();
    const now = new Date();
    const newReminder: Reminder = {
      ...reminder,
      id: Crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    reminders.push(newReminder);
    await this.dataSource.saveReminders(reminders);
    return newReminder;
  }

  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const reminders = await this.dataSource.getReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    
    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date(),
    };
    await this.dataSource.saveReminders(reminders);
    return reminders[index];
  }

  async delete(id: string): Promise<void> {
    const reminders = await this.dataSource.getReminders();
    const filtered = reminders.filter((r) => r.id !== id);
    await this.dataSource.saveReminders(filtered);
  }

  async getByDate(date: Date): Promise<Reminder[]> {
    const reminders = await this.dataSource.getReminders();
    return reminders.filter((r) =>
      isWithinInterval(r.date, {
        start: startOfDay(date),
        end: endOfDay(date),
      })
    );
  }

  async getUpcoming(): Promise<Reminder[]> {
    const reminders = await this.dataSource.getReminders();
    return reminders
      .filter((r) => !r.isCompleted && (isToday(r.date) || isFuture(r.date)))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async toggleComplete(id: string): Promise<Reminder> {
    const reminders = await this.dataSource.getReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    
    reminders[index] = {
      ...reminders[index],
      isCompleted: !reminders[index].isCompleted,
      updatedAt: new Date(),
    };
    await this.dataSource.saveReminders(reminders);
    return reminders[index];
  }
}
