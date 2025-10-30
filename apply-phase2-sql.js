/**
 * Script pour appliquer le SQL Phase 2 dans Supabase
 * Utilise pg (PostgreSQL client) pour exécuter le SQL directement
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configuration de connexion PostgreSQL depuis Supabase
const SUPABASE_PROJECT_REF = 'ontaxdhynqucamhtucgd';
const DATABASE_PASSWORD = 'cfYC5d43L73jnz9u';

const client = new Client({
  host: `db.${SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Nécessaire pour Supabase
  }
});

async function applySQLFile() {
  console.log('🚀 Connexion à Supabase PostgreSQL...\n');

  try {
    // Connexion à la base
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'sql', '02_employee_tracking.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Fichier SQL chargé:', sqlPath);
    console.log('📊 Taille:', sqlContent.length, 'caractères\n');

    // Exécuter le SQL complet
    console.log('⚙️  Exécution du SQL...\n');

    const result = await client.query(sqlContent);

    console.log('✅ SQL exécuté avec succès!\n');

    // Vérifier que les tables existent
    console.log('🔍 Vérification des tables créées...\n');

    const tablesToCheck = [
      'employee_heartbeat',
      'employee_current_activity',
      'activity_alerts'
    ];

    for (const table of tablesToCheck) {
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      const exists = checkResult.rows[0].exists;
      if (exists) {
        console.log(`✅ Table "${table}" : OK`);
      } else {
        console.log(`❌ Table "${table}" : NON TROUVÉE`);
      }
    }

    console.log('\n🎉 Phase 2 SQL appliqué avec succès!\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Déconnexion\n');
  }
}

// Exécuter
applySQLFile().catch(console.error);
