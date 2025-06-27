import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calculator, Clock, Package, Users, Plus, Minus, TriangleAlert as AlertTriangle, Calendar, X } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  status?: string;
  rating?: number;
  location?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  shift?: string;
  performance?: number;
  tasksCompleted?: number;
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
  teamMembers?: number[]; // IDs des membres de l'équipe
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('05:00');
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // États pour le nouveau sélecteur d'heure
  const [tempSelectedHour, setTempSelectedHour] = useState('05');
  const [tempSelectedMinute, setTempSelectedMinute] = useState('00');
  const [workingHours, setWorkingHours] = useState({ start: '05:00', end: '21:00' });

  // État pour la popup de conflit
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<{title: string, startTime: string, endTime: string} | null>(null);
  const [allConflicts, setAllConflicts] = useState<Array<{title: string, startTime: string, endTime: string, type?: string}>>([]);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);

  // État pour la notification d'heure hors plage
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  // État pour la barre de progression du cooldown
  const [cooldownProgress, setCooldownProgress] = useState(0);

  // États pour le menu de sélection des employés
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [allEmployees, setAllEmployees] = useState<TeamMember[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<TeamMember[]>([]);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<number[]>([]);

  // Animation pour le modal de date
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation pour la notification d'heure hors plage
  const notificationFadeAnim = useRef(new Animated.Value(0)).current;

  // Nombre d'employés de l'équipe rayon (basé sur l'équipe définie dans team.tsx)
  const totalEmployees = 4; // Nombre total d'employés dans l'équipe rayon
  const [availableEmployees, setAvailableEmployees] = useState(totalEmployees); // Employés réellement disponibles
  const [totalEmployeesDynamic, setTotalEmployeesDynamic] = useState(totalEmployees); // Nombre total d'employés dynamique

  // Charger le nombre total d'employés depuis AsyncStorage
  useEffect(() => {
    loadTotalEmployees();
  }, []);

  // Charger tous les employés de l'équipe rayon
  useEffect(() => {
    loadAllEmployees();
  }, []);

  const loadAllEmployees = async () => {
    try {
      const savedTeam = await AsyncStorage.getItem('teamMembers');
      if (savedTeam) {
        const employees = JSON.parse(savedTeam);
        setAllEmployees(employees);
      }
    } catch (error) {
      console.error('Error loading all employees:', error);
    }
  };

  // Vérifier si un employé est déjà assigné à une tâche qui se chevauche
  const isEmployeeAssigned = async (employeeId: number) => {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];
      
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const tasksOnSameDate = existingTasks.filter((task: any) => task.date === selectedDateString);
      
      // Calculer la durée de la nouvelle tâche
      const packageCount = parseInt(packages) || 0;
      const baseTimeSeconds = packageCount * 40;
      const palettePenaltySeconds = paletteCondition ? 0 : 20 * 60;
      const additionalMembers = teamMembers.length - 1;
      const teamBonusSeconds = additionalMembers * 30 * 60;
      const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds - teamBonusSeconds);
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, totalTimeSeconds);
      
      console.log('Checking employee assignment:', {
        employeeId,
        newTaskStart,
        newTaskEnd,
        totalTimeSeconds,
        tasksOnSameDate: tasksOnSameDate.length
      });
      
      // Vérifier si l'employé est dans une tâche qui se chevauche
      for (const task of tasksOnSameDate) {
        const existingStart = task.startTime;
        const existingEnd = task.endTime;
        
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        // Vérifier si l'employé est dans cette tâche
        const isInTask = task.teamMembers && task.teamMembers.includes(employeeId);
        
        // Pour les anciennes tâches sans teamMembers, on considère que tous les employés sont assignés
        // car on ne peut pas savoir qui était assigné
        const isLegacyTask = !task.teamMembers;
        
        // Ne pas considérer comme conflit si c'est la même tâche (même heure de début)
        const isSameTask = existingStart === newTaskStart;
        
        if (hasConflict && (isInTask || isLegacyTask) && !isSameTask) {
          console.log(`Employee ${employeeId} is assigned to conflicting task:`, task.title);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking employee assignment:', error);
      return false;
    }
  };

  // Recharger les données quand l'utilisateur revient sur cette page
  useFocusEffect(
    React.useCallback(() => {
      loadTotalEmployees();
    }, [])
  );

  // Recharger les heures de travail quand l'utilisateur revient sur cette page
  useFocusEffect(
    React.useCallback(() => {
      loadWorkingHours();
    }, [])
  );

  // Charger les heures de travail au montage du composant
  useEffect(() => {
    loadWorkingHours();
  }, []);

  // Recalculer les employés disponibles quand les heures de travail changent
  useEffect(() => {
    calculateAvailableEmployees();
  }, [workingHours]);

  // Vérifier si l'heure sélectionnée est hors des horaires de travail
  const checkTimeInWorkingHours = () => {
    const taskStartMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
    const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
    const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
    
    const isOutOfRange = taskStartMinutes < workingStartMinutes || taskStartMinutes > workingEndMinutes;
    
    console.log('Time warning check:', {
      selectedStartTime,
      taskStartMinutes,
      workingHours,
      workingStartMinutes,
      workingEndMinutes,
      isOutOfRange,
      showTimeWarning
    });
    
    setShowTimeWarning(isOutOfRange);
  };

  // Surveiller les changements d'heure et d'horaires de travail
  useEffect(() => {
    checkTimeInWorkingHours();
  }, [selectedStartTime, workingHours]);

  // Animation de la notification
  useEffect(() => {
    if (showTimeWarning) {
      Animated.timing(notificationFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(notificationFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showTimeWarning, notificationFadeAnim]);

  const loadTotalEmployees = async () => {
    try {
      const savedTeam = await AsyncStorage.getItem('teamMembers');
      if (savedTeam) {
        const teamMembers = JSON.parse(savedTeam);
        setTotalEmployeesDynamic(teamMembers.length);
      }
    } catch (error) {
      console.error('Error loading total employees:', error);
    }
  };

  // Mettre à jour les employés disponibles quand le nombre total change
  useEffect(() => {
    calculateAvailableEmployees();
  }, [totalEmployeesDynamic]);

  useEffect(() => {
    if (showDatePicker) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150, // Animation très rapide de 150ms
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100, // Disparition encore plus rapide de 100ms
        useNativeDriver: true,
      }).start();
    }
  }, [showDatePicker, fadeAnim]);

  // Charger les heures de travail depuis AsyncStorage
  const loadWorkingHours = async () => {
    try {
      const savedHours = await AsyncStorage.getItem('workingHours');
      console.log('Loading working hours from AsyncStorage:', savedHours);
      
      if (savedHours) {
        const newWorkingHours = JSON.parse(savedHours);
        console.log('Setting new working hours:', newWorkingHours);
        setWorkingHours(newWorkingHours);
        
        // Vérifier si l'heure sélectionnée actuellement est dans la plage des nouvelles heures de travail
        const currentStartMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
        const newStartMinutes = parseInt(newWorkingHours.start.split(':')[0]) * 60 + parseInt(newWorkingHours.start.split(':')[1]);
        const newEndMinutes = parseInt(newWorkingHours.end.split(':')[0]) * 60 + parseInt(newWorkingHours.end.split(':')[1]);
        
        console.log('Time validation:', {
          currentStartTime: selectedStartTime,
          currentStartMinutes,
          newStartMinutes,
          newEndMinutes,
          isInRange: currentStartMinutes >= newStartMinutes && currentStartMinutes <= newEndMinutes
        });
        
        // Ne plus réinitialiser automatiquement l'heure pour permettre l'affichage de la notification
        // La notification s'affichera automatiquement via le useEffect qui surveille selectedStartTime et workingHours
      } else {
        console.log('No working hours found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
    }
  };

  // Générer les créneaux horaires selon les heures de travail
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

  // Générer les heures disponibles
  const generateAvailableHours = () => {
    const hours = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    console.log('Generating available hours:', {
      workingHours,
      startHour,
      endHour
    });
    
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push(hour.toString().padStart(2, '0'));
    }
    
    console.log('Available hours generated:', hours);
    return hours;
  };

  // Générer les minutes disponibles
  const generateAvailableMinutes = () => {
    const minutes = ['00', '10', '20', '30', '40', '50'];
    
    // Si l'heure sélectionnée est l'heure de fin, limiter les minutes
    if (tempSelectedHour === workingHours.end.split(':')[0]) {
      const endMinute = parseInt(workingHours.end.split(':')[1]);
      const availableMinutes = minutes.filter(minute => parseInt(minute) <= endMinute);
      console.log('Limited minutes for end hour:', availableMinutes);
      return availableMinutes;
    }
    
    return minutes;
  };

  // Manager information (this would normally come from authentication)
  const currentManager = {
    name: 'Marie Dubois',
    section: 'Fruits & Légumes',
    initials: 'MD'
  };

  // Fonction pour calculer les employés réellement disponibles
  const calculateAvailableEmployees = async () => {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];
      
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const tasksOnSameDate = existingTasks.filter((task: any) => task.date === selectedDateString);
      
      // Calculer le nombre d'employés déjà assignés à des tâches qui se chevauchent
      let assignedEmployees = 0;
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
      
      tasksOnSameDate.forEach((task: any) => {
        const existingStart = task.startTime;
        const existingEnd = task.endTime;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier si les plages horaires se chevauchent
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        if (hasConflict) {
          assignedEmployees += task.teamSize || 1;
        }
      });
      
      const actuallyAvailable = Math.max(0, totalEmployeesDynamic - assignedEmployees);
      setAvailableEmployees(actuallyAvailable);
      
      console.log('Available employees calculation:', {
        totalEmployees: totalEmployeesDynamic,
        assignedEmployees,
        actuallyAvailable,
        conflictingTasks: tasksOnSameDate.filter((task: any) => {
          const existingStart = task.startTime;
          const existingEnd = task.endTime;
          const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
          const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
          const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
          const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
          
          return (
            (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
            (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
            (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
          );
        }).map((t: any) => ({ title: t.title, teamSize: t.teamSize }))
      });
      
    } catch (error) {
      console.error('Error calculating available employees:', error);
      setAvailableEmployees(totalEmployeesDynamic);
    }
  };

  // Mettre à jour les employés disponibles quand la date ou l'heure de début change
  useEffect(() => {
    calculateAvailableEmployees();
  }, [selectedDate, selectedStartTime, packages, teamMembers.length, paletteCondition, totalEmployeesDynamic]);

  const addTeamMember = () => {
    const currentTeamSize = teamMembers.length;
    const remainingEmployees = availableEmployees - currentTeamSize;
    
    if (remainingEmployees > 0) {
      const newId = Math.max(...teamMembers.map(m => m.id)) + 1;
      setTeamMembers([...teamMembers, { id: newId, name: `Membre ${newId}` }]);
    } else {
      Alert.alert('Limite atteinte', `Tous les ${availableEmployees} employés disponibles sont déjà affectés à cette tâche`);
    }
  };

  const removeTeamMember = (id: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  // Ajouter un employé à l'équipe
  const addEmployeeToTeam = (employee: TeamMember) => {
    // Vérifier si l'employé est déjà occupé
    if (assignedEmployeeIds.includes(employee.id)) {
      console.log(`Cannot add employee ${employee.name} - already assigned to another task`);
      return;
    }
    
    if (!teamMembers.find(member => member.id === employee.id)) {
      const newTeamMembers = [...teamMembers, employee];
      setTeamMembers(newTeamMembers);
      
      // Rafraîchir la liste des employés disponibles
      if (showEmployeeSelector) {
        setTimeout(() => loadAssignedEmployees(), 100);
      }
    }
  };

  // Supprimer un employé de l'équipe
  const removeEmployeeFromTeam = (employeeId: number) => {
    const newTeamMembers = teamMembers.filter(member => member.id !== employeeId);
    setTeamMembers(newTeamMembers);
    
    // Rafraîchir la liste des employés disponibles
    if (showEmployeeSelector) {
      setTimeout(() => loadAssignedEmployees(), 100);
    }
  };

  // Ouvrir le sélecteur d'employés
  const openEmployeeSelector = () => {
    setShowEmployeeSelector(true);
    loadAssignedEmployees();
  };

  // Charger les employés déjà assignés
  const loadAssignedEmployees = async () => {
    try {
      const assignedIds: number[] = [];
      const currentTeamIds = teamMembers.map(member => member.id);
      
      console.log('Loading assigned employees:', {
        currentTeamIds,
        allEmployeesCount: allEmployees.length
      });
      
      for (const employee of allEmployees) {
        // Ne jamais considérer comme occupé si l'employé est déjà dans l'équipe actuelle
        if (currentTeamIds.includes(employee.id)) {
          console.log(`Employee ${employee.name} (${employee.id}) is in current team, skipping`);
          continue;
        }
        
        const isAssigned = await isEmployeeAssigned(employee.id);
        console.log(`Employee ${employee.name} (${employee.id}) is assigned:`, isAssigned);
        
        if (isAssigned) {
          assignedIds.push(employee.id);
        }
      }
      
      console.log('Final assigned employee IDs:', assignedIds);
      setAssignedEmployeeIds(assignedIds);
    } catch (error) {
      console.error('Error loading assigned employees:', error);
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
    
    // Retourner le format HH:MM pour les comparaisons
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatEndTimeForDisplay = (startTime: string, durationSeconds: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour trier les événements chronologiquement
  const sortEventsChronologically = (events: Array<{title: string, startTime: string, endTime: string, type?: string}>) => {
    return events.sort((a, b) => {
      const timeA = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
      const timeB = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
      return timeA - timeB;
    });
  };

  const checkPlanningConflicts = async () => {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];
      
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const tasksOnSameDate = existingTasks.filter((task: any) => task.date === selectedDateString);
      
      // Événements fixes (réunions, formations, etc.)
      const fixedEvents = [
        {
          title: 'Réunion équipe',
          startTime: '09:00',
          endTime: '10:00',
          type: 'meeting'
        },
        {
          title: 'Formation sécurité',
          startTime: '16:30',
          endTime: '18:00',
          type: 'training'
        }
      ];
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
      
      console.log('Checking conflicts for:', {
        newTaskStart,
        newTaskEnd,
        existingTasks: tasksOnSameDate.map((t: any) => ({ title: t.title, start: t.startTime, end: t.endTime })),
        fixedEvents: fixedEvents.map((e: any) => ({ title: e.title, start: e.startTime, end: e.endTime }))
      });
      
      // Vérifier les conflits avec les tâches planifiées
      const taskConflicts = tasksOnSameDate.filter((task: any) => {
        const existingStart = task.startTime;
        const existingEnd = task.endTime;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier si les plages horaires se chevauchent
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        console.log('Task conflict check:', {
          task: task.title,
          existingStart: existingStart,
          existingEnd: existingEnd,
          newStart: newTaskStart,
          newEnd: newTaskEnd,
          hasConflict
        });
        
        return hasConflict;
      }).map((task: any) => ({
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        type: 'task'
      }));
      
      // Vérifier les conflits avec les événements fixes
      const eventConflicts = fixedEvents.filter((event: any) => {
        const existingStart = event.startTime;
        const existingEnd = event.endTime;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier si les plages horaires se chevauchent
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        console.log('Event conflict check:', {
          event: event.title,
          existingStart: existingStart,
          existingEnd: existingEnd,
          newStart: newTaskStart,
          newEnd: newTaskEnd,
          hasConflict
        });
        
        return hasConflict;
      }).map((event: any) => ({
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type
      }));
      
      // Combiner et trier tous les conflits chronologiquement
      const allConflictsFound = sortEventsChronologically([...taskConflicts, ...eventConflicts]);
      
      if (allConflictsFound.length > 0) {
        setAllConflicts(allConflictsFound);
        // Garder le premier conflit pour la compatibilité avec l'interface existante
        setConflictDetails({
          title: allConflictsFound[0].title,
          startTime: allConflictsFound[0].startTime,
          endTime: allConflictsFound[0].endTime
        });
        setShowConflictModal(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  const startTask = async () => {
    if (!packages || parseInt(packages) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de colis valide');
      return;
    }

    if (availableEmployees === 0) {
      Alert.alert('Erreur', 'Aucun employé disponible pour cette plage horaire. Tous les employés sont déjà assignés à d\'autres tâches qui se chevauchent.');
      return;
    }

    if (teamMembers.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un membre d\'équipe à la tâche');
      return;
    }

    // Vérifier qu'aucun employé occupé n'est dans l'équipe
    const occupiedEmployees = teamMembers.filter(member => assignedEmployeeIds.includes(member.id));
    if (occupiedEmployees.length > 0) {
      const occupiedNames = occupiedEmployees.map(emp => emp.name).join(', ');
      Alert.alert(
        'Employés occupés', 
        `Les employés suivants sont déjà assignés à d'autres tâches : ${occupiedNames}. Veuillez les retirer de l'équipe.`
      );
      return;
    }

    // Validation des heures de travail
    const taskStartMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
    const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
    const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
    
    if (taskStartMinutes < workingStartMinutes || taskStartMinutes > workingEndMinutes) {
      Alert.alert(
        'Heure hors plage', 
        `La tâche doit commencer entre ${workingHours.start} et ${workingHours.end} selon le planning.`
      );
      return;
    }

    const endTime = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
    
    const task: Task = {
      id: Date.now().toString(),
      title: `${currentManager.section} - ${currentManager.initials}`,
      startTime: selectedStartTime,
      endTime,
      duration: timeCalculation.formattedTime,
      date: selectedDate.toISOString().split('T')[0],
      packages: parseInt(packages),
      teamSize: teamMembers.length,
      managerSection: currentManager.section,
      managerInitials: currentManager.initials,
      teamMembers: teamMembers.map(member => member.id)
    };

    // Vérifier les conflits de planning (mais ne pas bloquer)
    const hasConflict = await checkPlanningConflicts();
    
    if (hasConflict) {
      // Stocker la tâche en attente et afficher la popup de conflit
      setPendingTask(task);
      return;
    }

    // Pas de conflit, ajouter directement la tâche
    await saveTask(task);
  };

  const saveTask = async (task: Task) => {
    try {
      // Store task in AsyncStorage (in a real app, this would be sent to a backend)
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];
      existingTasks.push(task);
      await AsyncStorage.setItem('scheduledTasks', JSON.stringify(existingTasks));

      // Force a small delay to ensure storage is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Afficher le modal de succès mais ne pas effacer les données
      setShowTaskModal(true);
      
      // Recalculer les employés disponibles après avoir ajouté la tâche
      calculateAvailableEmployees();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la tâche');
    }
  };

  const goToCalendar = () => {
    setShowTaskModal(false);
    router.push('/(manager-tabs)/calendar');
  };

  // Réinitialiser le formulaire pour une nouvelle tâche
  const resetForm = () => {
    setPackages('');
    setPaletteCondition(true);
    setTeamMembers([]);
    setSelectedDate(new Date());
    setSelectedStartTime('05:00');
    setShowTaskModal(false);
  };

  const confirmTaskWithConflict = async () => {
    if (pendingTask) {
      await saveTask(pendingTask);
      setShowConflictModal(false);
      setPendingTask(null);
      setConflictDetails(null);
      setAllConflicts([]);
    }
  };

  const cancelTaskWithConflict = () => {
    setShowConflictModal(false);
    setPendingTask(null);
    setConflictDetails(null);
    setAllConflicts([]);
  };

  // Initialiser les valeurs temporaires du sélecteur d'heure
  const openTimePicker = () => {
    const [hour, minute] = selectedStartTime.split(':');
    
    // Valider que l'heure sélectionnée est dans la plage des heures de travail
    const currentStartMinutes = parseInt(hour) * 60 + parseInt(minute);
    const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
    const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
    
    let validHour = hour;
    let validMinute = minute;
    
    // Si l'heure est en dehors de la plage, la corriger
    if (currentStartMinutes < workingStartMinutes) {
      validHour = workingHours.start.split(':')[0];
      validMinute = workingHours.start.split(':')[1];
      console.log('Start time corrected to working hours start:', validHour + ':' + validMinute);
    } else if (currentStartMinutes > workingEndMinutes) {
      validHour = workingHours.end.split(':')[0];
      validMinute = workingHours.end.split(':')[1];
      console.log('Start time corrected to working hours end:', validHour + ':' + validMinute);
    }
    
    setTempSelectedHour(validHour);
    setTempSelectedMinute(validMinute);
    setShowTimePicker(true);
  };

  console.log('Component render - showTimeWarning:', showTimeWarning, 'selectedStartTime:', selectedStartTime, 'workingHours:', workingHours);

  // Recharger les employés assignés quand la date, l'heure ou les paramètres de la tâche changent
  useEffect(() => {
    if (showEmployeeSelector) {
      loadAssignedEmployees();
    }
  }, [selectedDate, selectedStartTime, packages, paletteCondition, showEmployeeSelector]);

  // Recharger les employés assignés quand l'équipe change
  useEffect(() => {
    if (showEmployeeSelector) {
      loadAssignedEmployees();
    }
  }, [teamMembers, showEmployeeSelector]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification d'heure hors plage */}
      <Animated.View 
        style={[
          styles.timeWarningContainer,
          { opacity: notificationFadeAnim }
        ]}
        pointerEvents={showTimeWarning ? 'auto' : 'none'}
      >
        <View style={styles.timeWarningContent}>
          <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
          <Text style={styles.timeWarningText}>
            L'heure sélectionnée ({selectedStartTime}) est hors des horaires de travail ({workingHours.start} - {workingHours.end})
          </Text>
        </View>
        {/* Barre de progression du cooldown */}
        <View style={styles.cooldownBarContainer}>
          <View style={styles.cooldownBarBackground}>
            <Animated.View 
              style={[
                styles.cooldownBarProgress,
                { width: `${cooldownProgress * 100}%` }
              ]}
            />
          </View>
        </View>
      </Animated.View>
      
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

        {/* Date & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure de planification</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateSelector, { flexDirection: 'row', minWidth: 90, justifyContent: 'center' }]}
              onPress={openTimePicker}
            >
              <Clock color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={styles.dateText}>{selectedStartTime}</Text>
            </TouchableOpacity>
          </View>
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
            <View style={styles.teamInfo}>
              <Text style={styles.teamCount}>{teamMembers.length}/{availableEmployees} membres</Text>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeInfoText}>
                  {availableEmployees - teamMembers.length} employé{availableEmployees - teamMembers.length > 1 ? 's' : ''} restant{availableEmployees - teamMembers.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.totalEmployeesText}>
                  Équipe rayon: {totalEmployeesDynamic} employé{totalEmployeesDynamic > 1 ? 's' : ''} total
                </Text>
                {availableEmployees < totalEmployeesDynamic && (
                  <Text style={styles.employeeWarningText}>
                    ⚠️ {totalEmployeesDynamic - availableEmployees} employé{totalEmployeesDynamic - availableEmployees > 1 ? 's' : ''} déjà assigné{totalEmployeesDynamic - availableEmployees > 1 ? 's' : ''} à d'autres tâches
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Bouton pour ouvrir le sélecteur d'employés */}
          <TouchableOpacity style={styles.employeeSelectorButton} onPress={openEmployeeSelector}>
            <Users color="#3b82f6" size={24} strokeWidth={2} />
            <Text style={styles.employeeSelectorText}>
              Sélectionner les membres de l'équipe
            </Text>
            <Text style={styles.employeeSelectorSubtext}>
              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} sélectionné{teamMembers.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
          
          {/* Liste des employés sélectionnés */}
          {teamMembers.map((member, index) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Users color="#3b82f6" size={20} strokeWidth={2} />
                  </View>
                )}
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.role && <Text style={styles.memberRole}>{member.role}</Text>}
                </View>
                {index === 0 && <Text style={styles.principalBadge}>Principal</Text>}
                {index > 0 && <Text style={styles.bonusBadge}>-30 min</Text>}
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeEmployeeFromTeam(member.id)}
              >
                <X color="#ef4444" size={16} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}

          {teamMembers.length === 0 && (
            <View style={styles.noEmployeeCard}>
              <Text style={styles.noEmployeeText}>
                Aucun membre sélectionné
              </Text>
              <Text style={styles.noEmployeeSubtext}>
                Cliquez sur "Sélectionner les membres" pour ajouter des employés à cette tâche
              </Text>
            </View>
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
                Début: {selectedStartTime} - Fin: {formatEndTimeForDisplay(selectedStartTime, timeCalculation.totalTime)}
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
        animationType="none"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
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
        </Animated.View>
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
              La tâche "{currentManager.section} - {currentManager.initials}" a été ajoutée au calendrier pour le {formatDate(selectedDate)} de {selectedStartTime} à {formatEndTimeForDisplay(selectedStartTime, timeCalculation.totalTime)}.
            </Text>
            
            <View style={styles.taskSummary}>
              <Text style={styles.summaryItem}>📦 {packages} colis à traiter</Text>
              <Text style={styles.summaryItem}>👥 {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} d'équipe</Text>
              <Text style={styles.summaryItem}>⏱️ Durée: {timeCalculation.formattedTime}</Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={resetForm}
              >
                <Text style={styles.modalButtonText}>Nouvelle tâche</Text>
              </TouchableOpacity>
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

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'heure de début</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>Heure sélectionnée</Text>
              <Text style={styles.timePickerPreviewText}>
                {tempSelectedHour}:{tempSelectedMinute}
              </Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateAvailableHours().map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timeOption,
                        tempSelectedHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempSelectedHour === hour && styles.selectedTimeText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerDivider}>
                <Text style={styles.timePickerDividerText}>:</Text>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateAvailableMinutes().map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timeOption,
                        tempSelectedMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempSelectedMinute === minute && styles.selectedTimeText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  const selectedMinutes = parseInt(tempSelectedHour) * 60 + parseInt(tempSelectedMinute);
                  const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
                  const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
                  
                  // Vérifier si l'heure est hors plage
                  if (selectedMinutes < workingStartMinutes || selectedMinutes > workingEndMinutes) {
                    // Afficher la notification temporairement sans fermer le sélecteur
                    setShowTimeWarning(true);
                    setCooldownProgress(0);
                    
                    // Animation de la barre de progression
                    const duration = 3000; // 3 secondes
                    const interval = 50; // Mise à jour toutes les 50ms
                    const steps = duration / interval;
                    let currentStep = 0;
                    
                    const progressInterval = setInterval(() => {
                      currentStep++;
                      const progress = currentStep / steps;
                      setCooldownProgress(progress);
                      
                      if (currentStep >= steps) {
                        clearInterval(progressInterval);
                        setShowTimeWarning(false);
                        setCooldownProgress(0);
                      }
                    }, interval);
                    
                    return; // Ne pas confirmer l'heure
                  }
                  
                  // Si l'heure est valide, confirmer et fermer le sélecteur
                  setSelectedStartTime(`${tempSelectedHour}:${tempSelectedMinute}`);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Conflict Modal */}
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Conflit de planning</Text>
              <TouchableOpacity onPress={() => setShowConflictModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.conflictContent}>
              <View style={styles.conflictIcon}>
                <AlertTriangle color="#ef4444" size={32} strokeWidth={2} />
              </View>
              
              <Text style={styles.conflictTitle}>
                Conflit{allConflicts.length > 1 ? 's' : ''} détecté{allConflicts.length > 1 ? 's' : ''}
              </Text>
              
              <Text style={styles.conflictMessage}>
                Votre nouvelle tâche entre en conflit avec {allConflicts.length} événement{allConflicts.length > 1 ? 's' : ''} existant{allConflicts.length > 1 ? 's' : ''} :
              </Text>
              
              <ScrollView style={styles.conflictsList} showsVerticalScrollIndicator={false}>
                {allConflicts.map((conflict, index) => (
                  <View key={index} style={styles.conflictItem}>
                    <View style={styles.conflictItemHeader}>
                      {conflict.type === 'meeting' && <Calendar color="#3b82f6" size={16} strokeWidth={2} />}
                      {conflict.type === 'training' && <AlertTriangle color="#f59e0b" size={16} strokeWidth={2} />}
                      {conflict.type === 'task' && <Package color="#10b981" size={16} strokeWidth={2} />}
                      <Text style={styles.conflictEventTitle}>
                        {conflict.title}
                      </Text>
                    </View>
                    <Text style={styles.conflictEventTime}>
                      {conflict.startTime} - {conflict.endTime}
                    </Text>
                    {conflict.type && (
                      <Text style={styles.conflictType}>
                        {conflict.type === 'meeting' && 'Réunion'}
                        {conflict.type === 'training' && 'Formation'}
                        {conflict.type === 'task' && 'Tâche planifiée'}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              
              <Text style={styles.conflictNote}>
                Voulez-vous ajouter cette tâche malgré le{allConflicts.length > 1 ? 's' : ''} conflit{allConflicts.length > 1 ? 's' : ''} ?
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={cancelTaskWithConflict}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={confirmTaskWithConflict}
              >
                <Text style={styles.primaryButtonText}>Ajouter quand même</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Selector Modal */}
      <Modal
        visible={showEmployeeSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmployeeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les employés</Text>
              <TouchableOpacity onPress={() => setShowEmployeeSelector(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
              {allEmployees.map((employee) => {
                const isSelected = teamMembers.find(member => member.id === employee.id);
                const isAssigned = assignedEmployeeIds.includes(employee.id);
                
                return (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeItem,
                      isSelected && !isAssigned && styles.selectedEmployeeItem,
                      isAssigned && styles.assignedEmployeeItem,
                      isAssigned && styles.assignedEmployeeItemVisual
                    ]}
                    onPress={() => {
                      if (isAssigned) {
                        console.log(`Cannot select employee ${employee.name} - already assigned to another task`);
                        return;
                      }
                      if (isSelected) {
                        removeEmployeeFromTeam(employee.id);
                      } else {
                        addEmployeeToTeam(employee);
                      }
                    }}
                    disabled={isAssigned}
                    activeOpacity={isAssigned ? 1 : 0.7}
                  >
                    <View style={styles.employeeItemContent}>
                      {/* Icône d'avertissement pour les employés occupés */}
                      {isAssigned && (
                        <View style={styles.assignedIconContainer}>
                          <AlertTriangle color="#ef4444" size={22} strokeWidth={2.5} />
                        </View>
                      )}
                      {employee.avatar ? (
                        <Image
                          source={{ uri: employee.avatar }}
                          style={[
                            styles.employeeItemAvatar,
                            isAssigned && styles.assignedEmployeeAvatar
                          ]}
                          // Flou sur l'avatar si occupé (sinon opacité réduite)
                          blurRadius={isAssigned ? 2 : 0}
                        />
                      ) : (
                        <View style={styles.employeeItemAvatarPlaceholder}>
                          <Users color="#3b82f6" size={20} strokeWidth={2} />
                        </View>
                      )}
                      <View style={styles.employeeItemDetails}>
                        <Text style={[
                          styles.employeeItemName,
                          isAssigned && styles.assignedEmployeeText
                        ]}>
                          {employee.name}
                        </Text>
                        {employee.role && (
                          <Text style={[
                            styles.employeeItemRole,
                            isAssigned && styles.assignedEmployeeText
                          ]}>
                            {employee.role}
                          </Text>
                        )}
                        {employee.status && (
                          <Text style={[
                            styles.employeeItemStatus,
                            isAssigned && styles.assignedEmployeeText
                          ]}>
                            {employee.status}
                          </Text>
                        )}
                      </View>
                      <View style={styles.employeeItemActions}>
                        {isSelected && !isAssigned && (
                          <View style={styles.selectedIndicator}>
                            <Text style={styles.selectedIndicatorText}>✓</Text>
                          </View>
                        )}
                        {isAssigned && (
                          <Text style={styles.assignedIndicatorStrong}>Occupé</Text>
                        )}
                        {!isSelected && !isAssigned && (
                          <Text style={styles.availableIndicator}>Disponible</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEmployeeSelector(false)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
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
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  conflictContent: {
    alignItems: 'center',
    padding: 20,
  },
  conflictIcon: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  conflictTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  conflictMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  conflictsList: {
    maxHeight: 300,
  },
  conflictItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conflictItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  conflictEventTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  conflictType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  conflictNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  employeeInfoText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  employeeWarningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  totalEmployeesText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  noEmployeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEmployeeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  noEmployeeSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerSection: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerDivider: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerDividerText: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: '700',
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timePickerPreview: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  timePickerPreviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  timePickerPreviewText: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  timeWarningContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  timeWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    flex: 1,
  },
  cooldownBarContainer: {
    marginTop: 8,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cooldownBarBackground: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  cooldownBarProgress: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  employeeSelectorButton: {
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
  employeeSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  employeeSelectorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberRole: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  employeeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedEmployeeItem: {
    backgroundColor: '#3b82f6',
  },
  assignedEmployeeItem: {
    backgroundColor: '#f8fafc',
    opacity: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  employeeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  employeeItemAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeItemDetails: {
    flex: 1,
  },
  employeeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  assignedEmployeeText: {
    color: '#9ca3af',
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  employeeItemRole: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  employeeItemStatus: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedIndicator: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 4,
    marginRight: 8,
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  assignedIndicator: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  employeeItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeList: {
    maxHeight: 400,
  },
  availableIndicator: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 8,
  },
  assignedEmployeeItemVisual: {
    backgroundColor: '#e5e7eb',
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  assignedIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedEmployeeAvatar: {
    opacity: 0.5,
  },
  assignedIndicatorStrong: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});