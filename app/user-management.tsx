import React, { useState, useRef, useCallback } from 'react';
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
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Lock, 
  Users, 
  Shield,
  X,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useUserDatabase } from '../hooks/useUserDatabase';
import { User as UserType, UserFormData } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserManagement() {
  const { 
    users, 
    loading, 
    addUser, 
    updateUser, 
    deleteUser, 
    isUsernameTaken,
    resetToDefaults,
    loadUsers
  } = useUserDatabase();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le re-render
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null); // Pour l'indicateur de suppression
  
  // États pour la popup de confirmation de suppression
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  
  // Animations pour les utilisateurs
  const userAnimations = useRef<{[key: number]: Animated.Value}>({});
  const userScaleAnimations = useRef<{[key: number]: Animated.Value}>({});
  const userRotationAnimations = useRef<{[key: number]: Animated.Value}>({});
  const userColorAnimations = useRef<{[key: number]: Animated.Value}>({});
  
  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    role: 'manager',
    section: '',
    isActive: true
  });

  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [shakeAnimations, setShakeAnimations] = useState<{[key: string]: Animated.Value}>({
    username: new Animated.Value(0),
    password: new Animated.Value(0),
    fullName: new Animated.Value(0),
    section: new Animated.Value(0),
  });

  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [sections, setSections] = useState([
    'Fruits & Légumes',
    'Boucherie',
    'Poissonnerie',
    'Charcuterie',
    'Fromage',
    'Épicerie Salée',
    'Épicerie Sucrée',
    'Surgelés',
    'Produits Laitiers',
    'Boissons'
  ]);

  const managers = users.filter(user => user.role === 'manager');
  const directors = users.filter(user => user.role === 'director');

  // Initialiser les animations pour les nouveaux utilisateurs
  const initializeUserAnimation = (userId: number, isNewUser: boolean = false) => {
    if (!userAnimations.current[userId]) {
      userAnimations.current[userId] = new Animated.Value(isNewUser ? 0 : 1);
      userScaleAnimations.current[userId] = new Animated.Value(isNewUser ? 0.3 : 1);
      userRotationAnimations.current[userId] = new Animated.Value(isNewUser ? 0 : 0);
      userColorAnimations.current[userId] = new Animated.Value(0);
      
      // Animation d'entrée moderne pour les nouveaux utilisateurs
      if (isNewUser) {
        // Séquence d'animation moderne
        Animated.sequence([
          // Phase 1: Apparition rapide avec rebond
          Animated.parallel([
            Animated.spring(userAnimations.current[userId], {
              toValue: 1,
              tension: 150,
              friction: 6,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(userScaleAnimations.current[userId], {
              toValue: 1.1,
              tension: 120,
              friction: 7,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
          
          // Phase 2: Retour à la taille normale avec effet de rebond
          Animated.spring(userScaleAnimations.current[userId], {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: Platform.OS !== 'web',
          }),
          
          // Phase 3: Rotation finale pour l'effet de stabilisation
          Animated.timing(userRotationAnimations.current[userId], {
            toValue: 1,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      }
    }
  };

  // Animation de suppression linéaire
  const animateUserDeletion = (userId: number): Promise<void> => {
    return new Promise((resolve) => {
      const opacityAnim = userAnimations.current[userId];
      const scaleAnim = userScaleAnimations.current[userId];
      const rotationAnim = userRotationAnimations.current[userId];
      const colorAnim = userColorAnimations.current[userId];
      
      if (!opacityAnim) {
        resolve();
        return;
      }

      // Animation de suppression linéaire et simple
      Animated.parallel([
        // Fade out linéaire
          Animated.timing(opacityAnim, {
            toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
          }),
        
        // Scale linéaire vers 0
          Animated.timing(scaleAnim, {
            toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
          }),
        
        // Rotation linéaire simple
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        
        // Effet de couleur linéaire
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        resolve();
      });
    });
  };

  // Fonction pour forcer le re-render
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Animation de secousse pour les champs en erreur
  const shakeField = (fieldName: string) => {
    const animation = shakeAnimations[fieldName];
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  };

  // Validation des champs
  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'username':
        if (!value.trim()) {
          newErrors[fieldName] = 'Le nom d\'utilisateur est requis';
          shakeField(fieldName);
        } else if (value.trim().length < 3) {
          newErrors[fieldName] = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
          shakeField(fieldName);
        } else {
          delete newErrors[fieldName];
        }
        break;
        
      case 'password':
        if (!value.trim()) {
          newErrors[fieldName] = 'Le mot de passe est requis';
          shakeField(fieldName);
        } else if (value.trim().length < 4) {
          newErrors[fieldName] = 'Le mot de passe doit contenir au moins 4 caractères';
          shakeField(fieldName);
        } else {
          delete newErrors[fieldName];
        }
        break;
        
      case 'fullName':
        if (!value.trim()) {
          newErrors[fieldName] = 'Le nom complet est requis';
          shakeField(fieldName);
        } else if (value.trim().length < 2) {
          newErrors[fieldName] = 'Le nom complet doit contenir au moins 2 caractères';
          shakeField(fieldName);
        } else {
          delete newErrors[fieldName];
        }
        break;
        
      case 'section':
        if (formData.role === 'manager' && !value.trim()) {
          newErrors[fieldName] = 'La section est requise pour les managers';
          shakeField(fieldName);
        } else {
          delete newErrors[fieldName];
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation complète du formulaire
  const validateForm = () => {
    const validations = [
      validateField('username', formData.username),
      validateField('password', formData.password),
      validateField('fullName', formData.fullName),
      validateField('section', formData.section),
    ];
    
    return validations.every(valid => valid);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'manager',
      section: '',
      isActive: true
    });
    setErrors({});
    setEditingUser(null);
    setShowPassword(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user: UserType) => {
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      section: user.section || '',
      isActive: user.isActive
    });
    setErrors({});
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation complète
    if (!validateForm()) {
      Alert.alert('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    // Vérifier si le nom d'utilisateur existe déjà
    if (isUsernameTaken(formData.username, editingUser?.id)) {
      setErrors({ ...errors, username: 'Ce nom d\'utilisateur existe déjà' });
      shakeField('username');
      return;
    }

    try {
      if (editingUser) {
        // Mise à jour
        await updateUser(editingUser.id, {
          username: formData.username.trim(),
          password: formData.password.trim(),
          fullName: formData.fullName.trim(),
          role: formData.role,
          section: formData.role === 'manager' ? formData.section.trim() : undefined,
          isActive: formData.isActive
        });
        Alert.alert('Succès', 'Utilisateur mis à jour avec succès');
      } else {
        // Ajout
        const newUser = await addUser({
          username: formData.username.trim(),
          password: formData.password.trim(),
          fullName: formData.fullName.trim(),
          role: formData.role,
          section: formData.role === 'manager' ? formData.section.trim() : undefined,
          isActive: formData.isActive
        });
        
        // Initialiser l'animation pour le nouvel utilisateur
        initializeUserAnimation(newUser.id, true);
        
        Alert.alert('Succès', 'Utilisateur ajouté avec succès');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleDelete = (user: UserType) => {
    console.log('🚀 === DÉBUT handleDelete ===');
    console.log('🔔 handleDelete appelé pour:', user.fullName);
    console.log('🔔 État actuel deleteModalVisible:', deleteModalVisible);
    console.log('🔔 État actuel userToDelete:', userToDelete);
    
    // Empêcher la suppression du dernier directeur
    if (user.role === 'director' && directors.length <= 1) {
      console.log('⚠️ Tentative de suppression du dernier directeur bloquée');
      Alert.alert(
        'Suppression impossible',
        'Impossible de supprimer le dernier directeur. Il doit y avoir au moins un directeur actif.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    console.log('📋 Affichage de la popup de confirmation personnalisée');
    setUserToDelete(user);
    setDeleteModalVisible(true);
    
    // Log après mise à jour de l'état
    setTimeout(() => {
      console.log('🔔 État après mise à jour - deleteModalVisible:', deleteModalVisible);
      console.log('🔔 État après mise à jour - userToDelete:', userToDelete);
    }, 100);
    
    console.log('🏁 === FIN handleDelete ===');
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      console.log('🚀 Début de la suppression pour:', userToDelete.fullName, 'ID:', userToDelete.id);
      
      // Indiquer que la suppression est en cours
      setDeletingUserId(userToDelete.id);
      
      // Fermer la popup immédiatement
      setDeleteModalVisible(false);
      
      // Animer la suppression de l'utilisateur
      await animateUserDeletion(userToDelete.id);
      
      // Utiliser la fonction du hook pour supprimer de la base
      await deleteUser(userToDelete.id);
      
      // Forcer le re-render
      forceRefresh();
      
      console.log('✅ Suppression terminée avec succès');
      
      // Nettoyer l'état
      setUserToDelete(null);
      
      Alert.alert('Succès', `L'utilisateur "${userToDelete.fullName}" a été supprimé avec succès.`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      // Réinitialiser l'indicateur de suppression
      setDeletingUserId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Réinitialiser la base de données',
      'Êtes-vous sûr de vouloir réinitialiser la base de données aux valeurs par défaut ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Succès', 'Base de données réinitialisée');
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la réinitialisation');
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (window?.history?.length > 1) {
      router.back();
    } else {
      router.replace('/directeur');
    }
  };

  // Fonction pour ajouter plusieurs utilisateurs comme un directeur
  const addMultipleUsers = async () => {
    const newUsers = [
      // Nouveaux Managers
      {
        username: 'sarah.m',
        password: 'SM2024!',
        fullName: 'Sarah Moreau',
        role: 'manager' as const,
        section: 'Fruits & Légumes',
        isActive: true
      },
      {
        username: 'antoine.p',
        password: 'AP2024!',
        fullName: 'Antoine Petit',
        role: 'manager' as const,
        section: 'Boucherie',
        isActive: true
      },
      {
        username: 'clara.r',
        password: 'CR2024!',
        fullName: 'Clara Rousseau',
        role: 'manager' as const,
        section: 'Poissonnerie',
        isActive: true
      },
      {
        username: 'marc.l',
        password: 'ML2024!',
        fullName: 'Marc Leroy',
        role: 'manager' as const,
        section: 'Charcuterie',
        isActive: true
      },
      {
        username: 'juliette.d',
        password: 'JD2024!',
        fullName: 'Juliette Dubois',
        role: 'manager' as const,
        section: 'Fromage',
        isActive: true
      },
      {
        username: 'nicolas.b',
        password: 'NB2024!',
        fullName: 'Nicolas Blanc',
        role: 'manager' as const,
        section: 'Épicerie Salée',
        isActive: true
      },
      {
        username: 'amelie.t',
        password: 'AT2024!',
        fullName: 'Amélie Tremblay',
        role: 'manager' as const,
        section: 'Épicerie Sucrée',
        isActive: true
      },
      {
        username: 'vincent.m',
        password: 'VM2024!',
        fullName: 'Vincent Martin',
        role: 'manager' as const,
        section: 'Surgelés',
        isActive: true
      },
      {
        username: 'elise.g',
        password: 'EG2024!',
        fullName: 'Élise Gagnon',
        role: 'manager' as const,
        section: 'Produits Laitiers',
        isActive: true
      },
      {
        username: 'pascal.r',
        password: 'PR2024!',
        fullName: 'Pascal Roy',
        role: 'manager' as const,
        section: 'Boissons',
        isActive: true
      },
      // Nouveaux Directeurs
      {
        username: 'marie.l',
        password: 'ML2024!',
        fullName: 'Marie Laurent',
        role: 'director' as const,
        isActive: true
      },
      {
        username: 'pierre.d',
        password: 'PD2024!',
        fullName: 'Pierre Durand',
        role: 'director' as const,
        isActive: true
      }
    ];

    try {
      let addedCount = 0;
      
      for (const userData of newUsers) {
        // Vérifier si l'utilisateur existe déjà
        if (!isUsernameTaken(userData.username)) {
          const newUser = await addUser(userData);
          initializeUserAnimation(newUser.id, true);
          addedCount++;
          
          // Petit délai pour l'animation
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Forcer le re-render
      forceRefresh();
      
      Alert.alert(
        'Utilisateurs ajoutés', 
        `${addedCount} nouveaux utilisateurs ont été ajoutés avec succès !\n\nTotal: ${users.length + addedCount} utilisateurs`
      );
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout des utilisateurs:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout des utilisateurs');
    }
  };

  // Animation pour le picker de section (plus nécessaire)
  const openSectionPicker = useCallback(() => setShowSectionPicker(true), []);
  const closeSectionPicker = useCallback(() => setShowSectionPicker(false), []);
  const selectSection = useCallback((section: string) => {
    setFormData({...formData, section});
    if (errors.section) validateField('section', section);
    closeSectionPicker();
  }, [formData, errors.section, validateField, closeSectionPicker]);

  const addNewSection = useCallback(() => {
    if (newSectionName.trim()) {
      const sectionExists = sections.some(section => 
        section.toLowerCase() === newSectionName.trim().toLowerCase()
      );
      
      if (sectionExists) {
        Alert.alert('Erreur', 'Cette section existe déjà');
        return;
      }
      
      setSections([...sections, newSectionName.trim()]);
      setNewSectionName('');
      setShowAddSectionModal(false);
      Alert.alert('Succès', 'Nouvelle section ajoutée avec succès');
    } else {
      Alert.alert('Erreur', 'Veuillez saisir un nom de section');
    }
  }, [newSectionName, sections]);

  const deleteSection = useCallback((sectionToDelete: string) => {
    console.log('🗑️ Tentative de suppression de la section:', sectionToDelete);
    console.log('📋 Sections actuelles:', sections);
    console.log('👥 Utilisateurs utilisant cette section:', users.filter(user => user.section === sectionToDelete));
    
    // Vérifier si des utilisateurs utilisent cette section
    const usersUsingSection = users.filter(user => user.section === sectionToDelete);
    
    if (usersUsingSection.length > 0) {
      console.log('❌ Impossible de supprimer - section utilisée par des utilisateurs');
      Alert.alert(
        'Impossible de supprimer',
        `Cette section est utilisée par ${usersUsingSection.length} utilisateur(s). Veuillez d'abord modifier leurs sections.`,
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ Suppression autorisée - aucune utilisation détectée');
    
    // Supprimer la section en utilisant la fonction de mise à jour d'état
    setSections(prevSections => {
      console.log('🔄 Mise à jour de l\'état sections');
      console.log('📋 Sections avant suppression:', prevSections);
      const newSections = prevSections.filter(section => section !== sectionToDelete);
      console.log('✅ Sections après suppression:', newSections);
      return newSections;
    });
    
    // Si la section supprimée était sélectionnée, la désélectionner
    if (formData.section === sectionToDelete) {
      console.log('🔄 Désélection de la section dans le formulaire');
      setFormData(prev => ({...prev, section: ''}));
    }
    
    // Forcer le re-render pour s'assurer que l'interface se met à jour
    console.log('🔄 Force refresh de l\'interface');
    forceRefresh();
    
    // Afficher le message de succès
    console.log('🎉 Affichage du message de succès');
    Alert.alert('Succès', 'Section supprimée avec succès');
  }, [sections, users, formData]);

  // Composant SwipeableSection
  const SwipeableSection = ({ section, index, isSelected, onSelect }: {
    section: string;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    return (
      <View style={styles.swipeableContainer}>
        <View style={[
          styles.sectionOption,
          isSelected && styles.sectionOptionSelected
        ]}>
          <TouchableOpacity
            style={styles.sectionOptionTouchable}
            onPress={onSelect}
            activeOpacity={0.7}
          >
            <View style={styles.sectionOptionContent}>
              <Package 
                color={isSelected ? '#3b82f6' : '#6b7280'} 
                size={18} 
                strokeWidth={2} 
              />
              <Text style={[
                styles.sectionOptionText,
                isSelected && styles.sectionOptionTextSelected
              ]}>
                {section}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.sectionOptionCheck}>
                <View style={styles.checkCircle} />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Bouton de suppression */}
          <TouchableOpacity
            style={styles.deleteSectionButton}
            onPress={() => {
              console.log('🔴 [SECTION] Bouton de suppression cliqué pour la section:', section);
              Alert.alert(
                'Confirmer la suppression',
                `Êtes-vous sûr de vouloir supprimer la section "${section}" ?`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    text: 'Supprimer', 
                    style: 'destructive',
                    onPress: () => {
                      console.log('🗑️ [SECTION] Confirmation de suppression pour:', section);
                      deleteSection(section);
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Trash2 color="#ef4444" size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const UserCard = ({ user, onEdit, onDelete }: { user: UserType; onEdit: () => void; onDelete: () => void }) => {
    // Initialiser l'animation pour cet utilisateur
    React.useEffect(() => {
      initializeUserAnimation(user.id, false);
    }, [user.id]);

    // Calculer les valeurs d'animation
    const opacity = userAnimations.current[user.id] || new Animated.Value(1);
    const scale = userScaleAnimations.current[user.id] || new Animated.Value(1);
    const rotation = userRotationAnimations.current[user.id] || new Animated.Value(0);
    const colorProgress = userColorAnimations.current[user.id] || new Animated.Value(0);

    // Interpolation pour les transformations modernes
    const rotateY = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const translateY = opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    // Couleur dynamique pour l'effet de destruction
    const backgroundColor = colorProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 255, 255, 1)', 'rgba(239, 68, 68, 0.1)'],
    });

    const borderColor = colorProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0.05)', 'rgba(239, 68, 68, 0.3)'],
    });

    return (
      <Animated.View 
        style={[
          styles.userCard,
          {
            opacity,
            backgroundColor,
            borderColor,
            transform: [
              { scale },
              { translateY },
              { rotateY },
              {
                perspective: 1000,
              },
            ],
            shadowOpacity: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.05],
            }),
            shadowRadius: scale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 4],
            }),
          },
        ]}
      >
        {/* Effet de particules lors de la suppression */}
          <Animated.View 
            style={[
              styles.particleEffect,
              {
                opacity: colorProgress.interpolate({
                  inputRange: [0.5, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          >
            <View style={styles.particle} />
            <View style={[styles.particle, { top: 20, left: 30 }]} />
            <View style={[styles.particle, { top: 40, right: 20 }]} />
          </Animated.View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: user.role === 'manager' ? '#3b82f6' : '#10b981' }
            ]}>
              <Shield color="#ffffff" size={16} strokeWidth={2} />
              <Text style={styles.roleText}>
                {user.role === 'manager' ? 'Manager' : 'Directeur'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: user.isActive ? '#10b981' : '#ef4444' }
            ]}>
              <Text style={styles.statusText}>
                {user.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userUsername}>@{user.username}</Text>
          {user.section && (
            <Text style={styles.userSection}>Section: {user.section}</Text>
          )}
          <Text style={styles.userCreated}>
            Créé le: {new Date(user.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        
        <View style={styles.userActions}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={onEdit}
            activeOpacity={0.7}
            disabled={deletingUserId === user.id}
          >
            <Edit color="#3b82f6" size={20} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.deleteButton,
              deletingUserId === user.id && styles.deleteButtonDisabled
            ]} 
            onPress={() => {
              console.log('🎯 [UTILISATEUR] Bouton supprimer cliqué pour:', user.fullName, '(ID:', user.id, ')');
              onDelete();
            }}
            activeOpacity={0.7}
            disabled={deletingUserId === user.id}
          >
            {deletingUserId === user.id ? (
              <Text style={styles.deletingText}>...</Text>
            ) : (
              <Trash2 color="#ef4444" size={20} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft color="#6b7280" size={24} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gestion des Utilisateurs</Text>
          <Text style={styles.subtitle}>
            {users.length} utilisateurs au total • {managers.length} managers • {directors.length} directeurs
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus color="#ffffff" size={20} strokeWidth={2} />
            <Text style={styles.addButtonText}>Ajouter un utilisateur</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={handleResetDatabase}>
            <Text style={styles.resetButtonText}>Réinitialiser la base</Text>
          </TouchableOpacity>
        </View>

        {/* Managers Section */}
        <View style={styles.sectionContainer} key={`managers-${refreshKey}`}>
          <View style={styles.sectionHeader}>
            <Users color="#3b82f6" size={24} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Managers ({managers.length})</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{managers.length}</Text>
            </View>
          </View>
          {managers.map((user, index) => (
            <UserCard
              key={`manager-${user.id}-${refreshKey}`}
              user={user}
              onEdit={() => openEditModal(user)}
              onDelete={() => handleDelete(user)}
            />
          ))}
          {managers.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun manager enregistré</Text>
            </View>
          )}
        </View>

        {/* Directors Section */}
        <View style={styles.sectionContainer} key={`directors-${refreshKey}`}>
          <View style={styles.sectionHeader}>
            <Shield color="#10b981" size={24} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Directeurs ({directors.length})</Text>
            <View style={[styles.sectionBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.sectionBadgeText}>{directors.length}</Text>
            </View>
          </View>
          {directors.map((user, index) => (
            <UserCard
              key={`director-${user.id}-${refreshKey}`}
              user={user}
              onEdit={() => openEditModal(user)}
              onDelete={() => handleDelete(user)}
            />
          ))}
          {directors.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun directeur enregistré</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Save color="#3b82f6" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Username */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom d'utilisateur *</Text>
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  errors.username && styles.inputWrapperError,
                  { transform: [{ translateX: shakeAnimations.username }] }
                ]}
              >
                <User color={errors.username ? "#ef4444" : "#6b7280"} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  value={formData.username}
                  onChangeText={(value) => {
                    setFormData({...formData, username: value});
                    if (errors.username) validateField('username', value);
                    closeSectionPicker();
                  }}
                  placeholder="prenom.n"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Animated.View>
              {errors.username && (
                <View style={styles.errorContainer}>
                  <AlertCircle color="#ef4444" size={16} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.username}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mot de passe *</Text>
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputWrapperError,
                  { transform: [{ translateX: shakeAnimations.password }] }
                ]}
              >
                <Lock color={errors.password ? "#ef4444" : "#6b7280"} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => {
                    setFormData({...formData, password: value});
                    if (errors.password) validateField('password', value);
                    closeSectionPicker();
                  }}
                  placeholder="Mot de passe"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => {
                    setShowPassword(!showPassword);
                    closeSectionPicker();
                  }}
                >
                  {showPassword ? (
                    <EyeOff color="#6b7280" size={20} strokeWidth={2} />
                  ) : (
                    <Eye color="#6b7280" size={20} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              {errors.password && (
                <View style={styles.errorContainer}>
                  <AlertCircle color="#ef4444" size={16} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  errors.fullName && styles.inputWrapperError,
                  { transform: [{ translateX: shakeAnimations.fullName }] }
                ]}
              >
                <User color={errors.fullName ? "#ef4444" : "#6b7280"} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  value={formData.fullName}
                  onChangeText={(value) => {
                    setFormData({...formData, fullName: value});
                    if (errors.fullName) validateField('fullName', value);
                    closeSectionPicker();
                  }}
                  placeholder="Nom complet"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </Animated.View>
              {errors.fullName && (
                <View style={styles.errorContainer}>
                  <AlertCircle color="#ef4444" size={16} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                </View>
              )}
            </View>

            {/* Role */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Rôle *</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'manager' && styles.roleOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({...formData, role: 'manager'});
                    closeSectionPicker();
                    // Re-validate section if switching to manager
                    if (formData.role !== 'manager') {
                      setTimeout(() => validateField('section', formData.section), 100);
                    }
                  }}
                >
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'manager' && styles.roleOptionTextSelected
                  ]}>
                    Manager
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'director' && styles.roleOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({...formData, role: 'director'});
                    closeSectionPicker();
                    // Clear section error if switching to director
                    if (formData.role !== 'director') {
                      const newErrors = { ...errors };
                      delete newErrors.section;
                      setErrors(newErrors);
                    }
                  }}
                >
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'director' && styles.roleOptionTextSelected
                  ]}>
                    Directeur
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section (only for managers) */}
            {formData.role === 'manager' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Section *</Text>
                <View style={styles.sectionInputContainer}>
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    errors.section && styles.inputWrapperError,
                    { transform: [{ translateX: shakeAnimations.section }] }
                  ]}
                >
                    <Package color="#6b7280" size={20} strokeWidth={2} />
                    <TouchableOpacity
                      style={styles.sectionSelector}
                      onPress={openSectionPicker}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.sectionSelectorText,
                        !formData.section && styles.sectionSelectorPlaceholder
                      ]}>
                        {formData.section || "Sélectionner une section"}
                      </Text>
                      <ChevronDown color="#6b7280" size={20} strokeWidth={2} />
                    </TouchableOpacity>
                  </Animated.View>
                  {/* Section Picker Modal */}
                  <Modal
                    visible={showSectionPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={closeSectionPicker}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={closeSectionPicker}
                    >
                      <View style={styles.modalDropdownContainer}>
                        <LinearGradient
                          colors={['#ffffff', '#f8fafc']}
                          style={styles.sectionPickerContent}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                    >
                          <ScrollView 
                            style={styles.sectionPickerScroll}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                          >
                            {sections.map((section, index) => (
                              <SwipeableSection
                                key={section}
                                section={section}
                                index={index}
                                isSelected={formData.section === section}
                                onSelect={() => selectSection(section)}
                              />
                            ))}
                            
                            {/* Séparateur avant le bouton d'ajout */}
                            <View style={styles.sectionSeparator} />
                            
                            {/* Bouton pour ajouter une nouvelle section */}
                            <TouchableOpacity
                              style={styles.addSectionButton}
                              onPress={() => {
                                closeSectionPicker();
                                setShowAddSectionModal(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.addSectionContent}>
                                <Plus color="#3b82f6" size={18} strokeWidth={2} />
                                <Text style={styles.addSectionText}>
                                  Ajouter une nouvelle section
                                </Text>
                  </View>
                            </TouchableOpacity>
                          </ScrollView>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
                {errors.section && (
                  <View style={styles.errorContainer}>
                    <AlertCircle color="#ef4444" size={16} strokeWidth={2} />
                    <Text style={styles.errorText}>{errors.section}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Active Status */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Compte actif</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => {
                  setFormData({...formData, isActive: value});
                  closeSectionPicker();
                }}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={formData.isActive ? '#ffffff' : '#ffffff'}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
        onShow={() => console.log('🔔 Modal de confirmation affichée')}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Trash2 color="#ef4444" size={24} strokeWidth={2} />
              <Text style={styles.deleteModalTitle}>Confirmer la suppression</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <Text style={styles.deleteModalUserName}>
                "{userToDelete?.fullName}" ({userToDelete?.username})
              </Text> ?
            </Text>
            
            <Text style={styles.deleteModalWarning}>
              ⚠️ Cette action ne peut pas être annulée.
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteModalButton} 
                onPress={cancelDelete}
              >
                <Text style={styles.deleteModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteModalButton, styles.deleteModalButtonDanger]} 
                onPress={confirmDelete}
                disabled={deletingUserId === userToDelete?.id}
              >
                <Text style={[styles.deleteModalButtonText, styles.deleteModalButtonTextDanger]}>
                  {deletingUserId === userToDelete?.id ? 'Suppression...' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pour ajouter une nouvelle section */}
      <Modal
        visible={showAddSectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddSectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addSectionModalContent}>
            <View style={styles.addSectionModalHeader}>
              <Plus color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.addSectionModalTitle}>Ajouter une nouvelle section</Text>
              <TouchableOpacity onPress={() => setShowAddSectionModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addSectionModalBody}>
              <Text style={styles.addSectionModalLabel}>
                Nom de la nouvelle section
              </Text>
              <TextInput
                style={styles.addSectionInput}
                value={newSectionName}
                onChangeText={setNewSectionName}
                placeholder="Ex: Boulangerie, Hygiène, etc."
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus={true}
                onSubmitEditing={addNewSection}
              />
              
              <Text style={styles.addSectionModalHint}>
                Cette section sera disponible pour tous les managers
              </Text>
            </View>
            
            <View style={styles.addSectionModalActions}>
              <TouchableOpacity 
                style={styles.addSectionModalButton} 
                onPress={() => setShowAddSectionModal(false)}
              >
                <Text style={styles.addSectionModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addSectionModalButton, styles.addSectionModalButtonPrimary]} 
                onPress={addNewSection}
              >
                <Text style={[styles.addSectionModalButtonText, styles.addSectionModalButtonTextPrimary]}>
                  Ajouter
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userSection: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  userCreated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  deleteButtonDisabled: {
    backgroundColor: '#f8fafc',
  },
  deletingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
    zIndex: 0,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 52,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    marginRight: 8,
  },
  inputError: {
    color: '#ef4444',
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  roleOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 0,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
  },
  deleteModalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    maxWidth: '85%',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 10,
      },
    }),
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  deleteModalWarning: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  deleteModalButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  deleteModalButtonDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(239, 68, 68, 0.1)',
      },
      default: {
        shadowColor: '#ef4444',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  deleteModalButtonTextDanger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  deleteModalUserName: {
    fontWeight: '600',
  },
  particleEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
    top: 10,
    left: 10,
  },
  sectionBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionInputContainer: {
    position: 'relative',
    zIndex: 10000,
  },
  sectionSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  sectionSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  sectionSelectorPlaceholder: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalDropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    maxWidth: '80%',
    width: '100%',
  },
  sectionPickerContent: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 200,
  },
  sectionPickerScroll: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 200,
  },
  sectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  sectionOptionTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  sectionOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  sectionOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  sectionOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  sectionSeparator: {
    height: 2,
    backgroundColor: '#d1d5db',
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
  },
  addSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  addSectionModalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    maxWidth: '80%',
    width: '100%',
  },
  addSectionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addSectionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addSectionModalBody: {
    marginBottom: 16,
  },
  addSectionModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  addSectionInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addSectionModalHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  addSectionModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  addSectionModalButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  addSectionModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  addSectionModalButtonPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  addSectionModalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteSectionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginLeft: 12,
  },
}); 