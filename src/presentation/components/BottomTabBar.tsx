import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/constants/colors';

type TabName = 'mail' | 'task' | 'meet' | 'calendar' | 'drive';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const tabs: { key: TabName; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'mail', icon: 'mail-outline', label: 'Correo' },
  { key: 'task', icon: 'checkbox-outline', label: 'Tareas' },
  { key: 'meet', icon: 'videocam-outline', label: 'Meet' },
  { key: 'calendar', icon: 'calendar-outline', label: 'Calendario' },
  { key: 'drive', icon: 'folder-outline', label: 'Drive' },
];

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTabPress(tab.key)}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={activeTab === tab.key ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.label,
              activeTab === tab.key && styles.labelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: Colors.textLight,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
