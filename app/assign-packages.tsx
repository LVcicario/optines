import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Package,
  Users,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useSectorEmployees, EmployeeWithAvailability } from '../hooks/useSupabaseSectors';

interface AssignmentMode {
  mode: 'manual' | 'auto';
  selectedEmployeeId?: string;
}

export default function AssignPackages() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { sectorId, sectorName, departmentId, departmentName } = useLocalSearchParams();

  const { employees, loading: loadingEmployees, refetch } = useSectorEmployees(
    Number(sectorId)
  );

  const [packages, setPackages] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>({ mode: 'auto' });
  const [assigning, setAssigning] = useState(false);

  const calculateDuration = (numPackages: number): number => {
    // Formule: (packages × 42s) × 1.2
    return Math.round((numPackages * 42) * 1.2);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
  };

  const findBestEmployee = (availableEmployees: EmployeeWithAvailability[], requiredMinutes: number): EmployeeWithAvailability | null => {
    // Filtrer les employés avec assez de temps
    const suitableEmployees = availableEmployees.filter(
      emp => emp.is_available && emp.remaining_work_minutes >= requiredMinutes
    );

    if (suitableEmployees.length === 0) return null;

    // Choisir celui qui a le plus de temps restant (pour équilibrer la charge)
    return suitableEmployees.reduce((best, current) =>
      current.remaining_work_minutes > best.remaining_work_minutes ? current : best
    );
  };

  const handleAssign = async () => {
    try {
      if (!packages || parseInt(packages) <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer un nombre de colis valide');
        return;
      }

      if (!title.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer un titre pour la tâche');
        return;
      }

      setAssigning(true);

      const numPackages = parseInt(packages);
      const durationSeconds = calculateDuration(numPackages);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      let targetEmployeeId: string | undefined;

      if (assignmentMode.mode === 'auto') {
        // Assignation automatique
        const filteredEmployees = departmentId
          ? employees.filter(emp => emp.department_id === Number(departmentId))
          : employees;

        const bestEmployee = findBestEmployee(filteredEmployees, durationMinutes);

        if (!bestEmployee) {
          Alert.alert(
            'Aucun employé disponible',
            'Tous les employés de ce rayon sont occupés ou n\'ont pas assez de temps restant.',
            [{ text: 'OK' }]
          );
          setAssigning(false);
          return;
        }

        targetEmployeeId = bestEmployee.id;
      } else {
        // Assignation manuelle
        if (!assignmentMode.selectedEmployeeId) {
          Alert.alert('Erreur', 'Veuillez sélectionner un employé');
          setAssigning(false);
          return;
        }

        const selectedEmployee = employees.find(emp => emp.id === assignmentMode.selectedEmployeeId);
        if (selectedEmployee && selectedEmployee.remaining_work_minutes < durationMinutes) {
          Alert.alert(
            'Attention',
            `L'employé sélectionné n'a que ${formatTime(selectedEmployee.remaining_work_minutes * 60)} de temps restant, mais cette tâche nécessite ${formatTime(durationSeconds)}. Continuer quand même?`,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => setAssigning(false) },
              { text: 'Continuer', onPress: () => createTask(assignmentMode.selectedEmployeeId!) }
            ]
          );
          return;
        }

        targetEmployeeId = assignmentMode.selectedEmployeeId;
      }

      await createTask(targetEmployeeId);
    } catch (err: any) {
      console.error('Error assigning packages:', err);
      Alert.alert('Erreur', err.message || 'Impossible d\'assigner les colis');
      setAssigning(false);
    }
  };

  const createTask = async (employeeId: string) => {
    try {
      const numPackages = parseInt(packages);
      const durationSeconds = calculateDuration(numPackages);

      // Obtenir le store_id de l'employé
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('store_id')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      // Créer la tâche
      const now = new Date();
      const startTime = now.toTimeString().split(' ')[0].substring(0, 5);
      const endDate = new Date(now.getTime() + durationSeconds * 1000);
      const endTime = endDate.toTimeString().split(' ')[0].substring(0, 5);

      const { error: taskError } = await supabase
        .from('tasks')
        .insert([{
          store_id: employeeData.store_id,
          employee_id: employeeId,
          sector_id: Number(sectorId),
          department_id: departmentId ? Number(departmentId) : null,
          title: title,
          description: description || null,
          date: now.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          packages: numPackages,
          calculated_duration: durationSeconds,
          time_per_package: 42,
          status: 'pending',
          team_size: 1,
        }]);

      if (taskError) throw taskError;

      Alert.alert(
        'Succès',
        `${numPackages} colis assignés avec succès!\nTemps estimé: ${formatTime(durationSeconds)}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Error creating task:', err);
      Alert.alert('Erreur', err.message || 'Impossible de créer la tâche');
    } finally {
      setAssigning(false);
    }
  };

  const numPackages = parseInt(packages) || 0;
  const estimatedDuration = numPackages > 0 ? calculateDuration(numPackages) : 0;

  // Filtrer les employés par rayon si spécifié
  const availableEmployees = departmentId
    ? employees.filter(emp => emp.department_id === Number(departmentId))
    : employees;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={isDark ? '#ffffff' : '#1a1a1a'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Assigner des Colis
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            {departmentName || sectorName}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Informations de la tâche */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Informations
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              Titre de la tâche *
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Mise en rayon fromages"
              placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              Description (optionnel)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, isDark && styles.inputDark]}
              value={description}
              onChangeText={setDescription}
              placeholder="Détails supplémentaires..."
              placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              Nombre de colis *
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={packages}
              onChangeText={setPackages}
              placeholder="125"
              placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
              keyboardType="number-pad"
            />
          </View>

          {/* Temps estimé */}
          {numPackages > 0 && (
            <View style={[styles.estimateCard, isDark && styles.estimateCardDark]}>
              <Clock color="#3b82f6" size={20} strokeWidth={2} />
              <View style={styles.estimateInfo}>
                <Text style={[styles.estimateLabel, isDark && styles.estimateLabelDark]}>
                  Temps estimé
                </Text>
                <Text style={[styles.estimateValue, isDark && styles.estimateValueDark]}>
                  {formatTime(estimatedDuration)}
                </Text>
              </View>
              <Text style={[styles.estimateFormula, isDark && styles.estimateFormulaDark]}>
                ({numPackages} × 42s) × 1.2
              </Text>
            </View>
          )}
        </View>

        {/* Mode d'assignation */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Mode d'assignation
          </Text>

          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                assignmentMode.mode === 'auto' && styles.modeButtonActive,
                isDark && styles.modeButtonDark,
              ]}
              onPress={() => setAssignmentMode({ mode: 'auto' })}
            >
              <Zap
                color={assignmentMode.mode === 'auto' ? '#ffffff' : (isDark ? '#a1a1aa' : '#6b7280')}
                size={20}
                strokeWidth={2}
              />
              <Text style={[
                styles.modeButtonText,
                assignmentMode.mode === 'auto' && styles.modeButtonTextActive,
                isDark && styles.modeButtonTextDark,
              ]}>
                Automatique
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                assignmentMode.mode === 'manual' && styles.modeButtonActive,
                isDark && styles.modeButtonDark,
              ]}
              onPress={() => setAssignmentMode({ mode: 'manual' })}
            >
              <Users
                color={assignmentMode.mode === 'manual' ? '#ffffff' : (isDark ? '#a1a1aa' : '#6b7280')}
                size={20}
                strokeWidth={2}
              />
              <Text style={[
                styles.modeButtonText,
                assignmentMode.mode === 'manual' && styles.modeButtonTextActive,
                isDark && styles.modeButtonTextDark,
              ]}>
                Manuel
              </Text>
            </TouchableOpacity>
          </View>

          {assignmentMode.mode === 'auto' ? (
            <View style={[styles.infoBox, isDark && styles.infoBoxDark]}>
              <Zap color="#3b82f6" size={16} strokeWidth={2} />
              <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
                Le système choisira automatiquement l'employé le plus disponible
              </Text>
            </View>
          ) : (
            <View style={styles.employeesList}>
              {loadingEmployees ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : availableEmployees.length === 0 ? (
                <View style={[styles.infoBox, styles.warningBox, isDark && styles.warningBoxDark]}>
                  <AlertTriangle color="#f59e0b" size={16} strokeWidth={2} />
                  <Text style={[styles.infoText, styles.warningText]}>
                    Aucun employé disponible dans ce rayon
                  </Text>
                </View>
              ) : (
                availableEmployees.map((employee) => {
                  const isSelected = assignmentMode.selectedEmployeeId === employee.id;
                  const hasEnoughTime = employee.remaining_work_minutes >= Math.ceil(estimatedDuration / 60);

                  return (
                    <TouchableOpacity
                      key={employee.id}
                      style={[
                        styles.employeeCard,
                        isSelected && styles.employeeCardSelected,
                        isDark && styles.employeeCardDark,
                      ]}
                      onPress={() => setAssignmentMode({
                        mode: 'manual',
                        selectedEmployeeId: employee.id
                      })}
                    >
                      <View style={styles.employeeInfo}>
                        <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
                          {employee.first_name} {employee.last_name}
                        </Text>
                        <Text style={[styles.employeeDepartment, isDark && styles.employeeDepartmentDark]}>
                          {employee.department_name}
                        </Text>
                        <Text style={[
                          styles.employeeTime,
                          hasEnoughTime ? styles.employeeTimeGood : styles.employeeTimeBad
                        ]}>
                          {formatTime(employee.remaining_work_minutes * 60)} restant
                        </Text>
                      </View>
                      {isSelected && (
                        <CheckCircle color="#10b981" size={24} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Bouton Assigner */}
        <TouchableOpacity
          style={[
            styles.assignButton,
            (assigning || !packages || !title.trim()) && styles.assignButtonDisabled
          ]}
          onPress={handleAssign}
          disabled={assigning || !packages || !title.trim()}
        >
          {assigning ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Package color="#ffffff" size={20} strokeWidth={2} />
              <Text style={styles.assignButtonText}>
                Assigner les colis
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#a1a1aa',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  estimateCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  estimateCardDark: {
    backgroundColor: '#1e3a8a',
  },
  estimateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  estimateLabel: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  estimateLabelDark: {
    color: '#93c5fd',
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginTop: 2,
  },
  estimateValueDark: {
    color: '#dbeafe',
  },
  estimateFormula: {
    fontSize: 12,
    color: '#60a5fa',
  },
  estimateFormulaDark: {
    color: '#93c5fd',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
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
  modeButtonDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  modeButtonTextDark: {
    color: '#a1a1aa',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
  },
  infoBoxDark: {
    backgroundColor: '#1e3a8a',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
  },
  infoTextDark: {
    color: '#93c5fd',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
  },
  warningBoxDark: {
    backgroundColor: '#78350f',
  },
  warningText: {
    color: '#92400e',
  },
  employeesList: {
    gap: 8,
    marginTop: 8,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  employeeCardDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  employeeCardSelected: {
    backgroundColor: '#e0f2fe',
    borderColor: '#10b981',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  employeeNameDark: {
    color: '#ffffff',
  },
  employeeDepartment: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  employeeDepartmentDark: {
    color: '#a1a1aa',
  },
  employeeTime: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  employeeTimeGood: {
    color: '#10b981',
  },
  employeeTimeBad: {
    color: '#ef4444',
  },
  assignButton: {
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
  assignButtonDisabled: {
    opacity: 0.5,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
});
