// 🧪 TESTE COMPLETO - EVOLUTION WEBSOCKET + BKCRM
// Script para testar a integração completa do sistema

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { io } = require('socket.io-client');

const BKCRM_URL = 'http://localhost:4000';
const TEST_PHONE = '5511999999999';
const TEST_TICKET_ID = '10972431-3da5-4717-8c5f-8c29ac49c189';

console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA...\n');

// === 1. TESTE HEALTH CHECK ===
async function testHealthCheck() {
  console.log('🏥 1. TESTANDO HEALTH CHECK...');
  
  try {
    const response = await fetch(`${BKCRM_URL}/webhook/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health Check: OK');
      console.log(`   - WebSocket: ${data.websocket?.enabled ? 'ATIVO' : 'INATIVO'}`);
      console.log(`   - Conexões: ${data.websocket?.connections || 0}`);
      console.log(`   - Evolution: ${data.evolution?.connected ? 'CONECTADO' : 'DESCONECTADO'}`);
      console.log(`   - Instância: ${data.evolution?.instance}`);
      return true;
    } else {
      console.log('❌ Health Check: FALHOU');
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check: ERRO DE CONEXÃO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 2. TESTE WEBSOCKET BKCRM ===
async function testWebSocketBKCRM() {
  console.log('\n🔗 2. TESTANDO WEBSOCKET BKCRM...');
  
  return new Promise((resolve) => {
    const socket = io(BKCRM_URL);
    let connected = false;
    let messagesReceived = 0;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('❌ WebSocket BKCRM: TIMEOUT');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
    
    socket.on('connect', () => {
      console.log('✅ WebSocket BKCRM: CONECTADO');
      connected = true;
      clearTimeout(timeout);
      
      // Entrar em um ticket
      socket.emit('join-ticket', {
        ticketId: TEST_TICKET_ID,
        userId: 'test-user'
      });
      
      console.log(`   - Entrando no ticket: ${TEST_TICKET_ID}`);
    });
    
    socket.on('messages-loaded', (messages) => {
      console.log(`✅ Mensagens carregadas: ${messages.length}`);
      messagesReceived = messages.length;
      
      // Enviar mensagem de teste
      socket.emit('send-message', {
        ticketId: TEST_TICKET_ID,
        content: `🧪 Teste WebSocket - ${new Date().toLocaleString()}`,
        isInternal: true,
        userId: 'test-user',
        senderName: 'Teste Automatizado'
      });
      
      console.log('   - Mensagem de teste enviada');
    });
    
    socket.on('new-message', (message) => {
      console.log('✅ Nova mensagem recebida via WebSocket:');
      console.log(`   - ID: ${message.id}`);
      console.log(`   - Conteúdo: ${message.content.substring(0, 50)}...`);
      console.log(`   - Remetente: ${message.senderName}`);
      console.log(`   - Interna: ${message.isInternal}`);
      
      // Desconectar após receber mensagem
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 1000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket BKCRM: ERRO DE CONEXÃO');
      console.log(`   - Erro: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 WebSocket BKCRM: DESCONECTADO');
    });
  });
}

// === 3. TESTE ENVIO EVOLUTION API ===
async function testEvolutionSend() {
  console.log('\n📤 3. TESTANDO ENVIO VIA EVOLUTION API...');
  
  try {
    const testMessage = `🧪 Teste Evolution API - ${new Date().toLocaleString()}`;
    
    const response = await fetch(`${BKCRM_URL}/webhook/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
        text: testMessage,
        instance: 'atendimento-ao-cliente-suporte',
        options: {
          delay: 1000,
          presence: 'composing'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Envio Evolution API: SUCESSO');
      console.log(`   - Message ID: ${data.messageId}`);
      console.log(`   - Status: ${data.status}`);
      return true;
    } else {
      console.log('❌ Envio Evolution API: FALHOU');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Erro: ${data.error}`);
      
      if (data.details) {
        console.log('   - Detalhes:');
        console.log(`     * Evolution Status: ${data.evolutionStatus}`);
        if (data.details.response?.message) {
          console.log(`     * Mensagem: ${JSON.stringify(data.details.response.message)}`);
        }
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Envio Evolution API: ERRO INTERNO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 4. TESTE WEBHOOK EVOLUTION ===
async function testEvolutionWebhook() {
  console.log('\n📥 4. TESTANDO WEBHOOK EVOLUTION...');
  
  try {
    // Simular mensagem recebida da Evolution API
    const mockPayload = {
      event: 'messages.upsert',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: 'test-message-' + Date.now(),
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: `🧪 Teste webhook - ${new Date().toLocaleString()}`
        },
        messageTimestamp: Date.now(),
        pushName: 'Teste Cliente'
      }
    };
    
    const response = await fetch(`${BKCRM_URL}/webhook/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Webhook Evolution: SUCESSO');
      console.log(`   - Customer ID: ${data.customerId}`);
      console.log(`   - Ticket ID: ${data.ticketId}`);
      console.log(`   - Message ID: ${data.messageId}`);
      return true;
    } else {
      console.log('❌ Webhook Evolution: FALHOU');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Erro: ${data.error || data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook Evolution: ERRO INTERNO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 5. RELATÓRIO FINAL ===
async function generateReport(results) {
  console.log('\n📊 RELATÓRIO FINAL DO TESTE:');
  console.log('═══════════════════════════════════════');
  
  const tests = [
    { name: 'Health Check', result: results.healthCheck },
    { name: 'WebSocket BKCRM', result: results.websocket },
    { name: 'Envio Evolution API', result: results.evolutionSend },
    { name: 'Webhook Evolution', result: results.evolutionWebhook }
  ];
  
  tests.forEach(test => {
    console.log(`${test.result ? '✅' : '❌'} ${test.name}: ${test.result ? 'PASSOU' : 'FALHOU'}`);
  });
  
  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log('═══════════════════════════════════════');
  console.log(`🎯 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 SISTEMA TOTALMENTE FUNCIONAL!');
    console.log('💡 O WhatsApp está pronto para uso com WebSocket em tempo real');
  } else if (passedTests >= 2) {
    console.log('⚠️  SISTEMA PARCIALMENTE FUNCIONAL');
    console.log('💡 Alguns componentes precisam de ajuste');
  } else {
    console.log('🚨 SISTEMA COM PROBLEMAS CRÍTICOS');
    console.log('💡 Correções necessárias antes do uso');
  }
  
  // Recomendações
  console.log('\n💡 PRÓXIMOS PASSOS:');
  if (!results.healthCheck) {
    console.log('   1. Verificar se o servidor está rodando na porta 4000');
  }
  if (!results.websocket) {
    console.log('   2. Verificar configuração do WebSocket BKCRM');
  }
  if (!results.evolutionSend) {
    console.log('   3. Verificar API Key e URL da Evolution API');
    console.log('   4. Conectar instância WhatsApp na Evolution API');
  }
  if (!results.evolutionWebhook) {
    console.log('   5. Verificar configuração do banco Supabase');
  }
  
  console.log('\n🔗 LINKS ÚTEIS:');
  console.log(`   - Sistema BKCRM: http://localhost:3000`);
  console.log(`   - Health Check: ${BKCRM_URL}/webhook/health`);
  console.log(`   - Evolution API: ${process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host'}`);
}

// === EXECUTAR TODOS OS TESTES ===
async function runAllTests() {
  console.log('🚀 EXECUTANDO BATERIA COMPLETA DE TESTES...\n');
  
  const results = {
    healthCheck: false,
    websocket: false,
    evolutionSend: false,
    evolutionWebhook: false
  };
  
  // Executar testes em sequência
  results.healthCheck = await testHealthCheck();
  
  if (results.healthCheck) {
    results.websocket = await testWebSocketBKCRM();
    results.evolutionSend = await testEvolutionSend();
    results.evolutionWebhook = await testEvolutionWebhook();
  } else {
    console.log('⚠️  Pulando outros testes devido à falha no Health Check');
  }
  
  await generateReport(results);
  
  console.log('\n✅ Teste completo finalizado!');
  process.exit(0);
}

// Executar testes
runAllTests().catch(error => {
  console.error('❌ Erro durante os testes:', error);
  process.exit(1);
}); 