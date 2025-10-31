require('dotenv').config();

console.log('\n🔍 VÉRIFICATION CONFIGURATION ENVIRONNEMENT\n');
console.log('='.repeat(60));

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'PORT'
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];

  if (!value) {
    console.log(`❌ ${varName}: MANQUANT`);
    allValid = false;
  } else if (value.includes('your_') || value.includes('here')) {
    console.log(`⚠️  ${varName}: NON CONFIGURÉ (valeur par défaut)`);
    allValid = false;
  } else {
    // Masquer les clés sensibles
    let displayValue = value;
    if (varName.includes('KEY') || varName.includes('ANON')) {
      displayValue = value.substring(0, 20) + '...' + value.substring(value.length - 10);
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(60));

if (allValid) {
  console.log('\n✅ Toutes les variables sont correctement configurées!\n');
  process.exit(0);
} else {
  console.log('\n❌ Certaines variables nécessitent votre attention!\n');
  console.log('💡 Consultez .env.example pour les instructions de configuration\n');
  process.exit(1);
}
