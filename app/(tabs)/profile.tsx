import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight 
} from 'lucide-react-native';

export default function ProfileTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#ffffff" size={32} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.name}>Jean Dupont</Text>
          <Text style={styles.role}>Directeur Général</Text>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <User color="#3b82f6" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.optionTitle}>Informations personnelles</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Settings color="#10b981" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.optionTitle}>Paramètres</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Bell color="#f59e0b" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.optionTitle}>Notifications</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Shield color="#8b5cf6" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.optionTitle}>Sécurité</Text>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut color="#ef4444" size={20} strokeWidth={2} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  optionCard: {
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});