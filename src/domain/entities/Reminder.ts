export type RepeatDay = 'everyday' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Category = 'personal' | 'work' | 'health' | 'other';

export type AlertType = 'notification' | 'alarm';

export type AdvanceNotice = 'none' | '5min' | '15min' | '30min' | '1hour' | '3hours' | '1day' | '2days';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  category: Category;
  date: Date;
  time: Date;
  repeatDays: RepeatDay[];
  isCompleted: boolean;
  alertType: AlertType;
  advanceNotice: AdvanceNotice;
  notificationId?: string;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderTemplate {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
  category: Category;
}
