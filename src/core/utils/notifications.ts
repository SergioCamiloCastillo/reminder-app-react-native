import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Reminder } from '../../domain/entities/Reminder';

const isExpoGo = Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';
// Solo deshabilitar push notifications, pero intentar local notifications
const pushNotificationsDisabled = isExpoGo && isAndroid;

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

async function loadNotificationModules() {
  if (pushNotificationsDisabled || Notifications) return;
  
  try {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('Notification modules not available:', error);
  }
}

if (!pushNotificationsDisabled) {
  loadNotificationModules();
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (pushNotificationsDisabled) {
    console.log('Push notifications not supported in Expo Go on Android');
    return undefined;
  }

  await loadNotificationModules();
  if (!Notifications || !Device) return undefined;

  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2DD4BF',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log('Notification registration failed:', error);
  }

  return token;
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<string> {
  if (pushNotificationsDisabled) {
    console.log('Local notifications not fully supported in Expo Go on Android');
    return 'expo-go-placeholder';
  }

  await loadNotificationModules();
  if (!Notifications) return 'error-placeholder';

  try {
    const trigger = new Date(reminder.date);
    trigger.setHours(reminder.time.getHours());
    trigger.setMinutes(reminder.time.getMinutes());
    trigger.setSeconds(0);

    const notificationIds: string[] = [];

    const baseId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${reminder.title}`,
        body: reminder.description || 'Recordatorio',
        data: { reminderId: reminder.id, type: 'onTime' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
    notificationIds.push(baseId);

    const advanceMinutesMap: Record<string, number> = {
      '5min': 5,
      '15min': 15,
      '30min': 30,
      '1hour': 60,
      '3hours': 180,
      '1day': 1440,
      '2days': 2880,
    };

    const advanceMinutes = advanceMinutesMap[reminder.advanceNotice] ?? 0;
    if (advanceMinutes > 0) {
      const advanceTrigger = new Date(trigger);
      advanceTrigger.setMinutes(advanceTrigger.getMinutes() - advanceMinutes);

      if (advanceTrigger > new Date()) {
        const advanceId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 Próximo: ${reminder.title}`,
            body: reminder.description || 'Recordatorio próximo',
            data: { reminderId: reminder.id, type: 'advance' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: advanceTrigger,
          },
        });
        notificationIds.push(advanceId);
      }
    }

    return notificationIds.join(',');
  } catch (error) {
    console.log('Schedule notification failed:', error);
    return 'error-placeholder';
  }
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  if (notificationId === 'expo-go-placeholder' || notificationId === 'error-placeholder') {
    return;
  }
  
  if (pushNotificationsDisabled) return;
  
  await loadNotificationModules();
  if (!Notifications) return;
  
  try {
    const ids = notificationId.split(',').map((id) => id.trim()).filter(Boolean);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.log('Cancel notification failed:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (pushNotificationsDisabled) return;
  
  await loadNotificationModules();
  if (!Notifications) return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Cancel all notifications failed:', error);
  }
}
