import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { Calculator, Clock, Package, Users, Plus, Minus, TriangleAlert as AlertTriangle, Calendar, X } from 'lucide-react-native';
import { router } from 'expo-router';

interface TeamMember {
  id: number;
  name: string;
}

interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  date: string;
  packages: number;
  teamSize: number;
  managerSection: string;
  managerInitials: string;
}

export default function JobCalculatorTab() {
  const [packages, setPackages] = useState('');
  const [paletteCondition, setPaletteCondition] = useState(true); // true = good, false = bad
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 1, name: 'Membre principal' }
  ]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Manager information (this would normally come from authentication)
  const currentManager = {
    name: 'Marie Dubois',
    section: 'Fruits & Légumes',
    initials: 'MD'
  };

  const addTeamMember = () => {
    if (teamMembers.length < 3) {
      const newId = Math.max(...teamMembers.map(m => m.id)) + 1;
      setTeamMembers([...teamMembers, { id: newId, name: `Membre ${newId}` }]);
    }
  };

  const removeTeamMember = (id: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter(member => member.id !== id));
    }
  };

  const calculateWorkTime = () => {
    const packageCount = parseInt(packages) || 0;
    
    // Base time: 40 seconds per package
    const baseTimeSeconds = packageCount * 40;
    
    // Palette condition penalty: 20 minutes if bad condition
    const palettePenaltySeconds = paletteCondition ? 0 : 20 * 60;
    
    // Team efficiency: each additional member saves 30 minutes (1800 seconds)
    const additionalMembers = teamMembers.length - 1;
    const teamBonusSeconds = additionalMembers * 30 * 60;
    
    // Calculate total time
    const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds - teamBonusSeconds);
    
    // Convert to hours and minutes
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = totalTimeSeconds % 60;
    
    return {
      baseTime: baseTimeSeconds,
      palettePenalty: palettePenaltySeconds,
      teamBonus: teamBonusSeconds,
      totalTime: totalTimeSeconds,
      hours,
      minutes,
      seconds,
      formattedTime: `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`
    };
  };

  const timeCalculation = calculateWorkTime();

  const getTimeColor = (totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    if (hours <= 2) return '#10b981'; // green - excellent
    if (hours <= 4) return '#3b82f6'; // blue - good
    if (hours <= 6) return '#f59e0b'; // orange - warning
    return '#ef4444'; // red - critical
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const calculateEndTime = (startTime: string, durationSeconds: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startTask = () => {
    if (!packages || parseInt(packages) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de colis valide');
      return;
    }

    const startTime = '05:00'; // All teams start at 5 AM
    const endTime = calculateEndTime(startTime, timeCalculation.totalTime);
    
    const task: Task = {
      id: Date.now().toString(),
      title: `${currentManager.section} - ${currentManager.initials}`,
      startTime,
      endTime,
      duration: timeCalculation.formattedTime,
      date: selectedDate.toISOString().split('T')[0],
      packages: parseInt(packages),
      teamSize: teamMembers.length,
      managerSection: currentManager.section,
      managerInitials: currentManager.initials
    };

    // Store task in local storage (in a real app, this would be sent to a backend)
    const existingTasks = JSON.parse(localStorage.getItem('scheduledTasks') || '[]');
    existingTasks.push(task);
    localStorage.setItem('scheduledTasks', JSON.stringify(existingTasks));

    setShowTaskModal(true);
  };

  const goToCalendar = () => {
    setShowTaskModal(false);
    router.push('/(manager-tabs)/calendar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Calculator color="#3b82f6" size={32} strokeWidth={2} />
          <Text style={styles.title}>Calculateur d'Équipe</Text>
          <Text style={styles.subtitle}>Calculez le temps de travail de votre équipe</Text>
          <View style={styles.managerInfo}>
            <Text style={styles.managerText}>Manager: {currentManager.name}</Text>
            <Text style={styles.sectionText}>Rayon: {currentManager.section}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date de planification</Text>
          
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar color="#3b82f6" size={20} strokeWidth={2} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Package Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres de la tâche</Text>
          
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Package color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={styles.inputLabel}>Nombre de colis à traiter</Text>
            </View>
            <TextInput
              style={styles.input}
              value={packages}
              onChangeText={setPackages}
              placeholder="Ex: 150"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputNote}>Base: 40 secondes par colis</Text>
          </View>

          {/* Palette Condition */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <AlertTriangle 
                color={paletteCondition ? "#10b981" : "#ef4444"} 
                size={20} 
                strokeWidth={2} 
              />
              <Text style={styles.inputLabel}>État de la palette</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, !paletteCondition && styles.activeLabel]}>
                Mauvais état (+20 min)
              </Text>
              <Switch
                value={paletteCondition}
                onValueChange={setPaletteCondition}
                trackColor={{ false: '#ef4444', true: '#10b981' }}
                thumbColor={paletteCondition ? '#ffffff' : '#ffffff'}
              />
              <Text style={[styles.switchLabel, paletteCondition && styles.activeLabel]}>
                Bon état
              </Text>
            </View>
          </View>
        </View>

        {/* Team Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Composition de l'équipe</Text>
            <Text style={styles.teamCount}>{teamMembers.length}/3 membres</Text>
          </View>
          
          {teamMembers.map((member, index) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Users color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={styles.memberName}>{member.name}</Text>
                {index === 0 && <Text style={styles.principalBadge}>Principal</Text>}
                {index > 0 && <Text style={styles.bonusBadge}>-30 min</Text>}
              </View>
              {teamMembers.length > 1 && index > 0 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeTeamMember(member.id)}
                >
                  <Minus color="#ef4444" size={16} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {teamMembers.length < 3 && (
            <TouchableOpacity style={styles.addMemberButton} onPress={addTeamMember}>
              <Plus color="#10b981" size={20} strokeWidth={2} />
              <Text style={styles.addMemberText}>Ajouter un membre d'équipe</Text>
            </TouchableOpacity>
          )}

          <View style={styles.teamNote}>
            <Text style={styles.noteText}>
              💡 Chaque membre supplémentaire réduit le temps de 30 minutes
            </Text>
          </View>
        </View>

        {/* Time Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail du calcul</Text>
          
          <View style={styles.calculationCard}>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Temps de base</Text>
              <Text style={styles.calculationValue}>
                {Math.floor(timeCalculation.baseTime / 60)} min
              </Text>
            </View>
            
            {!paletteCondition && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, styles.penaltyText]}>
                  Pénalité palette
                </Text>
                <Text style={[styles.calculationValue, styles.penaltyText]}>
                  +{Math.floor(timeCalculation.palettePenalty / 60)} min
                </Text>
              </View>
            )}
            
            {teamMembers.length > 1 && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, styles.bonusText]}>
                  Bonus équipe ({teamMembers.length - 1} membres)
                </Text>
                <Text style={[styles.calculationValue, styles.bonusText]}>
                  -{Math.floor(timeCalculation.teamBonus / 60)} min
                </Text>
              </View>
            )}

            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleLabel}>Horaires prévus:</Text>
              <Text style={styles.scheduleTime}>
                Début: 05:00 - Fin: {calculateEndTime('05:00', timeCalculation.totalTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Final Result */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temps total estimé</Text>
          
          <View style={[styles.resultCard, { borderColor: getTimeColor(timeCalculation.totalTime) }]}>
            <View style={styles.resultHeader}>
              <Clock color={getTimeColor(timeCalculation.totalTime)} size={32} strokeWidth={2} />
              <Text style={[styles.resultTime, { color: getTimeColor(timeCalculation.totalTime) }]}>
                {timeCalculation.formattedTime}
              </Text>
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={styles.resultLabel}>
                Pour {packages || '0'} colis avec {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
              </Text>
              {!paletteCondition && (
                <Text style={styles.warningText}>
                  ⚠️ Palette en mauvais état - temps majoré
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={startTask}>
            <Text style={styles.saveButtonText}>Démarrer la tâche</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sauvegarder le calcul</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateList}>
              {generateDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateOption,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateOption
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.dateOptionText,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                  ]}>
                    {formatDate(date)}
                  </Text>
                  {index === 0 && <Text style={styles.todayBadge}>Aujourd'hui</Text>}
                  {index === 1 && <Text style={styles.tomorrowBadge}>Demain</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Task Confirmation Modal */}
      <Modal
        visible={showTaskModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.taskModal}>
            <View style={styles.successIcon}>
              <Clock color="#10b981" size={32} strokeWidth={2} />
            </View>
            
            <Text style={styles.successTitle}>Tâche planifiée !</Text>
            <Text style={styles.successMessage}>
              La tâche "{currentManager.section} - {currentManager.initials}" a été ajoutée au calendrier pour le {formatDate(selectedDate)} de 05:00 à {calculateEndTime('05:00', timeCalculation.totalTime)}.
            </Text>
            
            <View style={styles.taskSummary}>
              <Text style={styles.summaryItem}>📦 {packages} colis à traiter</Text>
              <Text style={styles.summaryItem}>👥 {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} d'équipe</Text>
              <Text style={styles.summaryItem}>⏱️ Durée: {timeCalculation.formattedTime}</Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowTaskModal(false)}
              >
                <Text style={styles.modalButtonText}>Continuer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={goToCalendar}
              >
                <Text style={styles.primaryModalButtonText}>Voir le calendrier</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  managerInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  managerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
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
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  inputNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  principalBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bonusBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addMemberButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  teamNote: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
  calculationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calculationLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  calculationValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  penaltyText: {
    color: '#ef4444',
  },
  bonusText: {
    color: '#10b981',
  },
  scheduleInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTime: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 16,
  },
  resultDetails: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateOption: {
    backgroundColor: '#3b82f6',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  selectedDateText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tomorrowBadge: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  taskSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  primaryModalButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});