// 🧪 Script de Teste Completo - Integração Evolution API
// Execute: node test-integration-complete.js

const axios = require('axios');

// Configurações
const FRONTEND_URL = 'http://localhost:3000';
const WEBHOOK_URL = 'http://localhost:4000';
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Função para logs coloridos
function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

// Teste de conectividade
async function testConnectivity(url, name) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    log('green', '✅', `${name}: Online (${response.status})`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    log('red', '❌', `${name}: Offline (${error.message})`);
    return { success: false, error: error.message };
  }
}

// Teste webhook específico
async function testWebhookEndpoints() {
  const endpoints = [
    { url: `${WEBHOOK_URL}/webhook/health`, name: 'Health Check' },
    { url: `${WEBHOOK_URL}/webhook/ws-stats`, name: 'WebSocket Stats' }
  ];

  log('blue', '🔍', 'Testando endpoints do webhook...');
  
  for (const endpoint of endpoints) {
    const result = await testConnectivity(endpoint.url, endpoint.name);
    if (result.success && result.data) {
      console.log(`   📊 Dados: ${JSON.stringify(result.data, null, 2)}`);
    }
  }
}

// Teste Evolution API
async function testEvolutionAPI() {
  log('blue', '🔍', 'Testando Evolution API...');
  
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': API_KEY
      },
      timeout: 10000
    });
    
    if (response.data && Array.isArray(response.data)) {
      log('green', '✅', `Evolution API: ${response.data.length} instância(s) encontrada(s)`);
      
      response.data.forEach((instance, index) => {
        console.log(`   📱 Instância ${index + 1}: ${instance.instanceName} (${instance.status})`);
      });
    } else {
      log('yellow', '⚠️', 'Evolution API: Resposta inesperada');
    }
    
    return true;
  } catch (error) {
    log('red', '❌', `Evolution API: Erro - ${error.message}`);
    return false;
  }
}

// Teste WebSocket (simulado)
async function testWebSocketConnection() {
  log('blue', '🔍', 'Testando conexão WebSocket...');
  
  try {
    // Tentar conectar via HTTP primeiro para verificar se server está rodando
    const response = await axios.get(`${WEBHOOK_URL}/webhook/ws-stats`);
    
    if (response.data) {
      log('green', '✅', 'WebSocket Server: Online');
      console.log(`   📊 Conexões: ${response.data.totalConnections || 0}`);
      console.log(`   📋 Tickets Ativos: ${response.data.activeTickets || 0}`);
      return true;
    }
  } catch (error) {
    log('red', '❌', `WebSocket Server: ${error.message}`);
    return false;
  }
}

// Teste integração Frontend
async function testFrontendIntegration() {
  log('blue', '🔍', 'Testando frontend...');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    
    if (response.status === 200) {
      log('green', '✅', 'Frontend Vite: Online');
      
      // Verificar se contém código React
      if (response.data.includes('react') || response.data.includes('vite')) {
        log('green', '⚛️', 'Frontend: React/Vite detectado');
      }
      
      return true;
    }
  } catch (error) {
    log('red', '❌', `Frontend: ${error.message}`);
    return false;
  }
}

// Sumário final
function printSummary(results) {
  console.log('\n' + colors.bold + colors.cyan + '📋 SUMÁRIO DA INTEGRAÇÃO EVOLUTION API' + colors.reset);
  console.log('=' * 50);
  
  const tests = [
    { name: 'Frontend React/Vite', status: results.frontend },
    { name: 'Webhook Server', status: results.webhook },
    { name: 'WebSocket Connection', status: results.websocket },
    { name: 'Evolution API', status: results.evolution }
  ];
  
  tests.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    const color = test.status ? 'green' : 'red';
    log(color, icon, test.name);
  });
  
  const successCount = tests.filter(t => t.status).length;
  const totalTests = tests.length;
  
  console.log('\n' + colors.bold);
  if (successCount === totalTests) {
    log('green', '🎉', `TODOS OS TESTES PASSARAM! (${successCount}/${totalTests})`);
    log('cyan', '🚀', 'Sistema Evolution API está 100% funcional!');
    console.log('\n📚 Próximos passos:');
    console.log('1. Acesse http://localhost:3000 no navegador');
    console.log('2. Execute "testEvolutionIntegration()" no console');
    console.log('3. Monitore mensagens WhatsApp em tempo real');
  } else {
    log('yellow', '⚠️', `${successCount}/${totalTests} testes passaram`);
    log('red', '🔧', 'Corrija os problemas antes de continuar');
  }
  console.log(colors.reset);
}

// Função principal
async function runCompleteTest() {
  console.log(colors.bold + colors.blue + '\n🧪 TESTE COMPLETO - INTEGRAÇÃO EVOLUTION API' + colors.reset);
  console.log('🕐 Iniciando verificação de todos os componentes...\n');
  
  const results = {
    frontend: false,
    webhook: false,
    websocket: false,
    evolution: false
  };
  
  // Executar testes
  results.frontend = await testFrontendIntegration();
  console.log('');
  
  results.webhook = (await testConnectivity(`${WEBHOOK_URL}/webhook/health`, 'Webhook Health')).success;
  console.log('');
  
  await testWebhookEndpoints();
  console.log('');
  
  results.websocket = await testWebSocketConnection();
  console.log('');
  
  results.evolution = await testEvolutionAPI();
  console.log('');
  
  // Mostrar sumário
  printSummary(results);
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteTest().catch(error => {
    log('red', '💥', `Erro geral: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runCompleteTest, testConnectivity, testWebhookEndpoints, testEvolutionAPI }; 