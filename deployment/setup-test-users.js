const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Client admin avec service role key pour créer des utilisateurs
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration des comptes de test
const STORE_ID = 1;
const TEST_PASSWORD = 'Test1234!'; // Mot de passe pour tous les comptes test

const accounts = {
  director: {
    email: 'directeur@optines.test',
    firstName: 'Jean',
    lastName: 'Dupont',
    position: 'directeur'
  },
  manager: {
    email: 'manager@optines.test',
    firstName: 'Marie',
    lastName: 'Martin',
    position: 'manager',
    sectorId: 1 // Secteur Frais
  },
  employees: [
    // Secteur 1: Frais
    { email: 'isabelle.fromage@optines.test', firstName: 'Isabelle', lastName: 'Froment', sectorId: 1, departmentId: 1 }, // Fromage
    { email: 'lucas.yaourt@optines.test', firstName: 'Lucas', lastName: 'Lactel', sectorId: 1, departmentId: 2 }, // Yaourt

    // Secteur 2: Épicerie Sucrée
    { email: 'sophie.chocolat@optines.test', firstName: 'Sophie', lastName: 'Dulac', sectorId: 2, departmentId: 8 }, // Chocolat
    { email: 'thomas.biscuit@optines.test', firstName: 'Thomas', lastName: 'Biscotte', sectorId: 2, departmentId: 9 }, // Biscuits

    // Secteur 3: Épicerie Salée
    { email: 'julie.conserve@optines.test', firstName: 'Julie', lastName: 'Conserva', sectorId: 3, departmentId: 13 }, // Conserves
    { email: 'marc.pates@optines.test', firstName: 'Marc', lastName: 'Rivoli', sectorId: 3, departmentId: 14 }, // Pâtes & Riz

    // Secteur 4: Boissons
    { email: 'claire.eau@optines.test', firstName: 'Claire', lastName: 'Evian', sectorId: 4, departmentId: 18 }, // Eaux
    { email: 'pierre.jus@optines.test', firstName: 'Pierre', lastName: 'Tropicana', sectorId: 4, departmentId: 20 }, // Jus de Fruits

    // Secteur 5: Hygiène & Beauté
    { email: 'laura.cosmetique@optines.test', firstName: 'Laura', lastName: 'Loreal', sectorId: 5, departmentId: 23 }, // Cosmétiques
    { email: 'nicolas.parfum@optines.test', firstName: 'Nicolas', lastName: 'Chanel', sectorId: 5, departmentId: 24 }, // Parfumerie
  ]
};

async function createUserAndEmployee(userData, sectorId = null, departmentId = null) {
  try {
    console.log(`\n📝 Création de ${userData.firstName} ${userData.lastName}...`);

    // 1. Créer l'utilisateur avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: TEST_PASSWORD,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   ⚠️  Email déjà existant, on récupère l'utilisateur...`);

        // Récupérer l'utilisateur existant
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (existingUsers) {
          // Mettre à jour l'employé existant
          const { error: updateError } = await supabase
            .from('employees')
            .update({
              sector_id: sectorId,
              department_id: departmentId,
              position: userData.position
            })
            .eq('email', userData.email);

          if (!updateError) {
            console.log(`   ✅ Employé mis à jour`);
            return true;
          }
        }
      } else {
        throw authError;
      }
    }

    const userId = authData.user.id;

    // 2. Créer l'entrée dans users (ou mettre à jour si existe)
    const { error: userError } = await supabase
      .from('users')
      .upsert([{
        id: userId,
        email: userData.email,
        password: TEST_PASSWORD, // Pour référence seulement
        role: userData.position === 'directeur' ? 'director' : 'employee'
      }], {
        onConflict: 'id'
      });

    if (userError && !userError.message.includes('duplicate')) {
      console.log(`   ⚠️  Erreur users: ${userError.message}`);
    }

    // 3. Créer l'employé
    const { error: employeeError } = await supabase
      .from('employees')
      .insert([{
        user_id: userId,
        store_id: STORE_ID,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        position: userData.position,
        sector_id: sectorId,
        department_id: departmentId
      }]);

    if (employeeError && !employeeError.message.includes('duplicate')) {
      throw employeeError;
    }

    // 4. Créer un horaire de travail pour aujourd'hui
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (employee) {
      const today = new Date().toISOString().split('T')[0];
      const { error: scheduleError } = await supabase
        .from('employee_schedules')
        .insert([{
          employee_id: employee.id,
          store_id: STORE_ID,
          work_date: today,
          work_start: '08:00',
          work_end: '17:00',
          is_present: true
        }]);

      if (scheduleError && !scheduleError.message.includes('duplicate')) {
        console.log(`   ⚠️  Horaire non créé: ${scheduleError.message}`);
      }
    }

    console.log(`   ✅ ${userData.firstName} ${userData.lastName} créé avec succès`);
    console.log(`      📧 Email: ${userData.email}`);
    console.log(`      🔑 Password: ${TEST_PASSWORD}`);
    if (sectorId) console.log(`      📍 Secteur ID: ${sectorId}, Rayon ID: ${departmentId}`);

    return true;
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 SETUP COMPTES DE TEST OPTINES\n');
  console.log('=' .repeat(60));

  try {
    // Vérifier les secteurs et rayons existants
    const { data: sectors } = await supabase
      .from('sectors')
      .select('id, name')
      .order('id');

    const { data: departments } = await supabase
      .from('departments')
      .select('id, name, sector_id')
      .order('id');

    console.log(`\n📊 Secteurs disponibles: ${sectors?.length || 0}`);
    console.log(`📊 Rayons disponibles: ${departments?.length || 0}\n`);

    // 1. Créer le directeur
    console.log('\n1️⃣  CRÉATION DIRECTEUR');
    console.log('-'.repeat(60));
    await createUserAndEmployee(accounts.director);

    // 2. Créer le manager
    console.log('\n2️⃣  CRÉATION MANAGER');
    console.log('-'.repeat(60));
    await createUserAndEmployee(
      accounts.manager,
      accounts.manager.sectorId,
      null
    );

    // 3. Créer les employés
    console.log('\n3️⃣  CRÉATION EMPLOYÉS (10 personnes sur 5 secteurs)');
    console.log('-'.repeat(60));

    for (const emp of accounts.employees) {
      await createUserAndEmployee(
        { ...emp, position: 'employee' },
        emp.sectorId,
        emp.departmentId
      );
      await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai entre chaque création
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SETUP TERMINÉ!\n');
    console.log('📋 COMPTES CRÉÉS:\n');
    console.log('🎯 DIRECTEUR:');
    console.log(`   Email: ${accounts.director.email}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Accès: Dashboard global par secteur\n`);

    console.log('👔 MANAGER:');
    console.log(`   Email: ${accounts.manager.email}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Secteur: Frais`);
    console.log(`   Accès: Dashboard de son équipe uniquement\n`);

    console.log('👷 EMPLOYÉS (10):');
    accounts.employees.forEach((emp, index) => {
      const sector = sectors?.find(s => s.id === emp.sectorId);
      const department = departments?.find(d => d.id === emp.departmentId);
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`      Email: ${emp.email}`);
      console.log(`      Password: ${TEST_PASSWORD}`);
      console.log(`      Secteur: ${sector?.name || emp.sectorId}, Rayon: ${department?.name || emp.departmentId}\n`);
    });

    console.log('\n📱 POUR TESTER:');
    console.log('   1. Connectez-vous avec directeur@optines.test');
    console.log('   2. Allez sur "Vue par Secteur" depuis le home');
    console.log('   3. Cliquez sur un secteur pour voir les employés');
    console.log('   4. Cliquez sur "Assigner" pour créer une tâche');
    console.log('   5. Testez le mode Auto et Manuel\n');

    console.log('🔄 HORAIRES:');
    console.log('   Tous les employés ont un horaire 08:00-17:00 pour aujourd\'hui');
    console.log('   Ils sont marqués comme présents\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
