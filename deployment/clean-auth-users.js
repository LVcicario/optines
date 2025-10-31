const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

async function cleanAuthUsers() {
  console.log('\n🧹 NETTOYAGE COMPLET DES UTILISATEURS AUTH\n');
  console.log('='.repeat(60));

  try {
    // Lister tous les utilisateurs
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) throw listError;

    console.log(`\n📊 Total utilisateurs Auth: ${users.length}\n`);

    let deleted = 0;
    for (const user of users) {
      if (testEmails.includes(user.email)) {
        console.log(`🗑️  Suppression ${user.email}...`);

        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          console.log(`   ❌ ${error.message}`);
        } else {
          console.log(`   ✅ Supprimé`);
          deleted++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ NETTOYAGE TERMINÉ: ${deleted} utilisateurs supprimés\n`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  }
}

cleanAuthUsers();
