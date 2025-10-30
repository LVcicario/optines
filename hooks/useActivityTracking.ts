/**
 * HOOK: useActivityTracking
 *
 * Gère le tracking d'activité en temps réel des employés
 * - Envoie des heartbeats automatiques toutes les 5 minutes
 * - Met à jour l'état d'activité
 * - Fonctionne en arrière-plan
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes en millisecondes

interface ActivityStatus {
  isTracking: boolean;
  lastHeartbeat: Date | null;
  status: 'active' | 'inactive' | 'on_break' | 'offline';
}

interface HeartbeatData {
  employee_id: string;
  store_id: number;
  timestamp?: Date;
  location?: string;
  device_info?: {
    platform: string;
    version: string;
  };
}

export function useActivityTracking(employeeId?: string, storeId?: number) {
  const [status, setStatus] = useState<ActivityStatus>({
    isTracking: false,
    lastHeartbeat: null,
    status: 'offline',
  });
  const [error, setError] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  /**
   * Récupère la position GPS (optionnel)
   */
  const getLocation = async (): Promise<string | undefined> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return undefined;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return `${location.coords.latitude},${location.coords.longitude}`;
    } catch (err) {
      console.log('[ActivityTracking] Impossible de récupérer la localisation:', err);
      return undefined;
    }
  };

  /**
   * Envoie un heartbeat au serveur
   */
  const sendHeartbeat = async (): Promise<boolean> => {
    if (!employeeId || !storeId) {
      console.log('[ActivityTracking] employeeId ou storeId manquant');
      return false;
    }

    try {
      const location = await getLocation();

      const heartbeatData: HeartbeatData = {
        employee_id: employeeId,
        store_id: storeId,
        timestamp: new Date(),
        location,
        device_info: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
      };

      console.log('[ActivityTracking] Envoi heartbeat...');

      const response = await fetch(`${API_URL}/api/activity/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heartbeatData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du heartbeat');
      }

      const data = await response.json();

      setStatus((prev) => ({
        ...prev,
        lastHeartbeat: new Date(),
        status: data.status || 'active',
      }));

      setError(null);

      // Sauvegarder le dernier heartbeat localement
      await AsyncStorage.setItem(
        'last_heartbeat',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          employee_id: employeeId,
          store_id: storeId,
        })
      );

      console.log('[ActivityTracking] Heartbeat envoyé avec succès');
      return true;
    } catch (err: any) {
      console.error('[ActivityTracking] Erreur heartbeat:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Démarre le tracking automatique
   */
  const startTracking = async () => {
    if (!employeeId || !storeId) {
      setError('employeeId et storeId requis pour démarrer le tracking');
      return;
    }

    console.log('[ActivityTracking] Démarrage du tracking...');

    // Envoyer immédiatement un heartbeat
    await sendHeartbeat();

    // Configurer l'intervalle
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    setStatus((prev) => ({
      ...prev,
      isTracking: true,
    }));

    console.log('[ActivityTracking] Tracking démarré (heartbeat toutes les 5 min)');
  };

  /**
   * Arrête le tracking automatique
   */
  const stopTracking = () => {
    console.log('[ActivityTracking] Arrêt du tracking...');

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    setStatus((prev) => ({
      ...prev,
      isTracking: false,
      status: 'offline',
    }));

    console.log('[ActivityTracking] Tracking arrêté');
  };

  /**
   * Gère les changements d'état de l'app
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // L'app revient au premier plan
        console.log('[ActivityTracking] App revenue au premier plan');
        if (status.isTracking && employeeId && storeId) {
          sendHeartbeat();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [status.isTracking, employeeId, storeId]);

  /**
   * Nettoyer à la destruction du composant
   */
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  /**
   * Récupérer le dernier heartbeat au montage
   */
  useEffect(() => {
    const loadLastHeartbeat = async () => {
      try {
        const lastHeartbeatStr = await AsyncStorage.getItem('last_heartbeat');
        if (lastHeartbeatStr) {
          const lastHeartbeat = JSON.parse(lastHeartbeatStr);
          setStatus((prev) => ({
            ...prev,
            lastHeartbeat: new Date(lastHeartbeat.timestamp),
          }));
        }
      } catch (err) {
        console.error('[ActivityTracking] Erreur chargement dernier heartbeat:', err);
      }
    };

    loadLastHeartbeat();
  }, []);

  return {
    status,
    error,
    startTracking,
    stopTracking,
    sendHeartbeat,
  };
}
