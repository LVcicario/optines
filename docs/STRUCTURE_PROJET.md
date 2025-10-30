# 📁 Structure du projet Optines

> Documentation de l'organisation du projet après nettoyage et réorganisation

## 🗂️ Organisation des dossiers

```
optines/
├── 📱 app/                    # Pages et écrans de l'application (Expo Router)
├── 🧩 components/             # Composants React réutilisables
├── 🔗 contexts/               # Contextes React (Auth, Theme, Tasks, etc.)
├── 🪝 hooks/                  # Hooks React personnalisés
├── 🛠️ services/              # Services métier (Notifications, API, etc.)
├── 🗄️ lib/                    # Configuration des bibliothèques (Supabase)
├── 📊 supabase/               # Migrations SQL et configuration Supabase
├── 📜 scripts/                # Scripts utilitaires et automatisation
├── 🎨 assets/                 # Images, fonts et ressources statiques
├── 🤖 android/                # Configuration native Android
├── 📚 docs/                   # Documentation du projet
│   ├── deployment/           # Guides de déploiement
│   └── guides/               # Guides utilisateur et développeur
├── 🚀 deployment/             # Scripts de déploiement et release
├── 📋 logs/                   # Fichiers de logs et temporaires
└── 🔧 Configuration           # Fichiers de config à la racine
```

## 📚 Documentation (dossier `/docs`)

### Documentation principale
- `ANALYSE_COMPLETE_ERREURS_OPTIMISATIONS.md` - Analyse détaillée du code
- `CHANGELOG.md` - Historique des versions et changements
- `CONFIGURATION_ENVIRONNEMENT.md` - Configuration de l'environnement
- `CORRECTIONS_APPLIQUEES.md` - Liste des corrections effectuées
- `OPTINES_PME_PRESENTATION.md` - Présentation du projet

### Guides de déploiement (`/docs/deployment`)
- `DEPLOIEMENT_OTA_GUIDE.md` - Guide de déploiement Over-The-Air
- `GUIDE_INSTALLATION_ANDROID.md` - Installation sur Android
- `GUIDE_MISE_A_JOUR_APP.md` - Processus de mise à jour

### Guides utilisateur (`/docs/guides`)
- Guides détaillés pour l'utilisation de l'application
- Documentation technique pour les développeurs

## 🚀 Déploiement (dossier `/deployment`)

Scripts automatisés pour le déploiement :
- `auto-release.bat` - Release automatique
- `release.bat` - Script de release manuel
- `start.bat` - Script de démarrage Windows
- `.auto-release-pid` - Fichier PID pour le suivi des processus

## 📋 Logs (dossier `/logs`)

Fichiers temporaires et logs de développement :
- `auto-release.log` - Logs des releases automatiques
- `test-storage.json` - Tests de stockage
- Autres fichiers temporaires

## 🔧 Configuration racine

Fichiers de configuration essentiels à garder à la racine :
- `package.json` - Dépendances npm
- `app.config.js` - Configuration Expo
- `babel.config.js` - Configuration Babel
- `metro.config.js` - Configuration Metro bundler
- `tsconfig.json` - Configuration TypeScript
- `eas.json` - Configuration EAS Build
- `.env` - Variables d'environnement (à ne pas commiter)
- `.env.example` - Template des variables d'environnement
- `server.js` - Serveur backend Node.js

## ✅ Avantages de cette organisation

1. **Racine propre** : Seulement les fichiers de configuration essentiels
2. **Documentation centralisée** : Tout dans `/docs`
3. **Séparation des responsabilités** : Code source séparé de la doc
4. **Facilite la maintenance** : Structure claire et logique
5. **Git plus propre** : Logs et fichiers temporaires isolés

## 🔒 Sécurité

**Important** : Le fichier `.env` contient des informations sensibles et ne doit JAMAIS être committé dans Git. Un template `.env.example` est fourni pour la documentation.

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Démarrage de l'application (Expo + Server)
npm start

# Démarrage du serveur backend uniquement
npm run server

# Démarrage d'Expo uniquement
npm run dev
```

## 📞 Support

Pour toute question sur la structure du projet, consultez la documentation dans `/docs` ou contactez l'équipe de développement.
