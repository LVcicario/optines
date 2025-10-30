import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Package,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSectorEmployees } from '../hooks/useSupabaseSectors';

export default function SectorDetails() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { sectorId, sectorName } = useLocalSearchParams();
  const { employees, loading, error, refetch } = useSectorEmployees(Number(sectorId));

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const getAvailabilityColor = (isAvailable: boolean): string => {
    return isAvailable ? '#10b981' : '#ef4444';
  };

  const getAvailabilityText = (isAvailable: boolean): string => {
    return isAvailable ? 'Disponible' : 'Occupé';
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={isDark ? '#ffffff' : '#1a1a1a'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {sectorName}
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            {employees.length} employé{employees.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => router.push(`/assign-packages?sectorId=${sectorId}&sectorName=${sectorName}`)}
        >
          <Package color="#ffffff" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {loading && employees.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Chargement des employés...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User color={isDark ? '#a1a1aa' : '#6b7280'} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Aucun employé dans ce secteur
            </Text>
          </View>
        ) : (
          <>
            {/* Liste des employés */}
            <View style={styles.employeesList}>
              {employees.map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  style={[styles.employeeCard, isDark && styles.employeeCardDark]}
                  onPress={() => router.push(`/employee-schedule?employeeId=${employee.id}&employeeName=${employee.first_name} ${employee.last_name}`)}
                  activeOpacity={0.7}
                >
                  {/* En-tête employé */}
                  <View style={styles.employeeHeader}>
                    <View style={styles.employeeInfo}>
                      <View style={styles.employeeAvatar}>
                        <User color="#ffffff" size={20} strokeWidth={2} />
                      </View>
                      <View style={styles.employeeDetails}>
                        <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
                          {employee.first_name} {employee.last_name}
                        </Text>
                        <Text style={[styles.employeePosition, isDark && styles.employeePositionDark]}>
                          {employee.department_name || 'Non assigné'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight color={isDark ? '#a1a1aa' : '#6b7280'} size={20} strokeWidth={2} />
                  </View>

                  {/* Statut de disponibilité */}
                  <View style={styles.availabilityContainer}>
                    <View style={[
                      styles.availabilityBadge,
                      { backgroundColor: getAvailabilityColor(employee.is_available) + '20' }
                    ]}>
                      {employee.is_available ? (
                        <CheckCircle
                          color={getAvailabilityColor(employee.is_available)}
                          size={16}
                          strokeWidth={2}
                        />
                      ) : (
                        <AlertCircle
                          color={getAvailabilityColor(employee.is_available)}
                          size={16}
                          strokeWidth={2}
                        />
                      )}
                      <Text style={[
                        styles.availabilityText,
                        { color: getAvailabilityColor(employee.is_available) }
                      ]}>
                        {getAvailabilityText(employee.is_available)}
                      </Text>
                    </View>
                  </View>

                  {/* Temps de travail */}
                  <View style={styles.timeStats}>
                    <View style={styles.timeStat}>
                      <Clock color={isDark ? '#a1a1aa' : '#6b7280'} size={16} strokeWidth={2} />
                      <Text style={[styles.timeStatLabel, isDark && styles.timeStatLabelDark]}>
                        Total:
                      </Text>
                      <Text style={[styles.timeStatValue, isDark && styles.timeStatValueDark]}>
                        {formatTime(employee.total_work_minutes)}
                      </Text>
                    </View>

                    <View style={styles.timeStat}>
                      <Clock color={isDark ? '#a1a1aa' : '#6b7280'} size={16} strokeWidth={2} />
                      <Text style={[styles.timeStatLabel, isDark && styles.timeStatLabelDark]}>
                        Utilisé:
                      </Text>
                      <Text style={[styles.timeStatValue, isDark && styles.timeStatValueDark]}>
                        {formatTime(employee.used_work_minutes)}
                      </Text>
                    </View>

                    <View style={styles.timeStat}>
                      <Clock color="#10b981" size={16} strokeWidth={2} />
                      <Text style={[styles.timeStatLabel, isDark && styles.timeStatLabelDark]}>
                        Restant:
                      </Text>
                      <Text style={[styles.timeStatValue, { color: '#10b981' }]}>
                        {formatTime(employee.remaining_work_minutes)}
                      </Text>
                    </View>
                  </View>

                  {/* Barre de progression */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(
                            (employee.used_work_minutes / (employee.total_work_minutes || 1)) * 100,
                            100
                          )}%`,
                          backgroundColor: employee.is_available ? '#3b82f6' : '#ef4444',
                        }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Résumé global du secteur */}
            <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
              <Text style={[styles.summaryTitle, isDark && styles.summaryTitleDark]}>
                Résumé du Secteur
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                    {employees.filter(e => e.is_available).length}
                  </Text>
                  <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                    Disponibles
                  </Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                    {formatTime(employees.reduce((acc, e) => acc + e.total_work_minutes, 0))}
                  </Text>
                  <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                    Temps total
                  </Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                    {formatTime(employees.reduce((acc, e) => acc + e.remaining_work_minutes, 0))}
                  </Text>
                  <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                    Restant
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  assignButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerTitleDark: {
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#a1a1aa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#a1a1aa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  errorTextDark: {
    color: '#f87171',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyTextDark: {
    color: '#a1a1aa',
  },
  employeesList: {
    gap: 16,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeCardDark: {
    backgroundColor: '#27272a',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  employeeNameDark: {
    color: '#ffffff',
  },
  employeePosition: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  employeePositionDark: {
    color: '#a1a1aa',
  },
  availabilityContainer: {
    marginBottom: 16,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeStats: {
    gap: 8,
    marginBottom: 12,
  },
  timeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4,
  },
  timeStatLabelDark: {
    color: '#a1a1aa',
  },
  timeStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeStatValueDark: {
    color: '#ffffff',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardDark: {
    backgroundColor: '#27272a',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  summaryTitleDark: {
    color: '#ffffff',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryStatValueDark: {
    color: '#ffffff',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryStatLabelDark: {
    color: '#a1a1aa',
  },
});
