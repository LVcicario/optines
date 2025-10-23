# 🔄 GUIDE DE MISE À JOUR DE L'APPLICATION

## 📱 Comment mettre à jour Optines sur votre tablette Android

---

## 🎯 Table des Matières
1. [Mise à jour avec Expo Go](#méthode-1---expo-go)
2. [Mise à jour d'un APK standalone](#méthode-2---apk-standalone)
3. [Mise à jour Over-The-Air (OTA)](#méthode-3---ota-avec-eas-update)
4. [Mise à jour via câble USB](#méthode-4---câble-usb)

---

## 🚀 MÉTHODE 1 - EXPO GO (Développement)

### Si vous avez installé avec Expo Go

**Bonne nouvelle** : Les mises à jour sont **automatiques** ! 🎉

### Comment ça marche ?

1. **Modifiez votre code** sur votre PC
2. **Sauvegardez** le fichier (Ctrl+S)
3. L'application **se recharge automatiquement** sur la tablette (Hot Reload)

### Pas besoin de réinstaller !

```bash
# Sur votre PC - Modifiez votre code
# Puis sauvegardez

# Sur la tablette
# L'app se recharge automatiquement en ~2 secondes
```

### Forcer un rechargement manuel

Si l'app ne se met pas à jour automatiquement :

**Sur la tablette** :
1. Secouez la tablette (ou appuyez sur le bouton menu)
2. Appuyez sur **"Reload"** ou **"Recharger"**

**Ou sur votre PC** :
```bash
# Appuyez sur 'r' dans le terminal Expo
r

# Ou redémarrez complètement
npm start -- --clear
```

---

## 📦 MÉTHODE 2 - APK STANDALONE (Production)

### Si vous avez installé un APK

Vous devez **reconstruire et réinstaller** l'APK complet.

### Étape 1 : Incrémenter la version

**Fichier `app.config.js`** :
```javascript
module.exports = ({ config }) => ({
  ...config,
  version: "1.0.1",  // ← Changez ici (était 1.0.0)
  android: {
    package: "com.hagothem04444.optines",
    versionCode: 2,  // ← Ajoutez cette ligne et incrémentez à chaque build
    // ...
  },
});
```

**Pourquoi ?**
- `version` : Version visible pour les utilisateurs (1.0.0 → 1.0.1)
- `versionCode` : Numéro interne Android (doit toujours augmenter)

### Étape 2 : Reconstruire l'APK

```bash
# Créer un nouveau build
eas build --platform android --profile preview

# Ou pour la production
eas build --platform android --profile production
```

⏱️ **Durée** : 15-25 minutes

### Étape 3 : Télécharger le nouvel APK

1. Vous recevrez un lien par email
2. Téléchargez le nouvel APK sur votre tablette
3. Ouvrez le fichier téléchargé

### Étape 4 : Installer la mise à jour

Android détectera que c'est une mise à jour et proposera :
- **"Mettre à jour"** ou **"Update"**
- Appuyez sur ce bouton
- Vos données seront conservées ✅

**⚠️ Important** : 
- Même `package` name : `com.hagothem04444.optines`
- `versionCode` plus élevé que la version installée
- Signée avec la même clé (EAS gère ça automatiquement)

---

## ⚡ MÉTHODE 3 - OTA AVEC EAS UPDATE (Recommandé)

### Mises à jour Over-The-Air (sans réinstaller l'APK)

**C'est la méthode professionnelle** utilisée par les grandes apps (Facebook, Instagram, etc.)

### Avantages
- ✅ Mises à jour **instantanées**
- ✅ Pas besoin de réinstaller l'APK
- ✅ Les utilisateurs reçoivent les mises à jour automatiquement
- ✅ Idéal pour les corrections de bugs et petites fonctionnalités

### Limitations
- ❌ Ne peut pas modifier le code natif (dépendances natives)
- ❌ Ne peut pas changer `app.config.js` (permissions, icônes, etc.)

### Configuration (Une seule fois)

#### 1. Installer EAS Update

```bash
npm install expo-updates
npx expo install expo-updates
```

#### 2. Configurer app.config.js

```javascript
module.exports = ({ config }) => ({
  ...config,
  updates: {
    url: "https://u.expo.dev/f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d"
  },
  runtimeVersion: {
    policy: "sdkVersion"
  },
  extra: {
    // ... votre config existante
    eas: {
      projectId: "f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d"
    }
  },
});
```

#### 3. Reconstruire l'APK avec support OTA

```bash
eas build --platform android --profile production
```

⚠️ **Important** : Cette étape est nécessaire **une seule fois** pour activer les OTA.

### Utilisation - Publier une mise à jour

Après avoir modifié votre code :

```bash
# 1. Publier la mise à jour
eas update --branch production --message "Fix: Correction du bug de connexion"

# 2. C'est tout !
```

⏱️ **Durée** : 2-5 minutes

### Sur la tablette

L'application vérifiera automatiquement les mises à jour :
- Au démarrage de l'app
- Ou toutes les 30 minutes si l'app est ouverte

**L'utilisateur n'a rien à faire** ! 🎉

### Forcer la vérification de mise à jour

Ajoutez un bouton dans votre app :

```typescript
// Dans un composant Settings par exemple
import * as Updates from 'expo-updates';

const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // Redémarre l'app avec la nouvelle version
    } else {
      alert('Vous avez déjà la dernière version');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
};

// Bouton
<TouchableOpacity onPress={checkForUpdates}>
  <Text>Vérifier les mises à jour</Text>
</TouchableOpacity>
```

---

## 🔌 MÉTHODE 4 - CÂBLE USB (Développement)

### Si vous développez avec câble USB

### Option A : Hot Reload automatique

Comme avec Expo Go, le code se recharge automatiquement :

1. Modifiez votre code
2. Sauvegardez (Ctrl+S)
3. L'app se recharge sur la tablette

### Option B : Réinstaller complètement

```bash
# Dans le dossier du projet
npm run android

# Cette commande va :
# 1. Compiler l'app
# 2. L'installer sur la tablette connectée
# 3. La lancer
```

⏱️ **Durée** : 3-5 minutes (première fois), ~1 minute ensuite

---

## 🎯 TABLEAU COMPARATIF

| Méthode | Vitesse | Facilité | Recommandé pour |
|---------|---------|----------|-----------------|
| **Expo Go** | ⚡ Instantané | ⭐⭐⭐ Très facile | Développement |
| **APK Rebuild** | 🐌 20-30 min | ⭐ Difficile | Changements natifs |
| **OTA (EAS Update)** | ⚡⚡ 2-5 min | ⭐⭐⭐ Très facile | **Production** ✅ |
| **Câble USB** | ⚡⚡ 1-5 min | ⭐⭐ Moyen | Développement |

---

## 🎬 WORKFLOW RECOMMANDÉ

### Phase 1 : Développement (Vous êtes ici)

```bash
# Utilisez Expo Go pour tester rapidement
npm start
# Scannez le QR Code
```

**Avantage** : Modifications instantanées

---

### Phase 2 : Tests internes

```bash
# Créez un APK de preview avec OTA activé
eas build --platform android --profile preview
```

**Avantage** : APK installable + mises à jour OTA

---

### Phase 3 : Production

```bash
# 1. Build initial (une fois)
eas build --platform android --profile production

# 2. Mises à jour (fréquentes)
eas update --branch production --message "Nouvelle fonctionnalité X"
```

**Avantage** : Mises à jour instantanées sans réinstallation

---

## 📝 CHECKLIST AVANT MISE À JOUR

### Avant de publier une mise à jour OTA

- [ ] ✅ Tester localement avec Expo Go
- [ ] ✅ Vérifier qu'il n'y a pas d'erreurs de compilation
- [ ] ✅ Tester sur au moins un appareil réel
- [ ] ✅ Vérifier les nouvelles fonctionnalités
- [ ] ✅ S'assurer qu'aucune dépendance native n'a été ajoutée
- [ ] ✅ Écrire un message de release clair

### Avant de rebuilder un APK

- [ ] ✅ Incrémenter `version` et `versionCode`
- [ ] ✅ Tester avec Expo Go
- [ ] ✅ Vérifier les permissions Android si modifiées
- [ ] ✅ Tester l'installation de la mise à jour
- [ ] ✅ Vérifier que les données utilisateur sont conservées

---

## 🐛 DÉPANNAGE

### Problème : "App not updating with Expo Go"

**Solutions** :
```bash
# 1. Forcer le rechargement
# Sur la tablette : Secouez et appuyez sur "Reload"

# 2. Nettoyer le cache
npm start -- --clear

# 3. Redémarrer complètement
npm run stop-server
npm start
```

---

### Problème : "Cannot install APK update"

**Solutions** :

1. **Vérifiez le versionCode** :
   ```javascript
   // app.config.js
   android: {
     versionCode: 3, // Doit être > version installée
   }
   ```

2. **Vérifiez le package name** :
   ```javascript
   // Doit être identique
   package: "com.hagothem04444.optines"
   ```

3. **Désinstallez l'ancienne version** (si tout échoue) :
   - Paramètres → Applications → Optines → Désinstaller
   - Puis réinstallez le nouvel APK

---

### Problème : "OTA update not working"

**Solutions** :

1. **Vérifiez la configuration** :
   ```bash
   # Voir les updates publiées
   eas update:list --branch production
   ```

2. **Forcez la vérification** :
   ```typescript
   // Dans l'app
   await Updates.checkForUpdateAsync();
   ```

3. **Vérifiez les logs** :
   ```bash
   # Terminal
   npx expo start
   # Regardez les logs de update
   ```

---

## 💡 ASTUCES PRO

### 1. Versioning sémantique

Utilisez le format `MAJOR.MINOR.PATCH` :

```javascript
version: "1.2.3"
//        │ │ │
//        │ │ └─ PATCH : Corrections de bugs
//        │ └─── MINOR : Nouvelles fonctionnalités
//        └───── MAJOR : Changements majeurs (breaking changes)
```

### 2. Branches de mise à jour

Créez différentes branches pour différents environnements :

```bash
# Développement
eas update --branch development

# Staging
eas update --branch staging

# Production
eas update --branch production
```

### 3. Rollback rapide

Si une mise à jour OTA pose problème :

```bash
# Republier la version précédente
eas update --branch production --message "Rollback to previous version"
```

### 4. Tester avant de publier

```bash
# Créer une branche de test
eas update --branch test --message "Testing new feature"

# Configurer l'app pour utiliser cette branche temporairement
# Puis publier en production quand c'est validé
eas update --branch production --message "Release new feature"
```

---

## 📊 RÉSUMÉ RAPIDE

### Vous développez activement ?
👉 **Utilisez Expo Go** - Rechargement instantané

### Vous voulez tester sur plusieurs appareils ?
👉 **APK Preview + OTA** - Flexibilité maximale

### Vous êtes en production avec des utilisateurs ?
👉 **APK Production + OTA** - Mises à jour professionnelles

---

## 🎯 RECOMMANDATION POUR VOUS

Pour votre cas d'usage (PME avec tablettes) :

**Étape 1 - Maintenant** :
```bash
npm start  # Développez avec Expo Go
```

**Étape 2 - Quand prêt pour déploiement** :
```bash
# 1. Activer OTA (une fois)
npm install expo-updates
eas build --platform android --profile production

# 2. Installer sur les tablettes (une fois)
# Télécharger et installer l'APK

# 3. Mises à jour futures (fréquent)
eas update --branch production --message "Mise à jour X"
```

**Résultat** : 
- Installation initiale : 1 fois
- Mises à jour : Automatiques et instantanées ✨

---

## 📚 RESSOURCES

- [Documentation EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Documentation Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/)
- [Guide de versioning](https://docs.expo.dev/build-reference/app-versions/)

---

**Date de création** : 8 octobre 2025  
**Version** : 1.0  
**Application** : Optines v1.0.13


