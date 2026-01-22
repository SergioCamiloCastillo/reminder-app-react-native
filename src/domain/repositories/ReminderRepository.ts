import { Reminder, ReminderTemplate } from '../entities/Reminder';

export interface ReminderRepository {
  getAll(): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | null>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder>;
  update(id: string, reminder: Partial<Reminder>): Promise<Reminder>;
  delete(id: string): Promise<void>;
  getByDate(date: Date): Promise<Reminder[]>;
  getUpcoming(): Promise<Reminder[]>;
  toggleComplete(id: string): Promise<Reminder>;
}

export interface TemplateRepository {
  getAll(): Promise<ReminderTemplate[]>;
  getById(id: string): Promise<ReminderTemplate | null>;
  create(template: Omit<ReminderTemplate, 'id'>): Promise<ReminderTemplate>;
  delete(id: string): Promise<void>;
}
