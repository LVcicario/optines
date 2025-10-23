# 📱 GUIDE D'INSTALLATION SUR TABLETTE ANDROID

## 🎯 Guide Complet pour Installer Optines sur votre Tablette Android

---

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Méthode 1 - Installation via Expo Go (Développement)](#méthode-1---expo-go-développement)
3. [Méthode 2 - Installation via APK (Production)](#méthode-2---apk-production)
4. [Méthode 3 - Installation via câble USB](#méthode-3---câble-usb)
5. [Dépannage](#dépannage)

---

## ✅ PRÉREQUIS

### Sur votre ordinateur Windows
- ✅ Node.js installé (version 18 ou supérieure)
- ✅ Application déjà configurée (`npm install` effectué)
- ✅ Connexion internet stable
- ✅ Pare-feu Windows configuré pour autoriser les connexions

### Sur votre tablette Android
- ✅ Android 8.0 (Oreo) ou supérieur
- ✅ Au moins 100 Mo d'espace libre
- ✅ Même réseau Wi-Fi que l'ordinateur (important!)

---

## 🚀 MÉTHODE 1 - EXPO GO (DÉVELOPPEMENT - LA PLUS SIMPLE)

### ⏱️ Temps estimé: 5 minutes

Cette méthode est la plus rapide pour tester l'application. **C'est la méthode recommandée pour l'essai.**

### Étape 1: Installer Expo Go sur votre tablette

1. Ouvrez le **Google Play Store** sur votre tablette
2. Recherchez **"Expo Go"**
3. Appuyez sur **Installer**
4. Attendez la fin de l'installation

📱 Lien direct: https://play.google.com/store/apps/details?id=host.exp.exponent

---

### Étape 2: Démarrer le serveur de développement sur votre PC

1. Ouvrez **PowerShell** ou **l'invite de commandes**
2. Naviguez vers le dossier du projet:
   ```bash
   cd C:\Users\thoma\Desktop\optines-main
   ```

3. Démarrez le serveur:
   ```bash
   npm start
   ```

4. **Attendez** que le serveur démarre (environ 30 secondes)

---

### Étape 3: Scanner le QR Code

Une fois le serveur démarré, vous verrez un **QR Code** dans votre terminal.

#### 🔍 Si vous voyez le QR Code:

1. Ouvrez **Expo Go** sur votre tablette
2. Appuyez sur **"Scan QR Code"**
3. Scannez le QR Code affiché dans votre terminal
4. L'application va se charger automatiquement

#### 🔍 Si vous ne voyez PAS le QR Code:

1. Dans le terminal, appuyez sur **`w`** pour ouvrir dans le navigateur
2. Vous verrez une URL comme: `http://localhost:19000`
3. Remplacez `localhost` par l'adresse IP de votre PC (voir ci-dessous)
4. Tapez cette URL dans Expo Go sur votre tablette

---

### 📍 Trouver l'adresse IP de votre PC

1. Ouvrez PowerShell
2. Tapez: `ipconfig`
3. Cherchez **"Carte réseau sans fil Wi-Fi"**
4. Notez l'**adresse IPv4** (exemple: `192.168.1.100`)

Votre URL sera: `http://192.168.1.100:19000`

---

### ⚡ Étape 4: Utiliser l'application

1. Une fois chargée, l'application démarrera automatiquement
2. Vous pouvez maintenant tester toutes les fonctionnalités
3. Les modifications du code seront reflétées en temps réel (Hot Reload)

---

## 📦 MÉTHODE 2 - APK STANDALONE (PRODUCTION)

### ⏱️ Temps estimé: 20-30 minutes

Cette méthode crée un APK installable sans dépendance à Expo Go.

### Étape 1: Installer EAS CLI

```bash
npm install -g eas-cli
```

---

### Étape 2: Configurer EAS

1. Connectez-vous à votre compte Expo:
   ```bash
   eas login
   ```

2. Configurez le projet:
   ```bash
   eas build:configure
   ```

---

### Étape 3: Créer l'APK

1. Lancez la construction:
   ```bash
   eas build --platform android --profile preview
   ```

2. Choisissez les options suivantes:
   - **Generate a new Android Keystore**: Yes (première fois)
   - **Build type**: APK (pas AAB)

3. **Attendez** la fin de la construction (15-25 minutes)
   - La construction se fait sur les serveurs Expo
   - Vous recevrez une notification quand c'est terminé

---

### Étape 4: Télécharger et installer l'APK

1. Une fois terminé, vous recevrez un lien de téléchargement
2. Sur votre tablette, **désactivez temporairement le Play Protect**:
   - Ouvrez **Paramètres** → **Sécurité**
   - Désactivez **"Google Play Protect"** temporairement
   - Activez **"Sources inconnues"** ou **"Installer des applications inconnues"**

3. Téléchargez l'APK sur votre tablette
4. Ouvrez le fichier téléchargé
5. Appuyez sur **Installer**
6. Attendez la fin de l'installation
7. **Réactivez Play Protect** après l'installation

---

## 🔌 MÉTHODE 3 - CÂBLE USB (ADB)

### ⏱️ Temps estimé: 15 minutes

Cette méthode utilise Android Debug Bridge (ADB) pour installer directement sur votre tablette.

### Étape 1: Activer le mode développeur sur votre tablette

1. Ouvrez **Paramètres** → **À propos de la tablette**
2. Appuyez **7 fois** sur **"Numéro de build"**
3. Un message "Vous êtes maintenant développeur" apparaîtra

4. Retournez dans **Paramètres** → **Options pour les développeurs**
5. Activez **"Débogage USB"**

---

### Étape 2: Installer Android SDK Platform Tools

1. Téléchargez depuis: https://developer.android.com/tools/releases/platform-tools
2. Extrayez le ZIP dans `C:\platform-tools`
3. Ajoutez à la variable PATH Windows:
   - Ouvrez **Panneau de configuration** → **Système** → **Paramètres système avancés**
   - Cliquez sur **Variables d'environnement**
   - Modifiez **Path** et ajoutez: `C:\platform-tools`

---

### Étape 3: Connecter votre tablette

1. Connectez votre tablette à votre PC via USB
2. Sur votre tablette, **autorisez le débogage USB** (popup qui apparaît)
3. Sur votre PC, ouvrez PowerShell et tapez:
   ```bash
   adb devices
   ```
4. Vous devriez voir votre tablette listée

---

### Étape 4: Lancer l'application

1. Dans le dossier du projet:
   ```bash
   cd C:\Users\thoma\Desktop\optines-main
   ```

2. Lancez l'application directement sur votre tablette:
   ```bash
   npm run android
   ```

3. Expo va automatiquement:
   - Compiler l'application
   - Installer sur votre tablette
   - Lancer l'application

4. **Attendez** le premier lancement (3-5 minutes)

---

## 🔧 DÉPANNAGE

### ❌ Problème: "Metro Bundler ne démarre pas"

**Solution**:
```bash
# Nettoyer le cache
npm start -- --clear

# Ou
npx expo start -c
```

---

### ❌ Problème: "Impossible de se connecter au serveur de développement"

**Solutions possibles**:

1. **Vérifiez que votre PC et tablette sont sur le MÊME Wi-Fi**
   - PC: Vérifiez dans les paramètres réseau
   - Tablette: Paramètres → Wi-Fi

2. **Désactivez temporairement le pare-feu Windows**:
   - Paramètres → Pare-feu Windows → Désactiver temporairement
   - Ou ajoutez une exception pour Node.js

3. **Essayez en mode tunnel**:
   ```bash
   npx expo start --tunnel
   ```
   ⚠️ Note: Plus lent mais contourne les problèmes de réseau

4. **Vérifiez l'adresse IP**:
   ```bash
   ipconfig
   ```
   Utilisez l'IP affichée dans Expo Go

---

### ❌ Problème: "Application crash au démarrage"

**Solutions**:

1. **Vérifiez que le serveur backend est démarré**:
   ```bash
   # Terminal 1 - API Backend
   npm run server

   # Terminal 2 - Expo
   npm run dev
   ```

2. **Nettoyez et redémarrez**:
   ```bash
   # Nettoyer
   rm -rf node_modules
   npm install

   # Redémarrer
   npm start -- --clear
   ```

3. **Vérifiez les logs**:
   - Dans Expo Go, secouez votre tablette
   - Ouvrez le menu développeur
   - Consultez les logs

---

### ❌ Problème: "QR Code ne fonctionne pas"

**Solutions**:

1. **Utilisez l'URL manuelle**:
   - Dans Expo Go, choisissez "Enter URL manually"
   - Tapez: `exp://[IP_DE_VOTRE_PC]:19000`
   - Exemple: `exp://192.168.1.100:19000`

2. **Essayez le mode tunnel**:
   ```bash
   npx expo start --tunnel
   ```

---

### ❌ Problème: "Erreur de connexion Supabase"

**Solution**:

1. Vérifiez votre connexion internet
2. Vérifiez que les clés Supabase sont correctes dans `app.config.js`
3. Si les clés ont changé, redémarrez l'application

---

### ❌ Problème: "APK non installable"

**Solutions**:

1. **Activez les sources inconnues**:
   - Paramètres → Sécurité → Sources inconnues
   - Ou pour Android 8+: Paramètres → Applications → Accès spécial → Installer des apps inconnues

2. **Vérifiez l'espace disque**:
   - Minimum 200 Mo libres requis

3. **Désinstallez l'ancienne version** si elle existe

---

## 📊 COMPARAISON DES MÉTHODES

| Critère | Expo Go | APK Standalone | Câble USB |
|---------|---------|----------------|-----------|
| ⏱️ Temps | 5 min | 30 min | 15 min |
| 🔧 Difficulté | ⭐ Facile | ⭐⭐⭐ Difficile | ⭐⭐ Moyen |
| 📱 Installation | Temporaire | Permanente | Permanente |
| 🔄 Hot Reload | ✅ Oui | ❌ Non | ✅ Oui |
| 🌐 Internet requis | ✅ Oui | ❌ Non | ⚠️ Pour le dev |
| 👍 Recommandé pour | Test rapide | Production | Développement |

---

## 🎯 RECOMMANDATION

Pour **tester rapidement** l'application sur votre tablette, je recommande la **MÉTHODE 1 (Expo Go)**.

### Étapes résumées:
1. ✅ Installer **Expo Go** depuis le Play Store
2. ✅ Lancer `npm start` sur votre PC
3. ✅ Scanner le QR Code avec Expo Go
4. ✅ Tester l'application !

---

## 🔐 IDENTIFIANTS DE TEST

Pour tester l'application, utilisez ces identifiants:

### Manager
- **Identifiant**: `manager`
- **Mot de passe**: `password123`

### Directeur
- **Identifiant**: `thomas`
- **Mot de passe**: `thomas123`

---

## 📞 SUPPORT

Si vous rencontrez des problèmes:

1. ✅ Consultez la section [Dépannage](#dépannage)
2. ✅ Vérifiez les logs dans le terminal
3. ✅ Consultez la documentation Expo: https://docs.expo.dev
4. ✅ Vérifiez que tous les services sont démarrés:
   ```bash
   npm run check-health
   ```

---

## 🎉 FÉLICITATIONS !

Une fois l'application installée, vous pourrez:

- ✅ Gérer les employés
- ✅ Planifier des tâches
- ✅ Consulter les performances
- ✅ Gérer les planning par rayon
- ✅ Consulter les statistiques en temps réel

---

**Bon test de l'application Optines !** 🚀

---

**Date de création**: 8 octobre 2025  
**Version du guide**: 1.0  
**Application version**: 1.0.13

