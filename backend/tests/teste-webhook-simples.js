const http = require('http');

// Função helper para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Teste 1: Health Check
async function testHealthCheck() {
  console.log('🏥 Testando Health Check...');
  try {
    const response = await makeRequest('http://localhost:4000/webhook/health');
    console.log('✅ Health Check:', response.data);
    return response.status === 200;
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
    const response = await makeRequest('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Resposta da Mensagem de Texto:', response.data);
    return response.data.processed === true;
  } catch (error) {
    console.error('❌ Erro na Mensagem de Texto:', error.message);
    return false;
  }
}

// Teste 3: Mensagem Real (baseada nos logs)
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
    const response = await makeRequest('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Resposta da Mensagem Real:', response.data);
    return response.data.processed === true;
  } catch (error) {
    console.error('❌ Erro na Mensagem Real:', error.message);
    return false;
  }
}

// Teste 4: Endpoint Específico
async function testSpecificEndpoint() {
  console.log('\n📱 Testando Endpoint Específico...');
  
  const payload = {
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511888776655@s.whatsapp.net',
        fromMe: false,
        id: 'SPECIFIC_TEST_001'
      },
      pushName: 'Maria Santos',
      message: {
        conversation: 'Teste do endpoint específico'
      },
      messageType: 'conversation',
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await makeRequest('http://localhost:4000/webhook/messages-upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Resposta do Endpoint Específico:', response.data);
    return response.data.processed === true;
  } catch (error) {
    console.error('❌ Erro no Endpoint Específico:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando Testes Simples do Webhook Evolution API\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    textMessage: await testTextMessage(),
    realMessage: await testRealMessage(),
    specificEndpoint: await testSpecificEndpoint()
  };

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('========================');
  console.log(`🏥 Health Check: ${results.healthCheck ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Mensagem de Texto: ${results.textMessage ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Mensagem Real: ${results.realMessage ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`📱 Endpoint Específico: ${results.specificEndpoint ? '✅ PASSOU' : '❌ FALHOU'}`);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n🎯 RESULTADO FINAL: ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Webhook está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
  }

  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testTextMessage,
  testRealMessage,
  testSpecificEndpoint,
  runAllTests
}; 