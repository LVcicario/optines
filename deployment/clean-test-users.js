const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanTestUsers() {
  console.log('\n🧹 NETTOYAGE DES COMPTES DE TEST\n');
  console.log('='.repeat(60));

  try {
    // Emails des comptes de test
    const testEmails = [
      'directeur@optines.test',
      'manager@optines.test',
      'isabelle.fromage@optines.test',
      'lucas.yaourt@optines.test',
      'sophie.chocolat@optines.test',
      'thomas.biscuit@optines.test',
      'julie.conserve@optines.test',
      'marc.pates@optines.test',
      'claire.eau@optines.test',
      'pierre.jus@optines.test',
      'laura.cosmetique@optines.test',
      'nicolas.parfum@optines.test'
    ];

    for (const email of testEmails) {
      console.log(`\n🗑️  Suppression de ${email}...`);

      let userIdToClean = null;

      // 1. Récupérer l'employé
      const { data: employees } = await supabase
        .from('employees')
        .select('id, user_id')
        .eq('email', email);

      if (employees && employees.length > 0) {
        for (const emp of employees) {
          userIdToClean = emp.user_id;
          // Supprimer les horaires
          const { error: schedError } = await supabase
            .from('employee_schedules')
            .delete()
            .eq('employee_id', emp.id);

          if (schedError) console.log(`   ⚠️  Horaires: ${schedError.message}`);

          // Supprimer les tâches
          const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('employee_id', emp.id);

          if (tasksError) console.log(`   ⚠️  Tâches: ${tasksError.message}`);

          // Supprimer l'employé
          const { error: empError } = await supabase
            .from('employees')
            .delete()
            .eq('id', emp.id);

          if (empError) console.log(`   ⚠️  Employé: ${empError.message}`);

          // Supprimer l'utilisateur de la table users
          if (emp.user_id) {
            const { error: userError } = await supabase
              .from('users')
              .delete()
              .eq('id', emp.user_id);

            if (userError) console.log(`   ⚠️  Users: ${userError.message}`);

            // Supprimer de Supabase Auth
            try {
              const { error: authError } = await supabase.auth.admin.deleteUser(emp.user_id);
              if (authError) console.log(`   ⚠️  Auth: ${authError.message}`);
            } catch (e) {
              console.log(`   ⚠️  Auth: ${e.message}`);
            }
          }
        }
        console.log(`   ✅ ${email} supprimé`);
      } else {
        // Pas d'employé trouvé, vérifier users table directement (entrées orphelines)
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('email', email);

        if (users && users.length > 0) {
          console.log(`   ⚠️  Entrée orpheline dans users, nettoyage...`);
          for (const user of users) {
            userIdToClean = user.id;

            // Supprimer de la table users
            const { error: userError } = await supabase
              .from('users')
              .delete()
              .eq('id', user.id);

            if (userError) console.log(`   ⚠️  Users: ${userError.message}`);
          }
        }

        // Nettoyer Auth si user_id trouvé
        if (userIdToClean) {
          try {
            const { error: authError } = await supabase.auth.admin.deleteUser(userIdToClean);
            if (authError) console.log(`   ⚠️  Auth: ${authError.message}`);
            else console.log(`   ✅ ${email} supprimé`);
          } catch (e) {
            console.log(`   ⚠️  Auth: ${e.message}`);
          }
        } else {
          console.log(`   ⏭️  ${email} n'existe pas`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ NETTOYAGE TERMINÉ!\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
  }
}

cleanTestUsers();
