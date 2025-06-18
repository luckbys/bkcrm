// Importar fetch de forma compatível
let fetch;
try {
  // Tentar usar fetch nativo (Node 18+)
  fetch = globalThis.fetch;
} catch (e) {
  // Fallback para node-fetch
  try {
    fetch = require('node-fetch');
  } catch (e2) {
    // Último fallback - dynamic import
    const { default: fetchModule } = await import('node-fetch');
    fetch = fetchModule;
  }
}

// Se ainda não temos fetch, usar método alternativo
if (!fetch) {
  const https = require('https');
  const http = require('http');
  
  // Implementação simples de fetch para testes
  fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const req = protocol.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

// Configurações
const WEBHOOK_URL = 'http://localhost:4000/webhook';

// Teste 1: Health Check
async function testHealthCheck() {
  console.log('🏥 Testando Health Check...');
  try {
    const response = await fetch(`${WEBHOOK_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro no Health Check:', error.message);
    return false;
  }
}

// Teste 2: Mensagem de Texto
async function testTextMessage() {
  console.log('\n📱 Testando Mensagem de Texto...');
  
  const payload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999887766@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_MESSAGE_001'
      },
      pushName: 'João da Silva',
      status: 'SERVER_ACK',
      message: {
        conversation: 'Olá! Preciso de ajuda com meu pedido.'
      },
      messageType: 'conversation',
      messageTimestamp: Math.floor(Date.now() / 1000),
      instanceId: 'test-instance-123',
      source: 'android'
    }
  };

  try {
    const response = await fetch(`${WEBHOOK_URL}/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Resposta da Mensagem de Texto:', data);
    return data.processed;
  } catch (error) {
    console.error('❌ Erro na Mensagem de Texto:', error.message);
    return false;
  }
}

// Teste 3: Mensagem do Cliente Real (baseada nos logs)
async function testRealMessage() {
  console.log('\n📱 Testando Mensagem Real (baseada nos logs)...');
  
  const payload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5512981022013@s.whatsapp.net',
        fromMe: true,
        id: '3EB0E0D9A910DBC99496B5'
      },
      pushName: 'Lucas Borges',
      status: 'SERVER_ACK',
      message: {
        conversation: 'mnnkjjnjj'
      },
      messageType: 'conversation',
      messageTimestamp: 1750287815,
      instanceId: 'ad22f1f9-3b0d-4a4e-8f16-db1ed86d2eab',
      source: 'web'
    }
  };

  try {
    const response = await fetch(`${WEBHOOK_URL}/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Resposta da Mensagem Real:', data);
    return data.processed;
  } catch (error) {
    console.error('❌ Erro na Mensagem Real:', error.message);
    return false;
  }
}

// Teste 4: Evento Não Processado
async function testNonProcessedEvent() {
  console.log('\n📱 Testando Evento Não Processado...');
  
  const payload = {
    event: 'contacts.update',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      remoteJid: '5511999887766@s.whatsapp.net',
      pushName: 'João da Silva',
      profilePicUrl: 'https://example.com/pic.jpg',
      instanceId: 'test-instance-123'
    }
  };

  try {
    const response = await fetch(`${WEBHOOK_URL}/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('ℹ️ Resposta do Evento Não Processado:', data);
    return !data.processed; // Esperamos que NÃO seja processado
  } catch (error) {
    console.error('❌ Erro no Evento Não Processado:', error.message);
    return false;
  }
}

// Teste 5: Endpoint Genérico
async function testGenericEndpoint() {
  console.log('\n📱 Testando Endpoint Genérico...');
  
  const payload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511888776655@s.whatsapp.net',
        fromMe: false,
        id: 'GENERIC_TEST_001'
      },
      pushName: 'Maria Santos',
      message: {
        conversation: 'Teste do endpoint genérico'
      },
      messageType: 'conversation',
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await fetch(`${WEBHOOK_URL}/messages-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Resposta do Endpoint Genérico:', data);
    return data.processed;
  } catch (error) {
    console.error('❌ Erro no Endpoint Genérico:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando Testes do Webhook Evolution API\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    textMessage: await testTextMessage(),
    realMessage: await testRealMessage(),
    nonProcessedEvent: await testNonProcessedEvent(),
    genericEndpoint: await testGenericEndpoint()
  };

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('========================');
  console.log(`🏥 Health Check: ${results.healthCheck ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Mensagem de Texto: ${results.textMessage ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Mensagem Real: ${results.realMessage ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Evento Não Processado: ${results.nonProcessedEvent ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Endpoint Genérico: ${results.genericEndpoint ? '✅ PASSOU' : '❌ FALHOU'}`);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n🎯 RESULTADO FINAL: ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Webhook está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testTextMessage,
  testRealMessage,
  testNonProcessedEvent,
  testGenericEndpoint,
  runAllTests
}; 