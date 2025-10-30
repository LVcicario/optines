import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserStore {
  store_id: number;
  store_name?: string;
}

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStore: UserStore | null;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStore, setUserStore] = useState<UserStore | null>(null);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('[SUPABASE] Session initiale:', session);
      console.log('[SUPABASE] User initial:', session?.user);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log(`[SUPABASE] Auth event: ${event}`);
      console.log('[SUPABASE] Session maj:', session);
      console.log('[SUPABASE] User maj:', session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Correction : forcer le rechargement du user si la session existe mais pas le user
  useEffect(() => {
    if (session && !user) {
      supabase.auth.getUser().then(({ data, error }) => {
        if (data?.user) {
          setUser(data.user);
        }
        if (error) {
          console.error('[SUPABASE] Erreur getUser:', error.message);
        }
      });
    }
  }, [session, user]);

  // Récupérer le store_id de l'utilisateur
  useEffect(() => {
    if (user) {
      supabase
        .from('users')
        .select('store_id')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setUserStore({ store_id: data.store_id });
          } else if (error) {
            console.error('[SUPABASE] Erreur récupération store_id:', error.message);
          }
        });
    } else {
      setUserStore(null);
    }
  }, [user]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserStore(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    userStore,
    signOut,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase doit être utilisé dans un SupabaseProvider');
  }
  return context;
} 