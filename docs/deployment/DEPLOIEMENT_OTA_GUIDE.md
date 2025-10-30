# 🚀 GUIDE DE DÉPLOIEMENT OTA - OPTINES

## ✅ Configuration Terminée !

Votre application est maintenant configurée pour les **mises à jour OTA** (Over-The-Air).

---

## 📖 COMMENT ÇA FONCTIONNE ?

### Le Concept

Imaginez que votre application est comme **une coque** (l'APK) avec **du contenu à l'intérieur** (votre code JavaScript/TypeScript).

```
┌─────────────────────────────────┐
│     APK (Coque - Version 1.0)   │
│  ┌───────────────────────────┐  │
│  │   Votre Code JS/TS        │  │ ← Peut être mis à jour OTA
│  │   (Mise à jour v1, v2...) │  │
│  └───────────────────────────┘  │
│                                  │
│  Code Natif Android             │ ← Ne peut PAS être mis à jour OTA
└─────────────────────────────────┘
```

### Avec OTA

- ✅ **L'APK reste le même** (installé une fois sur la tablette)
- ✅ **Le contenu JS/TS change** (mis à jour automatiquement)
- ✅ **Pas besoin de réinstaller** l'application
- ✅ **Mise à jour en quelques secondes** au prochain démarrage

### Ce que vous POUVEZ mettre à jour OTA

- ✅ Code JavaScript/TypeScript
- ✅ Composants React
- ✅ Logique métier
- ✅ Styles (StyleSheet)
- ✅ Textes et traductions
- ✅ Assets (images, jusqu'à une certaine taille)

### Ce que vous NE POUVEZ PAS mettre à jour OTA

- ❌ Dépendances natives (nouvelles bibliothèques natives)
- ❌ Permissions Android (`AndroidManifest.xml`)
- ❌ Icône de l'application
- ❌ Nom de l'application
- ❌ Configuration `app.config.js` (updates, runtimeVersion, etc.)

**Pour ces changements** → Il faut rebuilder et réinstaller l'APK

---

## 🎬 LES 3 PHASES DU DÉPLOIEMENT

### 📍 PHASE 1 : BUILD INITIAL (Une seule fois)

C'est l'étape que vous allez faire **maintenant**.

#### Étape 1.1 : Créer le build de production avec support OTA

```bash
eas build --platform android --profile production
```

**Ce qui se passe** :
- EAS compile votre application sur ses serveurs (15-25 min)
- L'APK créé inclut le support des mises à jour OTA
- Vous recevez un lien de téléchargement par email

**Questions lors du build** :
```
? Generate a new Android Keystore?
→ YES (première fois)

? Would you like to upload a Keystore or have us generate one for you?
→ Generate new keystore
```

#### Étape 1.2 : Télécharger l'APK

1. Cliquez sur le lien dans l'email
2. Ou allez sur : https://expo.dev/accounts/hagothem04444/projects/optines/builds
3. Téléchargez l'APK (fichier `.apk`)

#### Étape 1.3 : Installer sur les tablettes

**Sur chaque tablette** :
1. Transférez l'APK (via email, clé USB, ou téléchargement direct)
2. Ouvrez le fichier APK
3. Autorisez l'installation depuis sources inconnues si demandé
4. Installez l'application

**C'est fait !** Vous n'aurez plus jamais besoin de réinstaller l'APK.

---

### 📍 PHASE 2 : DÉVELOPPEMENT ET TESTS

Vous développez de nouvelles fonctionnalités.

#### Sur votre PC - Développement rapide

```bash
# Démarrez Expo Go pour tester
npm start

# Scannez le QR Code avec Expo Go
# Testez vos modifications en temps réel
```

**Avantage** : Rechargement instantané pendant que vous codez

---

### 📍 PHASE 3 : PUBLICATION OTA (À chaque mise à jour)

Quand vous êtes prêt à déployer vos modifications.

#### Étape 3.1 : Publier la mise à jour

```bash
# Une seule commande !
eas update --branch production --message "Ajout de la fonctionnalité X"
```

**Exemple de messages** :
```bash
eas update --branch production --message "Fix: Correction du bug de connexion"
eas update --branch production --message "Feature: Nouveau système de statistiques"
eas update --branch production --message "Update: Amélioration des performances"
```

**Ce qui se passe** :
1. EAS compile votre code JavaScript/TypeScript (2-3 minutes)
2. Le code est uploadé sur les serveurs Expo
3. Les tablettes vérifient automatiquement les mises à jour
4. **C'est tout !** 🎉

#### Étape 3.2 : Vérification

Vous pouvez voir toutes vos mises à jour :

```bash
# Lister les mises à jour publiées
eas update:list --branch production

# Voir les détails d'une mise à jour
eas update:view [update-id]
```

---

## 📱 CÔTÉ UTILISATEUR (TABLETTE)

### Comment l'utilisateur reçoit-il les mises à jour ?

**C'est automatique !** L'utilisateur n'a RIEN à faire.

#### Scénario typique :

1. **Vous publiez** : `eas update --branch production` (2 min)
2. **L'utilisateur lance l'app** le lendemain matin
3. **L'app vérifie** s'il y a une mise à jour (2 secondes)
4. **L'app télécharge** la mise à jour en arrière-plan (5-10 secondes)
5. **L'app redémarre** avec la nouvelle version

**Durée totale pour l'utilisateur** : ~15 secondes au démarrage

#### Fréquence de vérification

Par défaut, l'app vérifie les mises à jour :
- ✅ À chaque démarrage de l'app
- ✅ Toutes les 30 minutes si l'app est ouverte
- ✅ Quand l'app revient au premier plan (après minimisation)

---

## 🎯 WORKFLOW RECOMMANDÉ

### Développement quotidien

```bash
# Matin
npm start
# Développez avec Expo Go
# Testez en temps réel

# Après-midi
# Continuez à développer
# Testez les nouvelles fonctionnalités

# Fin de journée - Prêt à déployer
eas update --branch production --message "Journée du 08/10: nouvelles stats"
```

### Déploiement urgent (bug critique)

```bash
# 1. Corrigez le bug
# Éditez le fichier concerné
# Sauvegardez

# 2. Testez avec Expo Go
npm start
# Vérifiez que le bug est corrigé

# 3. Déployez immédiatement
eas update --branch production --message "Hotfix: Correction bug connexion"

# 4. Vos utilisateurs auront la correction en 15 min max
```

---

## 💡 FONCTIONNALITÉS AVANCÉES

### 1. Forcer une vérification de mise à jour

Ajoutez un bouton dans votre app (optionnel mais utile) :

Créez : `components/UpdateChecker.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Updates from 'expo-updates';

export default function UpdateChecker() {
  const [checking, setChecking] = useState(false);

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          'Mise à jour disponible',
          'Une nouvelle version est disponible. Voulez-vous la télécharger ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Mettre à jour',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        Alert.alert('À jour', 'Vous utilisez déjà la dernière version');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      Alert.alert('Erreur', 'Impossible de vérifier les mises à jour');
    } finally {
      setChecking(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={checkForUpdates}
      disabled={checking}
      style={{
        padding: 15,
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        alignItems: 'center'
      }}
    >
      {checking ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={{ color: '#ffffff', fontWeight: '600' }}>
          Vérifier les mises à jour
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

**Utilisez-le dans** : `app/(tabs)/settings.tsx`

```typescript
import UpdateChecker from '@/components/UpdateChecker';

// Dans votre composant Settings
<View style={{ padding: 20 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
    Mises à jour
  </Text>
  <UpdateChecker />
</View>
```

### 2. Afficher la version actuelle

Ajoutez dans vos paramètres :

```typescript
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

// Dans votre composant
<View>
  <Text>Version: {Constants.expoConfig?.version}</Text>
  <Text>Build: {Constants.expoConfig?.android?.versionCode}</Text>
  <Text>Update ID: {Updates.updateId?.slice(0, 8) || 'N/A'}</Text>
</View>
```

### 3. Branches multiples (environnements)

Créez différentes branches pour différents groupes :

```bash
# Branche de test (quelques tablettes pilotes)
eas update --branch staging --message "Test nouvelle fonctionnalité"

# Branche de production (toutes les tablettes)
eas update --branch production --message "Release v1.1.0"
```

Pour utiliser la branche staging sur certaines tablettes, modifiez `app.config.js` :

```javascript
updates: {
  url: "https://u.expo.dev/f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d",
  // requestHeaders: {
  //   'expo-channel-name': 'staging', // Pour tests
  // }
},
```

---

## 🐛 DÉPANNAGE

### Problème : "No updates available"

**Vérifiez** :
```bash
# 1. Voir les updates publiées
eas update:list --branch production

# 2. Vérifier le projectId
# app.config.js doit avoir le bon projectId
```

### Problème : "Update not applying"

**Solutions** :
1. Vérifiez la connexion internet de la tablette
2. Fermez complètement l'app et relancez-la
3. Vérifiez les logs :
   ```bash
   npx expo start
   # Regardez les logs de update dans le terminal
   ```

### Problème : "Runtime version mismatch"

**Cause** : Le `runtimeVersion` de l'app ne correspond pas à la mise à jour

**Solution** : Rebuilder l'APK avec le nouveau `runtimeVersion`
```bash
eas build --platform android --profile production
```

---

## 📊 VERSIONING

### Stratégie recommandée

```javascript
// app.config.js
version: "1.2.3",  // Visible pour les utilisateurs
android: {
  versionCode: 10, // Incrémenter à chaque build APK
}
```

**Règles** :
- `version` : Format sémantique (MAJOR.MINOR.PATCH)
  - MAJOR : Changements majeurs (1.0.0 → 2.0.0)
  - MINOR : Nouvelles fonctionnalités (1.0.0 → 1.1.0)
  - PATCH : Corrections de bugs (1.0.0 → 1.0.1)

- `versionCode` : Nombre entier qui augmente toujours
  - 1, 2, 3, 4, 5... (jamais redescend)

**Exemple de progression** :
```
Build 1: version 1.0.0, versionCode 1
Update OTA: (version reste 1.0.0)
Update OTA: (version reste 1.0.0)
Build 2: version 1.1.0, versionCode 2
Update OTA: (version reste 1.1.0)
Build 3: version 1.1.1, versionCode 3
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant le premier build

- [x] ✅ expo-updates installé
- [x] ✅ app.config.js configuré (updates, runtimeVersion)
- [x] ✅ versionCode ajouté
- [ ] ⏳ Créer le fichier `.env` (voir CONFIGURATION_ENVIRONNEMENT.md)
- [ ] ⏳ Tester localement avec Expo Go

### Pour chaque mise à jour OTA

- [ ] Tester les modifications avec Expo Go
- [ ] Vérifier qu'aucune dépendance native n'a été ajoutée
- [ ] Écrire un message de release clair
- [ ] Publier : `eas update --branch production --message "..."`
- [ ] Vérifier la publication : `eas update:list --branch production`

### Pour chaque nouveau build APK

- [ ] Incrémenter `versionCode` dans app.config.js
- [ ] Mettre à jour `version` si nécessaire
- [ ] Builder : `eas build --platform android --profile production`
- [ ] Tester l'APK sur au moins une tablette
- [ ] Distribuer aux tablettes si OK

---

## 🎯 COMMANDES ESSENTIELLES

### Développement
```bash
npm start                    # Expo Go pour dev/test
```

### Build APK (rare)
```bash
eas build --platform android --profile production    # Nouveau build complet
```

### Mise à jour OTA (fréquent)
```bash
eas update --branch production --message "Description"    # Publier mise à jour
eas update:list --branch production                      # Voir les updates
eas update:view [update-id]                              # Détails d'une update
```

### Diagnostic
```bash
eas build:list                      # Voir tous les builds
eas update:list --branch production # Voir toutes les updates
```

---

## 🎉 RÉSUMÉ

Vous avez maintenant un système de déploiement professionnel :

### Que faites-vous maintenant ?

**1. BUILD INITIAL** (à faire une fois) :
```bash
eas build --platform android --profile production
# Attendre 20 minutes
# Télécharger l'APK
# Installer sur les tablettes
```

**2. DÉVELOPPEMENT** (quotidien) :
```bash
npm start
# Développer avec Expo Go
# Tester en temps réel
```

**3. DÉPLOIEMENT** (quand prêt) :
```bash
eas update --branch production --message "Nouvelles fonctionnalités"
# 2 minutes plus tard : Déployé ! 🚀
```

---

## 📞 BESOIN D'AIDE ?

1. **Problèmes de configuration** : Relisez ce guide
2. **Erreurs de build** : `eas build:list` pour voir les logs
3. **Problèmes d'update** : `eas update:list --branch production`

---

## 🎬 PROCHAINES ÉTAPES POUR VOUS

1. **Créer le fichier .env** (voir CONFIGURATION_ENVIRONNEMENT.md)
2. **Lancer le premier build** :
   ```bash
   eas build --platform android --profile production
   ```
3. **Installer l'APK sur une tablette de test**
4. **Tester une mise à jour OTA** :
   ```bash
   # Faites une petite modification
   # Puis publiez
   eas update --branch production --message "Test OTA"
   ```

---

**Félicitations ! 🎉 Vous avez maintenant un système de mise à jour professionnel !**

---

**Date de création** : 8 octobre 2025  
**Version** : 1.0  
**Status** : ✅ Configuration complète

