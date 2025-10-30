/**
 * SERVICE: ActivityMonitor (Version JavaScript)
 *
 * Surveillance automatique de l'activité des employés en temps réel
 * Détecte les temps morts et génère des alertes automatiques
 *
 * Objectif: Récupérer les 5h perdues par employé par semaine
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Service role pour bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class ActivityMonitor {
  constructor() {
    // Seuils de détection (en minutes)
    this.INACTIVITY_WARNING_THRESHOLD = 10;  // Alerte manager
    this.INACTIVITY_CRITICAL_THRESHOLD = 30; // Alerte directeur
    this.INACTIVITY_SEVERE_THRESHOLD = 60;   // Alerte critique
    this.HEARTBEAT_TIMEOUT = 5;              // Considéré offline après 5 min sans heartbeat
  }

  /**
   * Point d'entrée principal - Vérifie toute l'activité
   * Appelé par cron job toutes les 5 minutes
   */
  async checkAllActivity() {
    console.log(`[ActivityMonitor] Début de vérification - ${new Date().toISOString()}`);

    try {
      // 1. Vérifier les heartbeats et marquer offline si nécessaire
      await this.checkHeartbeats();

      // 2. Détecter les inactivités
      const alerts = await this.detectInactivity();

      // 3. Créer les alertes dans la base
      if (alerts.length > 0) {
        await this.createAlerts(alerts);
        console.log(`[ActivityMonitor] ${alerts.length} alertes créées`);
      } else {
        console.log(`[ActivityMonitor] Aucune inactivité détectée`);
      }

      // 4. Nettoyer les anciennes activités terminées (>7 jours)
      await this.cleanupOldActivities();

      console.log(`[ActivityMonitor] Vérification terminée`);
    } catch (error) {
      console.error('[ActivityMonitor] Erreur lors de la vérification:', error);
    }
  }

  /**
   * Vérifie les heartbeats de tous les employés
   */
  async checkHeartbeats() {
    const timeoutThreshold = new Date(Date.now() - this.HEARTBEAT_TIMEOUT * 60 * 1000);

    try {
      // Récupérer tous les heartbeats expirés
      const { data: expiredHeartbeats, error } = await supabase
        .from('employee_heartbeat')
        .select('employee_id, last_heartbeat')
        .lt('last_heartbeat', timeoutThreshold.toISOString());

      if (error) throw error;

      if (expiredHeartbeats && expiredHeartbeats.length > 0) {
        console.log(`[ActivityMonitor] ${expiredHeartbeats.length} employés sans heartbeat récent`);

        // Marquer les employés comme offline
        const employeeIds = expiredHeartbeats.map(h => h.employee_id);

        await supabase
          .from('team_members')
          .update({ status: 'offline' })
          .in('id', employeeIds);

        // Terminer leurs activités en cours
        await supabase
          .from('employee_activity_log')
          .update({
            ended_at: new Date().toISOString(),
            activity_data: {
              auto_closed: true,
              reason: 'heartbeat_timeout'
            }
          })
          .in('employee_id', employeeIds)
          .is('ended_at', null);
      }
    } catch (error) {
      console.error('[ActivityMonitor] Erreur vérification heartbeats:', error);
    }
  }

  /**
   * Détecte les employés en inactivité
   */
  async detectInactivity() {
    const alerts = [];

    try {
      // Récupérer l'activité actuelle de tous les employés
      const { data: activities, error } = await supabase
        .from('employee_current_activity')
        .select('*')
        .neq('employee_status', 'offline');

      if (error) throw error;
      if (!activities) return alerts;

      for (const activity of activities) {
        // Ignorer les employés en pause officielle
        if (activity.activity_status === 'break') continue;

        // Ignorer si pas de heartbeat récent
        if (!activity.last_heartbeat ||
            (activity.minutes_since_heartbeat && activity.minutes_since_heartbeat > this.HEARTBEAT_TIMEOUT)) {
          continue;
        }

        // Calculer le temps d'inactivité réel
        let idleMinutes = 0;

        // Employé sur une tâche mais status "idle"
        if (activity.activity_status === 'idle' && activity.minutes_active) {
          idleMinutes = activity.minutes_active;
        }
        // Employé sur une tâche "working" mais pas de heartbeat récent
        else if (activity.activity_status === 'working' && activity.minutes_since_heartbeat) {
          idleMinutes = activity.minutes_since_heartbeat;
        }
        // Pas d'activité en cours mais heartbeat actif
        else if (!activity.activity_status && activity.last_heartbeat) {
          const minutesSinceLastActivity = await this.getMinutesSinceLastActivity(activity.employee_id);
          if (minutesSinceLastActivity > this.INACTIVITY_WARNING_THRESHOLD) {
            idleMinutes = minutesSinceLastActivity;
          }
        }

        // Générer les alertes selon les seuils
        if (idleMinutes >= this.INACTIVITY_SEVERE_THRESHOLD) {
          // 60 minutes → Critique
          alerts.push({
            employee_id: activity.employee_id,
            employee_name: activity.employee_name,
            task_id: activity.task_id,
            idle_minutes: Math.floor(idleMinutes),
            severity: 'critical',
            alert_type: 'inactivity_60min',
            notify_manager: true,
            notify_director: true
          });
        } else if (idleMinutes >= this.INACTIVITY_CRITICAL_THRESHOLD) {
          // 30 minutes → Warning + Directeur
          alerts.push({
            employee_id: activity.employee_id,
            employee_name: activity.employee_name,
            task_id: activity.task_id,
            idle_minutes: Math.floor(idleMinutes),
            severity: 'warning',
            alert_type: 'inactivity_30min',
            notify_manager: true,
            notify_director: true
          });
        } else if (idleMinutes >= this.INACTIVITY_WARNING_THRESHOLD) {
          // 10 minutes → Info manager seulement
          alerts.push({
            employee_id: activity.employee_id,
            employee_name: activity.employee_name,
            task_id: activity.task_id,
            idle_minutes: Math.floor(idleMinutes),
            severity: 'info',
            alert_type: 'inactivity_10min',
            notify_manager: true,
            notify_director: false
          });
        }
      }

      // Filtrer les alertes déjà existantes (pas de spam)
      const filteredAlerts = await this.filterExistingAlerts(alerts);

      return filteredAlerts;

    } catch (error) {
      console.error('[ActivityMonitor] Erreur détection inactivité:', error);
      return alerts;
    }
  }

  /**
   * Récupère le temps depuis la dernière activité d'un employé
   */
  async getMinutesSinceLastActivity(employeeId) {
    try {
      const { data, error } = await supabase
        .from('employee_activity_log')
        .select('ended_at')
        .eq('employee_id', employeeId)
        .order('ended_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data || !data.ended_at) return 0;

      const lastActivityTime = new Date(data.ended_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);

      return diffMinutes;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Filtre les alertes qui existent déjà (évite les doublons)
   */
  async filterExistingAlerts(alerts) {
    if (alerts.length === 0) return alerts;

    try {
      const employeeIds = alerts.map(a => a.employee_id);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const { data: existingAlerts, error } = await supabase
        .from('activity_alerts')
        .select('employee_id, alert_type, created_at')
        .in('employee_id', employeeIds)
        .gte('created_at', twoHoursAgo.toISOString())
        .eq('is_resolved', false);

      if (error) throw error;
      if (!existingAlerts || existingAlerts.length === 0) return alerts;

      // Filtrer: ne garder que si c'est une escalade
      return alerts.filter(alert => {
        const existing = existingAlerts.find(e => e.employee_id === alert.employee_id);
        if (!existing) return true; // Nouvelle alerte

        const escalationMap = {
          'inactivity_10min': 0,
          'inactivity_30min': 1,
          'inactivity_60min': 2
        };

        const existingLevel = escalationMap[existing.alert_type] || 0;
        const newLevel = escalationMap[alert.alert_type] || 0;

        return newLevel > existingLevel; // Garder seulement si escalade
      });

    } catch (error) {
      console.error('[ActivityMonitor] Erreur filtrage alertes:', error);
      return alerts;
    }
  }

  /**
   * Crée les alertes dans la base de données
   */
  async createAlerts(alerts) {
    if (alerts.length === 0) return;

    try {
      // Récupérer les store_id des employés
      const employeeIds = alerts.map(a => a.employee_id);
      const { data: employees, error: employeeError } = await supabase
        .from('team_members')
        .select('id, store_id')
        .in('id', employeeIds);

      if (employeeError) throw employeeError;

      const storeMap = new Map(employees?.map(e => [e.id, e.store_id]) || []);

      // Créer les enregistrements d'alerte
      const alertRecords = alerts.map(alert => ({
        employee_id: alert.employee_id,
        task_id: alert.task_id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: this.generateAlertMessage(alert),
        idle_duration_minutes: alert.idle_minutes,
        notified_to_manager: alert.notify_manager,
        notified_to_director: alert.notify_director,
        store_id: storeMap.get(alert.employee_id) || 1,
        is_resolved: false
      }));

      const { error } = await supabase
        .from('activity_alerts')
        .insert(alertRecords);

      if (error) throw error;

      // Envoyer notifications
      await this.sendNotifications(alerts);

    } catch (error) {
      console.error('[ActivityMonitor] Erreur création alertes:', error);
    }
  }

  /**
   * Génère le message d'alerte lisible
   */
  generateAlertMessage(alert) {
    const taskInfo = alert.task_id ? ` sur la tâche` : ` sans tâche assignée`;

    switch (alert.alert_type) {
      case 'inactivity_10min':
        return `${alert.employee_name} est inactif depuis ${alert.idle_minutes} minutes${taskInfo}`;
      case 'inactivity_30min':
        return `⚠️ ${alert.employee_name} est inactif depuis ${alert.idle_minutes} minutes${taskInfo} - Intervention recommandée`;
      case 'inactivity_60min':
        return `🚨 CRITIQUE: ${alert.employee_name} est inactif depuis ${alert.idle_minutes} minutes${taskInfo} - Intervention urgente requise`;
      default:
        return `Inactivité détectée pour ${alert.employee_name}`;
    }
  }

  /**
   * Envoie les notifications push
   */
  async sendNotifications(alerts) {
    // TODO: Implémenter l'envoi de notifications push
    console.log(`[ActivityMonitor] ${alerts.length} notifications à envoyer`);

    for (const alert of alerts) {
      if (alert.notify_director) {
        console.log(`[ActivityMonitor] → Notification directeur: ${alert.employee_name} inactif ${alert.idle_minutes}min`);
      }
      if (alert.notify_manager) {
        console.log(`[ActivityMonitor] → Notification manager: ${alert.employee_name} inactif ${alert.idle_minutes}min`);
      }
    }
  }

  /**
   * Nettoie les anciennes activités terminées (>7 jours)
   */
  async cleanupOldActivities() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Supprimer les activités terminées de plus de 7 jours
      await supabase
        .from('employee_activity_log')
        .delete()
        .lt('ended_at', sevenDaysAgo.toISOString())
        .not('ended_at', 'is', null);

      // Marquer les anciennes alertes comme résolues
      await supabase
        .from('activity_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_note: 'Auto-résolu après 7 jours'
        })
        .lt('created_at', sevenDaysAgo.toISOString())
        .eq('is_resolved', false);

    } catch (error) {
      console.error('[ActivityMonitor] Erreur nettoyage:', error);
    }
  }

  /**
   * Marquer une alerte comme résolue
   */
  async resolveAlert(alertId, resolvedBy, note) {
    try {
      await supabase
        .from('activity_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_note: note || 'Résolu manuellement'
        })
        .eq('id', alertId);
    } catch (error) {
      console.error('[ActivityMonitor] Erreur résolution alerte:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de productivité
   */
  async getProductivityStats(storeId) {
    try {
      const { data, error } = await supabase
        .from('employee_productivity_stats')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[ActivityMonitor] Erreur stats productivité:', error);
      throw error;
    }
  }
}

// Export singleton
const activityMonitor = new ActivityMonitor();

module.exports = { activityMonitor, ActivityMonitor };
