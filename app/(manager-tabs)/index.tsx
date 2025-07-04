import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users, Calendar, Calculator, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Package, Target, Bell, X, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ManagerHomeTab() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'Livraison en retard',
      message: 'La livraison de fruits & légumes a 30 minutes de retard',
      time: '10 min',
      type: 'warning'
    },
    {
      id: 2,
      title: 'Objectif atteint',
      message: 'Votre équipe a traité 120% de l\'objectif quotidien',
      time: '1h',
      type: 'success'
    },
    {
      id: 3,
      title: 'Pause équipe',
      message: 'Pause de 15 minutes dans 5 minutes',
      time: '2h',
      type: 'info'
    }
  ]);

  // --- Ajout pour stats dynamiques ---
  const [stats, setStats] = useState({
    treatedPackages: 0,
    activeTeamMembers: 0,
    remainingTime: '0h00',
    performance: 0,
    treatedTasks: 0,
    totalTasks: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [todayPlannedTasks, setTodayPlannedTasks] = useState([]);
  const [treatedPackagesToday, setTreatedPackagesToday] = useState(0);
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);

  // Charger les tâches du jour depuis AsyncStorage
  useEffect(() => {
    const loadTodayTasks = async () => {
      const tasksString = await AsyncStorage.getItem('scheduledTasks');
      const tasks = tasksString ? JSON.parse(tasksString) : [];
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter((t) => t.date === today && !(t.isCompleted || t.status === 'completed'));
      setTodayPlannedTasks(todayTasks);
    };
    loadTodayTasks();
  }, [refreshFlag]);

  // Charger le compteur de colis traités du jour
  useEffect(() => {
    const loadTreatedPackages = async () => {
      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);
      const stored = await AsyncStorage.getItem('treatedPackages_' + today);
      setTreatedPackagesToday(stored ? parseInt(stored, 10) : 0);
    };
    loadTreatedPackages();
  }, [refreshFlag]);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const tasksString = await AsyncStorage.getItem('scheduledTasks');
        const tasks = tasksString ? JSON.parse(tasksString) : [];
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter((t) => t.date === today);
        const treatedTasks = todayTasks.filter((t) => t.isCompleted || t.status === 'completed');
        // const treatedPackages = treatedTasks.reduce((sum, t) => sum + (t.packages || 0), 0);
        const activeTeamMembers = todayTasks.filter((t) => !(t.isCompleted || t.status === 'completed')).reduce((sum, t) => sum + (t.teamSize || 0), 0);
        let totalMinutes = 0;
        const now = new Date();
        todayTasks.forEach((t) => {
          const [startHour, startMin] = (t.startTime || '00:00').split(':').map(Number);
          const [endHour, endMin] = (t.endTime || '00:00').split(':').map(Number);
          const start = new Date(t.date + 'T' + t.startTime);
          const end = new Date(t.date + 'T' + t.endTime);
          if (now < start) {
            totalMinutes += Math.max(0, (end - start) / 60000);
          } else if (now >= start && now < end) {
            totalMinutes += Math.max(0, (end - now) / 60000);
          }
        });
        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);
        const remainingTime = `${hours}h${mins.toString().padStart(2, '0')}`;
        const totalTasks = todayTasks.length;
        const performance = totalTasks > 0 ? Math.round((treatedTasks.length / totalTasks) * 100) : 0;
        setStats({
          treatedPackages: treatedPackagesToday,
          activeTeamMembers,
          remainingTime,
          performance,
          treatedTasks: treatedTasks.length,
          totalTasks,
        });
      } catch (e) {
        setStats({
          treatedPackages: treatedPackagesToday,
          activeTeamMembers: 0,
          remainingTime: '0h00',
          performance: 0,
          treatedTasks: 0,
          totalTasks: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [refreshFlag, treatedPackagesToday]);

  // Remise à zéro automatique du compteur chaque jour
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== todayDate) {
        await AsyncStorage.setItem('treatedPackages_' + now, '0');
        setTreatedPackagesToday(0);
        setTodayDate(now);
        setRefreshFlag((f) => !f);
      }
    }, 60000); // vérifie chaque minute
    return () => clearInterval(interval);
  }, [todayDate]);

  const todayTasks = [
    {
      id: 1,
      title: 'Mise en rayon matinale',
      progress: 100,
      status: 'completed',
      time: '05:00 - 07:30'
    },
    {
      id: 2,
      title: 'Réapprovisionnement',
      progress: 75,
      status: 'in-progress',
      time: '08:00 - 11:00'
    },
    {
      id: 3,
      title: 'Contrôle qualité',
      progress: 0,
      status: 'pending',
      time: '14:00 - 15:30'
    }
  ];

  const navigateToCalculator = () => {
    router.push('/(manager-tabs)/calculator');
  };

  const navigateToCalendar = () => {
    router.push('/(manager-tabs)/calendar');
  };

  const navigateToEfficiency = () => {
    router.push('/(manager-tabs)/efficiency');
  };

  const navigateToTeam = () => {
    router.push('/(manager-tabs)/team');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const markNotificationRead = (notificationId: number) => {
    Alert.alert('Notification', 'Notification marquée comme lue');
  };

  // Fonction pour marquer une tâche comme terminée
  const markTaskAsCompleted = async (taskId) => {
    const tasksString = await AsyncStorage.getItem('scheduledTasks');
    let tasks = tasksString ? JSON.parse(tasksString) : [];
    let updated = false;
    let addedPackages = 0;
    let taskAlreadyCompleted = false;
    tasks = tasks.map((t) => {
      if (t.id === taskId) {
        if (t.isCompleted || t.status === 'completed') {
          taskAlreadyCompleted = true;
          return t;
        }
        updated = true;
        addedPackages = t.packages || 0;
        return { ...t, isCompleted: true, status: 'completed' };
      }
      return t;
    });
    await AsyncStorage.setItem('scheduledTasks', JSON.stringify(tasks));
    // Incrémenter le compteur de colis traités du jour si la tâche vient d'être terminée et n'a pas déjà été comptée
    if (updated && addedPackages > 0 && !taskAlreadyCompleted) {
      const today = new Date().toISOString().split('T')[0];
      const key = 'treatedPackages_' + today;
      const stored = await AsyncStorage.getItem(key);
      const current = stored ? parseInt(stored, 10) : 0;
      const newValue = current + addedPackages;
      await AsyncStorage.setItem(key, String(newValue));
      setTreatedPackagesToday(newValue);
    } else {
      // Recharge le compteur même si rien n'a été ajouté pour garantir l'affichage
      const today = new Date().toISOString().split('T')[0];
      const key = 'treatedPackages_' + today;
      const stored = await AsyncStorage.getItem(key);
      setTreatedPackagesToday(stored ? parseInt(stored, 10) : 0);
    }
    setRefreshFlag((f) => !f);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>Manager Rayon</Text>
            <Text style={styles.date}>Aujourd'hui - {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotificationModal(true)}
          >
            <Bell color="#6b7280" size={24} strokeWidth={2} />
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats dynamiques */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}> <Package color="#3b82f6" size={20} strokeWidth={2} /> </View>
            <Text style={styles.statValue}>{loadingStats ? '...' : stats.treatedPackages}</Text>
            <Text style={styles.statLabel}>Colis traités</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${Math.round((stats.treatedTasks / stats.totalTasks) * 100)}%` : '0%', backgroundColor: '#3b82f6' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? Math.round((stats.treatedTasks / stats.totalTasks) * 100) : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}> <Users color="#10b981" size={20} strokeWidth={2} /> </View>
            <Text style={styles.statValue}>{loadingStats ? '...' : stats.activeTeamMembers}</Text>
            <Text style={styles.statLabel}>Équipiers actifs</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${Math.round((stats.activeTeamMembers / (stats.totalTasks * 2)) * 100)}` + '%' : '0%', backgroundColor: '#10b981' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? Math.round((stats.activeTeamMembers / (stats.totalTasks * 2)) * 100) : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}> <Clock color="#f59e0b" size={20} strokeWidth={2} /> </View>
            <Text style={styles.statValue}>{loadingStats ? '...' : stats.remainingTime}</Text>
            <Text style={styles.statLabel}>Temps restant</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${100 - stats.performance}%` : '0%', backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? 100 - stats.performance : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8b5cf620' }]}> <Target color="#8b5cf6" size={20} strokeWidth={2} /> </View>
            <Text style={styles.statValue}>{loadingStats ? '...' : stats.performance + '%'}</Text>
            <Text style={styles.statLabel}>Performance</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.performance}%`, backgroundColor: '#8b5cf6' }]} />
              </View>
              <Text style={styles.progressText}>{stats.performance}%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Tasks dynamiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâches du jour</Text>
          {todayPlannedTasks.length === 0 && (
            <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }}>Aucune tâche planifiée à terminer.</Text>
          )}
          {todayPlannedTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskStatus}>
                  {task.status === 'in-progress' && <Clock color="#f59e0b" size={20} strokeWidth={2} />}
                  {task.status === 'pending' && <Clock color="#6b7280" size={20} strokeWidth={2} />}
                </View>
              </View>
              <Text style={styles.taskTime}>{task.startTime} - {task.endTime}</Text>
              <View style={styles.taskProgressContainer}>
                <View style={styles.taskProgressBar}>
                  <View style={[styles.taskProgressFill, { width: `${task.progress || 0}%`, backgroundColor: task.status === 'in-progress' ? '#3b82f6' : '#e5e7eb' }]} />
                </View>
                <Text style={styles.taskProgressText}>{task.progress || 0}%</Text>
              </View>
              <TouchableOpacity style={styles.finishButton} onPress={() => markTaskAsCompleted(task.id)}>
                <Check color="#fff" size={18} />
                <Text style={styles.finishButtonText}>Marquer comme fini</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToCalculator}>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Calculator color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Calculateur d'Équipe</Text>
                <Text style={styles.actionSubtitle}>Planifier les tâches et horaires</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToCalendar}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Calendar color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Planning Rayon</Text>
                <Text style={styles.actionSubtitle}>Organiser et visualiser</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToTeam}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Users color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Équipe Rayon</Text>
                <Text style={styles.actionSubtitle}>Gérer votre équipe</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToEfficiency}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TrendingUp color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Performance</Text>
                <Text style={styles.actionSubtitle}>Analyser l'efficacité</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes importantes</Text>
          
          <TouchableOpacity style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Stock faible</Text>
              <Text style={styles.alertText}>Pommes de terre - Réapprovisionner avant 16h</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Clock color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Pause équipe</Text>
              <Text style={styles.alertText}>Pause de 15 minutes dans 10 minutes</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.map((notification) => (
                <TouchableOpacity 
                  key={notification.id} 
                  style={styles.notificationItem}
                  onPress={() => markNotificationRead(notification.id)}
                >
                  <Text style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>Il y a {notification.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.markAllReadButton}
              onPress={() => {
                Alert.alert('Notifications', 'Toutes les notifications ont été marquées comme lues');
                setShowNotificationModal(false);
              }}
            >
              <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 80,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
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
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  taskStatus: {
    marginLeft: 12,
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  taskProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 35,
  },
  actionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  markAllReadButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  markAllReadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  finishButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-end' },
  finishButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 }
});