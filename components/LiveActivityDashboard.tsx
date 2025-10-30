/**
 * COMPONENT: LiveActivityDashboard
 *
 * Dashboard temps réel de l'activité des employés pour les directeurs
 * Affiche tous les employés avec leur statut actuel
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface EmployeeActivity {
  employee_id: string;
  employee_name: string;
  status: 'active' | 'inactive' | 'on_break' | 'offline';
  last_heartbeat: string;
  last_activity: string;
  current_task?: string;
}

interface LiveActivityDashboardProps {
  storeId: number;
}

export default function LiveActivityDashboard({ storeId }: LiveActivityDashboardProps) {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/activity/live/${storeId}`);
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('[LiveActivityDashboard] Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Rafraîchir toutes les 30s
    return () => clearInterval(interval);
  }, [storeId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'on_break': return '#3b82f6';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'active': return <CheckCircle color={color} size={20} />;
      case 'inactive': return <Clock color={color} size={20} />;
      case 'on_break': return <Activity color={color} size={20} />;
      case 'offline': return <AlertCircle color={color} size={20} />;
      default: return <AlertCircle color={color} size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'on_break': return 'En pause';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - then) / 60000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `Il y a ${diffHours}h`;
  };

  const renderEmployee = ({ item }: { item: EmployeeActivity }) => (
    <View style={[styles.employeeCard, isDark && styles.employeeCardDark]}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
            {item.employee_name}
          </Text>
          <Text style={[styles.lastSeen, isDark && styles.lastSeenDark]}>
            {getTimeAgo(item.last_heartbeat)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          {getStatusIcon(item.status)}
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      {item.current_task && (
        <View style={styles.taskInfo}>
          <Text style={[styles.taskLabel, isDark && styles.taskLabelDark]}>
            Tâche en cours:
          </Text>
          <Text style={[styles.taskName, isDark && styles.taskNameDark]}>
            {item.current_task}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Activité en direct
        </Text>
        <TouchableOpacity onPress={fetchActivities} style={styles.refreshButton}>
          <Activity color={isDark ? '#a1a1aa' : '#6b7280'} size={20} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.employee_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchActivities();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AlertCircle color={isDark ? '#a1a1aa' : '#6b7280'} size={48} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Aucun employé actif
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  employeeCardDark: {
    backgroundColor: '#27272a',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  employeeNameDark: {
    color: '#ffffff',
  },
  lastSeen: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastSeenDark: {
    color: '#a1a1aa',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  taskLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  taskLabelDark: {
    color: '#a1a1aa',
  },
  taskName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  taskNameDark: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyTextDark: {
    color: '#a1a1aa',
  },
});
