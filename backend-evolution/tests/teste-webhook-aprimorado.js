/**
 * 🧪 SCRIPT DE TESTE COMPLETO
 * Webhook Evolution API - Versão Aprimorada
 * 
 * Este script testa todas as funcionalidades do webhook aprimorado
 */

import axios from 'axios';

// Configurações de teste
const WEBHOOK_BASE_URL = 'http://localhost:4000'; // ou 'https://bkcrm.devsible.com.br'
const TEST_PHONE = '5511999887766'; // Número para testes
const TEST_INSTANCE = 'atendimento-ao-cliente-suporte';

console.log('🧪 Iniciando testes do Webhook Evolution API Aprimorado');
console.log(`📡 Base URL: ${WEBHOOK_BASE_URL}`);
console.log(`📱 Telefone de teste: ${TEST_PHONE}`);
console.log(`🏢 Instância: ${TEST_INSTANCE}`);
console.log('═'.repeat(80));

/**
 * 1. TESTE DE HEALTH CHECK
 */
async function testHealthCheck() {
  console.log('\n🏥 1. TESTE DE HEALTH CHECK');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${WEBHOOK_BASE_URL}/webhook/health`);
    
    console.log('✅ Health check passou');
    console.log('📊 Status:', response.data.status);
    console.log('🗄️ Supabase:', response.data.supabase);
    console.log('📡 Evolution API:', response.data.evolutionApi);
    console.log('💾 Cache:', response.data.cache);
    
    return true;
  } catch (error) {
    console.error('❌ Health check falhou:', error.message);
    return false;
  }
}

/**
 * 2. TESTE DE INFORMAÇÕES DO SERVIÇO
 */
async function testServiceInfo() {
  console.log('\n📋 2. TESTE DE INFORMAÇÕES DO SERVIÇO');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${WEBHOOK_BASE_URL}/`);
    
    console.log('✅ Informações obtidas com sucesso');
    console.log('🔧 Serviço:', response.data.service);
    console.log('📦 Versão:', response.data.version);
    console.log('🚀 Funcionalidades:', response.data.features.length);
    
    response.data.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });
    
    console.log('🔗 Endpoints disponíveis:', Object.keys(response.data.endpoints).length);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter informações:', error.message);
    return false;
  }
}

/**
 * 3. TESTE DE VERIFICAÇÃO DE INSTÂNCIA
 */
async function testInstanceCheck() {
  console.log('\n🔌 3. TESTE DE VERIFICAÇÃO DE INSTÂNCIA');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/check-instance`, {
      instance: TEST_INSTANCE
    });
    
    console.log('✅ Verificação de instância passou');
    console.log('📊 Conectada:', response.data.isConnected);
    console.log('🏢 Estado:', response.data.instance?.state);
    console.log('📱 Instância:', response.data.instance?.instanceName);
    
    return response.data.isConnected;
  } catch (error) {
    console.error('❌ Erro ao verificar instância:', error.message);
    console.error('📄 Detalhes:', error.response?.data);
    return false;
  }
}

/**
 * 4. TESTE DE ENVIO DE MENSAGEM SIMPLES
 */
async function testSimpleMessage() {
  console.log('\n📤 4. TESTE DE ENVIO DE MENSAGEM SIMPLES');
  console.log('-'.repeat(50));
  
  try {
    const messageData = {
      phone: TEST_PHONE,
      text: 'Teste de mensagem simples do webhook aprimorado! 🚀',
      instance: TEST_INSTANCE
    };
    
    console.log('📨 Enviando mensagem...', messageData);
    
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/send-message`, messageData);
    
    console.log('✅ Mensagem enviada com sucesso');
    console.log('🆔 Message ID:', response.data.messageId);
    console.log('📊 Status:', response.data.status);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    console.error('📄 Detalhes:', error.response?.data);
    return false;
  }
}

/**
 * 5. TESTE DE ENVIO DE MENSAGEM AVANÇADA
 */
async function testAdvancedMessage() {
  console.log('\n📤 5. TESTE DE ENVIO DE MENSAGEM AVANÇADA');
  console.log('-'.repeat(50));
  
  try {
    const messageData = {
      phone: TEST_PHONE,
      text: 'Teste de mensagem avançada com opções especiais! ⚡\n\nEsta mensagem tem:\n• Delay personalizado\n• Preview de link\n• Presença de digitação',
      instance: TEST_INSTANCE,
      options: {
        delay: 3000,
        presence: 'composing',
        linkPreview: true
      }
    };
    
    console.log('📨 Enviando mensagem avançada...', {
      phone: messageData.phone,
      textLength: messageData.text.length,
      options: messageData.options
    });
    
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/send-message`, messageData);
    
    console.log('✅ Mensagem avançada enviada');
    console.log('🆔 Message ID:', response.data.messageId);
    console.log('📊 Status:', response.data.status);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem avançada:', error.message);
    console.error('📄 Detalhes:', error.response?.data);
    return false;
  }
}

/**
 * 6. TESTE DE SIMULAÇÃO DE WEBHOOK RECEBIDO
 */
async function testWebhookSimulation() {
  console.log('\n🔔 6. TESTE DE SIMULAÇÃO DE WEBHOOK');
  console.log('-'.repeat(50));
  
  try {
    // Simular webhook de mensagem recebida
    const webhookPayload = {
      event: 'MESSAGES_UPSERT',
      instance: TEST_INSTANCE,
      data: {
        key: {
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: false,
          id: `test_${Date.now()}`
        },
        message: {
          conversation: 'Teste de mensagem recebida do webhook aprimorado! Olá, preciso de ajuda com meu pedido.'
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Cliente Teste Aprimorado'
      }
    };
    
    console.log('📥 Simulando webhook recebido...', {
      event: webhookPayload.event,
      instance: webhookPayload.instance,
      pushName: webhookPayload.data.pushName
    });
    
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/evolution`, webhookPayload);
    
    console.log('✅ Webhook simulado processado');
    console.log('📊 Processado:', response.data.processed);
    console.log('💬 Mensagem:', response.data.message);
    console.log('🎫 Ticket ID:', response.data.ticketId);
    console.log('👤 Contact ID:', response.data.contactId);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na simulação de webhook:', error.message);
    console.error('📄 Detalhes:', error.response?.data);
    return false;
  }
}

/**
 * 7. TESTE DE SIMULAÇÃO DE MÍDIA
 */
async function testMediaWebhook() {
  console.log('\n🖼️ 7. TESTE DE SIMULAÇÃO DE MÍDIA');
  console.log('-'.repeat(50));
  
  try {
    // Simular webhook de imagem recebida
    const webhookPayload = {
      event: 'MESSAGES_UPSERT',
      instance: TEST_INSTANCE,
      data: {
        key: {
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: false,
          id: `test_image_${Date.now()}`
        },
        message: {
          imageMessage: {
            caption: 'Aqui está a foto do problema que estou enfrentando!',
            url: 'https://example.com/image.jpg',
            mimetype: 'image/jpeg',
            fileLength: 1048576
          }
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Cliente Com Imagem'
      }
    };
    
    console.log('📸 Simulando webhook de imagem...', {
      caption: webhookPayload.data.message.imageMessage.caption,
      mimetype: webhookPayload.data.message.imageMessage.mimetype
    });
    
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/evolution`, webhookPayload);
    
    console.log('✅ Webhook de mídia processado');
    console.log('📊 Processado:', response.data.processed);
    console.log('🎫 Ticket ID:', response.data.ticketId);
    console.log('📄 Metadata:', response.data.metadata);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na simulação de mídia:', error.message);
    return false;
  }
}

/**
 * 8. TESTE DO CACHE DE CONTATOS
 */
async function testContactCache() {
  console.log('\n💾 8. TESTE DO CACHE DE CONTATOS');
  console.log('-'.repeat(50));
  
  try {
    // Verificar cache atual
    const cacheResponse = await axios.get(`${WEBHOOK_BASE_URL}/webhook/cache`);
    
    console.log('✅ Cache acessado com sucesso');
    console.log('📊 Entradas no cache:', cacheResponse.data.size);
    
    if (cacheResponse.data.entries.length > 0) {
      console.log('👤 Contatos em cache:');
      cacheResponse.data.entries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.name} (${entry.phone}) - ${entry.language}`);
      });
    } else {
      console.log('📝 Cache vazio');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar cache:', error.message);
    return false;
  }
}

/**
 * 9. TESTE DE LIMPEZA DE CACHE
 */
async function testCacheClear() {
  console.log('\n🧹 9. TESTE DE LIMPEZA DE CACHE');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/clear-cache`);
    
    console.log('✅ Cache limpo com sucesso');
    console.log('🗑️ Entradas removidas:', response.data.entriesCleared);
    console.log('⏰ Timestamp:', response.data.timestamp);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error.message);
    return false;
  }
}

/**
 * 10. TESTE DE MÚLTIPLOS IDIOMAS
 */
async function testMultiLanguage() {
  console.log('\n🌍 10. TESTE DE MÚLTIPLOS IDIOMAS');
  console.log('-'.repeat(50));
  
  const languages = [
    {
      lang: 'pt-BR',
      phone: '5511111111111',
      message: 'Olá! Bom dia, preciso de ajuda com meu pedido. Obrigado!',
      pushName: 'Cliente Português'
    },
    {
      lang: 'en-US',
      phone: '5511222222222',
      message: 'Hello! Good morning, I need help with my order. Thank you!',
      pushName: 'English Customer'
    },
    {
      lang: 'es-ES',
      phone: '5511333333333',
      message: 'Hola! Buenos días, necesito ayuda con mi pedido. Gracias!',
      pushName: 'Cliente Español'
    }
  ];
  
  try {
    for (const test of languages) {
      console.log(`🌐 Testando idioma: ${test.lang}`);
      
      const webhookPayload = {
        event: 'MESSAGES_UPSERT',
        instance: TEST_INSTANCE,
        data: {
          key: {
            remoteJid: `${test.phone}@s.whatsapp.net`,
            fromMe: false,
            id: `test_${test.lang}_${Date.now()}`
          },
          message: {
            conversation: test.message
          },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: test.pushName
        }
      };
      
      const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/evolution`, webhookPayload);
      
      console.log(`   ✅ ${test.lang}: Processado com sucesso`);
      console.log(`   🎫 Ticket: ${response.data.ticketId}`);
      
      // Pequeno delay entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste multi-idioma:', error.message);
    return false;
  }
}

/**
 * EXECUTAR TODOS OS TESTES
 */
async function runAllTests() {
  console.log('🚀 EXECUTANDO BATERIA COMPLETA DE TESTES');
  console.log('═'.repeat(80));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Service Info', fn: testServiceInfo },
    { name: 'Instance Check', fn: testInstanceCheck },
    { name: 'Simple Message', fn: testSimpleMessage },
    { name: 'Advanced Message', fn: testAdvancedMessage },
    { name: 'Webhook Simulation', fn: testWebhookSimulation },
    { name: 'Media Webhook', fn: testMediaWebhook },
    { name: 'Contact Cache', fn: testContactCache },
    { name: 'Cache Clear', fn: testCacheClear },
    { name: 'Multi Language', fn: testMultiLanguage }
  ];
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n⏳ Executando: ${test.name}...`);
      const startTime = Date.now();
      
      const result = await test.fn();
      
      const duration = Date.now() - startTime;
      
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSOU (${duration}ms)`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FALHOU (${duration}ms)`);
      }
      
      results.push({
        name: test.name,
        passed: result,
        duration: duration
      });
      
      // Delay entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      failed++;
      console.error(`💥 ${test.name} - ERRO:`, error.message);
      results.push({
        name: test.name,
        passed: false,
        duration: 0,
        error: error.message
      });
    }
  }
  
  // Relatório final
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('═'.repeat(80));
  
  console.log(`✅ Testes passaram: ${passed}`);
  console.log(`❌ Testes falharam: ${failed}`);
  console.log(`📊 Taxa de sucesso: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detalhes dos testes:');
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    const duration = result.duration ? `${result.duration}ms` : 'N/A';
    console.log(`${index + 1}. ${status} ${result.name} (${duration})`);
    if (result.error) {
      console.log(`   💬 Erro: ${result.error}`);
    }
  });
  
  if (passed === tests.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Webhook está funcionando perfeitamente.');
  } else {
    console.log(`\n⚠️ ${failed} teste(s) falharam. Verifique os logs para mais detalhes.`);
  }
  
  console.log('\n📝 Próximos passos:');
  console.log('1. Se algum teste falhou, verifique a configuração do webhook');
  console.log('2. Confirme que a Evolution API está rodando e conectada');
  console.log('3. Verifique as credenciais no arquivo webhook.env');
  console.log('4. Teste o envio real de mensagens para um número WhatsApp');
  
  return passed === tests.length;
}

/**
 * TESTE RÁPIDO INDIVIDUAL
 */
async function quickTest() {
  console.log('⚡ TESTE RÁPIDO - Health Check + Envio de Mensagem');
  console.log('-'.repeat(60));
  
  try {
    // Health check
    const health = await testHealthCheck();
    if (!health) {
      console.log('❌ Health check falhou, parando teste');
      return false;
    }
    
    // Envio de mensagem
    const message = await testSimpleMessage();
    if (!message) {
      console.log('❌ Envio de mensagem falhou');
      return false;
    }
    
    console.log('\n🎉 TESTE RÁPIDO PASSOU! Webhook está funcionando.');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste rápido:', error.message);
    return false;
  }
}

// Detectar se foi chamado diretamente ou importado
if (import.meta.url === `file://${process.argv[1]}`) {
  // Verificar argumentos da linha de comando
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    quickTest();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧪 Script de Teste do Webhook Evolution API Aprimorado');
    console.log('');
    console.log('Uso:');
    console.log('  node teste-webhook-aprimorado.js           # Executar todos os testes');
    console.log('  node teste-webhook-aprimorado.js --quick   # Teste rápido');
    console.log('  node teste-webhook-aprimorado.js --help    # Mostrar esta ajuda');
    console.log('');
    console.log('Variáveis de ambiente:');
    console.log('  WEBHOOK_BASE_URL  # URL base do webhook (padrão: http://localhost:4000)');
    console.log('  TEST_PHONE        # Telefone para teste (padrão: 5511999887766)');
    console.log('  TEST_INSTANCE     # Instância para teste (padrão: atendimento-ao-cliente-suporte)');
  } else {
    runAllTests();
  }
}

// Exportar funções para uso em outros scripts
export {
  testHealthCheck,
  testServiceInfo,
  testInstanceCheck,
  testSimpleMessage,
  testAdvancedMessage,
  testWebhookSimulation,
  testMediaWebhook,
  testContactCache,
  testCacheClear,
  testMultiLanguage,
  runAllTests,
  quickTest
}; 