import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { 
  Palette, 
  Globe, 
  Shield, 
  Bell,
  Moon,
  Smartphone,
  ChevronRight,
  Settings,
  Clock,
  AlertTriangle,
  Users,
  Save
} from 'lucide-react-native';
import { useNotifications, NotificationSettings } from '../../hooks/useNotifications';

export default function SettingsTab() {
  const {
    settings,
    saveNotificationSettings,
    cancelAllScheduledNotifications,
    getScheduledNotifications,
  } = useNotifications();

  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  // Charger le nombre de notifications programmées
  React.useEffect(() => {
    loadScheduledNotificationsCount();
  }, []);

  const loadScheduledNotificationsCount = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledCount(notifications.length);
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    await saveNotificationSettings(localSettings);
    Alert.alert('Succès', 'Paramètres de notification sauvegardés');
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment supprimer toutes les notifications programmées ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await cancelAllScheduledNotifications();
            await loadScheduledNotificationsCount();
            Alert.alert('Succès', 'Toutes les notifications ont été supprimées');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Settings color="#3b82f6" size={32} strokeWidth={2} />
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Personnalisez votre expérience</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell color="#3b82f6" size={24} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          {/* Task Reminders */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Clock color="#6b7280" size={20} strokeWidth={2} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Rappels de tâches</Text>
                <Text style={styles.settingDescription}>
                  Recevoir des rappels avant le début des tâches
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings.taskReminders}
              onValueChange={(value) => handleSettingChange('taskReminders', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={localSettings.taskReminders ? '#ffffff' : '#ffffff'}
            />
          </View>

          {/* Conflict Alerts */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <AlertTriangle color="#6b7280" size={20} strokeWidth={2} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Alertes de conflit</Text>
                <Text style={styles.settingDescription}>
                  Être notifié des conflits de planning
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings.conflictAlerts}
              onValueChange={(value) => handleSettingChange('conflictAlerts', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={localSettings.conflictAlerts ? '#ffffff' : '#ffffff'}
            />
          </View>

          {/* Employee Updates */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Users color="#6b7280" size={20} strokeWidth={2} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Mises à jour employés</Text>
                <Text style={styles.settingDescription}>
                  Notifications sur les changements d'équipe
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings.employeeUpdates}
              onValueChange={(value) => handleSettingChange('employeeUpdates', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={localSettings.employeeUpdates ? '#ffffff' : '#ffffff'}
            />
          </View>

          {/* Reminder Time */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Clock color="#6b7280" size={20} strokeWidth={2} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Temps de rappel</Text>
                <Text style={styles.settingDescription}>
                  Minutes avant le début de la tâche
                </Text>
              </View>
            </View>
            <View style={styles.timeSelector}>
              {[5, 10, 15, 30, 60].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    localSettings.reminderTime === time && styles.selectedTimeOption,
                  ]}
                  onPress={() => handleSettingChange('reminderTime', time)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      localSettings.reminderTime === time && styles.selectedTimeText,
                    ]}
                  >
                    {time}min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notifications Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📱 Notifications programmées</Text>
            <Text style={styles.infoText}>
              {scheduledCount} notification{scheduledCount > 1 ? 's' : ''} en attente
            </Text>
            {scheduledCount > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications}>
                <Text style={styles.clearButtonText}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Save color="#ffffff" size={20} strokeWidth={2} />
            <Text style={styles.saveButtonText}>Sauvegarder les paramètres</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    padding: 16,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});