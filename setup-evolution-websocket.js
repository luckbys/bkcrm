// 🚀 SETUP AUTOMÁTICO - EVOLUTION API WEBSOCKET + BKCRM
// Script para configurar automaticamente a integração WebSocket

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const readline = require('readline');

// Configurações
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';
const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';

console.log('🚀 SETUP AUTOMÁTICO - EVOLUTION API WEBSOCKET + BKCRM\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// === 1. VERIFICAR API KEY ===
async function verifyApiKey(apiKey) {
  console.log('🔍 Verificando API Key da Evolution API...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: { 'apikey': apiKey }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Key válida! Instância: ${data.state}`);
      return { valid: true, state: data.state };
    } else {
      console.log('❌ API Key inválida ou instância não encontrada');
      return { valid: false };
    }
  } catch (error) {
    console.log('❌ Erro ao verificar API Key:', error.message);
    return { valid: false, error: error.message };
  }
}

// === 2. CONFIGURAR WEBHOOK ===
async function setupWebhook(apiKey) {
  console.log('\n🔗 Configurando webhook da Evolution API...');
  
  const webhookConfig = {
    url: WEBHOOK_URL,
    webhook_by_events: false,
    webhook_base64: false,
    events: [
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED', 
      'CONNECTION_UPDATE',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'SEND_MESSAGE'
    ]
  };
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(webhookConfig)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook configurado com sucesso!');
      console.log(`   - URL: ${webhookConfig.url}`);
      console.log(`   - Eventos: ${webhookConfig.events.length} configurados`);
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao configurar webhook:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao configurar webhook:', error.message);
    return false;
  }
}

// === 3. VERIFICAR WEBSOCKET ===
async function checkWebSocketStatus() {
  console.log('\n📡 Verificando status do WebSocket...');
  
  try {
    const response = await fetch('http://localhost:4000/webhook/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ WebSocket BKCRM funcionando!');
      console.log(`   - Conexões ativas: ${data.websocket?.connections || 0}`);
      console.log(`   - Evolution conectado: ${data.evolution?.connected ? 'SIM' : 'NÃO'}`);
      return true;
    } else {
      console.log('❌ WebSocket BKCRM não está respondendo');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar WebSocket BKCRM:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando na porta 4000');
    return false;
  }
}

// === 4. TESTAR ENVIO ===
async function testSendMessage(apiKey) {
  console.log('\n📤 Testando envio de mensagem...');
  
  const testPhone = await askQuestion('Digite um número de WhatsApp para teste (ex: 5511999999999): ');
  
  if (!testPhone.trim()) {
    console.log('⚠️  Pulando teste de envio (número não fornecido)');
    return false;
  }
  
  try {
    const testMessage = `🧪 Teste de configuração Evolution API - ${new Date().toLocaleString()}`;
    
    const response = await fetch('http://localhost:4000/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: testPhone,
        text: testMessage,
        instance: INSTANCE_NAME
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log(`   - Message ID: ${data.messageId}`);
      return true;
    } else {
      console.log('❌ Erro ao enviar mensagem:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar envio:', error.message);
    return false;
  }
}

// === 5. GERAR RELATÓRIO ===
function generateReport(results) {
  console.log('\n📊 RELATÓRIO DE CONFIGURAÇÃO:');
  console.log('═══════════════════════════════════════');
  
  const checks = [
    { name: 'API Key Evolution', status: results.apiKey },
    { name: 'Webhook configurado', status: results.webhook },
    { name: 'WebSocket BKCRM', status: results.websocket },
    { name: 'Teste de envio', status: results.sendTest }
  ];
  
  checks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}: ${check.status ? 'OK' : 'FALHOU'}`);
  });
  
  const passedChecks = checks.filter(c => c.status).length;
  const totalChecks = checks.length;
  
  console.log('═══════════════════════════════════════');
  console.log(`🎯 RESULTADO: ${passedChecks}/${totalChecks} verificações passaram`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 CONFIGURAÇÃO COMPLETA E FUNCIONAL!');
    console.log('💡 O sistema está pronto para usar WhatsApp em tempo real');
  } else if (passedChecks >= 2) {
    console.log('⚠️  CONFIGURAÇÃO PARCIALMENTE FUNCIONAL');
    console.log('💡 Alguns ajustes podem ser necessários');
  } else {
    console.log('🚨 CONFIGURAÇÃO COM PROBLEMAS');
    console.log('💡 Verifique os erros acima e tente novamente');
  }
  
  console.log('\n🔄 PRÓXIMOS PASSOS:');
  if (!results.apiKey) {
    console.log('   1. Verificar API Key da Evolution API');
  }
  if (!results.webhook) {
    console.log('   2. Configurar webhook manualmente no painel Evolution API');
  }
  if (!results.websocket) {
    console.log('   3. Iniciar o servidor WebSocket BKCRM (porta 4000)');
  }
  if (!results.sendTest) {
    console.log('   4. Conectar instância WhatsApp no painel Evolution API');
  }
  
  console.log('\n🔗 COMANDOS ÚTEIS:');
  console.log('   # Iniciar servidor WebSocket BKCRM:');
  console.log('   cd backend/webhooks && node webhook-evolution-websocket.js');
  console.log('');
  console.log('   # Testar sistema completo:');
  console.log('   node test-evolution-websocket.js');
  console.log('');
  console.log('   # Painel Evolution API:');
  console.log(`   ${EVOLUTION_API_URL}`);
}

// === EXECUTAR SETUP COMPLETO ===
async function runSetup() {
  console.log('🚀 Iniciando configuração automática...\n');
  
  // Solicitar API Key
  const apiKey = await askQuestion('Digite sua API Key da Evolution API: ');
  
  if (!apiKey.trim()) {
    console.log('❌ API Key é obrigatória para continuar');
    rl.close();
    return;
  }
  
  const results = {
    apiKey: false,
    webhook: false,
    websocket: false,
    sendTest: false
  };
  
  // Executar verificações
  const apiKeyResult = await verifyApiKey(apiKey);
  results.apiKey = apiKeyResult.valid;
  
  if (results.apiKey) {
    results.webhook = await setupWebhook(apiKey);
    results.websocket = await checkWebSocketStatus();
    
    if (results.websocket) {
      const wantToTest = await askQuestion('\nDeseja testar o envio de mensagem? (s/n): ');
      if (wantToTest.toLowerCase() === 's') {
        results.sendTest = await testSendMessage(apiKey);
      } else {
        results.sendTest = null; // Não testado
      }
    }
  }
  
  generateReport(results);
  
  console.log('\n✅ Setup finalizado!');
  rl.close();
}

// Executar setup
runSetup().catch(error => {
  console.error('❌ Erro durante o setup:', error);
  rl.close();
  process.exit(1);
}); 