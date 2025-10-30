/**
 * PAGE: Assistant IA
 *
 * Page dédiée à l'assistant IA conversationnel
 * Accessible depuis le dashboard directeur
 */

import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import AIChat from '../components/AIChat';

export default function AIAssistantPage() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Assistant IA',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />
      <AIChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
