import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar as CalendarIcon, Clock, Plus, MapPin, Package, Users, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

interface ScheduledTask {
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

interface Event {
  id: number;
  title: string;
  time: string;
  duration: string;
  location: string;
  type: string;
}

interface WorkingHours {
  start: string;
  end: string;
}

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });
  const [tempWorkingHours, setTempWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });

  const events: Event[] = [
    {
      id: 1,
      title: 'Réunion équipe',
      time: '09:00',
      duration: '1h',
      location: 'Salle de pause',
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Formation sécurité',
      time: '16:30',
      duration: '1h30',
      location: 'Salle de formation',
      type: 'training'
    }
  ];

  useEffect(() => {
    // Load scheduled tasks from localStorage
    const loadTasks = () => {
      const tasks = JSON.parse(localStorage.getItem('scheduledTasks') || '[]');
      setScheduledTasks(tasks);
    };

    loadTasks();
    
    // Listen for storage changes (when new tasks are added)
    const handleStorageChange = () => {
      loadTasks();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for updates
    const interval = setInterval(loadTasks, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedTasks = scheduledTasks.filter(task => task.id !== taskId);
            setScheduledTasks(updatedTasks);
            localStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
          }
        }
      ]
    );
  };

  const addEvent = () => {
    if (!eventTitle.trim() || !eventTime.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // In a real app, this would save to a backend
    Alert.alert('Événement ajouté', `"${eventTitle}" programmé pour ${eventTime}`);
    setEventTitle('');
    setEventTime('');
    setEventLocation('');
    setShowEventModal(false);
  };

  const saveWorkingHours = () => {
    setWorkingHours(tempWorkingHours);
    setShowWorkingHoursModal(false);
    Alert.alert('Horaires mis à jour', `Nouvelles heures de travail: ${tempWorkingHours.start} - ${tempWorkingHours.end}`);
  };

  const getTasksForSelectedDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    return scheduledTasks.filter(task => task.date === selectedDateString);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return '#3b82f6';
      case 'inspection': return '#10b981';
      case 'training': return '#f59e0b';
      case 'task': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Generate full week (Monday to Sunday)
  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Find Monday of the current week + offset
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as well
    startOfWeek.setDate(today.getDate() + daysToMonday + (currentWeek * 7));

    // Generate Monday to Sunday (7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getWeekLabel = () => {
    if (currentWeek === 0) return 'Cette semaine';
    if (currentWeek === 1) return 'Semaine prochaine';
    if (currentWeek === -1) return 'Semaine dernière';
    return `Semaine ${currentWeek > 0 ? '+' : ''}${currentWeek}`;
  };

  const navigateWeek = (direction: number) => {
    setCurrentWeek(currentWeek + direction);
    // Reset selected date to first day of new week if it's not in the current week
    const newWeekDates = generateWeekDates();
    if (direction !== 0) {
      setSelectedDate(newWeekDates[0]);
    }
  };

  const getDayName = (date: Date) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return dayNames[date.getDay()];
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const tasksForSelectedDate = getTasksForSelectedDate();
  const weekDates = generateWeekDates();
  const timeSlots = generateTimeSlots();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CalendarIcon color="#3b82f6" size={32} strokeWidth={2} />
          <Text style={styles.title}>Planning Rayon</Text>
          <Text style={styles.subtitle}>Organisez vos activités et tâches (7j/7)</Text>
        </View>

        {/* Working Hours Display */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.workingHoursCard}
            onPress={() => {
              setTempWorkingHours(workingHours);
              setShowWorkingHoursModal(true);
            }}
          >
            <View style={styles.workingHoursContent}>
              <Clock color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={styles.workingHoursText}>
                Heures de travail: {workingHours.start} - {workingHours.end}
              </Text>
            </View>
            <Text style={styles.workingHoursHint}>Appuyer pour modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View style={styles.section}>
          <View style={styles.weekHeader}>
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => navigateWeek(-1)}
            >
              <ChevronLeft color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <Text style={styles.weekTitle}>{getWeekLabel()}</Text>
            
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => navigateWeek(1)}
            >
              <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Week Carousel - 7 days */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekContainer}>
            {weekDates.map((date, index) => {
              const dayTasks = scheduledTasks.filter(task => task.date === date.toISOString().split('T')[0]);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    isSameDate(date, selectedDate) && styles.selectedDayCard,
                    isToday(date) && styles.todayCard
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayName,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                    isToday(date) && styles.todayText
                  ]}>
                    {getDayName(date)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                    isToday(date) && styles.todayText
                  ]}>
                    {date.getDate()}
                  </Text>
                  {/* Task indicators */}
                  <View style={styles.taskIndicators}>
                    {dayTasks.length > 0 && (
                      <View style={styles.taskIndicator}>
                        <Text style={styles.taskIndicatorText}>{dayTasks.length}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? 'Aujourd\'hui' : formatDateForDisplay(selectedDate)}
          </Text>
          <View style={styles.dateCard}>
            <Text style={styles.dateText}>
              {formatDateForDisplay(selectedDate)}
            </Text>
            <View style={styles.dateSummary}>
              <Text style={styles.dateSummaryText}>
                {tasksForSelectedDate.length} tâche{tasksForSelectedDate.length !== 1 ? 's' : ''} planifiée{tasksForSelectedDate.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Scheduled Tasks */}
        {tasksForSelectedDate.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tâches planifiées</Text>
              <Text style={styles.taskCount}>{tasksForSelectedDate.length} tâche{tasksForSelectedDate.length > 1 ? 's' : ''}</Text>
            </View>

            {tasksForSelectedDate.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={[styles.taskIndicatorLine, { backgroundColor: '#8b5cf6' }]} />
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Trash2 color="#ef4444" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.taskDetails}>
                    <View style={styles.taskDetailRow}>
                      <Clock color="#6b7280" size={16} strokeWidth={2} />
                      <Text style={styles.taskDetailText}>
                        {task.startTime} - {task.endTime} ({task.duration})
                      </Text>
                    </View>
                    
                    <View style={styles.taskDetailRow}>
                      <Package color="#6b7280" size={16} strokeWidth={2} />
                      <Text style={styles.taskDetailText}>
                        {task.packages} colis à traiter
                      </Text>
                    </View>
                    
                    <View style={styles.taskDetailRow}>
                      <Users color="#6b7280" size={16} strokeWidth={2} />
                      <Text style={styles.taskDetailText}>
                        {task.teamSize} membre{task.teamSize > 1 ? 's' : ''} d'équipe
                      </Text>
                    </View>
                    
                    <View style={styles.taskDetailRow}>
                      <MapPin color="#6b7280" size={16} strokeWidth={2} />
                      <Text style={styles.taskDetailText}>
                        Rayon {task.managerSection}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Regular Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Événements du jour</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowEventModal(true)}
            >
              <Plus color="#ffffff" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View 
                style={[
                  styles.eventIndicator, 
                  { backgroundColor: getEventColor(event.type) }
                ]} 
              />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventTime}>
                    <Clock color="#6b7280" size={16} strokeWidth={2} />
                    <Text style={styles.eventTimeText}>{event.time}</Text>
                  </View>
                </View>
                <Text style={styles.eventDuration}>Durée: {event.duration}</Text>
                <View style={styles.eventLocation}>
                  <MapPin color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.eventLocationText}>{event.location}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowEventModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Planifier un événement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <Package color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Programmer une livraison</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              setTempWorkingHours(workingHours);
              setShowWorkingHoursModal(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fffbeb' }]}>
              <Clock color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Modifier les heures de travail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Working Hours Modal */}
      <Modal
        visible={showWorkingHoursModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkingHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Heures de travail</Text>
              <TouchableOpacity onPress={() => setShowWorkingHoursModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heure de début</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeOption,
                        tempWorkingHours.start === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempWorkingHours({...tempWorkingHours, start: time})}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempWorkingHours.start === time && styles.selectedTimeText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heure de fin</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeOption,
                        tempWorkingHours.end === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempWorkingHours({...tempWorkingHours, end: time})}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempWorkingHours.end === time && styles.selectedTimeText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowWorkingHoursModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={saveWorkingHours}
              >
                <Text style={styles.primaryButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Ex: Réunion équipe"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heure *</Text>
              <TextInput
                style={styles.input}
                value={eventTime}
                onChangeText={setEventTime}
                placeholder="Ex: 14:00"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lieu</Text>
              <TextInput
                style={styles.input}
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholder="Ex: Salle de pause"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={addEvent}
              >
                <Text style={styles.primaryButtonText}>Ajouter</Text>
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
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  workingHoursCard: {
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
  workingHoursContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workingHoursText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  workingHoursHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekNavButton: {
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
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  taskCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  weekContainer: {
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  selectedDayCard: {
    backgroundColor: '#3b82f6',
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedDayText: {
    color: '#ffffff',
  },
  todayText: {
    color: '#10b981',
    fontWeight: '700',
  },
  taskIndicators: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
  },
  taskIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
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
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  dateSummary: {
    alignItems: 'center',
  },
  dateSummaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  taskIndicatorLine: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDetails: {
    gap: 8,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  eventIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTimeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  eventDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  actionCard: {
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
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  timePickerSection: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  timePickerScroll: {
    maxHeight: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  timeOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});