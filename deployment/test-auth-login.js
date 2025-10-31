const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  console.log(`\n🔐 Test connexion: ${email}`);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log(`   ❌ ÉCHEC: ${error.message}`);
      return false;
    }

    if (data.user) {
      console.log(`   ✅ SUCCÈS`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email confirmé: ${data.user.email_confirmed_at ? 'Oui' : 'Non'}`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ ERREUR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🧪 TEST D\'AUTHENTIFICATION SUPABASE\n');
  console.log('='.repeat(60));
  console.log(`\nURL Supabase: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  const testAccounts = [
    { email: 'directeur@optines.test', password: 'Test1234!' },
    { email: 'manager@optines.test', password: 'Test1234!' },
    { email: 'isabelle.fromage@optines.test', password: 'Test1234!' }
  ];

  let success = 0;
  let failed = 0;

  for (const account of testAccounts) {
    const result = await testLogin(account.email, account.password);
    if (result) success++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RÉSULTATS: ${success} succès, ${failed} échecs\n`);

  if (failed > 0) {
    console.log('❌ Problème détecté: Les identifiants ne fonctionnent pas!');
    console.log('\nPossibles causes:');
    console.log('1. Les comptes n\'ont pas été créés correctement');
    console.log('2. Les emails ne sont pas confirmés');
    console.log('3. Mauvaise clé Supabase dans .env');
    console.log('4. Problème de configuration Supabase Auth\n');
  } else {
    console.log('✅ Tous les comptes fonctionnent côté Supabase!\n');
  }
}

main().catch(console.error);
