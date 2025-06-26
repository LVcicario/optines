import React, { useState } from 'react';
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
import { Users, Phone, Mail, MapPin, Star, Clock, Plus, X, UserPlus, Calendar, Target } from 'lucide-react-native';

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
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

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

    const newMember: TeamMember = {
      id: Math.max(...teamMembers.map(m => m.id)) + 1,
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
            <Star color="#8b5cf6" size={20} strokeWidth={2} />
            <Text style={styles.statValue}>
              {(teamMembers.reduce((sum, m) => sum + m.rating, 0) / teamMembers.length).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Note moy.</Text>
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
          
          {teamMembers.map((member) => (
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
                  <View style={styles.ratingContainer}>
                    <Star color="#f59e0b" size={14} strokeWidth={2} fill="#f59e0b" />
                    <Text style={styles.rating}>{member.rating}</Text>
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
        animationType="slide"
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

      {/* Meeting Modal */}
      <Modal
        visible={showMeetingModal}
        transparent={true}
        animationType="slide"
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
    marginBottom: 8,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 4,
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
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
});