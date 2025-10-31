const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const STORE_ID = 1;
const TEST_PASSWORD = 'Test1234!';

const accounts = [
  { email: 'directeur@optines.test', firstName: 'Jean', lastName: 'Dupont', position: 'directeur', sectorId: null, departmentId: null },
  { email: 'manager@optines.test', firstName: 'Marie', lastName: 'Martin', position: 'manager', sectorId: 1, departmentId: null },
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

async function createAccount(account) {
  try {
    console.log(`\n📝 ${account.firstName} ${account.lastName}...`);

    // 1. Créer l'utilisateur Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: account.firstName,
        last_name: account.lastName
      }
    });

    let userId;
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   ⚠️  Auth existe, récupération...`);
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users.find(u => u.email === account.email);
        if (existing) {
          userId = existing.id;
        } else {
          console.log(`   ❌ Utilisateur introuvable`);
          return false;
        }
      } else {
        console.log(`   ❌ Auth: ${authError.message}`);
        return false;
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Créer dans users SI directeur ou manager
    let linkedUserId = null;
    if (account.position === 'directeur' || account.position === 'manager') {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: account.email,
          password: TEST_PASSWORD,
          role: account.position === 'directeur' ? 'director' : 'manager'
        }, {
          onConflict: 'id'
        });

      if (userError) {
        console.log(`   ⚠️  Users: ${userError.message}`);
      } else {
        linkedUserId = userId;
      }
    }

    // 3. Vérifier si l'employé existe
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('email', account.email)
      .single();

    let empData;
    let empError;

    // Préparer les données de l'employé
    const employeeData = {
      first_name: account.firstName,
      last_name: account.lastName,
      position: account.position,
      sector_id: account.sectorId,
      department_id: account.departmentId
    };

    // Ajouter user_id seulement pour directeur/manager
    if (linkedUserId) {
      employeeData.user_id = linkedUserId;
    }

    if (existing) {
      // Update
      const result = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', existing.id)
        .select()
        .single();

      empData = result.data;
      empError = result.error;
    } else {
      // Insert
      const insertData = {
        ...employeeData,
        store_id: STORE_ID,
        email: account.email
      };

      const result = await supabase
        .from('employees')
        .insert(insertData)
        .select()
        .single();

      empData = result.data;
      empError = result.error;
    }

    if (empError || !empData) {
      console.log(`   ❌ Employee: ${empError?.message || 'Aucune donnée retournée'}`);
      return false;
    }

    // 4. Créer horaire
    const today = new Date().toISOString().split('T')[0];
    const { error: schedError } = await supabase
      .from('employee_schedules')
      .upsert({
        employee_id: empData.id,
        store_id: STORE_ID,
        work_date: today,
        work_start: '08:00',
        work_end: '17:00',
        is_present: true
      }, {
        onConflict: 'employee_id,work_date'
      });

    if (schedError) {
      console.log(`   ⚠️  Horaire: ${schedError.message}`);
    }

    console.log(`   ✅ ${account.email} | ${TEST_PASSWORD}`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 SETUP COMPTES DE TEST OPTINES\n');
  console.log('='.repeat(60));

  let created = 0;
  let failed = 0;

  for (const account of accounts) {
    const success = await createAccount(account);
    if (success) created++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ SETUP TERMINÉ: ${created} créés, ${failed} échecs\n`);
  console.log('📋 CONNEXIONS:\n');
  console.log('🎯 DIRECTEUR: directeur@optines.test | Test1234!');
  console.log('👔 MANAGER: manager@optines.test | Test1234!');
  console.log('👷 EMPLOYÉS: isabelle.fromage@optines.test (+ 9 autres) | Test1234!\n');
  console.log('📱 Lancez `node deployment/check-test-users.js` pour vérifier\n');
}

main().catch(console.error);
