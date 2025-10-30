module.exports = ({ config }) => ({
  ...config,
  name: "Optines",
  slug: "optines",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  // Configuration des mises à jour OTA (Over-The-Air)
  updates: {
    url: "https://u.expo.dev/f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d"
  },
  runtimeVersion: {
    policy: "sdkVersion"
  },
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.hagothem04444.optines",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // Utilisation des variables d'environnement pour la sécurité
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    eas: {
      projectId: "f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d"
    }
  },

}); 