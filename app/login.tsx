import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

// Base de données des utilisateurs (en production, ceci serait dans une vraie base de données)
const users = {
  managers: [
    { id: 1, username: 'marie.d', password: 'MD2024!', fullName: 'Marie Dubois', section: 'Fruits & Légumes' },
    { id: 2, username: 'pierre.m', password: 'PM2024!', fullName: 'Pierre Martin', section: 'Boucherie' },
    { id: 3, username: 'sophie.l', password: 'SL2024!', fullName: 'Sophie Laurent', section: 'Poissonnerie' },
    { id: 4, username: 'thomas.d', password: 'TD2024!', fullName: 'Thomas Durand', section: 'Charcuterie' },
    { id: 5, username: 'julie.m', password: 'JM2024!', fullName: 'Julie Moreau', section: 'Fromage' },
  ],
  directors: [
    { id: 1, username: 'jean.d', password: 'JD2024!', fullName: 'Jean Dupont', role: 'Directeur Général' },
    { id: 2, username: 'anne.r', password: 'AR2024!', fullName: 'Anne Rousseau', role: 'Directrice Adjointe' },
  ]
};

export default function LoginScreen() {
  const { userType } = useLocalSearchParams<{ userType: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManager = userType === 'manager';
  const isDirector = userType === 'director';

  const handleLogin = () => {
    console.log('Login button pressed!'); // Debug log
    console.log('Username:', username, 'Password:', password); // Debug log
    
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    console.log('Loading set to true'); // Debug log

    // Simulation d'une requête de connexion
    setTimeout(() => {
      console.log('Checking credentials...'); // Debug log
      const userDatabase = isManager ? users.managers : users.directors;
      const user = userDatabase.find(u => u.username === username.trim() && u.password === password.trim());

      console.log('User found:', user); // Debug log

      if (user) {
        // Connexion réussie
        console.log('Login successful, navigating...'); // Debug log
        setLoading(false);
        
        // Navigation directe sans Alert pour éviter les problèmes
        if (isManager) {
          router.replace('/(manager-tabs)');
        } else {
          router.replace('/directeur');
        }
      } else {
        // Échec de la connexion
        console.log('Login failed'); // Debug log
        setLoading(false);
        Alert.alert('Erreur', 'Identifiant ou mot de passe incorrect');
      }
    }, 1000);
  };

  const quickLogin = (userExample: any) => {
    console.log('Quick login for:', userExample.fullName);
    setUsername(userExample.username);
    setPassword(userExample.password);
    
    // Auto-login after setting credentials
    setTimeout(() => {
      if (isManager) {
        router.replace('/(manager-tabs)');
      } else {
        router.replace('/directeur');
      }
    }, 500);
  };

  const getExampleCredentials = () => {
    if (isManager) {
      return {
        username: 'marie.d',
        password: 'MD2024!',
        name: 'Marie Dubois'
      };
    } else {
      return {
        username: 'jean.d',
        password: 'JD2024!',
        name: 'Jean Dupont'
      };
    }
  };

  const example = getExampleCredentials();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>
                {isManager ? 'Espace Manager' : 'Espace Directeur'}
              </Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.formCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* User Type Indicator */}
              <View style={[
                styles.userTypeIndicator,
                { backgroundColor: isManager ? '#3b82f6' : '#10b981' }
              ]}>
                <User color="#ffffff" size={24} strokeWidth={2} />
                <Text style={styles.userTypeText}>
                  {isManager ? 'Manager' : 'Directeur'}
                </Text>
              </View>

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Identifiant</Text>
                <View style={styles.inputWrapper}>
                  <User color="#6b7280" size={20} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="prenom.n"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Text style={styles.inputHint}>
                  Format: prénom.première_lettre_nom (ex: {example.username})
                </Text>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#6b7280" size={20} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff color="#6b7280" size={20} strokeWidth={2} />
                    ) : (
                      <Eye color="#6b7280" size={20} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Mot de passe généré par l'administration
                </Text>
              </View>

              {/* Example Credentials */}
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>💡 Exemple de connexion:</Text>
                <View style={styles.exampleCredentials}>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Utilisateur:</Text> {example.name}
                  </Text>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Identifiant:</Text> {example.username}
                  </Text>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Mot de passe:</Text> {example.password}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.fillExampleButton}
                  onPress={() => {
                    setUsername(example.username);
                    setPassword(example.password);
                  }}
                >
                  <Text style={styles.fillExampleText}>Remplir automatiquement</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: isManager ? '#3b82f6' : '#10b981' },
                  loading && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Text>
              </TouchableOpacity>

              {/* Quick Login Button */}
              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={() => quickLogin(isManager ? users.managers[0] : users.directors[0])}
              >
                <Text style={styles.quickLoginText}>
                  🚀 Connexion rapide ({example.name})
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  Problème de connexion ? Contactez l'administrateur système.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Available Users List */}
          <View style={styles.usersListContainer}>
            <Text style={styles.usersListTitle}>
              Utilisateurs disponibles ({isManager ? 'Managers' : 'Directeurs'}):
            </Text>
            <View style={styles.usersList}>
              {(isManager ? users.managers : users.directors).map((user, index) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userItem,
                    index === (isManager ? users.managers : users.directors).length - 1 && styles.lastUserItem
                  ]}
                  onPress={() => quickLogin(user)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userItemContent}>
                    <Text style={styles.userItemName}>{user.fullName}</Text>
                    <Text style={styles.userItemUsername}>({user.username})</Text>
                  </View>
                  <Text style={styles.tapHint}>Appuyer pour se connecter</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  userTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    marginRight: 8,
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
    lineHeight: 16,
  },
  exampleContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  exampleCredentials: {
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },
  exampleLabel: {
    fontWeight: '600',
  },
  fillExampleButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  fillExampleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 52,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickLoginButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  quickLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  usersListContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  usersListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  usersList: {
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
    elevation: 3,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderRadius: 8,
  },
  lastUserItem: {
    borderBottomWidth: 0,
  },
  userItemContent: {
    flex: 1,
  },
  userItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userItemUsername: {
    fontSize: 12,
    color: '#6b7280',
  },
  tapHint: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
});