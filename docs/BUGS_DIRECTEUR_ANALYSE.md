# 🐛 Analyse des Bugs - Page Directeur

**Date**: 28 octobre 2025
**Analysé par**: Claude Code
**Fichiers concernés**: `app/directeur.tsx`, `hooks/useSupabaseAlerts.ts`, `hooks/useSupabaseTasks.ts`

---

## 📋 Résumé Exécutif

Tests automatisés effectués sur les fonctionnalités du directeur. **3 bugs critiques** et **5 améliorations recommandées** ont été identifiés.

---

## 🔴 BUGS CRITIQUES

### Bug #1: Isolation Multi-Store Défaillante pour les Alertes

**Sévérité**: 🔴 CRITIQUE
**Fichiers**: `app/directeur.tsx:93`, `hooks/useSupabaseAlerts.ts:36-56`
**Impact**: Fuite de données entre magasins

#### Description
```typescript
// directeur.tsx:93
const { alerts: realAlerts, isLoading: alertsLoading, markAlertAsRead } = useSupabaseAlerts({ store_id: 1 });
```

Le directeur passe `store_id: 1` au hook, **MAIS** le hook ne filtre PAS par store_id :

```typescript
// useSupabaseAlerts.ts:40-48
let query = supabase
  .from('alerts')
  .select('*')
  .order('created_at', { ascending: false });
if (filters?.manager_id) query = query.eq('manager_id', filters.manager_id);
if (filters?.severity) query = query.eq('severity', filters.severity);
if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);
// store_id: nécessite une jointure côté backend ou une vue
```

**Conséquence**: Un directeur du store 1 voit les alertes du store 2, 3, etc.

#### Solution Recommandée

**Option A** : Filtrer via jointure (si alerts.manager_id existe)
```typescript
// useSupabaseAlerts.ts
if (filters?.store_id) {
  // Jointure via users table pour récupérer le store_id du manager
  query = query
    .select(`
      *,
      users!alerts_manager_id_fkey(store_id)
    `)
    .filter('users.store_id', 'eq', filters.store_id);
}
```

**Option B** : Ajouter la colonne store_id à la table alerts (RECOMMANDÉ)
```sql
-- Migration SQL
ALTER TABLE alerts ADD COLUMN store_id INTEGER REFERENCES stores(id);

-- Mise à jour des données existantes
UPDATE alerts SET store_id = (
  SELECT store_id FROM users WHERE users.id = alerts.manager_id
);

-- Contrainte NOT NULL après migration
ALTER TABLE alerts ALTER COLUMN store_id SET NOT NULL;
```

Puis dans le hook :
```typescript
if (filters?.store_id) {
  query = query.eq('store_id', filters.store_id);
}
```

---

### Bug #2: Tâche avec `team_members: []` créée sans validation

**Sévérité**: 🟡 IMPORTANT
**Fichier**: `app/directeur.tsx:376`
**Impact**: Tâches assignées sans employés

#### Description
```typescript
// directeur.tsx:362-381
const taskData = {
  // ... autres champs
  team_members: [], // ⚠️ Tableau vide hardcodé !
  manager_id: selectedManager.id,
  store_id: selectedManager.store_id || 1,
};
```

Une tâche est créée avec **0 employés assignés**, même si `taskTeamSize` est renseigné (ex: 3 personnes).

**Incohérence**:
- `team_size: 3` → Le manager doit constituer une équipe de 3 personnes
- `team_members: []` → Mais aucun employé n'est pré-assigné

#### Solution Recommandée

**Option 1** : Supprimer le champ `team_members` lors de la création (laisser le manager assigner)
```typescript
const taskData = {
  title: taskTitle.trim(),
  description: taskDescription.trim() || null,
  // ... autres champs
  manager_id: selectedManager.id,
  store_id: selectedManager.store_id || 1,
  // ❌ Supprimer team_members: []
};
```

**Option 2** : Permettre au directeur de pré-assigner des employés
```tsx
// Ajouter un sélecteur d'employés dans le modal d'attribution
<View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>Employés assignés (optionnel)</Text>
  <EmployeeMultiSelector
    section={selectedManager.section}
    maxSelection={parseInt(taskTeamSize)}
    onSelectionChange={setSelectedEmployees}
  />
</View>
```

---

### Bug #3: Validation manquante pour taskEndTime < taskStartTime

**Sévérité**: 🟡 IMPORTANT
**Fichier**: `app/directeur.tsx:335-444`
**Impact**: Tâches avec durée négative possibles

#### Description
Aucune validation ne vérifie que `taskEndTime` est postérieur à `taskStartTime`.

**Scénario problématique**:
```
Heure de début: 14:00
Heure de fin: 08:00
→ Durée calculée: -6h00 (négatif !)
```

#### Code Actuel
```typescript
// directeur.tsx:335-344
if (!selectedManager || !taskTitle.trim() || !taskDate || !taskStartTime || !taskEndTime) {
  Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
  return;
}
// ⚠️ Pas de validation start < end
```

#### Solution Recommandée
```typescript
// Ajouter après la validation des champs obligatoires
const startTime = new Date(`2000-01-01T${taskStartTime}`);
const endTime = new Date(`2000-01-01T${taskEndTime}`);

if (endTime <= startTime) {
  Alert.alert(
    'Erreur de validation',
    `L'heure de fin (${taskEndTime}) doit être postérieure à l'heure de début (${taskStartTime}).`,
    [{ text: 'OK' }]
  );
  return;
}

// Vérifier que la durée est raisonnable (ex: max 12h)
const durationMs = endTime.getTime() - startTime.getTime();
const durationHours = durationMs / (1000 * 60 * 60);

if (durationHours > 12) {
  Alert.alert(
    'Durée excessive',
    `La tâche dure ${durationHours.toFixed(1)}h. Êtes-vous sûr de vouloir créer une tâche aussi longue ?`,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => proceedWithTaskCreation() }
    ]
  );
  return;
}
```

---

## 🟡 AMÉLIORATIONS RECOMMANDÉES

### Amélioration #1: Feedback visuel pendant saveWorkingHours

**Fichier**: `app/directeur.tsx:113-151`
**Impact**: UX

Le bouton affiche "Sauvegarde..." mais sans indicateur de chargement visuel.

**Amélioration suggérée**:
```tsx
<TouchableOpacity
  style={[
    styles.modalButton,
    styles.primaryButton,
    isSavingHours && styles.disabledButton
  ]}
  onPress={saveWorkingHours}
  disabled={isSavingHours}
>
  {isSavingHours ? (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color="#ffffff" />
      <Text style={styles.primaryButtonText}>Sauvegarde...</Text>
    </View>
  ) : (
    <Text style={styles.primaryButtonText}>Sauvegarder</Text>
  )}
</TouchableOpacity>
```

---

### Amélioration #2: Gestion d'erreur pour notification urgente

**Fichier**: `app/directeur.tsx:391-397`
**Impact**: UX

Si l'envoi de la notification urgente échoue, l'erreur est loguée mais l'utilisateur n'est pas informé.

**Amélioration suggérée**:
```typescript
if (sendUrgentNotification && taskPriority === 'urgent') {
  try {
    await notificationService.notifyUrgentTaskAssigned(result.task, selectedManager.full_name);
    console.log('✅ Notification urgente envoyée');
    notificationText = `\n\n📱 Notification urgente envoyée au téléphone de ${selectedManager.full_name}`;
  } catch (notificationError) {
    console.error('❌ Erreur notification urgente:', notificationError);
    notificationText = `\n\n⚠️ Tâche créée mais la notification n'a pas pu être envoyée. Veuillez contacter ${selectedManager.full_name} directement.`;
  }
}
```

---

### Amélioration #3: Affichage amélioré des tâches sans colis

**Fichier**: `app/directeur.tsx:405`
**Impact**: UX

Texte `• Colis : 0 (non spécifié)` peu élégant.

**Amélioration suggérée**:
```typescript
const packagesText = taskPackages.trim() !== '' && parseInt(taskPackages) > 0
  ? `• Colis : ${taskPackages}`
  : ''; // Masquer la ligne si aucun colis

// Puis dans l'alerte
const taskDetails = `📋 Détails de la tâche :
• Titre : ${taskTitle}
• Manager : ${selectedManager.full_name} (${selectedManager.section})
• Date : ${new Date(taskDate).toLocaleDateString('fr-FR')}
• Heures : ${taskStartTime} - ${taskEndTime}
${packagesText}${packagesText ? '\n' : ''}• Équipe : ${taskTeamSize} personnes
• Priorité : ${priorityText}`;
```

---

### Amélioration #4: Performance - loadPerformanceData appelé plusieurs fois

**Fichier**: `app/directeur.tsx:154-221`
**Impact**: Performance

Le useEffect se déclenche à chaque changement de `allTasks` ou `allUsers`, ce qui peut causer des recalculs inutiles.

**Optimisation suggérée**:
```typescript
// Ajouter un debounce
const loadPerformanceData = useMemo(() =>
  debounce(async () => {
    // ... code actuel
  }, 500),
  []
);

useEffect(() => {
  if (!tasksLoading && !usersLoading && allUsers && allTasks) {
    loadPerformanceData();
  }
}, [allTasks, allUsers, tasksLoading, usersLoading]);
```

---

### Amélioration #5: Commentaires obsolètes

**Fichier**: `app/directeur.tsx:322-333`
**Impact**: Maintenabilité

Code commenté pour la simulation d'alertes :
```typescript
// Supprimer la simulation d'alertes en temps réel
// useEffect(() => { ... }, []);
```

**Action**: Supprimer complètement le code commenté (déjà fait selon le commentaire).

---

## ✅ POINTS FORTS IDENTIFIÉS

1. **Validation des champs obligatoires** : Bien implémentée (lignes 338-357)
2. **Gestion de la désactivation pendant création** : `isCreatingTask` empêche les double-clics
3. **Affichage conditionnel des horaires** : Actualisation dynamique avec bouton refresh
4. **Gestion des priorités** : Système à 4 niveaux bien structuré
5. **Animations fluides** : Toggle de notification urgente avec Animated
6. **Séparation des modals** : Bonne organisation du code

---

## 🧪 TESTS EFFECTUÉS

### Tests Backend (test-director-features.js)

✅ **Test 1**: Récupération des managers
- Résultat: 3 managers trouvés pour store_id = 1
- Statut: **RÉUSSI**

✅ **Test 2**: Récupération des horaires de travail
- Résultat: 04:30:00 - 20:00:00
- Statut: **RÉUSSI**

✅ **Test 3**: Récupération des tâches planifiées
- Résultat: 5 tâches récentes trouvées
- Statut: **RÉUSSI**

❌ **Test 4**: Récupération des alertes
- Erreur: `alerts.store_id does not exist`
- Statut: **ÉCHEC** (Bug #1 confirmé)

✅ **Test 5**: Validation structure de tâche
- Résultat: Structure validée correctement
- Statut: **RÉUSSI**

✅ **Test 6**: Récupération des employés
- Résultat: 4 employés dans "rayon de test"
- Statut: **RÉUSSI**

---

## 📝 PLAN D'ACTION RECOMMANDÉ

### Priorité 1 (À faire immédiatement)
- [ ] **Bug #1**: Ajouter colonne store_id à table alerts + migration
- [ ] **Bug #3**: Ajouter validation heure début < heure fin

### Priorité 2 (Cette semaine)
- [ ] **Bug #2**: Décider du comportement de team_members (vide ou sélection)
- [ ] **Amélioration #2**: Feedback utilisateur pour erreurs notification

### Priorité 3 (Backlog)
- [ ] **Amélioration #1**: ActivityIndicator sur bouton sauvegarde
- [ ] **Amélioration #3**: Améliorer affichage tâches sans colis
- [ ] **Amélioration #4**: Optimiser loadPerformanceData avec debounce
- [ ] **Amélioration #5**: Nettoyer code commenté

---

## 📞 Prochaines Étapes

1. **Créer les migrations SQL** pour Bug #1
2. **Tester manuellement l'interface** avec les identifiants thomas/test
3. **Valider les corrections** avec l'équipe
4. **Déployer les fixes** en production

---

**Rapport généré par**: Claude Code
**Commande de test**: `node test-director-features.js`
**Durée d'analyse**: ~10 minutes
