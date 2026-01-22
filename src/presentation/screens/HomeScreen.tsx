import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReminders, useCreateReminder, useToggleReminder, useDeleteReminder, useUpdateReminder } from '../hooks/useReminders';
import { useReminderStore } from '../store/reminderStore';
import { CategoryFilter } from '../components/CategoryFilter';
import { ReminderCard } from '../components/ReminderCard';
import { FloatingButton } from '../components/FloatingButton';
import { AddReminderModal } from '../components/AddReminderModal';
import { Colors } from '../../core/constants/colors';
import { Reminder, Category, RepeatDay, AlertType, AdvanceNotice } from '../../domain/entities/Reminder';
import { registerForPushNotificationsAsync } from '../../core/utils/notifications';

export function HomeScreen() {
  const { reminders, upcomingReminders, todayReminders, isLoading, refetch } = useReminders();
  const createReminder = useCreateReminder();
  const toggleReminder = useToggleReminder();
  const deleteReminder = useDeleteReminder();
  const updateReminder = useUpdateReminder();
  
  const {
    selectedCategory,
    setSelectedCategory,
    isAddModalVisible,
    openAddModal,
    closeAddModal,
  } = useReminderStore();

  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddReminder = async (reminderData: {
    title: string;
    description?: string;
    category: Category;
    date: Date;
    time: Date;
    repeatDays: RepeatDay[];
    alertType: AlertType;
    advanceNotice: AdvanceNotice;
    id?: string;
  }) => {
    if (reminderData.id) {
      await updateReminder.mutateAsync({
        id: reminderData.id,
        updates: {
          title: reminderData.title,
          description: reminderData.description,
          category: reminderData.category,
          date: reminderData.date,
          time: reminderData.time,
          repeatDays: reminderData.repeatDays,
          alertType: reminderData.alertType,
          advanceNotice: reminderData.advanceNotice,
        },
      });
    } else {
      await createReminder.mutateAsync({
        ...reminderData,
        isCompleted: false,
      });
    }
  };

  const handleToggleComplete = (id: string) => {
    toggleReminder.mutate(id);
  };

  const handleDeleteReminder = (id: string) => {
    setReminderToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (reminderToDelete) {
      deleteReminder.mutate(reminderToDelete);
    }
    setDeleteModalVisible(false);
    setReminderToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setReminderToDelete(null);
  };

  const handleReminderPress = (reminder: Reminder) => {
    setEditingReminder(reminder);
    openAddModal();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerSimple}>
          <Text style={styles.headerTitle}>Mis Recordatorios</Text>
          <Text style={styles.headerSubtitle}>{reminders.length} tareas</Text>
        </View>
        
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingContainer}
            >
              {upcomingReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleComplete={handleToggleComplete}
                  onPress={handleReminderPress}
                  onDelete={handleDeleteReminder}
                  variant="upcoming"
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas de Hoy</Text>
          {todayReminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay tareas para hoy</Text>
            </View>
          ) : (
            todayReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={handleToggleComplete}
                onPress={handleReminderPress}
                onDelete={handleDeleteReminder}
              />
            ))
          )}
        </View>

        {reminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todas las Tareas</Text>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={handleToggleComplete}
                onPress={handleReminderPress}
                onDelete={handleDeleteReminder}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FloatingButton onPress={() => {
        setEditingReminder(null);
        openAddModal();
      }} />

      <AddReminderModal
        visible={isAddModalVisible}
        onClose={() => {
          closeAddModal();
          setEditingReminder(null);
        }}
        onSave={handleAddReminder}
        editingReminder={editingReminder}
      />

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Eliminar tarea</Text>
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar esta tarea?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelBtn} onPress={cancelDelete}>
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSimple: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  upcomingContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
  },
  bottomSpacer: {
    height: 180,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    width: '80%',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});
