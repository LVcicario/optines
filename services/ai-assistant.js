/**
 * SERVICE: AI Assistant
 *
 * Assistant IA conversationnel pour directeurs de magasin
 * Utilise Claude 3.5 Sonnet pour comprendre les commandes en langage naturel
 * et exécuter des actions sur la base de données
 *
 * Objectif: Simplifier l'interface complexe en un simple chat
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class AIAssistant {
  constructor() {
    // Utiliser Claude Sonnet 4.5 (le plus récent disponible - septembre 2025)
    this.model = 'claude-sonnet-4-5-20250929';
    this.conversationHistory = new Map(); // Store par store_id
  }

  /**
   * Point d'entrée principal - Traite un message utilisateur
   */
  async chat(message, userId, storeId) {
    try {
      console.log(`[AI] Message reçu de user ${userId}: "${message}"`);

      // Récupérer le contexte utilisateur
      const userContext = await this.getUserContext(userId, storeId);

      // Récupérer l'historique de conversation
      const conversationKey = `${storeId}_${userId}`;
      let history = this.conversationHistory.get(conversationKey) || [];

      // Construire le système prompt
      const systemPrompt = this.buildSystemPrompt(userContext);

      // Ajouter le message utilisateur à l'historique
      history.push({
        role: 'user',
        content: message
      });

      // Appeler Claude avec function calling
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: history,
        tools: this.getAvailableTools(),
      });

      console.log('[AI] Réponse Claude:', JSON.stringify(response, null, 2));

      // Traiter la réponse
      let assistantMessage = '';
      const toolResults = [];

      for (const content of response.content) {
        if (content.type === 'text') {
          assistantMessage = content.text;
        } else if (content.type === 'tool_use') {
          // Exécuter la fonction demandée par Claude
          const toolResult = await this.executeTool(
            content.name,
            content.input,
            storeId,
            userId
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(toolResult)
          });
        }
      }

      // Si des outils ont été utilisés, demander à Claude de formuler la réponse finale
      if (toolResults.length > 0) {
        history.push({
          role: 'assistant',
          content: response.content
        });

        history.push({
          role: 'user',
          content: toolResults
        });

        const finalResponse = await anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: history,
        });

        assistantMessage = finalResponse.content[0].text;

        // Ajouter la réponse finale à l'historique
        history.push({
          role: 'assistant',
          content: finalResponse.content
        });
      } else {
        // Ajouter la réponse à l'historique
        history.push({
          role: 'assistant',
          content: response.content
        });
      }

      // Limiter l'historique aux 20 derniers messages
      if (history.length > 20) {
        history = history.slice(-20);
      }

      // Sauvegarder l'historique
      this.conversationHistory.set(conversationKey, history);

      return {
        message: assistantMessage,
        actions: toolResults.map(r => JSON.parse(r.content)),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[AI] Erreur:', error);
      throw error;
    }
  }

  /**
   * Construit le prompt système avec le contexte
   */
  buildSystemPrompt(userContext) {
    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `Tu es un assistant IA pour directeurs de magasins Intermarché. Tu aides "${userContext.full_name}" à gérer son magasin "${userContext.store_name}".

CONTEXTE ACTUEL:
- Date: ${today}
- Magasin: ${userContext.store_name}
- Nombre de managers: ${userContext.managers_count}
- Nombre d'employés: ${userContext.employees_count}
- Horaires magasin: ${userContext.store_hours || '04:30 - 20:00'}

TES CAPACITÉS:
Tu peux exécuter des actions via des fonctions:
- createTask: Créer une tâche pour un manager
- getTeamStats: Voir les statistiques d'équipe
- listAvailableEmployees: Lister les employés disponibles
- getTodayTasks: Voir les tâches du jour
- getManagerPerformance: Performance d'un manager
- createUrgentAlert: Créer une alerte urgente

TON COMPORTEMENT:
- Parle en français naturel, professionnel mais friendly
- Sois proactif: propose des actions si tu vois un problème
- Demande confirmation avant d'exécuter des actions importantes
- Donne toujours des chiffres et des faits concrets
- Utilise des emojis occasionnellement pour rendre agréable (📊 📈 ✅ ⚠️ 🎯)

EXEMPLES DE DEMANDES:
- "Crée une tâche pour l'équipe frais demain matin"
- "Comment va l'équipe aujourd'hui?"
- "Qui est disponible cet après-midi?"
- "Montre-moi les stats de MLKH"
- "Organise ma semaine"

Réponds toujours de manière concise et actionnable.`;
  }

  /**
   * Récupère le contexte utilisateur
   */
  async getUserContext(userId, storeId) {
    try {
      // Info utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('full_name, role, section')
        .eq('id', userId)
        .single();

      // Info magasin
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();

      // Compter managers
      const { count: managersCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('role', 'manager');

      // Compter employés
      const { count: employeesCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      return {
        full_name: user?.full_name || 'Directeur',
        role: user?.role || 'director',
        store_name: store?.name || 'Magasin',
        managers_count: managersCount || 0,
        employees_count: employeesCount || 0,
        store_hours: '04:30 - 20:00' // TODO: récupérer depuis DB
      };
    } catch (error) {
      console.error('[AI] Erreur contexte:', error);
      return {
        full_name: 'Directeur',
        role: 'director',
        store_name: 'Magasin',
        managers_count: 0,
        employees_count: 0
      };
    }
  }

  /**
   * Définit les outils disponibles pour Claude
   */
  getAvailableTools() {
    return [
      {
        name: 'createTask',
        description: 'Crée une nouvelle tâche pour un manager et son équipe',
        input_schema: {
          type: 'object',
          properties: {
            manager_initials: {
              type: 'string',
              description: 'Initiales du manager (ex: MLKH)'
            },
            title: {
              type: 'string',
              description: 'Titre de la tâche'
            },
            description: {
              type: 'string',
              description: 'Description détaillée (optionnel)'
            },
            date: {
              type: 'string',
              description: 'Date au format YYYY-MM-DD'
            },
            start_time: {
              type: 'string',
              description: 'Heure de début au format HH:MM'
            },
            end_time: {
              type: 'string',
              description: 'Heure de fin au format HH:MM'
            },
            packages: {
              type: 'number',
              description: 'Nombre de colis'
            },
            team_size: {
              type: 'number',
              description: 'Taille de l\'équipe'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Niveau de priorité'
            }
          },
          required: ['manager_initials', 'title', 'date', 'start_time', 'end_time', 'packages', 'team_size']
        }
      },
      {
        name: 'getTeamStats',
        description: 'Récupère les statistiques de performance de l\'équipe',
        input_schema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month'],
              description: 'Période à analyser'
            }
          },
          required: ['period']
        }
      },
      {
        name: 'listAvailableEmployees',
        description: 'Liste les employés disponibles à un moment donné',
        input_schema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date au format YYYY-MM-DD'
            },
            shift: {
              type: 'string',
              enum: ['matin', 'après-midi', 'soir'],
              description: 'Créneau horaire'
            },
            section: {
              type: 'string',
              description: 'Section/rayon spécifique (optionnel)'
            }
          },
          required: ['date', 'shift']
        }
      },
      {
        name: 'getTodayTasks',
        description: 'Récupère toutes les tâches du jour',
        input_schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['all', 'pending', 'completed'],
              description: 'Filtrer par statut'
            }
          }
        }
      },
      {
        name: 'getManagerPerformance',
        description: 'Obtient les statistiques de performance d\'un manager',
        input_schema: {
          type: 'object',
          properties: {
            manager_initials: {
              type: 'string',
              description: 'Initiales du manager'
            },
            period: {
              type: 'string',
              enum: ['today', 'week', 'month'],
              description: 'Période à analyser'
            }
          },
          required: ['manager_initials']
        }
      }
    ];
  }

  /**
   * Exécute un outil demandé par Claude
   */
  async executeTool(toolName, input, storeId, userId) {
    console.log(`[AI] Exécution outil: ${toolName}`, input);

    try {
      switch (toolName) {
        case 'createTask':
          return await this.toolCreateTask(input, storeId, userId);

        case 'getTeamStats':
          return await this.toolGetTeamStats(input, storeId);

        case 'listAvailableEmployees':
          return await this.toolListAvailableEmployees(input, storeId);

        case 'getTodayTasks':
          return await this.toolGetTodayTasks(input, storeId);

        case 'getManagerPerformance':
          return await this.toolGetManagerPerformance(input, storeId);

        default:
          return { error: `Outil inconnu: ${toolName}` };
      }
    } catch (error) {
      console.error(`[AI] Erreur outil ${toolName}:`, error);
      return { error: error.message };
    }
  }

  /**
   * TOOL: Créer une tâche
   */
  async toolCreateTask(input, storeId, userId) {
    // Récupérer le manager par initiales
    const { data: manager } = await supabase
      .from('users')
      .select('id, full_name, section')
      .eq('store_id', storeId)
      .ilike('username', input.manager_initials)
      .single();

    if (!manager) {
      return { error: `Manager ${input.manager_initials} non trouvé` };
    }

    // Calculer la durée
    const startTime = new Date(`2000-01-01T${input.start_time}`);
    const endTime = new Date(`2000-01-01T${input.end_time}`);
    const durationMs = endTime - startTime;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${durationHours}h${durationMinutes.toString().padStart(2, '0')}`;

    // Créer la tâche
    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .insert([{
        title: input.title,
        description: input.description || '',
        start_time: input.start_time,
        end_time: input.end_time,
        duration,
        date: input.date,
        packages: input.packages,
        team_size: input.team_size,
        manager_section: manager.section || 'Non défini',
        manager_initials: input.manager_initials.toUpperCase(),
        manager_id: manager.id,
        store_id: storeId,
        is_pinned: input.priority === 'urgent',
        is_completed: false,
        team_members: []
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        manager: manager.full_name,
        date: task.date,
        time: `${task.start_time} - ${task.end_time}`,
        packages: task.packages,
        team_size: task.team_size
      }
    };
  }

  /**
   * TOOL: Stats équipe
   */
  async toolGetTeamStats(input, storeId) {
    const today = new Date().toISOString().split('T')[0];

    let startDate;
    if (input.period === 'today') {
      startDate = today;
    } else if (input.period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
    }

    // Tâches totales
    const { count: totalTasks } = await supabase
      .from('scheduled_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('date', startDate);

    // Tâches complétées
    const { count: completedTasks } = await supabase
      .from('scheduled_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_completed', true)
      .gte('date', startDate);

    // Colis traités
    const { data: packagesData } = await supabase
      .from('scheduled_tasks')
      .select('packages')
      .eq('store_id', storeId)
      .eq('is_completed', true)
      .gte('date', startDate);

    const totalPackages = packagesData?.reduce((sum, t) => sum + (t.packages || 0), 0) || 0;

    // Employés actifs
    const { count: activeEmployees } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .neq('status', 'offline');

    return {
      period: input.period,
      total_tasks: totalTasks || 0,
      completed_tasks: completedTasks || 0,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      packages_processed: totalPackages,
      active_employees: activeEmployees || 0
    };
  }

  /**
   * TOOL: Liste employés disponibles
   */
  async toolListAvailableEmployees(input, storeId) {
    let query = supabase
      .from('team_members')
      .select('id, name, role, section, shift, status')
      .eq('store_id', storeId)
      .eq('shift', input.shift)
      .neq('status', 'offline');

    if (input.section) {
      query = query.eq('section', input.section);
    }

    const { data: employees } = await query;

    return {
      date: input.date,
      shift: input.shift,
      section: input.section || 'toutes',
      count: employees?.length || 0,
      employees: employees || []
    };
  }

  /**
   * TOOL: Tâches du jour
   */
  async toolGetTodayTasks(input, storeId) {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('scheduled_tasks')
      .select('id, title, manager_initials, start_time, end_time, packages, is_completed, is_pinned')
      .eq('store_id', storeId)
      .eq('date', today)
      .order('start_time', { ascending: true });

    if (input.status === 'pending') {
      query = query.eq('is_completed', false);
    } else if (input.status === 'completed') {
      query = query.eq('is_completed', true);
    }

    const { data: tasks } = await query;

    return {
      date: today,
      count: tasks?.length || 0,
      tasks: tasks || []
    };
  }

  /**
   * TOOL: Performance manager
   */
  async toolGetManagerPerformance(input, storeId) {
    // Récupérer le manager
    const { data: manager } = await supabase
      .from('users')
      .select('id, full_name, section')
      .eq('store_id', storeId)
      .ilike('username', input.manager_initials)
      .single();

    if (!manager) {
      return { error: `Manager ${input.manager_initials} non trouvé` };
    }

    const today = new Date().toISOString().split('T')[0];
    let startDate = today;

    if (input.period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (input.period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
    }

    // Stats tâches
    const { data: tasks } = await supabase
      .from('scheduled_tasks')
      .select('is_completed, packages')
      .eq('manager_id', manager.id)
      .gte('date', startDate);

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.is_completed).length || 0;
    const totalPackages = tasks?.filter(t => t.is_completed).reduce((sum, t) => sum + (t.packages || 0), 0) || 0;

    return {
      manager: manager.full_name,
      section: manager.section,
      period: input.period,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      packages_processed: totalPackages
    };
  }

  /**
   * Efface l'historique de conversation
   */
  clearHistory(storeId, userId) {
    const conversationKey = `${storeId}_${userId}`;
    this.conversationHistory.delete(conversationKey);
  }
}

// Export singleton
const aiAssistant = new AIAssistant();

module.exports = { aiAssistant, AIAssistant };
