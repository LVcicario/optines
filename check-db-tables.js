/**
 * Script pour vérifier les tables existantes dans Supabase
 */

require('dotenv').config();
const { Client } = require('pg');

const SUPABASE_PROJECT_REF = 'ontaxdhynqucamhtucgd';
const DATABASE_PASSWORD = 'cfYC5d43L73jnz9u';

const client = new Client({
  host: `db.${SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  console.log('🔍 Vérification des tables existantes...\n');

  try {
    await client.connect();
    console.log('✅ Connecté\n');

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.log('❌ Aucune table trouvée dans le schéma public\n');
      console.log('📝 Action requise: Appliquer d\'abord le SQL de Phase 1\n');
    } else {
      console.log('📊 Tables trouvées (' + result.rows.length + '):\n');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
