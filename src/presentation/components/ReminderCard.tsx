import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reminder } from '../../domain/entities/Reminder';
import { Colors, CategoryColors } from '../../core/constants/colors';
import { format, differenceInDays, isToday, isTomorrow, isPast, addDays, set } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderCardProps {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onPress: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  variant?: 'default' | 'upcoming';
}

export function ReminderCard({ reminder, onToggleComplete, onPress, onDelete, variant = 'default' }: ReminderCardProps) {
  const categoryColor = CategoryColors[reminder.category] || Colors.categoryOther;
  const reminderDate = new Date(reminder.date);
  const reminderTime = new Date(reminder.time);

  const nextOccurrence = (() => {
    const now = new Date();
    const baseTime = { hours: reminderTime.getHours(), minutes: reminderTime.getMinutes(), seconds: 0, milliseconds: 0 };

    if (reminder.repeatDays.length === 0) {
      return set(reminderDate, baseTime);
    }

    for (let i = 0; i < 8; i += 1) {
      const candidate = addDays(now, i);
      const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][candidate.getDay()] as typeof reminder.repeatDays[number];
      const matches = reminder.repeatDays.includes('everyday') || reminder.repeatDays.includes(dayKey);

      if (matches) {
        const scheduled = set(candidate, baseTime);
        if (scheduled > now) {
          return scheduled;
        }
      }
    }

    return set(reminderDate, baseTime);
  })();

  const timeString = format(nextOccurrence, 'h:mm a');
  const dateString = format(nextOccurrence, 'd MMM', { locale: es });

  const getTimeDescription = () => {
    const daysUntil = differenceInDays(nextOccurrence, new Date());

    if (isPast(nextOccurrence) && !isToday(nextOccurrence)) {
      return `Vencida - ${dateString}`;
    }
    if (isToday(nextOccurrence)) {
      return `Hoy a las ${timeString}`;
    }
    if (isTomorrow(nextOccurrence)) {
      return `Mañana a las ${timeString}`;
    }
    if (daysUntil <= 7) {
      return `En ${daysUntil} días - ${timeString}`;
    }
    return `${dateString} a las ${timeString}`;
  };

  if (variant === 'upcoming') {
    return (
      <TouchableOpacity style={styles.upcomingCard} onPress={() => onPress(reminder)}>
        <View style={[styles.upcomingIcon, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name="notifications-outline" size={20} color={categoryColor} />
        </View>
        <View style={styles.upcomingContent}>
          <Text style={styles.upcomingTitle} numberOfLines={1}>{reminder.title}</Text>
          <View style={styles.upcomingTimeRow}>
            <Ionicons name="time-outline" size={14} color={Colors.error} />
            <Text style={styles.upcomingTime}>{getTimeDescription()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(reminder)}>
      <TouchableOpacity
        style={[styles.checkbox, reminder.isCompleted && styles.checkboxCompleted]}
        onPress={() => onToggleComplete(reminder.id)}
      >
        {reminder.isCompleted && (
          <Ionicons name="checkmark" size={14} color={Colors.surface} />
        )}
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, reminder.isCompleted && styles.titleCompleted]} numberOfLines={1}>
          {reminder.title}
        </Text>
        <Text style={styles.time}>{getTimeDescription()}</Text>
        {reminder.description && (
          <Text style={styles.description} numberOfLines={1}>{reminder.description}</Text>
        )}
      </View>
      <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(reminder.id)}>
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  time: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textLight,
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  deleteButton: {
    padding: 8,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  upcomingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingTime: {
    fontSize: 12,
    color: Colors.error,
  },
  upcomingArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
