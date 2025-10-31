const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const STORE_ID = 1;
const TEST_PASSWORD = 'Test1234!';

const accounts = [
  // Directeur
  { email: 'directeur@optines.test', firstName: 'Jean', lastName: 'Dupont', position: 'directeur', sectorId: null, departmentId: null },

  // Manager
  { email: 'manager@optines.test', firstName: 'Marie', lastName: 'Martin', position: 'manager', sectorId: 1, departmentId: null },

  // Employés
  { email: 'isabelle.fromage@optines.test', firstName: 'Isabelle', lastName: 'Froment', position: 'employee', sectorId: 1, departmentId: 1 },
  { email: 'lucas.yaourt@optines.test', firstName: 'Lucas', lastName: 'Lactel', position: 'employee', sectorId: 1, departmentId: 2 },
  { email: 'sophie.chocolat@optines.test', firstName: 'Sophie', lastName: 'Dulac', position: 'employee', sectorId: 2, departmentId: 8 },
  { email: 'thomas.biscuit@optines.test', firstName: 'Thomas', lastName: 'Biscotte', position: 'employee', sectorId: 2, departmentId: 9 },
  { email: 'julie.conserve@optines.test', firstName: 'Julie', lastName: 'Conserva', position: 'employee', sectorId: 3, departmentId: 13 },
  { email: 'marc.pates@optines.test', firstName: 'Marc', lastName: 'Rivoli', position: 'employee', sectorId: 3, departmentId: 14 },
  { email: 'claire.eau@optines.test', firstName: 'Claire', lastName: 'Evian', position: 'employee', sectorId: 4, departmentId: 18 },
  { email: 'pierre.jus@optines.test', firstName: 'Pierre', lastName: 'Tropicana', position: 'employee', sectorId: 4, departmentId: 20 },
  { email: 'laura.cosmetique@optines.test', firstName: 'Laura', lastName: 'Loreal', position: 'employee', sectorId: 5, departmentId: 23 },
  { email: 'nicolas.parfum@optines.test', firstName: 'Nicolas', lastName: 'Chanel', position: 'employee', sectorId: 5, departmentId: 24 },
];

console.log('\n🚀 SETUP COMPTES DE TEST - VERSION DIRECTE SQL\n');
console.log(`📍 Projet: ${projectId}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

readline.question('🔑 Entrez le mot de passe de la base de données Postgres: ', async (password) => {
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
    console.log('\n📡 Connexion à la base...');
    await client.connect();
    console.log('✅ Connecté!\n');

    const today = new Date().toISOString().split('T')[0];

    for (const account of accounts) {
      console.log(`\n📝 Création de ${account.firstName} ${account.lastName}...`);

      // 1. Créer l'utilisateur Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: TEST_PASSWORD,
        email_confirm: true
      });

      let userId;
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  Auth existe déjà, récupération...`);

          // Récupérer l'ID utilisateur existant via SQL
          const { rows } = await client.query(
            `SELECT id FROM auth.users WHERE email = $1`,
            [account.email]
          );

          if (rows.length === 0) {
            console.log(`   ❌ Utilisateur Auth introuvable`);
            continue;
          }
          userId = rows[0].id;
        } else {
          console.log(`   ❌ Erreur Auth: ${authError.message}`);
          continue;
        }
      } else {
        userId = authData.user.id;
      }

      console.log(`   User ID: ${userId}`);

      // 2. Créer/Mettre à jour dans la table users via SQL
      await client.query(`
        INSERT INTO users (id, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          updated_at = NOW()
      `, [userId, account.email, TEST_PASSWORD, account.position === 'directeur' ? 'director' : 'employee']);

      // 3. Créer/Mettre à jour l'employé via SQL
      await client.query(`
        INSERT INTO employees (user_id, store_id, first_name, last_name, email, position, sector_id, department_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          position = EXCLUDED.position,
          sector_id = EXCLUDED.sector_id,
          department_id = EXCLUDED.department_id,
          updated_at = NOW()
      `, [userId, STORE_ID, account.firstName, account.lastName, account.email, account.position, account.sectorId, account.departmentId]);

      // 4. Récupérer l'ID de l'employé
      const { rows: empRows } = await client.query(
        `SELECT id FROM employees WHERE email = $1`,
        [account.email]
      );

      if (empRows.length > 0) {
        const employeeId = empRows[0].id;

        // 5. Créer un horaire de travail pour aujourd'hui
        await client.query(`
          INSERT INTO employee_schedules (employee_id, store_id, work_date, work_start, work_end, is_present, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (employee_id, work_date) DO UPDATE SET
            work_start = EXCLUDED.work_start,
            work_end = EXCLUDED.work_end,
            is_present = EXCLUDED.is_present,
            updated_at = NOW()
        `, [employeeId, STORE_ID, today, '08:00', '17:00', true]);

        console.log(`   ✅ ${account.firstName} ${account.lastName} créé avec succès`);
        console.log(`      📧 ${account.email}`);
        console.log(`      🔑 ${TEST_PASSWORD}`);
        if (account.sectorId) {
          console.log(`      📍 Secteur: ${account.sectorId}, Rayon: ${account.departmentId || 'N/A'}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SETUP TERMINÉ!\n');
    console.log('📋 CONNEXIONS DE TEST:\n');
    console.log('🎯 DIRECTEUR:');
    console.log(`   Email: directeur@optines.test`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Accès: Dashboard global\n`);
    console.log('👔 MANAGER:');
    console.log(`   Email: manager@optines.test`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Secteur: Frais\n`);
    console.log('👷 EMPLOYÉS: 10 comptes sur 5 secteurs');
    console.log(`   Password pour tous: ${TEST_PASSWORD}\n`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
});
