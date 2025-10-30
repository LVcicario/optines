/**
 * TEST: Assistant IA Conversationnel
 *
 * Script pour tester l'intégration Claude API
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';

// Données de test (directeur thomas, store 1)
const TEST_USER_ID = '1'; // ID du directeur thomas
const TEST_STORE_ID = 1;

async function testAIChat() {
  console.log('🤖 TEST ASSISTANT IA\n');
  console.log('━'.repeat(50));

  // Test 1: Message simple
  console.log('\n📝 Test 1: Message de salutation');
  await sendMessage('Bonjour!');

  // Test 2: Question sur les tâches
  console.log('\n📝 Test 2: Question sur les tâches du jour');
  await sendMessage('Quelles sont les tâches du jour?');

  // Test 3: Stats équipe
  console.log('\n📝 Test 3: Demander les stats');
  await sendMessage('Comment va l\'équipe aujourd\'hui?');

  // Test 4: Créer une tâche (fonction complète)
  console.log('\n📝 Test 4: Créer une tâche');
  await sendMessage('Crée une tâche pour MLKH demain matin 9h-11h, réappro fruits, 50 colis, équipe de 3');

  console.log('\n━'.repeat(50));
  console.log('✅ TESTS TERMINÉS\n');
}

async function sendMessage(message) {
  try {
    console.log(`\n👤 VOUS: ${message}`);
    console.log('⏳ L\'IA réfléchit...');

    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        user_id: TEST_USER_ID,
        store_id: TEST_STORE_ID
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ ERREUR:', data.error);
      return;
    }

    console.log(`\n🤖 IA: ${data.response}`);

    if (data.actions && data.actions.length > 0) {
      console.log('\n📊 ACTIONS EXÉCUTÉES:');
      data.actions.forEach((action, idx) => {
        console.log(`   ${idx + 1}. ${action.success ? '✅' : '❌'} ${JSON.stringify(action, null, 2)}`);
      });
    }

    console.log(`\n⏱️  Timestamp: ${data.timestamp}`);

  } catch (error) {
    console.error('❌ ERREUR RÉSEAU:', error.message);
  }
}

// Lancer les tests
testAIChat().catch(console.error);
