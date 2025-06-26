import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { 
  Palette, 
  Globe, 
  Shield, 
  Bell,
  Moon,
  Smartphone,
  ChevronRight 
} from 'lucide-react-native';

export default function SettingsTab() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Personnalisez votre expérience</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          
          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Palette color="#3b82f6" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Thème</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Moon color="#8b5cf6" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Mode sombre</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={darkMode ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Globe color="#10b981" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Langue</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.valueText}>Français</Text>
              <ChevronRight color="#6b7280" size={16} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité & Sécurité</Text>
          
          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Shield color="#ef4444" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Sécurité</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Bell color="#f59e0b" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Notifications push</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Device Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appareil</Text>
          
          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Smartphone color="#6b7280" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingTitle}>Stockage</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.valueText}>2.4 GB</Text>
              <ChevronRight color="#6b7280" size={16} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    fontWeight: '500',
  },
});