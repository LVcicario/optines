import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, Phone, Mail, MapPin, Star, Clock, Plus, X, UserPlus, Calendar, Target, Edit, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: string;
  rating: number;
  location: string;
  phone: string;
  email: string;
  avatar: string;
  shift: string;
  performance: number;
  tasksCompleted: number;
}

export default function TeamTab() {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  
  // États pour la modification d'un membre
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // États pour le sélecteur d'horaires
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [shiftPresets, setShiftPresets] = useState([
    'Matin (05:00-13:00)',
    'Après-midi (13:00-21:00)',
    'Soir (21:00-05:00)'
  ]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPreset, setNewPreset] = useState('');

  // États pour la confirmation de suppression
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: number, name: string} | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: 'Marie Dubois',
      role: 'Responsable rayon',
      status: 'En ligne',
      rating: 4.8,
      location: 'Fruits & Légumes',
      phone: '+33 6 12 34 56 78',
      email: 'marie.dubois@supermarche.com',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      shift: 'Matin (05:00-13:00)',
      performance: 92,
      tasksCompleted: 28
    },
    {
      id: 2,
      name: 'Pierre Martin',
      role: 'Employé polyvalent',
      status: 'Occupé',
      rating: 4.6,
      location: 'Mise en rayon',
      phone: '+33 6 23 45 67 89',
      email: 'pierre.martin@supermarche.com',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      shift: 'Après-midi (13:00-21:00)',
      performance: 87,
      tasksCompleted: 24
    },
    {
      id: 3,
      name: 'Sophie Laurent',
      role: 'Spécialiste qualité',
      status: 'En ligne',
      rating: 4.9,
      location: 'Contrôle qualité',
      phone: '+33 6 34 56 78 90',
      email: 'sophie.laurent@supermarche.com',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      shift: 'Matin (05:00-13:00)',
      performance: 95,
      tasksCompleted: 31
    },
    {
      id: 4,
      name: 'Thomas Durand',
      role: 'Manutentionnaire',
      status: 'En pause',
      rating: 4.4,
      location: 'Réserve',
      phone: '+33 6 45 67 89 01',
      email: 'thomas.durand@supermarche.com',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      shift: 'Nuit (21:00-05:00)',
      performance: 78,
      tasksCompleted: 19
    }
  ]);

  // Charger l'équipe depuis AsyncStorage au démarrage
  useEffect(() => {
    loadTeamMembers();
  }, []);

  // Sauvegarder l'équipe dans AsyncStorage quand elle change
  useEffect(() => {
    saveTeamMembers();
  }, [teamMembers]);

  // Debug: Monitor delete confirmation modal state
  useEffect(() => {
    console.log('État du modal de suppression changé:', showDeleteConfirmModal);
    console.log('Membre à supprimer:', memberToDelete);
  }, [showDeleteConfirmModal, memberToDelete]);

  // Debug: Monitor team members state
  useEffect(() => {
    console.log('Team members state updated:', teamMembers);
    console.log('Team members IDs:', teamMembers.map(m => m.id));
  }, [teamMembers]);

  const loadTeamMembers = async () => {
    try {
      const savedTeam = await AsyncStorage.getItem('teamMembers');
      if (savedTeam) {
        const parsedTeam = JSON.parse(savedTeam);
        console.log('Team members loaded from storage:', parsedTeam);
        
        // Filter out any members with null or invalid IDs
        const validTeam = parsedTeam.filter((member: TeamMember) => {
          if (member.id === null || member.id === undefined || isNaN(member.id)) {
            console.warn('Found member with invalid ID:', member);
            return false;
          }
          return true;
        });
        
        if (validTeam.length !== parsedTeam.length) {
          console.log(`Filtered out ${parsedTeam.length - validTeam.length} members with invalid IDs`);
          // If we found invalid data, clear the storage and use default data
          if (validTeam.length === 0) {
            console.log('No valid members found, resetting to default data');
            await AsyncStorage.removeItem('teamMembers');
            setTeamMembers([
              {
                id: 1,
                name: 'Marie Dubois',
                role: 'Responsable rayon',
                status: 'En ligne',
                rating: 4.8,
                location: 'Fruits & Légumes',
                phone: '+33 6 12 34 56 78',
                email: 'marie.dubois@supermarche.com',
                avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
                shift: 'Matin (05:00-13:00)',
                performance: 92,
                tasksCompleted: 28
              },
              {
                id: 2,
                name: 'Pierre Martin',
                role: 'Employé polyvalent',
                status: 'Occupé',
                rating: 4.6,
                location: 'Mise en rayon',
                phone: '+33 6 23 45 67 89',
                email: 'pierre.martin@supermarche.com',
                avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
                shift: 'Après-midi (13:00-21:00)',
                performance: 87,
                tasksCompleted: 24
              },
              {
                id: 3,
                name: 'Sophie Laurent',
                role: 'Spécialiste qualité',
                status: 'En ligne',
                rating: 4.9,
                location: 'Contrôle qualité',
                phone: '+33 6 34 56 78 90',
                email: 'sophie.laurent@supermarche.com',
                avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
                shift: 'Matin (05:00-13:00)',
                performance: 95,
                tasksCompleted: 31
              },
              {
                id: 4,
                name: 'Thomas Durand',
                role: 'Manutentionnaire',
                status: 'En pause',
                rating: 4.4,
                location: 'Réserve',
                phone: '+33 6 45 67 89 01',
                email: 'thomas.durand@supermarche.com',
                avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
                shift: 'Nuit (21:00-05:00)',
                performance: 78,
                tasksCompleted: 19
              }
            ]);
            return;
          }
        }
        
        setTeamMembers(validTeam);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const saveTeamMembers = async () => {
    try {
      await AsyncStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    } catch (error) {
      console.error('Error saving team members:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En ligne': return '#10b981';
      case 'Occupé': return '#f59e0b';
      case 'En pause': return '#3b82f6';
      case 'Hors ligne': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return '#10b981';
    if (performance >= 80) return '#3b82f6';
    if (performance >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const addNewMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Fix the ID generation to avoid -Infinity when array is empty
    const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1;

    const newMember: TeamMember = {
      id: newId,
      name: newMemberName,
      role: newMemberRole,
      status: 'Hors ligne',
      rating: 4.0,
      location: 'À définir',
      phone: '+33 6 XX XX XX XX',
      email: `${newMemberName.toLowerCase().replace(' ', '.')}@supermarche.com`,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      shift: 'À définir',
      performance: 75,
      tasksCompleted: 0
    };

    setTeamMembers([...teamMembers, newMember]);
    setNewMemberName('');
    setNewMemberRole('');
    setShowAddMemberModal(false);
    Alert.alert('Succès', 'Nouveau membre ajouté à l\'équipe');
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditRole(member.role);
    setEditPhone(member.phone);
    setEditEmail(member.email);
    setEditLocation(member.location);
    setEditShift(member.shift);
    setEditAvatar(member.avatar);
    setShowEditMemberModal(true);
  };

  const saveMemberChanges = () => {
    if (!editingMember || !editName.trim() || !editRole.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const updatedMembers = teamMembers.map(member => 
      member.id === editingMember.id 
        ? {
            ...member,
            name: editName,
            role: editRole,
            phone: editPhone,
            email: editEmail,
            location: editLocation,
            shift: editShift,
            avatar: editAvatar
          }
        : member
    );

    setTeamMembers(updatedMembers);
    setShowEditMemberModal(false);
    setEditingMember(null);
    Alert.alert('Succès', 'Informations du membre mises à jour');
  };

  const scheduleMeeting = () => {
    if (!meetingTitle.trim() || !meetingTime.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // In a real app, this would save to calendar
    Alert.alert('Réunion planifiée', `"${meetingTitle}" programmée pour ${meetingTime}`);
    setMeetingTitle('');
    setMeetingTime('');
    setShowMeetingModal(false);
  };

  const callMember = (phone: string, name: string) => {
    Alert.alert('Appel', `Appel vers ${name} (${phone})`);
  };

  const sendMessage = (email: string, name: string) => {
    Alert.alert('Message', `Envoi d'un message à ${name} (${email})`);
  };

  const removeMember = (memberId: number, memberName: string) => {
    console.log('=== DÉBUT SUPPRESSION ===');
    console.log('ID à supprimer:', memberId);
    console.log('Nom à supprimer:', memberName);
    console.log('État actuel du modal:', showDeleteConfirmModal);
    
    // Stocker les informations du membre à supprimer
    setMemberToDelete({ id: memberId, name: memberName });
    
    // Afficher le modal de confirmation
    setShowDeleteConfirmModal(true);
    
    console.log('Modal de confirmation activé');
    console.log('=== FIN SUPPRESSION ===');
  };

  const confirmDelete = () => {
    console.log('=== DÉBUT CONFIRMATION ===');
    console.log('memberToDelete:', memberToDelete);
    
    if (!memberToDelete) {
      console.log('Aucun membre à supprimer');
      return;
    }
    
    console.log('Suppression confirmée pour:', memberToDelete.id);
    const updatedMembers = teamMembers.filter(member => member.id !== memberToDelete.id);
    console.log('Membres après suppression:', updatedMembers.length);
    
    setTeamMembers(updatedMembers);
    
    // Sauvegarder immédiatement
    AsyncStorage.setItem('teamMembers', JSON.stringify(updatedMembers))
      .then(() => {
        console.log('Membre supprimé et sauvegardé');
        Alert.alert('Succès', `${memberToDelete.name} a été supprimé de l'équipe`);
      })
      .catch(error => {
        console.error('Erreur lors de la sauvegarde:', error);
        Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
      });
    
    // Fermer le modal
    setShowDeleteConfirmModal(false);
    setMemberToDelete(null);
    
    console.log('=== FIN CONFIRMATION ===');
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setMemberToDelete(null);
  };

  // Fonction pour choisir une image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const selectShift = (shift: string) => {
    setEditShift(shift);
    setShowShiftPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Users color="#3b82f6" size={32} strokeWidth={2} />
          <Text style={styles.title}>Équipe Rayon</Text>
          <Text style={styles.subtitle}>Gérez votre équipe de grande distribution</Text>
        </View>

        {/* Team Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users color="#3b82f6" size={20} strokeWidth={2} />
            <Text style={styles.statValue}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Membres</Text>
          </View>
          <View style={styles.statCard}>
            <Target color="#10b981" size={20} strokeWidth={2} />
            <Text style={styles.statValue}>
              {Math.round(teamMembers.reduce((sum, m) => sum + m.performance, 0) / teamMembers.length)}%
            </Text>
            <Text style={styles.statLabel}>Performance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock color="#f59e0b" size={20} strokeWidth={2} />
            <Text style={styles.statValue}>
              {teamMembers.filter(m => m.status === 'En ligne').length}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Target color="#8b5cf6" size={20} strokeWidth={2} />
            <Text style={styles.statValue}>
              {teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0)}
            </Text>
            <Text style={styles.statLabel}>Tâches</Text>
          </View>
        </View>

        {/* Team Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Membres de l'équipe</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddMemberModal(true)}
            >
              <Plus color="#ffffff" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          {teamMembers
            .filter(member => member.id !== null && member.id !== undefined && !isNaN(member.id))
            .map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <Image source={{ uri: member.avatar }} style={styles.avatar} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <View style={styles.statusContainer}>
                    <View 
                      style={[
                        styles.statusDot, 
                        { backgroundColor: getStatusColor(member.status) }
                      ]} 
                    />
                    <Text style={styles.statusText}>{member.status}</Text>
                  </View>
                </View>
                <View style={styles.performanceContainer}>
                  <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(member.performance) }]}>
                    <Text style={styles.performanceText}>{member.performance}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.memberDetails}>
                <View style={styles.detailRow}>
                  <MapPin color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.shift}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Target color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.tasksCompleted} tâches terminées</Text>
                </View>
              </View>

              <View style={styles.memberActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => callMember(member.phone, member.name)}
                >
                  <Phone color="#3b82f6" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => sendMessage(member.email, member.name)}
                >
                  <Mail color="#10b981" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(member)}
                >
                  <Edit color="#f59e0b" size={18} strokeWidth={2} />
                  <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    console.log('Bouton supprimer cliqué pour:', member.name);
                    removeMember(member.id, member.name);
                  }}
                  activeOpacity={0.7}
                >
                  <X color="#ef4444" size={18} strokeWidth={2} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setShowAddMemberModal(true)}
          >
            <View style={styles.quickActionIcon}>
              <UserPlus color="#3b82f6" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickActionText}>Ajouter un membre</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setShowMeetingModal(true)}
          >
            <View style={styles.quickActionIcon}>
              <Calendar color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickActionText}>Planifier une réunion</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={styles.quickActionIcon}>
              <Target color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickActionText}>Évaluer les performances</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un membre</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Poste</Text>
              <TextInput
                style={styles.input}
                value={newMemberRole}
                onChangeText={setNewMemberRole}
                placeholder="Ex: Employé libre-service"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={addNewMember}
              >
                <Text style={styles.primaryButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        visible={showEditMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le membre</Text>
              <TouchableOpacity onPress={() => setShowEditMemberModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nom complet"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Poste *</Text>
              <TextInput
                style={styles.input}
                value={editRole}
                onChangeText={setEditRole}
                placeholder="Poste"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+33 6 XX XX XX XX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="email@exemple.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Localisation</Text>
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Ex: Fruits & Légumes"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Horaire de travail</Text>
              <TouchableOpacity 
                style={styles.shiftSelector}
                onPress={() => setShowShiftPicker(true)}
              >
                <Text style={[
                  styles.shiftSelectorText,
                  !editShift && styles.shiftSelectorPlaceholder
                ]}>
                  {editShift || "Sélectionner un horaire"}
                </Text>
                <ChevronDown color="#6b7280" size={20} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editPresetsButton}
                onPress={() => setShowPresetModal(true)}
              >
                <Text style={styles.editPresetsButtonText}>Modifier les presets</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Photo de profil</Text>
              <View style={styles.uploadContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Text style={styles.uploadButtonText}>Choisir une image</Text>
                </TouchableOpacity>
                {editAvatar ? (
                  <Image source={{ uri: editAvatar }} style={styles.avatarPreview} />
                ) : null}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEditMemberModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={saveMemberChanges}
              >
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Shift Picker Modal */}
      <Modal
        visible={showShiftPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShiftPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un horaire</Text>
              <TouchableOpacity onPress={() => setShowShiftPicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.shiftPickerList}>
              {shiftPresets.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.shiftOption,
                    editShift === preset && styles.selectedShiftOption
                  ]}
                  onPress={() => selectShift(preset)}
                >
                  <Text style={[
                    styles.shiftOptionText,
                    editShift === preset && styles.selectedShiftText
                  ]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Preset Management Modal */}
      <Modal
        visible={showPresetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier les horaires</Text>
              <TouchableOpacity onPress={() => setShowPresetModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.presetList}>
              {shiftPresets.map((preset, idx) => (
                <View key={idx} style={styles.presetItem}>
                  <TextInput
                    style={styles.presetInput}
                    value={preset}
                    onChangeText={text => {
                      const newPresets = [...shiftPresets];
                      newPresets[idx] = text;
                      setShiftPresets(newPresets);
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.deletePresetButton}
                    onPress={() => {
                      const newPresets = shiftPresets.filter((_, i) => i !== idx);
                      setShiftPresets(newPresets);
                    }}
                  >
                    <X color="#ef4444" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.addPresetContainer}>
                <TextInput
                  style={styles.presetInput}
                  value={newPreset}
                  onChangeText={setNewPreset}
                  placeholder="Nouvel horaire"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity 
                  style={styles.addPresetButton}
                  onPress={() => {
                    if (newPreset.trim()) {
                      setShiftPresets([...shiftPresets, newPreset]);
                      setNewPreset('');
                    }
                  }}
                >
                  <Plus color="#10b981" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowPresetModal(false)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Meeting Modal */}
      <Modal
        visible={showMeetingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMeetingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planifier une réunion</Text>
              <TouchableOpacity onPress={() => setShowMeetingModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Titre de la réunion</Text>
              <TextInput
                style={styles.input}
                value={meetingTitle}
                onChangeText={setMeetingTitle}
                placeholder="Ex: Point équipe hebdomadaire"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heure</Text>
              <TextInput
                style={styles.input}
                value={meetingTime}
                onChangeText={setMeetingTime}
                placeholder="Ex: 14:00"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowMeetingModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={scheduleMeeting}
              >
                <Text style={styles.primaryButtonText}>Planifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 350 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmer la suppression</Text>
              <TouchableOpacity onPress={cancelDelete}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmMessageContainer}>
              <Text style={styles.confirmMessage}>
                Êtes-vous sûr de vouloir supprimer{' '}
                <Text style={styles.memberNameHighlight}>
                  {memberToDelete?.name}
                </Text>{' '}
                de l'équipe ?
              </Text>
              <Text style={styles.confirmSubtext}>
                Cette action est irréversible et ne peut pas être annulée.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>Supprimer définitivement</Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  performanceContainer: {
    alignItems: 'flex-end',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  memberDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: '#fef3c7',
  },
  editButtonText: {
    color: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  quickActionCard: {
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
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
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
  shiftSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  shiftSelectorText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  shiftSelectorPlaceholder: {
    color: '#9ca3af',
  },
  editPresetsButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  editPresetsButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  avatarPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shiftPickerList: {
    maxHeight: 300,
  },
  shiftOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  selectedShiftOption: {
    backgroundColor: '#3b82f6',
  },
  shiftOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedShiftText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  presetList: {
    maxHeight: 300,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  presetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  deletePresetButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  addPresetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  addPresetButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  confirmMessageContainer: {
    marginBottom: 24,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  memberNameHighlight: {
    fontWeight: '600',
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});