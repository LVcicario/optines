import React, { useState, useCallback, useMemo } from 'react';
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
  Animated,
  InteractionManager,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserDatabase } from '../hooks/useUserDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { userType } = useLocalSearchParams<{ userType: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUsername, setLastUsername] = useState('');

  // Obtenir les dimensions de l'écran avec listener pour les changements
  const { width: screenWidth, height: screenHeight } = dimensions;
  const isTablet = screenWidth > 768;
  const isLargeScreen = screenWidth > 1024;

  // Log pour debug
  React.useEffect(() => {
    console.log('📱 Dimensions détectées:', {
      width: screenWidth,
      height: screenHeight,
      isTablet,
      isLargeScreen,
      platform: Platform.OS
    });
  }, [screenWidth, screenHeight, isTablet, isLargeScreen]);

  // Animations pour améliorer la réactivité
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = React.useRef(new Animated.Value(1)).current;
  const popupScaleAnim = React.useRef(new Animated.Value(0)).current;
  const popupOpacityAnim = React.useRef(new Animated.Value(0)).current;

  const { users, loading: dbLoading, authenticateUser } = useUserDatabase();

  const isManager = userType === 'manager';
  const isDirector = userType === 'director';

  // Fonction pour mettre à jour le dernier identifiant saisi
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
    // Sauvegarder l'identifiant même s'il est vide (pour garder le dernier saisi)
    setLastUsername(text);
    console.log('🔍 Identifiant saisi:', text, '-> lastUsername:', text);
    
    // Sauvegarder dans AsyncStorage
    if (text.trim()) {
      AsyncStorage.setItem('lastUsername', text.trim()).catch(error => {
        console.log('❌ Erreur lors de la sauvegarde de l\'identifiant:', error);
      });
    }
    
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  // Fonctions d'animation pour la popup
  const showPopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(popupScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [popupOpacityAnim, popupScaleAnim]);

  const hidePopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(popupScaleAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setShowErrorPopup(false);
    });
  }, [popupOpacityAnim, popupScaleAnim]);

  // Animation d'entrée fluide
  React.useEffect(() => {
    // Animation simplifiée pour améliorer la réactivité
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  // Écouter les changements de dimensions
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Charger l'identifiant de la dernière connexion au démarrage
  React.useEffect(() => {
    const loadLastUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('lastUsername');
        if (savedUsername) {
          setLastUsername(savedUsername);
          console.log('📱 Identifiant chargé depuis le stockage:', savedUsername);
        }
      } catch (error) {
        console.log('❌ Erreur lors du chargement de l\'identifiant:', error);
      }
    };
    
    loadLastUsername();
  }, []);

  // Optimisation des callbacks
  const handleLogin = useCallback(() => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Veuillez remplir tous les champs');
      setShowErrorPopup(true);
      showPopup();
      return;
    }

    setLoading(true);

    // Animation du bouton simplifiée
    Animated.timing(buttonScaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });

    // Connexion optimisée avec délai réduit
    InteractionManager.runAfterInteractions(() => {
      const role = isManager ? 'manager' : 'director';
      const user = authenticateUser(username.trim(), password.trim(), role);

      if (user) {
        if (!user.isActive) {
          setLoading(false);
          setErrorMessage('Ce compte est désactivé. Contactez l\'administrateur.');
          setShowErrorPopup(true);
          showPopup();
          return;
        }
        
        // Sauvegarder l'identifiant de la connexion réussie
        setLastUsername(username.trim());
        console.log('✅ Connexion réussie - Identifiant sauvegardé:', username.trim());
        
        // Sauvegarder dans AsyncStorage
        AsyncStorage.setItem('lastUsername', username.trim()).catch(error => {
          console.log('❌ Erreur lors de la sauvegarde de l\'identifiant:', error);
        });
        
        setLoading(false);
        
        // Navigation immédiate
        if (isManager) {
          router.replace('/(manager-tabs)');
        } else {
          router.replace('/directeur');
        }
      } else {
        setLoading(false);
        setErrorMessage('Identifiant ou mot de passe incorrect');
        setShowErrorPopup(true);
        showPopup();
      }
    });
  }, [username, password, isManager, authenticateUser, buttonScaleAnim, showPopup]);

  const quickLogin = useCallback((userExample: any) => {
    if (!userExample.isActive) {
      Alert.alert('Erreur', 'Ce compte est désactivé. Contactez l\'administrateur.');
      return;
    }
    
    setUsername(userExample.username);
    setPassword(userExample.password);
    
    // Connexion rapide optimisée
    InteractionManager.runAfterInteractions(() => {
      if (isManager) {
        router.replace('/(manager-tabs)');
      } else {
        router.replace('/directeur');
      }
    });
  }, [isManager]);

  // Fonction de connexion rapide avec le dernier identifiant
  const quickLoginWithLastUsername = useCallback(() => {
    console.log('🚀 Pré-remplissage avec l\'identifiant:', lastUsername);
    if (!lastUsername) {
      setErrorMessage('Aucun identifiant précédent disponible. Veuillez saisir un identifiant d\'abord.');
      setShowErrorPopup(true);
      showPopup();
      return;
    }

    // Pré-remplir seulement le champ nom d'utilisateur
    setUsername(lastUsername);
    
    // Focus sur le champ mot de passe pour faciliter la saisie
    // Note: React Native n'a pas de focus automatique, l'utilisateur devra cliquer manuellement
  }, [lastUsername, showPopup]);

  // Optimisation avec useMemo pour éviter les recalculs
  const example = useMemo(() => {
    return {
      username: 'exemple.user',
      password: 'motdepasse123',
      name: 'Utilisateur Exemple'
    };
  }, []);

  // Styles dynamiques basés sur la taille de l'écran
  const dynamicStyles = useMemo(() => ({
    formContainer: {
      paddingHorizontal: isLargeScreen ? 200 : isTablet ? 80 : 24,
      maxWidth: isLargeScreen ? 1000 : isTablet ? 700 : '100%' as any,
      alignSelf: 'center' as const,
      width: '100%' as const,
      marginBottom: 32,
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: isLargeScreen ? 60 : isTablet ? 40 : 24,
      minWidth: isLargeScreen ? 700 : isTablet ? 500 : 'auto' as any,
      maxWidth: isLargeScreen ? 900 : isTablet ? 600 : '100%' as any,
      ...Platform.select({
        web: {
          boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12,
        },
      }),
    },
    title: {
      fontSize: isLargeScreen ? 48 : isTablet ? 36 : 28,
      fontWeight: '700' as const,
      color: '#1a1a1a',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      color: '#6b7280',
    },
    inputLabel: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      fontWeight: '600' as const,
      color: '#1a1a1a',
      marginBottom: 12,
    },
    input: {
      flex: 1,
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      color: '#1a1a1a',
      marginLeft: 16,
      marginRight: 12,
    },
    inputWrapper: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: isLargeScreen ? 24 : isTablet ? 20 : 14,
      borderWidth: 2,
      borderColor: '#e5e7eb',
      minHeight: isLargeScreen ? 80 : isTablet ? 70 : 52,
    },
    eyeButton: {
      padding: isLargeScreen ? 20 : isTablet ? 16 : 8,
      marginLeft: 8,
    },
    loginButton: {
      borderRadius: 16,
      padding: isLargeScreen ? 32 : isTablet ? 24 : 16,
      alignItems: 'center' as const,
      marginBottom: 16,
      marginTop: 8,
      minHeight: isLargeScreen ? 80 : isTablet ? 70 : 52,
      justifyContent: 'center' as const,
      ...Platform.select({
        web: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    loginButtonText: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
  }), [isLargeScreen, isTablet]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  if (dbLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la base de données...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          removeClippedSubviews={true}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={dynamicStyles.title}>Connexion</Text>
              <Text style={dynamicStyles.subtitle}>
                {isManager ? 'Espace Manager' : 'Espace Directeur'}
              </Text>
            </View>
          </Animated.View>

          {/* Login Form */}
          <Animated.View 
            style={[
              dynamicStyles.formContainer,
              {
                opacity: fadeAnim
              }
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={dynamicStyles.formCard}
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
                <Text style={dynamicStyles.inputLabel}>Identifiant</Text>
                <View style={dynamicStyles.inputWrapper}>
                  <User color="#6b7280" size={20} strokeWidth={2} />
                  <TextInput
                    style={dynamicStyles.input}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="prenom.n"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                <Text style={styles.inputHint}>
                  Format: prénom.première_lettre_nom (ex: {example.username})
                </Text>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={dynamicStyles.inputLabel}>Mot de passe</Text>
                <View style={dynamicStyles.inputWrapper}>
                  <Lock color="#6b7280" size={20} strokeWidth={2} />
                  <TextInput
                    style={dynamicStyles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Mot de passe"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={dynamicStyles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
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
              </View>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.loginButton,
                    { backgroundColor: isManager ? '#3b82f6' : '#10b981' },
                    loading && styles.loginButtonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={dynamicStyles.loginButtonText}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Quick Login Button */}
              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={quickLoginWithLastUsername}
                activeOpacity={0.8}
              >
                <Text style={styles.quickLoginText}>
                  🔄 Pré-remplir identifiant {lastUsername ? `(${lastUsername})` : '(Aucun identifiant)'}
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  Problème de connexion ? Contactez l'administrateur système.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Popup */}
      {showErrorPopup && (
        <Animated.View 
          style={[
            styles.popupOverlay,
            {
              opacity: popupOpacityAnim
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.popupContainer,
              {
                transform: [{ scale: popupScaleAnim }]
              }
            ]}
          >
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>⚠️ Erreur</Text>
            </View>
            <View style={styles.popupContent}>
              <Text style={styles.popupMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={hidePopup}
              activeOpacity={0.8}
            >
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 24,
    paddingTop: Platform.OS === 'web' ? 32 : 16,
    paddingBottom: Platform.OS === 'web' ? 24 : 16,
    marginBottom: Platform.OS === 'web' ? 16 : 8,
  },
  backButton: {
    padding: Platform.OS === 'web' ? 16 : 8,
    marginRight: Platform.OS === 'web' ? 20 : 12,
    borderRadius: Platform.OS === 'web' ? 12 : 8,
    backgroundColor: '#ffffff',
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
  headerContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Platform.OS === 'web' ? 32 : 24,
  },
  inputHint: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    marginTop: Platform.OS === 'web' ? 12 : 8,
    fontStyle: 'italic',
  },
  userTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'web' ? 20 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    marginBottom: Platform.OS === 'web' ? 32 : 24,
  },
  userTypeText: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: Platform.OS === 'web' ? 12 : 8,
  },
  exampleContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    padding: Platform.OS === 'web' ? 24 : 16,
    marginBottom: Platform.OS === 'web' ? 32 : 20,
    marginTop: Platform.OS === 'web' ? 12 : 4,
  },
  exampleTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  exampleCredentials: {
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  exampleText: {
    fontSize: Platform.OS === 'web' ? 16 : 13,
    color: '#374151',
    marginBottom: Platform.OS === 'web' ? 6 : 4,
    lineHeight: Platform.OS === 'web' ? 24 : 18,
  },
  exampleLabel: {
    fontWeight: '600',
  },
  exampleNote: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 12 : 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  quickLoginButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    padding: Platform.OS === 'web' ? 24 : 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 24 : 16,
    borderWidth: 2,
    borderColor: '#10b981',
    minHeight: Platform.OS === 'web' ? 64 : 44,
  },
  quickLoginText: {
    fontSize: Platform.OS === 'web' ? 20 : 14,
    fontWeight: '600',
    color: '#10b981',
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 16 : 8,
  },
  helpText: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 24 : 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    fontWeight: '600',
    color: '#10b981',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    maxWidth: '80%',
    width: '100%',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  popupContent: {
    marginBottom: 16,
  },
  popupMessage: {
    fontSize: 16,
    color: '#6b7280',
  },
  popupButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});