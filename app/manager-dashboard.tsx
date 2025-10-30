import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Clock,
  Package,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useSectorEmployees } from '../hooks/useSupabaseSectors';

interface ManagerInfo {
  id: string;
  first_name: string;
  last_name: string;
  sector_id: number | null;
  sector_name: string;
  department_name: string;
  total_work_minutes: number;
  used_work_minutes: number;
  remaining_work_minutes: number;
  is_available: boolean;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const { employees, loading: teamLoading, refetch: refetchTeam } = useSectorEmployees(
    managerInfo?.sector_id || 0
  );

  useEffect(() => {
    fetchManagerInfo();
  }, []);

  async function fetchManagerInfo() {
    try {
      setLoading(true);

      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les infos du manager
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          sector_id,
          department_id,
          sectors (name),
          departments (name)
        `)
        .eq('user_id', user.id)
        .single();

      if (empError) throw empError;

      // Récupérer la disponibilité
      const { data: availability } = await supabase
        .rpc('get_employee_remaining_work_time', {
          p_employee_id: employeeData.id,
          p_date: new Date().toISOString().split('T')[0]
        });

      setManagerInfo({
        id: employeeData.id,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        sector_id: employeeData.sector_id,
        sector_name: employeeData.sectors?.name || 'Non assigné',
        department_name: employeeData.departments?.name || 'Non assigné',
        total_work_minutes: availability?.[0]?.total_work_minutes || 0,
        used_work_minutes: availability?.[0]?.used_work_minutes || 0,
        remaining_work_minutes: availability?.[0]?.remaining_work_minutes || 0,
        is_available: availability?.[0]?.is_available || false,
      });
    } catch (err: any) {
      console.error('Error fetching manager info:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    fetchManagerInfo();
    refetchTeam();
  };

  // Filtrer les employés pour ne garder que ceux du même secteur (excluant le manager lui-même)
  const teamMembers = employees.filter(emp => emp.id !== managerInfo?.id);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={isDark ? '#ffffff' : '#1a1a1a'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Mon Équipe
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            {managerInfo?.sector_name || 'Chargement...'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading || teamLoading} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Chargement...
            </Text>
          </View>
        ) : !managerInfo ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
              Impossible de charger les informations
            </Text>
          </View>
        ) : (
          <>
            {/* Carte personnelle du manager */}
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.managerCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.managerHeader}>
                <View style={styles.managerAvatar}>
                  <User color="#ffffff" size={32} strokeWidth={2} />
                </View>
                <View style={styles.managerInfo}>
                  <Text style={styles.managerName}>
                    {managerInfo.first_name} {managerInfo.last_name}
                  </Text>
                  <Text style={styles.managerDepartment}>
                    {managerInfo.department_name}
                  </Text>
                </View>
              </View>

              <View style={styles.managerStats}>
                <View style={styles.managerStat}>
                  <Clock color="#ffffff" size={18} strokeWidth={2} />
                  <Text style={styles.managerStatValue}>
                    {formatTime(managerInfo.total_work_minutes)}
                  </Text>
                  <Text style={styles.managerStatLabel}>Total</Text>
                </View>

                <View style={styles.managerStat}>
                  <Package color="#ffffff" size={18} strokeWidth={2} />
                  <Text style={styles.managerStatValue}>
                    {formatTime(managerInfo.used_work_minutes)}
                  </Text>
                  <Text style={styles.managerStatLabel}>Utilisé</Text>
                </View>

                <View style={styles.managerStat}>
                  <CheckCircle color="#ffffff" size={18} strokeWidth={2} />
                  <Text style={styles.managerStatValue}>
                    {formatTime(managerInfo.remaining_work_minutes)}
                  </Text>
                  <Text style={styles.managerStatLabel}>Restant</Text>
                </View>
              </View>

              <View style={styles.availabilityBadge}>
                {managerInfo.is_available ? (
                  <CheckCircle color="#10b981" size={16} strokeWidth={2} />
                ) : (
                  <AlertCircle color="#ef4444" size={16} strokeWidth={2} />
                )}
                <Text style={styles.availabilityText}>
                  {managerInfo.is_available ? 'Disponible' : 'Occupé'}
                </Text>
              </View>
            </LinearGradient>

            {/* Section équipe */}
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <Users color={isDark ? '#a1a1aa' : '#6b7280'} size={20} strokeWidth={2} />
                <Text style={[styles.teamTitle, isDark && styles.teamTitleDark]}>
                  Mon Équipe ({teamMembers.length})
                </Text>
              </View>

              {teamLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : teamMembers.length === 0 ? (
                <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
                  <Users color={isDark ? '#a1a1aa' : '#6b7280'} size={32} strokeWidth={1.5} />
                  <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                    Aucun membre dans votre équipe
                  </Text>
                </View>
              ) : (
                <View style={styles.teamList}>
                  {teamMembers.map((member) => (
                    <View
                      key={member.id}
                      style={[styles.teamMemberCard, isDark && styles.teamMemberCardDark]}
                    >
                      <View style={styles.teamMemberHeader}>
                        <View style={styles.teamMemberAvatar}>
                          <User color="#ffffff" size={20} strokeWidth={2} />
                        </View>
                        <View style={styles.teamMemberInfo}>
                          <Text style={[styles.teamMemberName, isDark && styles.teamMemberNameDark]}>
                            {member.first_name} {member.last_name}
                          </Text>
                          <Text style={[styles.teamMemberDepartment, isDark && styles.teamMemberDepartmentDark]}>
                            {member.department_name}
                          </Text>
                        </View>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: member.is_available ? '#10b981' : '#ef4444' }
                        ]} />
                      </View>

                      <View style={styles.teamMemberStats}>
                        <View style={styles.teamMemberStat}>
                          <Text style={[styles.teamMemberStatLabel, isDark && styles.teamMemberStatLabelDark]}>
                            Restant
                          </Text>
                          <Text style={[styles.teamMemberStatValue, isDark && styles.teamMemberStatValueDark]}>
                            {formatTime(member.remaining_work_minutes)}
                          </Text>
                        </View>

                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${Math.min(
                                  (member.used_work_minutes / (member.total_work_minutes || 1)) * 100,
                                  100
                                )}%`,
                                backgroundColor: member.is_available ? '#3b82f6' : '#ef4444',
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Stats globales de l'équipe */}
            {teamMembers.length > 0 && (
              <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                <Text style={[styles.summaryTitle, isDark && styles.summaryTitleDark]}>
                  Résumé de l'Équipe
                </Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                      {teamMembers.filter(m => m.is_available).length}
                    </Text>
                    <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                      Disponibles
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                      {formatTime(teamMembers.reduce((acc, m) => acc + m.total_work_minutes, 0))}
                    </Text>
                    <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                      Temps total
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatValue, isDark && styles.summaryStatValueDark]}>
                      {formatTime(teamMembers.reduce((acc, m) => acc + m.remaining_work_minutes, 0))}
                    </Text>
                    <Text style={[styles.summaryStatLabel, isDark && styles.summaryStatLabelDark]}>
                      Restant
                    </Text>
                  </View>
                </View>
              </View>
            )}
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
  managerCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  managerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  managerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  managerDepartment: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  managerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  managerStat: {
    alignItems: 'center',
    flex: 1,
  },
  managerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  managerStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  teamSection: {
    marginBottom: 24,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  teamTitleDark: {
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCardDark: {
    backgroundColor: '#27272a',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#a1a1aa',
  },
  teamList: {
    gap: 12,
  },
  teamMemberCard: {
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
    elevation: 2,
  },
  teamMemberCardDark: {
    backgroundColor: '#27272a',
  },
  teamMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamMemberNameDark: {
    color: '#ffffff',
  },
  teamMemberDepartment: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  teamMemberDepartmentDark: {
    color: '#a1a1aa',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamMemberStats: {
    gap: 8,
  },
  teamMemberStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamMemberStatLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  teamMemberStatLabelDark: {
    color: '#a1a1aa',
  },
  teamMemberStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamMemberStatValueDark: {
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
    fontSize: 20,
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
