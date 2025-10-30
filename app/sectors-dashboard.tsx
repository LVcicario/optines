import React, { useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Package,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSectorSummary } from '../hooks/useSupabaseSectors';

export default function SectorsDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { storeId } = useLocalSearchParams();
  const { summaries, loading, error, refetch } = useSectorSummary(Number(storeId) || 1);

  // Couleurs par secteur pour une meilleure visualisation
  const sectorColors: { [key: string]: string[] } = {
    'Frais': ['#10b981', '#059669'],
    'Épicerie Sucrée': ['#f59e0b', '#d97706'],
    'Épicerie Salée': ['#ef4444', '#dc2626'],
    'Boissons': ['#3b82f6', '#1d4ed8'],
    'Hygiène & Beauté': ['#ec4899', '#db2777'],
    'Entretien': ['#8b5cf6', '#7c3aed'],
    'Textile': ['#14b8a6', '#0d9488'],
    'Bazar': ['#f97316', '#ea580c'],
  };

  const getColorForSector = (sectorName: string): string[] => {
    return sectorColors[sectorName] || ['#6b7280', '#4b5563'];
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
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
            Vue par Secteur
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            Gestion globale du magasin
          </Text>
        </View>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
          <RefreshCw color={isDark ? '#a1a1aa' : '#6b7280'} size={20} strokeWidth={2} />
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
        {loading && summaries.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Chargement des secteurs...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
          </View>
        ) : summaries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package color={isDark ? '#a1a1aa' : '#6b7280'} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Aucun secteur trouvé
            </Text>
          </View>
        ) : (
          <View style={styles.sectorsGrid}>
            {summaries.map((sector) => {
              const colors = getColorForSector(sector.sector_name);
              const progress = calculateProgress(sector.completed_tasks, sector.total_tasks);

              return (
                <TouchableOpacity
                  key={sector.sector_id}
                  onPress={() => router.push(`/sector-details?sectorId=${sector.sector_id}&sectorName=${sector.sector_name}`)}
                  style={styles.sectorCardContainer}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={colors}
                    style={styles.sectorCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Titre du secteur */}
                    <View style={styles.sectorHeader}>
                      <Text style={styles.sectorName}>{sector.sector_name}</Text>
                      <ChevronRight color="#ffffff" size={20} strokeWidth={2} />
                    </View>

                    {/* Stats principales */}
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Users color="#ffffff" size={18} strokeWidth={2} />
                        <Text style={styles.statValue}>{sector.active_employees}/{sector.total_employees}</Text>
                        <Text style={styles.statLabel}>Actifs</Text>
                      </View>

                      <View style={styles.stat}>
                        <Package color="#ffffff" size={18} strokeWidth={2} />
                        <Text style={styles.statValue}>{sector.completed_packages}/{sector.total_packages}</Text>
                        <Text style={styles.statLabel}>Colis</Text>
                      </View>

                      <View style={styles.stat}>
                        <CheckCircle color="#ffffff" size={18} strokeWidth={2} />
                        <Text style={styles.statValue}>{progress}%</Text>
                        <Text style={styles.statLabel}>Complété</Text>
                      </View>
                    </View>

                    {/* Temps restant */}
                    <View style={styles.timeContainer}>
                      <Clock color="#ffffff" size={16} strokeWidth={2} />
                      <Text style={styles.timeText}>
                        {formatTime(sector.remaining_work_minutes)} restant
                      </Text>
                    </View>

                    {/* Barre de progression */}
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Statistiques globales */}
        {!loading && summaries.length > 0 && (
          <View style={[styles.globalStats, isDark && styles.globalStatsDark]}>
            <Text style={[styles.globalStatsTitle, isDark && styles.globalStatsTitleDark]}>
              Statistiques Globales
            </Text>
            <View style={styles.globalStatsGrid}>
              <View style={styles.globalStatItem}>
                <Text style={[styles.globalStatValue, isDark && styles.globalStatValueDark]}>
                  {summaries.reduce((acc, s) => acc + s.total_employees, 0)}
                </Text>
                <Text style={[styles.globalStatLabel, isDark && styles.globalStatLabelDark]}>
                  Employés total
                </Text>
              </View>
              <View style={styles.globalStatItem}>
                <Text style={[styles.globalStatValue, isDark && styles.globalStatValueDark]}>
                  {summaries.reduce((acc, s) => acc + s.total_packages, 0).toLocaleString()}
                </Text>
                <Text style={[styles.globalStatLabel, isDark && styles.globalStatLabelDark]}>
                  Colis total
                </Text>
              </View>
              <View style={styles.globalStatItem}>
                <Text style={[styles.globalStatValue, isDark && styles.globalStatValueDark]}>
                  {formatTime(summaries.reduce((acc, s) => acc + s.total_work_minutes, 0))}
                </Text>
                <Text style={[styles.globalStatLabel, isDark && styles.globalStatLabelDark]}>
                  Temps total
                </Text>
              </View>
            </View>
          </View>
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
  refreshButton: {
    padding: 8,
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
  sectorsGrid: {
    gap: 16,
  },
  sectorCardContainer: {
    marginBottom: 16,
  },
  sectorCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  globalStats: {
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
  globalStatsDark: {
    backgroundColor: '#27272a',
  },
  globalStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  globalStatsTitleDark: {
    color: '#ffffff',
  },
  globalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  globalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  globalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  globalStatValueDark: {
    color: '#ffffff',
  },
  globalStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  globalStatLabelDark: {
    color: '#a1a1aa',
  },
});
