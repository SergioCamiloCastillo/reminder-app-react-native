import * as Calendar from 'expo-calendar';
import { NativeModules, Platform } from 'react-native';
import { Reminder, AdvanceNotice } from '../../domain/entities/Reminder';

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  const defaultCalendar = calendars.find((cal) => {
    if (Platform.OS === 'ios') {
      return cal.allowsModifications && cal.source?.name === 'iCloud';
    }
    return cal.accessLevel === Calendar.CalendarAccessLevel.OWNER;
  });

  if (defaultCalendar) {
    return defaultCalendar.id;
  }

  if (calendars.length > 0) {
    const modifiableCalendar = calendars.find((cal) => cal.allowsModifications);
    return modifiableCalendar?.id || calendars[0].id;
  }

  return null;
}

function getAdvanceOffsetMinutes(advanceNotice?: AdvanceNotice): number {
  switch (advanceNotice) {
    case '5min':
      return 5;
    case '15min':
      return 15;
    case '30min':
      return 30;
    case '1hour':
      return 60;
    case '3hours':
      return 180;
    case '1day':
      return 1440;
    case '2days':
      return 2880;
    default:
      return 0;
  }
}

function getAdjustedAlarmDate(startDate: Date, advanceMinutes: number): Date {
  const alarmDate = new Date(startDate);
  alarmDate.setMinutes(alarmDate.getMinutes() - advanceMinutes);
  return alarmDate;
}

export async function createCalendarAlarm(reminder: Reminder): Promise<string | null> {
  if (Platform.OS === 'android') {
    try {
      const { AlarmModule } = NativeModules as {
        AlarmModule?: {
          scheduleAlarm: (id: string, timestamp: number, title: string, message: string) => void;
        };
      };

      if (!AlarmModule) {
        console.error('AlarmModule not available');
        return null;
      }

      const startDate = new Date(reminder.date);
      const timeDate = new Date(reminder.time);
      startDate.setHours(timeDate.getHours());
      startDate.setMinutes(timeDate.getMinutes());
      startDate.setSeconds(0);

      const advanceMinutes = getAdvanceOffsetMinutes(reminder.advanceNotice);
      const alarmDate = getAdjustedAlarmDate(startDate, advanceMinutes);

      const notificationIds: string[] = [];
      const onTimeId = `${reminder.id}-on`;
      AlarmModule.scheduleAlarm(onTimeId, startDate.getTime(), reminder.title, reminder.description || 'Recordatorio');
      notificationIds.push(onTimeId);

      if (advanceMinutes > 0 && alarmDate.getTime() > Date.now()) {
        const advanceId = `${reminder.id}-advance`;
        AlarmModule.scheduleAlarm(advanceId, alarmDate.getTime(), `Próximo: ${reminder.title}`, reminder.description || 'Recordatorio próximo');
        notificationIds.push(advanceId);
      }
      return notificationIds.join(',');
    } catch (error) {
      console.error('Error creating android alarm:', error);
      return null;
    }
  }

  try {
    console.log('Creating calendar alarm for:', reminder.title);
    
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      console.log('Calendar permission denied');
      return null;
    }
    console.log('Calendar permission granted');

    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      console.log('No calendar found');
      return null;
    }
    console.log('Using calendar ID:', calendarId);

    const startDate = new Date(reminder.date);
    const timeDate = new Date(reminder.time);
    startDate.setHours(timeDate.getHours());
    startDate.setMinutes(timeDate.getMinutes());
    startDate.setSeconds(0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    const advanceMinutes = getAdvanceOffsetMinutes(reminder.advanceNotice);
    const alarmDate = getAdjustedAlarmDate(startDate, advanceMinutes);

    console.log('Event start time:', startDate.toLocaleString());
    console.log('Event end time:', endDate.toLocaleString());

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `⏰ ${reminder.title}`,
      notes: reminder.description || 'Recordatorio',
      startDate,
      endDate,
      alarms: [
        {
          absoluteDate: alarmDate.toISOString(),
          method: Calendar.AlarmMethod.ALERT,
        },
      ],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    console.log('Calendar event created with ID:', eventId);
    
    // Verificar que el evento se creó correctamente
    try {
      const createdEvent = await Calendar.getEventAsync(eventId);
      console.log('Event verification:', {
        title: createdEvent.title,
        startDate: createdEvent.startDate,
        alarms: createdEvent.alarms,
      });
    } catch (verifyError) {
      console.log('Could not verify event:', verifyError);
    }
    
    return eventId;
  } catch (error) {
    console.error('Error creating calendar alarm:', error);
    return null;
  }
}

export async function deleteCalendarAlarm(eventId: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const { AlarmModule } = NativeModules as {
        AlarmModule?: {
          cancelAlarm: (id: string) => void;
        };
      };

      if (!AlarmModule) {
        return;
      }

      const ids = eventId.split(',').map((id) => id.trim()).filter(Boolean);
      ids.forEach((id) => AlarmModule.cancelAlarm(id));
      return;
    }
    await Calendar.deleteEventAsync(eventId);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
  }
}
