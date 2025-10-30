import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const { user, session, loading, signOut } = useSupabase();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  // Synchroniser avec le contexte Supabase
  useEffect(() => {
    setAuthState({
      user,
      isLoading: loading,
      isAuthenticated: !!user,
      error: null
    });
  }, [user, loading]);

  const login = async (identifier: string, password: string, role?: 'manager' | 'director') => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let email = identifier;

      // Si l'identifiant ne contient pas @, c'est un username, il faut chercher l'email correspondant
      if (!identifier.includes('@')) {
        try {
          const { data: userData, error: userError } = await supabase
        .from('users')
            .select('email')
            .eq('username', identifier)
        .single();

          if (userError || !userData) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Utilisateur non trouvé'
            }));
            return { success: false, error: 'Utilisateur non trouvé' };
          }

          email = userData.email;
        } catch (searchError) {
          console.error('Erreur lors de la recherche d\'utilisateur:', searchError);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur de recherche d\'utilisateur'
          }));
          return { success: false, error: 'Erreur de recherche d\'utilisateur' };
        }
      }

      // Authentification native Supabase avec l'email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Identifiants incorrects'
        }));
        return { success: false, error: 'Identifiants incorrects' };
      }

      // Vérifier le rôle de l'utilisateur si un rôle est spécifié
      if (role) {
        try {
          const { data: userRoleData, error: roleError } = await supabase
            .from('users')
            .select('role, username')
            .eq('id', data.user.id)
            .single();

          if (roleError || !userRoleData) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Erreur lors de la vérification du rôle'
            }));
            return { success: false, error: 'Erreur lors de la vérification du rôle' };
          }

          // Normaliser les rôles pour la comparaison (supporter français et anglais)
          const normalizeRole = (role: string) => {
            switch (role.toLowerCase()) {
              case 'director':
              case 'directeur':
                return 'director';
              case 'manager':
                return 'manager';
              default:
                return role.toLowerCase();
            }
          };

          const userRole = normalizeRole(userRoleData.role);
          const expectedRole = normalizeRole(role);

          // Vérifier que le rôle correspond
          if (userRole !== expectedRole) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: `Accès refusé. Cette page est réservée aux ${role === 'manager' ? 'managers' : 'directeurs'}.`
            }));
            return { 
              success: false, 
              error: `Accès refusé. Cette page est réservée aux ${role === 'manager' ? 'managers' : 'directeurs'}.` 
            };
          }
        } catch (roleCheckError) {
          console.error('Erreur lors de la vérification du rôle:', roleCheckError);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors de la vérification du rôle'
          }));
          return { success: false, error: 'Erreur lors de la vérification du rôle' };
        }
      }

      // Le provider global va maintenant détecter la session et le user automatiquement
      setAuthState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de connexion'
      }));
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await signOut();

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de déconnexion'
      }));
      return { success: false, error: 'Erreur de déconnexion' };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!authState.user) {
        throw new Error('Aucun utilisateur connecté');
      }

      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Mettre à jour les données utilisateur dans notre table
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      setAuthState(prev => ({
        ...prev,
        user: data.user
      }));

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { success: false, error: 'Erreur de mise à jour du profil' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!authState.user) {
        throw new Error('Aucun utilisateur connecté');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return { success: false, error: 'Erreur de changement de mot de passe' };
    }
  };

  return {
    ...authState,
    login,
    logout,
    updateProfile,
    changePassword,
  };
}; 