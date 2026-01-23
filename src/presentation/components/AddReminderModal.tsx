import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  PanResponder,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, RepeatDay, AlertType, AdvanceNotice, Reminder } from '../../domain/entities/Reminder';
import { Colors, CategoryColors } from '../../core/constants/colors';

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminder: {
    title: string;
    description?: string;
    category: Category;
    date: Date;
    time: Date;
    repeatDays: RepeatDay[];
    alertType: AlertType;
    advanceNotice: AdvanceNotice;
    id?: string;
  }) => void;
  editingReminder?: Reminder | null;
}

const alertTypes: { key: AlertType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { key: 'notification', label: 'Notificación', icon: 'notifications-outline', description: 'Notificación push silenciosa' },
  { key: 'alarm', label: 'Alarma', icon: 'alarm-outline', description: 'Alarma con sonido fuerte' },
  { key: 'both', label: 'Ambos', icon: 'notifications', description: 'Notificación + Alarma' },
];

const categories: { key: Category; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'work', label: 'Trabajo' },
  { key: 'health', label: 'Salud' },
  { key: 'other', label: 'Otros' },
];

const repeatDays: { key: RepeatDay; label: string }[] = [
  { key: 'everyday', label: 'Todos' },
  { key: 'sat', label: 'SAB' },
  { key: 'sun', label: 'DOM' },
  { key: 'mon', label: 'LUN' },
  { key: 'tue', label: 'MAR' },
  { key: 'wed', label: 'MIE' },
  { key: 'thu', label: 'JUE' },
  { key: 'fri', label: 'VIE' },
];

const advanceNoticeOptions: { key: AdvanceNotice; label: string }[] = [
  { key: 'none', label: 'En el momento' },
  { key: '5min', label: '5 minutos antes' },
  { key: '15min', label: '15 minutos antes' },
  { key: '30min', label: '30 minutos antes' },
  { key: '1hour', label: '1 hora antes' },
  { key: '3hours', label: '3 horas antes' },
  { key: '1day', label: '1 día antes' },
  { key: '2days', label: '2 días antes' },
];

export function AddReminderModal({ visible, onClose, onSave, editingReminder }: AddReminderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<RepeatDay[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('notification');
  const [advanceNotice, setAdvanceNotice] = useState<AdvanceNotice>('none');
  const [showAdvanceNoticeDropdown, setShowAdvanceNoticeDropdown] = useState(false);

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setDescription(editingReminder.description || '');
      setCategory(editingReminder.category);
      setDate(new Date(editingReminder.date));
      setTime(new Date(editingReminder.time));
      setSelectedRepeatDays(editingReminder.repeatDays);
      setAlertType(editingReminder.alertType);
      setAdvanceNotice(editingReminder.advanceNotice || 'none');
    } else {
      resetForm();
    }
  }, [editingReminder, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      date,
      time,
      repeatDays: selectedRepeatDays,
      alertType,
      advanceNotice,
      id: editingReminder?.id,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('personal');
    setDate(new Date());
    setTime(new Date());
    setSelectedRepeatDays([]);
    setAlertType('notification');
    setAdvanceNotice('none');
  };

  const toggleRepeatDay = (day: RepeatDay) => {
    if (day === 'everyday') {
      setSelectedRepeatDays(selectedRepeatDays.includes('everyday') ? [] : ['everyday']);
    } else {
      const newDays = selectedRepeatDays.filter(d => d !== 'everyday');
      if (newDays.includes(day)) {
        setSelectedRepeatDays(newDays.filter(d => d !== day));
      } else {
        setSelectedRepeatDays([...newDays, day]);
      }
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (t: Date) => {
    return t.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const panY = useRef(new Animated.Value(0)).current;
  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  });
  
  const closeAnim = Animated.timing(panY, {
    toValue: Dimensions.get('window').height,
    duration: 200,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeAnim.start(() => {
            onClose();
            panY.setValue(0);
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        <Animated.View 
          style={[styles.container, { transform: [{ translateY: panY }] }]}
        >
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.titleInput}
              placeholder="Nuevo Recordatorio"
              placeholderTextColor={Colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.descriptionInput}
              placeholder="Descripción (opcional)"
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="list-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Categoría</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>
                  {categories.find(c => c.key === category)?.label}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.dropdown}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.dropdownItem,
                      category === cat.key && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setCategory(cat.key);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: CategoryColors[cat.key] }]} />
                    <Text style={styles.dropdownItemText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Fecha</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>{formatDate(date)}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Alerta</Text>
              <View style={styles.alertTypeContainer}>
                {alertTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.alertTypeCard,
                      alertType === type.key && styles.alertTypeCardSelected,
                    ]}
                    onPress={() => setAlertType(type.key)}
                  >
                    <View style={[
                      styles.alertTypeIcon,
                      alertType === type.key && styles.alertTypeIconSelected,
                    ]}>
                      <Ionicons 
                        name={type.icon} 
                        size={24} 
                        color={alertType === type.key ? Colors.surface : Colors.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.alertTypeLabel,
                      alertType === type.key && styles.alertTypeLabelSelected,
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={styles.alertTypeDescription}>{type.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Repetir</Text>
              <View style={styles.repeatDaysContainer}>
                {repeatDays.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.repeatDayChip,
                      selectedRepeatDays.includes(day.key) && styles.repeatDayChipSelected,
                    ]}
                    onPress={() => toggleRepeatDay(day.key)}
                  >
                    <Text
                      style={[
                        styles.repeatDayText,
                        selectedRepeatDays.includes(day.key) && styles.repeatDayTextSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => setShowAdvanceNoticeDropdown(!showAdvanceNoticeDropdown)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Avisar antes</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>
                  {advanceNoticeOptions.find(o => o.key === advanceNotice)?.label}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {showAdvanceNoticeDropdown && (
              <View style={styles.dropdown}>
                {advanceNoticeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownItem,
                      advanceNotice === option.key && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setAdvanceNotice(option.key);
                      setShowAdvanceNoticeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Hora</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>{formatTime(time)}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {showTimePicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent animationType="fade">
                  <TouchableOpacity 
                    style={styles.datePickerOverlay} 
                    activeOpacity={1}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <TouchableOpacity 
                      activeOpacity={1} 
                      style={styles.datePickerContainer}
                      onPress={(e) => e.stopPropagation()}
                    >
                      <DateTimePicker
                        value={time}
                        mode="time"
                        display="spinner"
                        onChange={(event, selectedTime) => {
                          if (selectedTime) setTime(selectedTime);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.datePickerDone}
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={styles.datePickerDoneText}>Listo</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              ) : (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (event.type === 'set' && selectedTime) {
                      setTime(selectedTime);
                    }
                  }}
                />
              )
            )}

            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent animationType="fade">
                  <TouchableOpacity 
                    style={styles.datePickerOverlay} 
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <TouchableOpacity 
                      activeOpacity={1} 
                      style={styles.datePickerContainer}
                      onPress={(e) => e.stopPropagation()}
                    >
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="inline"
                        onChange={(event, selectedDate) => {
                          if (selectedDate) setDate(selectedDate);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.datePickerDone}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerDoneText}>Listo</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              ) : (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: '85%',
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 60,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  dropdown: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  dropdownItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  repeatDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatDayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repeatDayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  repeatDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  repeatDayTextSelected: {
    color: Colors.surface,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  alertTypeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  alertTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  alertTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTypeIconSelected: {
    backgroundColor: Colors.primary,
  },
  alertTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  alertTypeLabelSelected: {
    color: Colors.primary,
  },
  alertTypeDescription: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    margin: 20,
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});
