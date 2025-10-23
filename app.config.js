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
    // En développement : valeurs par défaut si .env n'existe pas
    supabaseUrl: process.env.SUPABASE_URL || "https://vqwgnvrhcaosnjczuwth.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4",
    eas: {
      projectId: "f13cb17b-04ab-4c0b-8b00-2541ed1a7b8d"
    }
  },

}); 