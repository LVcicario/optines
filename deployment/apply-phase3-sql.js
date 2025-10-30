const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse Supabase URL pour obtenir les infos de connexion
const supabaseUrl = process.env.SUPABASE_URL || '';
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';

if (!projectId) {
  console.error('❌ SUPABASE_URL invalide dans .env');
  process.exit(1);
}

// Demander le mot de passe DB
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Application de la Phase 3 - Refonte Secteurs & Rayons\n');
console.log(`📍 Projet Supabase: ${projectId}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

readline.question('🔑 Entrez le mot de passe de la base de données: ', async (password) => {
  readline.close();

  if (!password) {
    console.error('❌ Mot de passe requis');
    process.exit(1);
  }

  const client = new Client({
    host: `db.${projectId}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password.trim(),
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n📡 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté!\n');

    // Lire le fichier SQL Phase 3 (version fixed)
    const sqlPath = path.join(__dirname, '..', 'sql', '03_sectors_departments_refactor_fixed.sql');
    console.log(`📖 Lecture du fichier: ${sqlPath}`);

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Exécution du SQL Phase 3...\n');

    // Exécuter le SQL
    await client.query(sql);

    console.log('\n✅ Phase 3 appliquée avec succès!\n');

    // Vérifier les tables créées
    console.log('📊 Vérification des nouvelles tables...\n');

    const checkQuery = `
      SELECT
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('sectors', 'departments', 'employee_schedules')
      ORDER BY tablename;
    `;

    const { rows } = await client.query(checkQuery);

    console.log('✅ Tables créées:');
    rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    // Compter les secteurs et rayons
    const countQuery = `
      SELECT
        (SELECT COUNT(*) FROM sectors) as sectors_count,
        (SELECT COUNT(*) FROM departments) as departments_count;
    `;

    const { rows: [counts] } = await client.query(countQuery);

    console.log(`\n📊 Données insérées:`);
    console.log(`   - ${counts.sectors_count} secteurs`);
    console.log(`   - ${counts.departments_count} rayons`);

    console.log('\n🎉 Base de données mise à jour avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application du SQL:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
});
