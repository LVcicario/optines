# 🧪 Guide de Test Manuel - Fonctionnalités Directeur

**Date**: 28 octobre 2025
**Testeur**: Thomas (thomas / test)
**Objectif**: Valider toutes les fonctionnalités après corrections

---

## 🚀 ÉTAPE 0: Démarrage

### Prérequis
```bash
# Terminal 1: Démarrer le serveur backend (si pas déjà fait)
cd /Users/lucavicario/Documents/GitHub/optines
npm run server

# Terminal 2: Démarrer l'application Expo
npm start
```

### Connexion
```
Page d'accueil → Cliquer "Directeur"
Identifiant: thomas
Mot de passe: test
```

**✅ Résultat attendu**: Redirection vers `/directeur` (tableau de bord)

---

## 🔴 TEST 1: Bug #2 Corrigé - Validation Horaires

**Objectif**: Vérifier qu'on ne peut plus créer de tâche avec heure fin < heure début

### Test 1.1: Heure de fin avant heure de début
```
1. Dashboard → Cliquer "Attribuer tâche"
2. Sélectionner manager: MLKH (rayon de test)
3. Titre: "Test validation horaire"
4. Date: Aujourd'hui
5. Heure début: 14:00
6. Heure fin: 08:00  ← INVALIDE
7. Colis: 50
8. Taille équipe: 2
9. Cliquer "Attribuer la tâche"
```

**✅ Résultat attendu**:
- ❌ Popup d'erreur: "L'heure de fin (08:00) doit être postérieure à l'heure de début (14:00)"
- ✅ Tâche NON créée
- ✅ Modal reste ouvert

**❌ Si ça ne marche pas**: Noter l'erreur et continuer

---

### Test 1.2: Durée excessive (>12h)
```
1. Même modal (ou réouvrir "Attribuer tâche")
2. Sélectionner manager: MLKH
3. Titre: "Test durée excessive"
4. Date: Aujourd'hui
5. Heure début: 06:00
6. Heure fin: 20:00  ← 14h de durée
7. Colis: 100
8. Taille équipe: 3
9. Cliquer "Attribuer la tâche"
```

**✅ Résultat attendu**:
- ⚠️ Popup: "Cette tâche dure 14.0h. Les tâches de plus de 12h peuvent être difficiles à gérer. Êtes-vous sûr ?"
- 2 boutons: "Annuler" et "Confirmer"
- Si "Annuler" → Tâche NON créée
- Si "Confirmer" → Tâche créée avec succès

**Test**: Cliquer "Annuler" pour cette fois

---

### Test 1.3: Horaire valide (doit marcher)
```
1. Même modal (ou réouvrir "Attribuer tâche")
2. Sélectionner manager: MLKH
3. Titre: "Test tâche normale"
4. Date: Aujourd'hui
5. Heure début: 09:00
6. Heure fin: 11:00  ← 2h = OK
7. Colis: 50
8. Taille équipe: 2
9. Priorité: Moyenne
10. Cliquer "Attribuer la tâche"
```

**✅ Résultat attendu**:
- ✅ Popup de succès avec détails de la tâche
- ✅ Tâche créée
- ✅ Modal se ferme
- ✅ La tâche apparaît dans la section "Tâches Planifiées"

---

## 📊 TEST 2: Dashboard et Statistiques

**Objectif**: Vérifier que le dashboard affiche correctement les données

### Test 2.1: Statistiques globales
```
Dashboard → Section "Statistiques globales"
```

**✅ Vérifier**:
- [ ] Nombre de rayons affiché (devrait être >= 1)
- [ ] Colis traités (nombre >= 0)
- [ ] Total colis (nombre >= colis traités)
- [ ] Temps moyen (format "Xh00" ou "XhYY")
- [ ] Alertes (nombre >= 0)

**Prendre une capture d'écran** si quelque chose semble incorrect

---

### Test 2.2: Performance des Rayons
```
Dashboard → Section "Performance des Rayons"
```

**✅ Vérifier pour chaque carte de manager**:
- [ ] Nom du manager affiché
- [ ] Section affichée (ex: "rayon de test")
- [ ] Indicateur de statut (cercle de couleur)
- [ ] Colis traités / Total (ex: "50 / 100")
- [ ] Barre de progression cohérente avec les chiffres
- [ ] Temps restant estimé (format "Xh00min")
- [ ] Nombre d'équipiers

**Si "Aucune tâche planifiée"**:
- C'est normal si aucun manager n'a créé de tâche
- On en créera une au Test 3

---

### Test 2.3: Tâches Planifiées
```
Dashboard → Section "Tâches Planifiées par les Managers"
```

**✅ Vérifier**:
- [ ] Liste des tâches futures/en cours
- [ ] Pour chaque tâche: Titre, Manager, Date, Horaires, Colis, Équipe
- [ ] Badge de statut ("Épinglée" ou "Planifiée")
- [ ] Condition palette si applicable

---

## 🎯 TEST 3: Attribution de Tâche Complète

**Objectif**: Tester toutes les options d'attribution

### Test 3.1: Tâche normale
```
1. Cliquer "Attribuer tâche"
2. Manager: MLKH
3. Titre: "Réapprovisionnement fruits"
4. Description: "Réappro pommes et bananes"
5. Date: Demain
6. Heures: 10:00 - 12:00
7. Colis: 75
8. Équipe: 3
9. Priorité: Moyenne
10. Valider
```

**✅ Résultat attendu**: Tâche créée avec succès

---

### Test 3.2: Tâche urgente SANS notification
```
1. Cliquer "Attribuer tâche"
2. Manager: MLKH
3. Titre: "URGENT: Stock vide"
4. Date: Aujourd'hui
5. Heures: 15:00 - 16:00
6. Colis: 20
7. Équipe: 2
8. Priorité: Urgente  ← Sélectionner "Urgente"
9. Toggle notification: OFF (gris)
10. Valider
```

**✅ Résultat attendu**:
- Tâche créée comme "épinglée"
- Badge rouge "Urgente"
- AUCUNE notification envoyée

---

### Test 3.3: Tâche urgente AVEC notification
```
1. Cliquer "Attribuer tâche"
2. Manager: MLKH
3. Titre: "URGENT: Livraison express"
4. Date: Aujourd'hui
5. Heures: 16:00 - 17:00
6. Colis: 30
7. Équipe: 2
8. Priorité: Urgente
9. Toggle notification: ON (rouge) ← Activer
10. Valider
```

**✅ Résultat attendu**:
- Tâche créée
- Message de succès inclut "📱 Notification urgente envoyée..."
- ⚠️ Si erreur notification: OK, tâche quand même créée

---

### Test 3.4: Tâche sans colis
```
1. Cliquer "Attribuer tâche"
2. Manager: MLKH
3. Titre: "Nettoyage rayon"
4. Date: Demain
5. Heures: 14:00 - 15:00
6. Colis: (laisser vide)  ← Ne pas renseigner
7. Équipe: 1
8. Valider
```

**✅ Résultat attendu**:
- Tâche créée avec 0 colis
- Pas de message d'erreur

---

## ⏰ TEST 4: Configuration Horaires de Travail

**Objectif**: Modifier les horaires du magasin

### Test 4.1: Visualiser horaires actuels
```
1. Dashboard → Cliquer "Horaires travail"
2. Observer les horaires affichés
```

**✅ Vérifier**:
- [ ] Heure d'ouverture affichée (ex: 04:30)
- [ ] Heure de fermeture affichée (ex: 20:00)
- [ ] Bouton "🔄 Actualiser" présent

---

### Test 4.2: Modifier horaires
```
1. Modal ouvert
2. Cliquer sur "Heure d'ouverture"
3. Sélectionner: 06:00
4. Cliquer sur "Heure de fermeture"
5. Sélectionner: 21:00
6. Cliquer "Sauvegarder"
```

**✅ Résultat attendu**:
- Popup "Succès: Horaires mis à jour : 06:00 - 21:00"
- Modal se ferme
- Les horaires sont sauvegardés en base

**Vérification**:
```
Rouvrir "Horaires travail" → Doit afficher 06:00 - 21:00
```

---

### Test 4.3: Bouton Actualiser
```
1. Modal "Horaires travail" ouvert
2. Cliquer "🔄 Actualiser"
```

**✅ Résultat attendu**: Horaires se rechargent depuis la base

---

## 👥 TEST 5: Gestion des Utilisateurs

**Objectif**: Créer, modifier, supprimer des managers

### Test 5.1: Accéder à la page
```
Dashboard → Cliquer "Gestion utilisateurs"
```

**✅ Vérifier**:
- [ ] Page "Gestion des Utilisateurs" s'affiche
- [ ] Liste des managers actuels visible
- [ ] Bouton "Ajouter un utilisateur" présent
- [ ] Thomas (directeur) N'EST PAS dans la liste

---

### Test 5.2: Créer un nouveau manager
```
1. Cliquer "Ajouter un utilisateur"
2. Nom complet: "Jean Dupont"
3. Username: "jdupont"
4. Email: "jean.dupont@optines.test"
5. Téléphone: "+33612345678"
6. Rôle: Manager
7. Section: "Épicerie"
8. Valider
```

**✅ Résultat attendu**:
- Manager créé avec succès
- Apparaît dans la liste
- Mot de passe généré automatiquement (affiché ?)

---

### Test 5.3: Modifier un manager
```
1. Trouver le manager "Jean Dupont"
2. Cliquer "Éditer"
3. Changer section: "Boulangerie"
4. Valider
```

**✅ Résultat attendu**: Section mise à jour

---

### Test 5.4: Supprimer un manager
```
1. Trouver le manager "Jean Dupont"
2. Cliquer "Supprimer"
3. Confirmer la suppression
```

**✅ Résultat attendu**:
- Manager supprimé
- N'apparaît plus dans la liste

---

## 👷 TEST 6: Gestion des Équipes/Employés

**Objectif**: CRUD des employés

### Test 6.1: Accéder à la page
```
Dashboard → Cliquer "Gestion équipes"
```

**✅ Vérifier**:
- [ ] Page "Gestion des Équipes" s'affiche
- [ ] Liste des employés actuels (4 trouvés lors des tests)
- [ ] Sections visibles (dropdown)
- [ ] Bouton "Ajouter un employé"

---

### Test 6.2: Créer un employé
```
1. Cliquer "Ajouter un employé"
2. Nom: "Pierre Martin"
3. Rôle: "Opérateur"
4. Section: Sélectionner "rayon de test"
5. Téléphone: "+33698765432"
6. Email: "pierre.martin@optines.test"
7. Shift: "Matin"
8. Manager: Sélectionner "MLKH"
9. Valider
```

**✅ Résultat attendu**:
- Employé créé
- Apparaît dans la liste avec statut "online"

---

### Test 6.3: Modifier un employé
```
1. Trouver "Pierre Martin"
2. Cliquer "Éditer"
3. Changer shift: "Après-midi"
4. Changer section: "Fruits & Légumes"
5. Valider
```

**✅ Résultat attendu**: Modifications enregistrées

---

### Test 6.4: Supprimer un employé
```
1. Trouver "Pierre Martin"
2. Cliquer "Supprimer"
3. Confirmer
```

**✅ Résultat attendu**: Employé supprimé

---

### Test 6.5: Gérer les sections
```
1. Dans le formulaire d'ajout/édition
2. Section: Taper "Nouvelle Section Test"
3. Cliquer "+ Ajouter"
```

**✅ Résultat attendu**:
- Nouvelle section ajoutée au dropdown
- Disponible pour tous les employés

---

## 📋 TEST 7: Toutes les Tâches

**Objectif**: Filtres et recherche fonctionnent

### Test 7.1: Accéder à la page
```
Dashboard → Cliquer "Toutes les tâches"
```

**✅ Vérifier**:
- [ ] Page "Toutes les Tâches" s'affiche
- [ ] Statistiques en haut (Total, En cours, Terminées, Épinglées)
- [ ] Barre de recherche
- [ ] Filtres: Toutes / En cours / Terminées / Épinglées
- [ ] Filtres de date (derniers 7 jours)
- [ ] Liste des tâches

---

### Test 7.2: Recherche par texte
```
1. Barre de recherche: Taper "test"
2. Observer le filtrage en temps réel
```

**✅ Résultat attendu**: Seules les tâches contenant "test" dans le titre ou la section

---

### Test 7.3: Filtre par statut
```
1. Cliquer sur "En cours"
2. Observer la liste
3. Cliquer sur "Terminées"
4. Observer la liste
5. Cliquer sur "Épinglées"
```

**✅ Résultat attendu**: Liste filtrée selon le statut sélectionné

---

### Test 7.4: Filtre par date
```
1. Cliquer sur une des dates (ex: "27 oct")
2. Observer la liste
```

**✅ Résultat attendu**: Seules les tâches de ce jour affichées

---

### Test 7.5: Statistiques cohérentes
```
Vérifier que les chiffres en haut correspondent aux filtres:
- Total = nombre total de cartes
- En cours = nombre de tâches non terminées
- Terminées = nombre de tâches avec coche verte
- Épinglées = nombre de tâches avec badge "Épinglée"
```

---

## 📈 TEST 8: Performance des Employés

**Objectif**: Page de statistiques fonctionne

### Test 8.1: Accéder à la page
```
Dashboard → Cliquer "Performance"
```

**✅ Vérifier**:
- [ ] Page "Performance des Employés" s'affiche
- [ ] Composant de performance se charge
- [ ] Données affichées (ou message si pas de données)

---

### Test 8.2: Données affichées
```
Observer les informations affichées
```

**✅ Vérifier**:
- [ ] Graphiques ou tableaux de performance
- [ ] Données par employé ou par équipe
- [ ] Métriques pertinentes (colis traités, temps, etc.)

---

## 🔙 TEST 9: Navigation et Déconnexion

### Test 9.1: Retour au dashboard
```
Depuis n'importe quelle page → Cliquer bouton "Retour"
```

**✅ Résultat attendu**: Retour au dashboard

---

### Test 9.2: Déconnexion
```
Dashboard → Cliquer bouton rouge en bas à droite (Déconnexion)
```

**✅ Résultat attendu**:
- Redirection vers page d'accueil "/"
- Session détruite
- Impossible de revenir en arrière vers /directeur

---

## 📝 RAPPORT FINAL

### Bugs trouvés
```
Liste tous les bugs rencontrés:
1.
2.
3.
```

### Fonctionnalités OK
```
Liste ce qui marche parfaitement:
✅
✅
✅
```

### Améliorations suggérées
```
Ce qui pourrait être mieux:
💡
💡
💡
```

---

## 🎯 CHECKLIST GLOBALE

- [ ] Bug #2 corrigé (validation horaires)
- [ ] Dashboard et statistiques
- [ ] Attribution de tâche (tous les cas)
- [ ] Configuration horaires de travail
- [ ] Gestion utilisateurs (CRUD)
- [ ] Gestion équipes (CRUD)
- [ ] Toutes les tâches (filtres)
- [ ] Performance des employés
- [ ] Navigation et déconnexion

---

**Fin du guide de test** 🎉

Prends ton temps, note tout ce qui ne va pas, et on corrigera ensemble !
