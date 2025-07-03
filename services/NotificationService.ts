import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../hooks/useNotifications';

export class NotificationService {
  private static instance: NotificationService;
  private notificationHook: ReturnType<typeof useNotifications> | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setNotificationHook(hook: ReturnType<typeof useNotifications>) {
    this.notificationHook = hook;
  }

  // Programmer un rappel pour une tâche
  async scheduleTaskReminder(task: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.scheduleTaskReminder(task);
  }

  // Envoyer une alerte de conflit
  async sendConflictAlert(conflictData: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.sendConflictAlert(conflictData);
  }

  // Envoyer une notification immédiate
  async sendImmediateNotification(title: string, body: string, data?: any) {
    if (!this.notificationHook) {
      console.warn('Notification hook not initialized');
      return;
    }

    await this.notificationHook.sendImmediateNotification(title, body, data);
  }

  // Notifier un changement d'équipe
  async notifyTeamChange(changeType: 'added' | 'removed' | 'updated', employeeName: string) {
    const messages = {
      added: `👥 ${employeeName} a été ajouté(e) à l'équipe`,
      removed: `👋 ${employeeName} a été retiré(e) de l'équipe`,
      updated: `✏️ Les informations de ${employeeName} ont été mises à jour`,
    };

    await this.sendImmediateNotification(
      'Mise à jour équipe',
      messages[changeType],
      { type: 'employee_update', changeType, employeeName }
    );
  }

  // Notifier une tâche en retard
  async notifyTaskOverdue(task: any) {
    await this.sendImmediateNotification(
      '⚠️ Tâche en retard',
      `La tâche "${task.title}" devrait avoir commencé à ${task.startTime}`,
      { type: 'task_overdue', taskId: task.id }
    );
  }

  // Notifier une tâche terminée
  async notifyTaskCompleted(task: any) {
    await this.sendImmediateNotification(
      '✅ Tâche terminée',
      `La tâche "${task.title}" a été complétée avec succès`,
      { type: 'task_completed', taskId: task.id }
    );
  }

  // Programmer des rappels pour toutes les tâches existantes
  async scheduleRemindersForExistingTasks() {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      if (!existingTasksString) return;

      const existingTasks = JSON.parse(existingTasksString);
      const now = new Date();

      for (const task of existingTasks) {
        const taskDate = new Date(task.date + 'T' + task.startTime);
        
        // Ne programmer que pour les tâches futures
        if (taskDate > now) {
          await this.scheduleTaskReminder(task);
        }
      }
    } catch (error) {
      console.error('Error scheduling reminders for existing tasks:', error);
    }
  }

  // Nettoyer les notifications obsolètes
  async cleanupOldNotifications() {
    if (!this.notificationHook) return;

    try {
      const scheduledNotifications = await this.notificationHook.getScheduledNotifications();
      const now = new Date();

      for (const notification of scheduledNotifications) {
        const trigger = notification.trigger as any;
        if (trigger?.date && new Date(trigger.date) < now) {
          await this.notificationHook.cancelScheduledNotification(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Vérifier et notifier les tâches en retard
  async checkOverdueTasks() {
    try {
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      if (!existingTasksString) return;

      const existingTasks = JSON.parse(existingTasksString);
      const now = new Date();

      for (const task of existingTasks) {
        const taskDate = new Date(task.date + 'T' + task.startTime);
        const taskEndDate = new Date(task.date + 'T' + task.endTime);
        
        // Si la tâche devrait être en cours mais n'est pas terminée
        if (taskDate <= now && taskEndDate > now && !task.completed) {
          await this.notifyTaskOverdue(task);
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Initialiser le service de notifications
  async initialize() {
    await this.cleanupOldNotifications();
    await this.scheduleRemindersForExistingTasks();
    
    // Vérifier les tâches en retard toutes les 5 minutes
    setInterval(() => {
      this.checkOverdueTasks();
    }, 5 * 60 * 1000);
  }
}

// Instance singleton
export const notificationService = NotificationService.getInstance(); 