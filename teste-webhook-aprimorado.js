// ========================================
// TESTE DO WEBHOOK APRIMORADO
// ========================================
// Este script testa todas as funcionalidades do webhook aprimorado

const axios = require('axios');

console.log('🧪 INICIANDO TESTES DO WEBHOOK APRIMORADO');
console.log('=' + '='.repeat(50));

// Configurações
const WEBHOOK_URL = 'http://localhost:4000';

// Função utilitária para fazer requisições
async function makeRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    if (data) {
      options.data = data;
    }
    
    const response = await axios(options);
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      data: error.response?.data
    };
  }
}

// ====== TESTE 1: HEALTH CHECK ======
async function testHealthCheck() {
  console.log('\n🏥 TESTE 1: Health Check');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/health`);
  
  if (result.success) {
    console.log('✅ Health check passou');
    console.log('📊 Versão:', result.data.version);
    console.log('🎯 Funcionalidades:', result.data.features?.length || 0);
    console.log('📋 Cache de contatos:', result.data.cache?.contacts || 0);
    console.log('📝 Templates:', result.data.cache?.templates || 0);
  } else {
    console.log('❌ Health check falhou:', result.error);
    console.log('🔗 Verifique se o webhook está rodando em:', WEBHOOK_URL);
  }
  
  return result.success;
}

// ====== TESTE 2: CACHE DE CONTATOS ======
async function testContactCache() {
  console.log('\n📋 TESTE 2: Cache de Contatos');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/cache`);
  
  if (result.success) {
    console.log('✅ Cache acessível');
    console.log('📊 Total de contatos em cache:', result.data.size);
    
    if (result.data.contacts && result.data.contacts.length > 0) {
      console.log('👥 Contatos encontrados:');
      result.data.contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.contact.name} (${contact.contact.phone})`);
        console.log(`      Idioma: ${contact.contact.language}, Mensagens: ${contact.contact.messageCount}`);
      });
    } else {
      console.log('📭 Cache vazio (normal se servidor foi reiniciado recentemente)');
    }
  } else {
    console.log('❌ Erro ao acessar cache:', result.error);
  }
  
  return result.success;
}

// ====== TESTE 3: SIMULAÇÃO DE WEBHOOK ======
async function testWebhookSimulation() {
  console.log('\n📥 TESTE 3: Simulação de Webhook');
  console.log('-'.repeat(30));
  
  // Simular recebimento de mensagem
  const webhookPayload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '5511999000001@s.whatsapp.net',
        fromMe: false,
        id: 'test_message_' + Date.now(),
        participant: null
      },
      message: {
        conversation: 'Olá! Esta é uma mensagem de teste para verificar a extração de dados do webhook aprimorado.'
      },
      pushName: 'Cliente Teste Avançado',
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };
  
  console.log('📤 Enviando payload de teste...');
  console.log('👤 Contato:', webhookPayload.data.pushName);
  console.log('📱 Telefone:', webhookPayload.data.key.remoteJid);
  console.log('💬 Mensagem:', webhookPayload.data.message.conversation.substring(0, 50) + '...');
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/evolution`, 'POST', webhookPayload);
  
  if (result.success) {
    console.log('✅ Webhook processou mensagem com sucesso');
    
    if (result.data.contactData) {
      console.log('👤 Dados do contato extraídos:');
      console.log(`   Nome: ${result.data.contactData.name}`);
      console.log(`   Telefone: ${result.data.contactData.phone}`);
      console.log(`   Idioma: ${result.data.contactData.language}`);
      console.log(`   É grupo: ${result.data.contactData.isGroup ? 'Sim' : 'Não'}`);
      console.log(`   Foto de perfil: ${result.data.contactData.profilePictureUrl ? 'Sim' : 'Não'}`);
    }
    
    if (result.data.messageInfo) {
      console.log('📨 Informações da mensagem:');
      console.log(`   Tipo: ${result.data.messageInfo.type}`);
      console.log(`   Conteúdo: ${result.data.messageInfo.content?.substring(0, 50)}...`);
      console.log(`   Tem mídia: ${result.data.messageInfo.media ? 'Sim' : 'Não'}`);
    }
  } else {
    console.log('❌ Erro no webhook:', result.error);
    if (result.data) {
      console.log('📝 Detalhes:', result.data);
    }
  }
  
  return result.success;
}

// ====== TESTE 4: ENVIO DE MENSAGEM ======
async function testMessageSending() {
  console.log('\n📤 TESTE 4: Envio de Mensagem');
  console.log('-'.repeat(30));
  
  const messagePayload = {
    phone: '5512981022013', // Número real que funcionou nos testes anteriores
    text: '🤖 Teste do webhook APRIMORADO! Funcionalidades: ✅ Extração avançada de dados, ✅ Resposta automática inteligente, ✅ Cache de contatos, ✅ Processamento de mídias.',
    instance: 'atendimento-ao-cliente-sac1',
    options: {
      delay: 1000,
      presence: 'composing'
    }
  };
  
  console.log('📤 Tentando enviar mensagem...');
  console.log('📱 Para:', messagePayload.phone);
  console.log('💬 Texto:', messagePayload.text.substring(0, 50) + '...');
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/send-message`, 'POST', messagePayload);
  
  if (result.success && result.data.success) {
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('🆔 Message ID:', result.data.messageId);
    console.log('📊 Status:', result.data.status);
  } else if (result.success && !result.data.success) {
    console.log('⚠️ Webhook funcionando, mas erro no envio:', result.data.error);
    if (result.data.details?.response?.message) {
      console.log('📝 Detalhes:', result.data.details.response.message);
    }
  } else {
    console.log('❌ Erro no endpoint de envio:', result.error);
  }
  
  return result.success;
}

// ====== TESTE 5: LIMPAR CACHE ======
async function testClearCache() {
  console.log('\n🧹 TESTE 5: Limpar Cache');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/clear-cache`, 'POST');
  
  if (result.success) {
    console.log('✅ Cache limpo com sucesso');
    console.log('📝 Mensagem:', result.data.message);
  } else {
    console.log('❌ Erro ao limpar cache:', result.error);
  }
  
  return result.success;
}

// ====== TESTE 6: SIMULAÇÃO DE MENSAGEM COM MÍDIA ======
async function testMediaMessage() {
  console.log('\n📷 TESTE 6: Simulação de Mensagem com Mídia');
  console.log('-'.repeat(30));
  
  const mediaPayload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '5511999000002@s.whatsapp.net',
        fromMe: false,
        id: 'test_media_' + Date.now(),
        participant: null
      },
      message: {
        imageMessage: {
          caption: 'Esta é uma imagem de teste do webhook aprimorado 📷',
          mimetype: 'image/jpeg',
          url: 'https://exemplo.com/imagem.jpg',
          fileLength: 1024000,
          width: 1920,
          height: 1080
        }
      },
      pushName: 'Cliente Mídia Teste',
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };
  
  console.log('📤 Enviando mensagem com imagem...');
  
  const result = await makeRequest(`${WEBHOOK_URL}/webhook/evolution`, 'POST', mediaPayload);
  
  if (result.success && result.data.messageInfo) {
    console.log('✅ Mensagem com mídia processada');
    console.log('🎯 Tipo:', result.data.messageInfo.type);
    console.log('📝 Caption:', result.data.messageInfo.content);
    
    if (result.data.messageInfo.media) {
      console.log('📊 Dados da mídia:');
      console.log(`   Mimetype: ${result.data.messageInfo.media.mimetype}`);
      console.log(`   Tamanho: ${result.data.messageInfo.media.size} bytes`);
      console.log(`   Dimensões: ${result.data.messageInfo.media.width}x${result.data.messageInfo.media.height}`);
    }
  } else {
    console.log('❌ Erro ao processar mensagem com mídia');
  }
  
  return result.success;
}

// ====== TESTE 7: FUNCIONALIDADES ESPECÍFICAS ======
async function testSpecificFeatures() {
  console.log('\n🎯 TESTE 7: Funcionalidades Específicas');
  console.log('-'.repeat(30));
  
  let passed = 0;
  
  // Teste detecção de idioma
  const testMessages = [
    { text: 'Hello, I need help with my order', expectedLang: 'en' },
    { text: 'Hola, necesito ayuda con mi pedido', expectedLang: 'es' },
    { text: 'Olá, preciso de ajuda com meu pedido', expectedLang: 'pt' }
  ];
  
  for (const testMsg of testMessages) {
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: 'atendimento-ao-cliente-sac1',
      data: {
        key: {
          remoteJid: `55119990000${Math.floor(Math.random() * 100)}@s.whatsapp.net`,
          fromMe: false,
          id: 'lang_test_' + Date.now() + '_' + Math.random(),
          participant: null
        },
        message: {
          conversation: testMsg.text
        },
        pushName: 'Cliente Teste Idioma',
        messageTimestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    const result = await makeRequest(`${WEBHOOK_URL}/webhook/evolution`, 'POST', payload);
    
    if (result.success && result.data.contactData) {
      const detectedLang = result.data.contactData.language;
      console.log(`🗣️ Idioma detectado: ${detectedLang} (esperado: ${testMsg.expectedLang}) - ${detectedLang === testMsg.expectedLang ? '✅' : '⚠️'}`);
      if (detectedLang === testMsg.expectedLang) passed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`📊 Detecção de idioma: ${passed}/${testMessages.length} testes corretos`);
  
  return passed === testMessages.length;
}

// ====== EXECUTAR TODOS OS TESTES ======
async function runAllTests() {
  console.log('🚀 Iniciando bateria completa de testes...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Cache de Contatos', fn: testContactCache },
    { name: 'Simulação de Webhook', fn: testWebhookSimulation },
    { name: 'Envio de Mensagem', fn: testMessageSending },
    { name: 'Mensagem com Mídia', fn: testMediaMessage },
    { name: 'Funcionalidades Específicas', fn: testSpecificFeatures },
    { name: 'Limpar Cache', fn: testClearCache }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Erro no teste ${test.name}:`, error.message);
      failed++;
    }
    
    // Delay entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  console.log(`✅ Testes aprovados: ${passed}`);
  console.log(`❌ Testes falharam: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Webhook aprimorado funcionando perfeitamente.');
    console.log('🚀 O sistema está pronto para receber e processar mensagens com dados completos.');
  } else if (passed > failed) {
    console.log('\n⚠️ Maioria dos testes passou. Verifique os testes que falharam.');
  } else {
    console.log('\n❌ Muitos testes falharam. Verifique se o webhook está rodando e as configurações estão corretas.');
  }
  
  console.log('\n🔧 Para executar testes individuais:');
  console.log('- node teste-webhook-aprimorado.js health');
  console.log('- node teste-webhook-aprimorado.js cache');
  console.log('- node teste-webhook-aprimorado.js webhook');
  console.log('- node teste-webhook-aprimorado.js send');
  console.log('- node teste-webhook-aprimorado.js media');
  
  return { passed, failed, total: passed + failed };
}

// ====== EXECUTAR BASEADO EM ARGUMENTOS ======
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Executar todos os testes
    await runAllTests();
  } else {
    // Executar teste específico
    const testType = args[0].toLowerCase();
    
    switch (testType) {
      case 'health':
        await testHealthCheck();
        break;
      case 'cache':
        await testContactCache();
        break;
      case 'webhook':
        await testWebhookSimulation();
        break;
      case 'send':
        await testMessageSending();
        break;
      case 'media':
        await testMediaMessage();
        break;
      case 'features':
        await testSpecificFeatures();
        break;
      case 'clear':
        await testClearCache();
        break;
      case 'all':
        await runAllTests();
        break;
      default:
        console.log('❌ Teste não reconhecido:', testType);
        console.log('🔧 Testes disponíveis: health, cache, webhook, send, media, features, clear, all');
    }
  }
}

// ====== INSTRUÇÕES ======
console.log('\n📝 INSTRUÇÕES DE USO:');
console.log('1. Certifique-se de que o webhook aprimorado está rodando na porta 4000');
console.log('2. Execute: node teste-webhook-aprimorado.js');
console.log('3. Ou teste específico: node teste-webhook-aprimorado.js health');
console.log('\n🎯 REQUISITOS:');
console.log('- Webhook rodando em http://localhost:4000');
console.log('- Evolution API configurada');
console.log('- Variáveis de ambiente configuradas');
console.log('- Axios instalado: npm install axios');

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal nos testes:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testContactCache,
  testWebhookSimulation,
  testMessageSending,
  testMediaMessage,
  testSpecificFeatures,
  testClearCache,
  runAllTests
}; 