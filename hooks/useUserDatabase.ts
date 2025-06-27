import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

const USERS_STORAGE_KEY = '@users_database';

// Données initiales par défaut
const defaultUsers: User[] = [
  // Utilisateur de test
  { 
    id: 0, 
    username: 'test.manager', 
    password: 'test123', 
    fullName: 'Manager Test', 
    role: 'manager', 
    section: 'Test',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  // Managers
  { 
    id: 1, 
    username: 'marie.d', 
    password: 'MD2024!', 
    fullName: 'Marie Dubois', 
    role: 'manager', 
    section: 'Fruits & Légumes',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 2, 
    username: 'pierre.m', 
    password: 'PM2024!', 
    fullName: 'Pierre Martin', 
    role: 'manager', 
    section: 'Boucherie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 3, 
    username: 'sophie.l', 
    password: 'SL2024!', 
    fullName: 'Sophie Laurent', 
    role: 'manager', 
    section: 'Poissonnerie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 4, 
    username: 'thomas.d', 
    password: 'TD2024!', 
    fullName: 'Thomas Durand', 
    role: 'manager', 
    section: 'Charcuterie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 5, 
    username: 'julie.m', 
    password: 'JM2024!', 
    fullName: 'Julie Moreau', 
    role: 'manager', 
    section: 'Fromage',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  // Directors
  { 
    id: 6, 
    username: 'jean.d', 
    password: 'JD2024!', 
    fullName: 'Jean Dupont', 
    role: 'director',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 7, 
    username: 'anne.r', 
    password: 'AR2024!', 
    fullName: 'Anne Rousseau', 
    role: 'director',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  // Nouveaux Managers
  { 
    id: 8, 
    username: 'lucas.b', 
    password: 'LB2024!', 
    fullName: 'Lucas Bernard', 
    role: 'manager', 
    section: 'Épicerie Salée',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 9, 
    username: 'emma.t', 
    password: 'ET2024!', 
    fullName: 'Emma Tremblay', 
    role: 'manager', 
    section: 'Épicerie Sucrée',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 10, 
    username: 'alexandre.p', 
    password: 'AP2024!', 
    fullName: 'Alexandre Pelletier', 
    role: 'manager', 
    section: 'Surgelés',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 11, 
    username: 'camille.g', 
    password: 'CG2024!', 
    fullName: 'Camille Gagnon', 
    role: 'manager', 
    section: 'Produits Laitiers',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 12, 
    username: 'maxime.r', 
    password: 'MR2024!', 
    fullName: 'Maxime Roy', 
    role: 'manager', 
    section: 'Boissons',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 13, 
    username: 'laura.s', 
    password: 'LS2024!', 
    fullName: 'Laura Simard', 
    role: 'manager', 
    section: 'Fruits & Légumes',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 14, 
    username: 'nathan.l', 
    password: 'NL2024!', 
    fullName: 'Nathan Lavoie', 
    role: 'manager', 
    section: 'Boucherie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 15, 
    username: 'chloe.m', 
    password: 'CM2024!', 
    fullName: 'Chloé Mercier', 
    role: 'manager', 
    section: 'Poissonnerie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 16, 
    username: 'hugo.d', 
    password: 'HD2024!', 
    fullName: 'Hugo Deschamps', 
    role: 'manager', 
    section: 'Charcuterie',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 17, 
    username: 'zoey.c', 
    password: 'ZC2024!', 
    fullName: 'Zoey Couture', 
    role: 'manager', 
    section: 'Fromage',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 18, 
    username: 'felix.b', 
    password: 'FB2024!', 
    fullName: 'Félix Beaulieu', 
    role: 'manager', 
    section: 'Épicerie Salée',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 19, 
    username: 'elodie.p', 
    password: 'EP2024!', 
    fullName: 'Élodie Paradis', 
    role: 'manager', 
    section: 'Épicerie Sucrée',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 20, 
    username: 'raphael.l', 
    password: 'RL2024!', 
    fullName: 'Raphaël Leblanc', 
    role: 'manager', 
    section: 'Surgelés',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 21, 
    username: 'lea.f', 
    password: 'LF2024!', 
    fullName: 'Léa Fortin', 
    role: 'manager', 
    section: 'Produits Laitiers',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  { 
    id: 22, 
    username: 'gabriel.c', 
    password: 'GC2024!', 
    fullName: 'Gabriel Caron', 
    role: 'manager', 
    section: 'Boissons',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export const useUserDatabase = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les utilisateurs depuis AsyncStorage
  const loadUsers = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Première fois: initialiser avec les utilisateurs par défaut
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        setUsers(defaultUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers(defaultUsers);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les utilisateurs dans AsyncStorage
  const saveUsers = async (newUsers: User[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    }
  };

  // Ajouter un nouvel utilisateur
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      createdAt: new Date().toISOString(),
    };
    const newUsers = [...users, newUser];
    await saveUsers(newUsers);
    return newUser;
  };

  // Mettre à jour un utilisateur
  const updateUser = async (id: number, updates: Partial<User>) => {
    const newUsers = users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    );
    await saveUsers(newUsers);
  };

  // Supprimer un utilisateur
  const deleteUser = async (id: number) => {
    try {
      console.log('🔍 Tentative de suppression de l\'utilisateur ID:', id);
      console.log('📈 Utilisateurs avant suppression:', users.length);
      
      // Vérifier si l'utilisateur existe
      const userToDelete = users.find(user => user.id === id);
      if (!userToDelete) {
        console.warn('⚠️ Utilisateur non trouvé avec ID:', id);
        throw new Error('Utilisateur non trouvé');
      }
      
      // Filtrer l'utilisateur à supprimer
      const newUsers = users.filter(user => user.id !== id);
      
      console.log('📉 Utilisateurs après suppression:', newUsers.length);
      
      // Sauvegarder immédiatement
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      
      // Mettre à jour l'état local
      setUsers(newUsers);
      
      console.log('✅ Utilisateur supprimé avec succès:', userToDelete.fullName);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  };

  // Authentifier un utilisateur
  const authenticateUser = (username: string, password: string, role: 'manager' | 'director') => {
    console.log('🔐 Tentative d\'authentification:');
    console.log('  - Username:', username);
    console.log('  - Password:', password);
    console.log('  - Role:', role);
    console.log('  - Nombre d\'utilisateurs dans la DB:', users.length);
    console.log('  - Utilisateurs disponibles:', users.map(u => ({ username: u.username, role: u.role, isActive: u.isActive })));
    
    const user = users.find(user => 
      user.username === username && 
      user.password === password && 
      user.role === role &&
      user.isActive
    );
    
    if (user) {
      console.log('✅ Authentification réussie pour:', user.fullName);
    } else {
      console.log('❌ Authentification échouée - Utilisateur non trouvé ou invalide');
    }
    
    return user;
  };

  // Obtenir les utilisateurs par rôle
  const getUsersByRole = (role: 'manager' | 'director') => {
    return users.filter(user => user.role === role);
  };

  // Vérifier si un nom d'utilisateur existe déjà
  const isUsernameTaken = (username: string, excludeId?: number) => {
    return users.some(user => 
      user.username === username && user.id !== excludeId
    );
  };

  // Réinitialiser la base de données aux valeurs par défaut
  const resetToDefaults = async () => {
    await saveUsers(defaultUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    authenticateUser,
    getUsersByRole,
    isUsernameTaken,
    resetToDefaults,
    loadUsers
  };
}; 