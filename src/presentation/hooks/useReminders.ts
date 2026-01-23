import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reminder } from '../../domain/entities/Reminder';
import { ReminderRepositoryImpl } from '../../data/repositories/ReminderRepositoryImpl';
import { LocalStorageDataSource } from '../../data/datasources/LocalStorageDataSource';
import { scheduleReminderNotification, cancelReminderNotification } from '../../core/utils/notifications';
import { createCalendarAlarm, deleteCalendarAlarm } from '../../core/utils/calendar';
import { useReminderStore } from '../store/reminderStore';
import { isToday, isFuture } from 'date-fns';

const dataSource = new LocalStorageDataSource();
const reminderRepository = new ReminderRepositoryImpl(dataSource);

const REMINDERS_KEY = ['reminders'];

export function useReminders() {
  const queryClient = useQueryClient();
  const selectedCategory = useReminderStore((state) => state.selectedCategory);

  const { data: reminders = [], isLoading, refetch } = useQuery({
    queryKey: REMINDERS_KEY,
    queryFn: () => reminderRepository.getAll(),
  });

  const filteredReminders = selectedCategory === 'all'
    ? reminders
    : reminders.filter((r) => r.category === selectedCategory);

  const upcomingReminders = filteredReminders
    .filter((r) => !r.isCompleted && (isToday(new Date(r.date)) || isFuture(new Date(r.date))))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const todayReminders = filteredReminders.filter((r) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDate = new Date(r.date);
    return reminderDate >= today && reminderDate < tomorrow;
  });

  return {
    reminders: filteredReminders,
    allReminders: reminders,
    upcomingReminders,
    todayReminders,
    isLoading,
    refetch,
  };
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newReminder = await reminderRepository.create(reminderData);
      
      try {
        if (reminderData.alertType === 'alarm') {
          const calendarEventId = await createCalendarAlarm(newReminder);
          if (calendarEventId) {
            await reminderRepository.update(newReminder.id, { calendarEventId });
          }
        } else if (reminderData.alertType === 'both') {
          const calendarEventId = await createCalendarAlarm(newReminder);
          const notificationId = await scheduleReminderNotification(newReminder);
          await reminderRepository.update(newReminder.id, { 
            calendarEventId: calendarEventId || undefined, 
            notificationId 
          });
        } else {
          const notificationId = await scheduleReminderNotification(newReminder);
          await reminderRepository.update(newReminder.id, { notificationId });
        }
      } catch (error) {
        console.log('Alert scheduling failed:', error);
      }
      return newReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reminder> }) => {
      const reminders = await reminderRepository.getAll();
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      try {
        if (reminder.notificationId) {
          await cancelReminderNotification(reminder.notificationId);
        }
        if (reminder.calendarEventId) {
          await deleteCalendarAlarm(reminder.calendarEventId);
        }
      } catch (error) {
        console.log('Cancel alert failed:', error);
      }

      const updatedReminder = await reminderRepository.update(id, updates);

      try {
        if (updatedReminder.alertType === 'alarm') {
          const calendarEventId = await createCalendarAlarm(updatedReminder);
          if (calendarEventId) {
            await reminderRepository.update(updatedReminder.id, { calendarEventId, notificationId: undefined });
          }
        } else if (updatedReminder.alertType === 'both') {
          const calendarEventId = await createCalendarAlarm(updatedReminder);
          const notificationId = await scheduleReminderNotification(updatedReminder);
          await reminderRepository.update(updatedReminder.id, { 
            calendarEventId: calendarEventId || undefined, 
            notificationId 
          });
        } else {
          const notificationId = await scheduleReminderNotification(updatedReminder);
          await reminderRepository.update(updatedReminder.id, { notificationId, calendarEventId: undefined });
        }
      } catch (error) {
        console.log('Alert scheduling failed:', error);
      }

      return updatedReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const reminders = await reminderRepository.getAll();
      const reminder = reminders.find((r) => r.id === id);
      
      try {
        if (reminder?.notificationId) {
          await cancelReminderNotification(reminder.notificationId);
        }
        if (reminder?.calendarEventId) {
          await deleteCalendarAlarm(reminder.calendarEventId);
        }
      } catch (error) {
        console.log('Cancel alert failed:', error);
      }
      
      return reminderRepository.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reminderRepository.toggleComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}
