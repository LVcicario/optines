import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

interface Schedule {
  id?: number;
  employee_id: string;
  work_date: string;
  work_start: string;
  work_end: string;
  is_present: boolean;
}

export default function EmployeeSchedule() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { employeeId, employeeName } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>({
    employee_id: employeeId as string,
    work_date: new Date().toISOString().split('T')[0],
    work_start: '08:00',
    work_end: '17:00',
    is_present: true,
  });

  useEffect(() => {
    fetchSchedule();
  }, [employeeId]);

  async function fetchSchedule() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSchedule(data);
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      Alert.alert('Erreur', 'Impossible de charger l\'horaire');
    } finally {
      setLoading(false);
    }
  }

  async function saveSchedule() {
    try {
      setSaving(true);

      // Obtenir le store_id de l'employé
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('store_id')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      const scheduleData = {
        employee_id: employeeId,
        store_id: employeeData.store_id,
        work_date: schedule.work_date,
        work_start: schedule.work_start,
        work_end: schedule.work_end,
        is_present: schedule.is_present,
      };

      if (schedule.id) {
        // Mise à jour
        const { error } = await supabase
          .from('employee_schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
      } else {
        // Création
        const { data, error } = await supabase
          .from('employee_schedules')
          .insert([scheduleData])
          .select()
          .single();

        if (error) throw error;
        setSchedule({ ...schedule, id: data.id });
      }

      Alert.alert('Succès', 'Horaire enregistré avec succès');
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      Alert.alert('Erreur', err.message || 'Impossible de sauvegarder l\'horaire');
    } finally {
      setSaving(false);
    }
  }

  const calculateWorkHours = (): string => {
    const [startHour, startMin] = schedule.work_start.split(':').map(Number);
    const [endHour, endMin] = schedule.work_end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;

    if (totalMinutes <= 0) return '0h00';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h${minutes.toString().padStart(2, '0')}`;
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
            Horaires
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            {employeeName}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Chargement...
            </Text>
          </View>
        ) : (
          <>
            {/* Date */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <View style={styles.sectionHeader}>
                <Calendar color={isDark ? '#a1a1aa' : '#6b7280'} size={20} strokeWidth={2} />
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  Date
                </Text>
              </View>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={schedule.work_date}
                onChangeText={(text) => setSchedule({ ...schedule, work_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
              />
            </View>

            {/* Horaires */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <View style={styles.sectionHeader}>
                <Clock color={isDark ? '#a1a1aa' : '#6b7280'} size={20} strokeWidth={2} />
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  Horaires de travail
                </Text>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
                    Début
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={schedule.work_start}
                    onChangeText={(text) => setSchedule({ ...schedule, work_start: text })}
                    placeholder="08:00"
                    placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
                    Fin
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={schedule.work_end}
                    onChangeText={(text) => setSchedule({ ...schedule, work_end: text })}
                    placeholder="17:00"
                    placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              {/* Durée calculée */}
              <View style={[styles.durationCard, isDark && styles.durationCardDark]}>
                <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                  Durée totale
                </Text>
                <Text style={[styles.durationValue, isDark && styles.durationValueDark]}>
                  {calculateWorkHours()}
                </Text>
              </View>
            </View>

            {/* Présence */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Statut de présence
              </Text>

              <View style={styles.presenceButtons}>
                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    schedule.is_present && styles.presenceButtonActive,
                    isDark && styles.presenceButtonDark,
                    schedule.is_present && styles.presenceButtonActiveDark,
                  ]}
                  onPress={() => setSchedule({ ...schedule, is_present: true })}
                >
                  <CheckCircle
                    color={schedule.is_present ? '#ffffff' : (isDark ? '#a1a1aa' : '#6b7280')}
                    size={20}
                    strokeWidth={2}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    schedule.is_present && styles.presenceButtonTextActive,
                    isDark && styles.presenceButtonTextDark,
                  ]}>
                    Présent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    !schedule.is_present && styles.presenceButtonAbsent,
                    isDark && styles.presenceButtonDark,
                    !schedule.is_present && styles.presenceButtonAbsentDark,
                  ]}
                  onPress={() => setSchedule({ ...schedule, is_present: false })}
                >
                  <XCircle
                    color={!schedule.is_present ? '#ffffff' : (isDark ? '#a1a1aa' : '#6b7280')}
                    size={20}
                    strokeWidth={2}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    !schedule.is_present && styles.presenceButtonTextActive,
                    isDark && styles.presenceButtonTextDark,
                  ]}>
                    Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton Sauvegarder */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveSchedule}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Save color="#ffffff" size={20} strokeWidth={2} />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
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
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#27272a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputDark: {
    backgroundColor: '#3f3f46',
    color: '#ffffff',
    borderColor: '#52525b',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  timeLabelDark: {
    color: '#a1a1aa',
  },
  durationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationCardDark: {
    backgroundColor: '#1e3a8a',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  durationLabelDark: {
    color: '#93c5fd',
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
  },
  durationValueDark: {
    color: '#dbeafe',
  },
  presenceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  presenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  presenceButtonDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  presenceButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  presenceButtonActiveDark: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  presenceButtonAbsent: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  presenceButtonAbsentDark: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  presenceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  presenceButtonTextDark: {
    color: '#a1a1aa',
  },
  presenceButtonTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
});
