/**
 * TEST: Versions des modèles Claude
 *
 * Script pour tester différentes versions de Claude avec votre clé API
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Liste des modèles à tester
const modelsToTest = [
  // Sonnet 3.7
  'claude-3-7-sonnet-20250219',
  'claude-sonnet-3-7-20250219',
  'claude-3.7-sonnet',

  // Sonnet 4.0
  'claude-4-0-sonnet-20250514',
  'claude-sonnet-4-0-20250514',
  'claude-4.0-sonnet',
  'claude-4-sonnet-20250514',

  // Sonnet 4.5
  'claude-4-5-sonnet-20250929',
  'claude-sonnet-4-5-20250929',
  'claude-4.5-sonnet',
  'claude-sonnet-4.5',
];

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Test du modèle: ${modelName}`);

    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Réponds juste "OK" si tu me comprends.'
        }
      ]
    });

    console.log(`✅ SUCCESS - ${modelName}`);
    console.log(`   Réponse: ${message.content[0].text}`);
    return { model: modelName, success: true, response: message.content[0].text };

  } catch (error) {
    if (error.status === 404) {
      console.log(`❌ 404 - Modèle non trouvé`);
    } else if (error.status === 401) {
      console.log(`❌ 401 - Problème d'authentification`);
    } else {
      console.log(`❌ ERREUR - ${error.message}`);
    }
    return { model: modelName, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 TEST DES VERSIONS DE MODÈLES CLAUDE');
  console.log('═'.repeat(60));

  const results = [];

  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);

    // Petit délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n📊 RÉSUMÉ DES TESTS');
  console.log('═'.repeat(60));

  const successfulModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);

  if (successfulModels.length > 0) {
    console.log(`\n✅ ${successfulModels.length} modèle(s) fonctionnel(s):`);
    successfulModels.forEach(r => {
      console.log(`   • ${r.model}`);
    });
  }

  if (failedModels.length > 0) {
    console.log(`\n❌ ${failedModels.length} modèle(s) non disponible(s):`);
    failedModels.forEach(r => {
      console.log(`   • ${r.model}`);
    });
  }

  console.log('\n');
}

runTests().catch(console.error);
