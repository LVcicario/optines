# Gestion des Utilisateurs - Documentation

## Vue d'ensemble

Cette fonctionnalité permet au directeur de gérer les utilisateurs de l'application (managers et directeurs) directement depuis le dashboard, sans avoir besoin de modifier le code source.

## Fonctionnalités

### 🔐 Base de données locale
- Stockage sécurisé des utilisateurs avec AsyncStorage
- Données persistantes entre les sessions
- Initialisation automatique avec des utilisateurs par défaut

### 👥 Gestion complète des utilisateurs
- **Ajouter** de nouveaux utilisateurs (managers ou directeurs)
- **Modifier** les informations existantes
- **Supprimer** des utilisateurs
- **Activer/Désactiver** des comptes
- **Réinitialiser** la base de données aux valeurs par défaut

### 🔒 Authentification sécurisée
- Vérification des identifiants contre la base de données
- Support des rôles (manager/directeur)
- Comptes actifs/inactifs
- Validation des noms d'utilisateur uniques

## Accès à la gestion des utilisateurs

1. Connectez-vous en tant que directeur
2. Dans le dashboard, cliquez sur l'icône ⚙️ (Settings) en haut à droite
3. Vous accédez à l'interface de gestion des utilisateurs

## Interface utilisateur

### Liste des utilisateurs
- **Managers** : Affichés avec leur section assignée
- **Directeurs** : Affichés sans section
- **Statut** : Indicateur visuel actif/inactif
- **Actions** : Boutons modifier et supprimer

### Formulaire d'ajout/modification
- **Nom d'utilisateur** : Format `prenom.n` (ex: marie.d)
- **Mot de passe** : Avec option d'affichage/masquage
- **Nom complet** : Prénom et nom
- **Rôle** : Sélection manager ou directeur
- **Section** : Obligatoire pour les managers
- **Statut** : Actif/inactif

## Utilisateurs par défaut

### Managers
- `marie.d` / `MD2024!` - Marie Dubois (Fruits & Légumes)
- `pierre.m` / `PM2024!` - Pierre Martin (Boucherie)
- `sophie.l` / `SL2024!` - Sophie Laurent (Poissonnerie)
- `thomas.d` / `TD2024!` - Thomas Durand (Charcuterie)
- `julie.m` / `JM2024!` - Julie Moreau (Fromage)

### Directeurs
- `jean.d` / `JD2024!` - Jean Dupont
- `anne.r` / `AR2024!` - Anne Rousseau

## Sections disponibles

- Fruits & Légumes
- Boucherie
- Poissonnerie
- Charcuterie
- Fromage
- Épicerie Salée
- Épicerie Sucrée
- Surgelés
- Produits Laitiers
- Boissons

## Sécurité

- Les mots de passe sont stockés en clair (pour la démo)
- En production, utilisez le hachage des mots de passe
- Validation des entrées utilisateur
- Vérification des noms d'utilisateur uniques

## Utilisation

### Ajouter un utilisateur
1. Cliquez sur "Ajouter un utilisateur"
2. Remplissez le formulaire
3. Cliquez sur l'icône de sauvegarde

### Modifier un utilisateur
1. Cliquez sur l'icône de modification (crayon)
2. Modifiez les champs souhaités
3. Sauvegardez les modifications

### Supprimer un utilisateur
1. Cliquez sur l'icône de suppression (poubelle)
2. Confirmez la suppression

### Réinitialiser la base
1. Cliquez sur "Réinitialiser la base"
2. Confirmez l'action
3. Tous les utilisateurs reviennent aux valeurs par défaut

## Fichiers modifiés

- `hooks/useUserDatabase.ts` - Hook de gestion de la base de données
- `app/user-management.tsx` - Interface de gestion des utilisateurs
- `app/login.tsx` - Mise à jour pour utiliser la nouvelle base
- `app/directeur.tsx` - Ajout du bouton d'accès
- `types/user.ts` - Types TypeScript

## Dépendances ajoutées

- `@react-native-async-storage/async-storage` - Stockage local

## Notes techniques

- La base de données est initialisée automatiquement au premier lancement
- Les données persistent entre les redémarrages de l'application
- Interface responsive et intuitive
- Validation en temps réel des formulaires
- Gestion des erreurs avec messages utilisateur 