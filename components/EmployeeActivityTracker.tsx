/**
 * COMPONENT: EmployeeActivityTracker
 *
 * Composant invisible qui tourne en arrière-plan pour les managers
 * Envoie automatiquement des heartbeats toutes les 5 minutes
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useActivityTracking } from '../hooks/useActivityTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmployeeActivityTrackerProps {
  employeeId?: string;
  storeId?: number;
  autoStart?: boolean;
}

export default function EmployeeActivityTracker({
  employeeId,
  storeId,
  autoStart = true,
}: EmployeeActivityTrackerProps) {
  const { status, error, startTracking, stopTracking } = useActivityTracking(employeeId, storeId);

  useEffect(() => {
    if (autoStart && employeeId && storeId) {
      console.log('[EmployeeActivityTracker] Démarrage automatique du tracking');
      startTracking();

      // Sauvegarder qu'on est en tracking
      AsyncStorage.setItem('activity_tracking_enabled', 'true');
    }

    return () => {
      if (autoStart) {
        console.log('[EmployeeActivityTracker] Arrêt du tracking');
        stopTracking();
        AsyncStorage.setItem('activity_tracking_enabled', 'false');
      }
    };
  }, [employeeId, storeId, autoStart]);

  // Log des erreurs
  useEffect(() => {
    if (error) {
      console.error('[EmployeeActivityTracker] Erreur:', error);
    }
  }, [error]);

  // Composant invisible - pas de UI
  return <View style={{ display: 'none' }} />;
}
