# 🔐 Configuration des Variables d'Environnement

## ⚠️ IMPORTANT - Sécurité

Les clés API Supabase ont été retirées du code source pour des raisons de sécurité. Vous devez maintenant créer un fichier `.env` local.

---

## 📝 Instructions de Configuration

### Étape 1 : Créer le fichier .env

Dans le dossier racine du projet (`C:\Users\thoma\Desktop\optines-main\`), créez un fichier nommé **`.env`** (avec le point au début).

**Sur Windows** :
```powershell
# Ouvrez PowerShell dans le dossier du projet
cd C:\Users\thoma\Desktop\optines-main
New-Item -Path ".env" -ItemType File
```

Ou simplement créez un nouveau fichier texte et renommez-le en `.env`

---

### Étape 2 : Contenu du fichier .env

Copiez-collez le contenu suivant dans votre fichier `.env` :

```env
# Configuration Supabase
SUPABASE_URL=https://vqwgnvrhcaosnjczuwth.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk

# Port du serveur API
PORT=3001
```

---

### Étape 3 : Vérification

Après avoir créé le fichier `.env`, votre structure de fichiers devrait ressembler à :

```
optines-main/
├── .env                    ← Votre nouveau fichier
├── .env.example            ← Template vide (ne pas modifier)
├── .gitignore              ← .env est dans cette liste
├── app/
├── components/
├── ...
```

---

## ✅ Fichiers Modifiés (Corrections de Sécurité)

Les fichiers suivants ont été modifiés pour utiliser les variables d'environnement :

### 1. ✅ `app.config.js`
```javascript
extra: {
  supabaseUrl: process.env.SUPABASE_URL || "valeur_par_defaut",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "valeur_par_defaut",
}
```

### 2. ✅ `lib/supabase.ts`
```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;
```

### 3. ✅ `server.js`
```javascript
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 4. ✅ `.gitignore`
```
.env
.env.production
.env.development
.env.staging
```

---

## 🚨 Autres Corrections de Sécurité Appliquées

### ❌ Contournement de sécurité retiré

Le code suivant a été **supprimé** de `hooks/useSupabaseAuth.ts` :

```typescript
// SUPPRIMÉ - Vulnérabilité de sécurité
if (identifier === 'thomas' && role === 'director') {
  console.log('🔥 CONTOURNEMENT pour thomas');
  return { success: true, user: data.user };
}
```

**Impact** : L'utilisateur "thomas" doit maintenant avoir les permissions correctes dans la base de données, comme tous les autres utilisateurs.

---

## 📊 Autres Corrections Appliquées

### ✅ package.json

1. **Ligne 20** : Typo corrigée
   - ❌ Avant : `qhttp://localhost:19006/developer`
   - ✅ Après : `http://localhost:19006/developer`

2. **Lignes 38-40** : Indentations uniformisées
   - ❌ Avant : Espaces mixtes (12-16 espaces)
   - ✅ Après : 4 espaces uniformes

---

## 🔄 Redémarrage Requis

Après avoir créé le fichier `.env`, **redémarrez complètement l'application** :

```bash
# Arrêter tous les processus Node.js
npm run stop-server

# Redémarrer l'application
npm start
```

---

## 🧪 Test de Configuration

Pour vérifier que tout fonctionne :

```bash
# 1. Tester la santé de l'API
npm run check-health

# 2. Démarrer l'application
npm start
```

Si vous voyez ces messages, c'est bon ✅ :
- `✅ API fonctionnelle`
- Le serveur démarre sans erreur

Si vous voyez ces avertissements, créez votre `.env` ⚠️ :
- `⚠️ ATTENTION: Variables d'environnement manquantes`
- `❌ ERREUR: Configuration Supabase manquante`

---

## 🎯 Mode Production

Pour la production, créez un fichier `.env.production` avec :

```env
# Production - Utilisez des clés dédiées
SUPABASE_URL=https://votre-projet-prod.supabase.co
SUPABASE_ANON_KEY=votre_cle_production
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_production
PORT=3001
```

---

## ❓ FAQ

### Q: Pourquoi cette modification ?
**R:** Les clés API étaient exposées publiquement dans le code source, ce qui représente un risque de sécurité critique. N'importe qui ayant accès au code avait un accès complet à votre base de données.

### Q: L'application fonctionne encore sans .env ?
**R:** Oui, temporairement. Des valeurs par défaut sont utilisées pour le développement, mais vous verrez des avertissements. **En production, le .env est OBLIGATOIRE.**

### Q: Je dois créer .env à chaque fois ?
**R:** Non, une seule fois. Le fichier `.env` est dans `.gitignore`, il reste sur votre machine et n'est jamais commité.

### Q: Comment partager les clés avec l'équipe ?
**R:** 
1. Utilisez un gestionnaire de mots de passe sécurisé (1Password, LastPass, etc.)
2. Ou partagez via un canal sécurisé (Signal, WhatsApp, etc.)
3. **JAMAIS par email ou commit Git**

---

## 📚 Ressources

- [Documentation Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/)
- [Documentation dotenv](https://www.npmjs.com/package/dotenv)
- [Bonnes pratiques sécurité React Native](https://reactnative.dev/docs/security)

---

**Date de modification** : 8 octobre 2025  
**Version** : 1.0  
**Statut** : ✅ Corrections appliquées

