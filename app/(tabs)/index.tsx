import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Bell,
  ChevronRight,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react-native';
import FutureTasksCalendar from '../../components/FutureTasksCalendar';
import { useTaskStats } from '../../hooks/useTaskStats';

export default function HomeTab() {
  const { stats, loading, refreshStats } = useTaskStats();

  // Rafraîchir les stats quand la page devient active
  useEffect(() => {
    const unsubscribe = () => {
      refreshStats();
    };
    
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>Directeur</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshStats}
            >
              <Clock color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - 4 cases fonctionnelles */}
        <View style={styles.statsContainer}>
          {/* Case 1: Colis traités */}
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Package color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalPackages.toLocaleString()
              )}
            </Text>
            <Text style={styles.statLabel}>Colis traités</Text>
            <Text style={styles.statSubtitle}>
              {stats.packagesPerHour}/h en moyenne
            </Text>
          </LinearGradient>

          {/* Case 2: Tâches planifiées */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Calendar color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalTasks
              )}
            </Text>
            <Text style={styles.statLabel}>Tâches planifiées</Text>
            <Text style={styles.statSubtitle}>
              {stats.completedTasks} terminées
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.statsContainer}>
          {/* Case 3: Équipes mobilisées */}
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Users color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalTeamMembers
              )}
            </Text>
            <Text style={styles.statLabel}>Équipes mobilisées</Text>
            <Text style={styles.statSubtitle}>
              {stats.averageTeamSize} pers/tâche
            </Text>
          </LinearGradient>

          {/* Case 4: Taux de réussite */}
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <CheckCircle color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                `${stats.completionRate}%`
              )}
            </Text>
            <Text style={styles.statLabel}>Taux de réussite</Text>
            <Text style={styles.statSubtitle}>
              Tâches terminées
            </Text>
          </LinearGradient>
        </View>

        {/* Debug Section */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>🔍 DEBUG - État des données</Text>
          <Text style={styles.debugText}>
            Tâches trouvées: {stats.totalTasks} | Colis: {stats.totalPackages} | Équipes: {stats.totalTeamMembers}
          </Text>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={async () => {
              try {
                const tasksString = await AsyncStorage.getItem('scheduledTasks');
                alert(`Données dans le stockage: ${tasksString || 'AUCUNE DONNÉE'}`);
                console.log('DEBUG - Tasks:', tasksString);
              } catch (error) {
                alert('Erreur: ' + error);
              }
            }}
          >
            <Text style={styles.debugButtonText}>🔍 VÉRIFIER LE STOCKAGE</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Calendar color="#3b82f6" size={20} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Planifier une réunion</Text>
                <Text style={styles.actionSubtitle}>Organiser avec l'équipe</Text>
              </View>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Users color="#10b981" size={20} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Gérer l'équipe</Text>
                <Text style={styles.actionSubtitle}>Voir les performances</Text>
              </View>
            </View>
            <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Tâches à venir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâches à venir</Text>
          <Text style={styles.sectionSubtitle}>Planifiez vos tâches pour les semaines et mois à venir</Text>
          <View style={styles.calendarContainer}>
            <FutureTasksCalendar />
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  debugSection: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  debugButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  calendarContainer: {
    height: 500,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionCard: {
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
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
});