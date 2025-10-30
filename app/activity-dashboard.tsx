/**
 * PAGE: Activity Dashboard
 *
 * Dashboard temps réel de l'activité des employés
 * Accessible uniquement aux directeurs
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import LiveActivityDashboard from '../components/LiveActivityDashboard';
import { useTheme } from '../contexts/ThemeContext';

export default function ActivityDashboardPage() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen
        options={{
          title: 'Activité en direct',
          headerStyle: {
            backgroundColor: isDark ? '#18181b' : '#ffffff',
          },
          headerTintColor: isDark ? '#ffffff' : '#1a1a1a',
          headerShadowVisible: false,
        }}
      />
      <LiveActivityDashboard storeId={parseInt(storeId || '1', 10)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
});
