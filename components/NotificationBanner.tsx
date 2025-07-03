import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { X, Bell, AlertTriangle, Clock, Users } from 'lucide-react-native';
import { useNotifications } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

interface NotificationBannerProps {
  onClose?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onClose }) => {
  const { notification } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      // Animer l'entrée de la notification
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-fermer après 5 secondes
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getNotificationIcon = () => {
    if (!notification) return <Bell color="#ffffff" size={20} strokeWidth={2} />;
    
    const data = notification.request.content.data;
    switch (data?.type) {
      case 'task_reminder':
        return <Clock color="#ffffff" size={20} strokeWidth={2} />;
      case 'conflict_alert':
        return <AlertTriangle color="#ffffff" size={20} strokeWidth={2} />;
      case 'employee_update':
        return <Users color="#ffffff" size={20} strokeWidth={2} />;
      default:
        return <Bell color="#ffffff" size={20} strokeWidth={2} />;
    }
  };

  const getNotificationColor = () => {
    if (!notification) return '#3b82f6';
    
    const data = notification.request.content.data;
    switch (data?.type) {
      case 'task_reminder':
        return '#10b981'; // Vert
      case 'conflict_alert':
        return '#ef4444'; // Rouge
      case 'employee_update':
        return '#f59e0b'; // Orange
      default:
        return '#3b82f6'; // Bleu
    }
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getNotificationColor(),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getNotificationIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.request.content.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.request.content.body}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hideNotification}>
          <X color="#ffffff" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 50, // Pour éviter la barre de statut
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(10px)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 