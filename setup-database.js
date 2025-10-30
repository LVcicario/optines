/**
 * Script pour initialiser complètement la base de données Supabase
 * Phase 1: Schéma de base
 * Phase 2: Employee tracking
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function applySQL(filePath, phaseName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 ${phaseName}`);
  console.log(`${'='.repeat(60)}\n`);

  const sqlContent = fs.readFileSync(filePath, 'utf8');
  console.log(`📄 Fichier: ${path.basename(filePath)}`);
  console.log(`📊 Taille: ${sqlContent.length} caractères\n`);

  console.log('⚙️  Exécution...\n');

  try {
    await client.query(sqlContent);
    console.log(`✅ ${phaseName} appliquée avec succès!\n`);
    return true;
  } catch (error) {
    console.error(`❌ ERREUR lors de ${phaseName}:`, error.message);
    return false;
  }
}

async function verifyTables(tables) {
  console.log('\n🔍 Vérification des tables créées...\n');

  for (const table of tables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      const exists = result.rows[0].exists;
      if (exists) {
        console.log(`✅ Table "${table}" : OK`);
      } else {
        console.log(`❌ Table "${table}" : NON TROUVÉE`);
      }
    } catch (error) {
      console.log(`❌ Erreur lors de la vérification de "${table}":`, error.message);
    }
  }
}

async function setupDatabase() {
  console.log('\n🚀 INITIALISATION BASE DE DONNÉES SUPABASE');
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Connexion
    console.log('🔌 Connexion à PostgreSQL...');
    await client.connect();
    console.log('✅ Connecté!\n');

    // Phase 1: Schéma de base
    const phase1Success = await applySQL(
      path.join(__dirname, 'sql', '01_base_schema.sql'),
      'PHASE 1: Schéma de base'
    );

    if (!phase1Success) {
      throw new Error('Phase 1 a échoué');
    }

    // Vérifier tables Phase 1
    await verifyTables([
      'stores',
      'users',
      'employees',
      'tasks',
      'employee_breaks'
    ]);

    // Phase 2: Employee tracking
    const phase2Success = await applySQL(
      path.join(__dirname, 'sql', '02_employee_tracking.sql'),
      'PHASE 2: Employee Tracking'
    );

    if (!phase2Success) {
      throw new Error('Phase 2 a échoué');
    }

    // Vérifier tables Phase 2
    await verifyTables([
      'employee_heartbeat',
      'employee_current_activity',
      'activity_alerts'
    ]);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS!');
    console.log('='.repeat(60) + '\n');

    console.log('📊 Tables créées:');
    console.log('   Phase 1:');
    console.log('     - stores');
    console.log('     - users');
    console.log('     - employees');
    console.log('     - tasks');
    console.log('     - employee_breaks');
    console.log('   Phase 2:');
    console.log('     - employee_heartbeat');
    console.log('     - employee_current_activity');
    console.log('     - activity_alerts\n');

    console.log('✅ Prêt pour le développement!\n');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Déconnexion\n');
  }
}

// Exécuter
setupDatabase();
