/**
 * COMPOSANT: AIChat
 *
 * Interface de chat conversationnelle avec l'assistant IA
 * Simplifie l'expérience directeur: au lieu de 15 boutons, un simple chat!
 *
 * Fonctionnalités:
 * - Chat en temps réel avec Claude
 * - Suggestions de commandes
 * - Historique conversation
 * - Actions automatiques (créer tâches, voir stats, etc.)
 */

import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SupabaseContext } from '../contexts/SupabaseContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: any[];
}

interface Suggestion {
  category: string;
  commands: string[];
}

export default function AIChat() {
  const { user } = useContext(SupabaseContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3006';

  // Message de bienvenue au chargement
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Bonjour! Je suis votre assistant IA. Je peux vous aider à gérer votre magasin.\n\nVous pouvez me demander de:\n• Créer des tâches\n• Voir les statistiques\n• Organiser votre équipe\n• Et bien plus!\n\nQue puis-je faire pour vous?',
        timestamp: new Date()
      }]);
      loadSuggestions();
    }
  }, []);

  // Charger les suggestions de commandes
  const loadSuggestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/suggestions`);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  // Envoyer un message
  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();

    if (!messageText || isLoading) return;

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Scroll vers le bas
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Appeler l'API
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          user_id: user?.id,
          store_id: user?.store_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur API');
      }

      // Ajouter la réponse de l'IA
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
        actions: data.actions
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll vers le bas
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Erreur chat:', error);

      // Afficher erreur à l'utilisateur
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Désolé, une erreur est survenue: ${error.message}\n\nAssurez-vous que le serveur est démarré et que votre clé API Anthropic est configurée.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Utiliser une suggestion
  const useSuggestion = (command: string) => {
    setInputText(command);
    sendMessage(command);
  };

  // Effacer l'historique
  const clearHistory = async () => {
    Alert.alert(
      'Effacer l\'historique',
      'Êtes-vous sûr de vouloir effacer toute la conversation?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/ai/history/${user?.id}/${user?.store_id}`, {
                method: 'DELETE'
              });

              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: '👋 Historique effacé! Comment puis-je vous aider?',
                timestamp: new Date()
              }]);
              setShowSuggestions(true);
            } catch (error) {
              console.error('Erreur effacement historique:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🤖 Assistant IA</Text>
          <Text style={styles.headerSubtitle}>Propulsé par Claude</Text>
        </View>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑️ Effacer</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.aiBubble
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userText : styles.aiText
            ]}>
              {message.content}
            </Text>

            {/* Afficher les actions si présentes */}
            {message.actions && message.actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {message.actions.map((action, idx) => (
                  <View key={idx} style={styles.actionBadge}>
                    <Text style={styles.actionText}>
                      {action.success ? '✅' : '❌'} Action exécutée
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        ))}

        {/* Indicateur de chargement */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>L'IA réfléchit...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((category, idx) => (
              <View key={idx} style={styles.suggestionCategory}>
                {category.commands.slice(0, 1).map((command, cmdIdx) => (
                  <TouchableOpacity
                    key={cmdIdx}
                    style={styles.suggestionChip}
                    onPress={() => useSuggestion(command)}
                  >
                    <Text style={styles.suggestionText}>{command}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tapez votre message..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '⏳' : '📤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 4,
  },
  actionBadge: {
    backgroundColor: '#f0fdf4',
    padding: 6,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 11,
    color: '#15803d',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionCategory: {
    marginRight: 8,
  },
  suggestionChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  suggestionText: {
    fontSize: 13,
    color: '#1e40af',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    fontSize: 20,
  },
});
