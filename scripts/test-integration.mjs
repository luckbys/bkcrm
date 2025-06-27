import axios from 'axios';

// 🔧 CONFIGURAÇÕES
const LOCALHOST = 'http://localhost:4000';
const PRODUCTION = 'https://bkcrm.devsible.com.br';
const EVOLUTION_API = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_KEY = '429683C4C977415CAAFCCE10F7D57E11';

console.log('🚀 INICIANDO ANÁLISE COMPLETA DA INTEGRAÇÃO...\n');

// Teste 1: Webhook Local
console.log('🔍 Testando Webhook Local...');
try {
  const response = await axios.get(`${LOCALHOST}/webhook/health`, { timeout: 5000 });
  console.log('✅ Webhook LOCAL funcionando:', response.data);
} catch (error) {
  console.log('❌ Webhook LOCAL não está rodando:', error.message);
}

// Teste 2: Webhook Produção
console.log('\n🔍 Testando Webhook Produção...');
try {
  const response = await axios.get(`${PRODUCTION}/webhook/health`, { timeout: 10000 });
  console.log('✅ Webhook PRODUÇÃO funcionando:', response.data);
} catch (error) {
  console.log('❌ Webhook PRODUÇÃO não está acessível:', error.message);
}

// Teste 3: Evolution API
console.log('\n🔍 Testando Evolution API...');
try {
  // Node.js pode ignorar SSL no backend
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  
  const response = await axios.get(`${EVOLUTION_API}/instance/fetchInstances`, {
    headers: { 'apikey': EVOLUTION_KEY },
    timeout: 10000
  });
  
  console.log(`✅ Evolution API conectada - ${response.data.length} instâncias`);
  response.data.forEach(instance => {
    console.log(`   📱 ${instance.instance.instanceName}: ${instance.instance.state}`);
  });
} catch (error) {
  console.log('❌ Evolution API inacessível:', error.message);
}

console.log('\n🎯 ANÁLISE CONCLUÍDA');
console.log('='*50);
console.log('Para análise completa, execute:');
console.log('1. node webhook-evolution-websocket.cjs (em outra janela)');
console.log('2. npm run dev (frontend)');
console.log('3. Abrir o chat e verificar conexão WebSocket'); 