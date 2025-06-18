/**
 * Script de Teste: Cadastro Automático de Clientes via Webhook
 * 
 * Este script testa a funcionalidade de verificação e criação automática
 * de clientes quando mensagens são recebidas via WhatsApp.
 */

const axios = require('axios');

// Configurações do teste
const WEBHOOK_BASE_URL = 'http://localhost:4000'; // Ajustar se necessário
const TEST_CASES = [
  {
    name: 'Cliente Novo',
    phone: '5511987654321',
    pushName: 'João Silva Teste',
    message: 'Olá, gostaria de informações sobre seus produtos',
    instance: 'test-instance'
  },
  {
    name: 'Cliente Existente',
    phone: '5511987654321', // Mesmo telefone do teste anterior
    pushName: 'João Silva',
    message: 'Agora tenho uma nova dúvida',
    instance: 'test-instance'
  },
  {
    name: 'Cliente WhatsApp Business',
    phone: '5511123456789',
    pushName: 'Empresa ABC',
    message: 'Somos uma empresa e precisamos de uma cotação',
    instance: 'test-instance'
  }
];

/**
 * Simular webhook de mensagem recebida
 */
async function simulateWebhook(testCase) {
  try {
    console.log(`\n🧪 Testando: ${testCase.name}`);
    console.log(`📱 Telefone: ${testCase.phone}`);
    console.log(`👤 Nome: ${testCase.pushName}`);
    console.log(`💬 Mensagem: ${testCase.message.substring(0, 50)}...`);
    
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: testCase.instance,
      data: {
        key: {
          remoteJid: `${testCase.phone}@s.whatsapp.net`,
          fromMe: false,
          id: `test_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        message: {
          conversation: testCase.message
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: testCase.pushName
      }
    };

    console.log('📡 Enviando webhook...');
    
    const response = await axios.post(`${WEBHOOK_BASE_URL}/webhook/evolution`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Resposta do webhook:', {
      status: response.status,
      processed: response.data.processed,
      message: response.data.message,
      ticketId: response.data.ticketId,
      customerId: response.data.customerId || 'N/A'
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Erro no teste:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verificar status do webhook
 */
async function checkWebhookHealth() {
  try {
    console.log('🏥 Verificando saúde do webhook...');
    
    const response = await axios.get(`${WEBHOOK_BASE_URL}/health`, {
      timeout: 10000
    });
    
    console.log('✅ Webhook está funcionando:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Webhook não está respondendo:', error.message);
    console.log('💡 Certifique-se de que o webhook está rodando na porta 4000');
    console.log('📚 Execute: node webhook-evolution-complete.js');
    return false;
  }
}

/**
 * Executar teste completo
 */
async function runTests() {
  console.log('🚀 Iniciando testes de cadastro automático de clientes...\n');
  
  // Verificar se webhook está funcionando
  const isHealthy = await checkWebhookHealth();
  if (!isHealthy) {
    console.log('\n❌ Testes cancelados - webhook não está funcionando');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTANDO CASOS DE TESTE');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    
    console.log(`\n[${i + 1}/${TEST_CASES.length}] Executando teste...`);
    
    const result = await simulateWebhook(testCase);
    results.push({
      testCase: testCase.name,
      ...result
    });
    
    // Aguardar um pouco entre os testes
    if (i < TEST_CASES.length - 1) {
      console.log('⏳ Aguardando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${(successful / results.length * 100).toFixed(1)}%`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} [${index + 1}] ${result.testCase}`);
    
    if (result.success && result.data) {
      if (result.data.customerId) {
        console.log(`   👤 Cliente: ${result.data.customerId}`);
      }
      if (result.data.ticketId) {
        console.log(`   🎫 Ticket: ${result.data.ticketId}`);
      }
    }
  });
  
  console.log('\n🎯 Teste concluído!');
  
  if (successful > 0) {
    console.log('\n💡 Dicas para verificar os resultados:');
    console.log('1. Verifique os logs do webhook para detalhes');
    console.log('2. Consulte a tabela "customers" no Supabase');
    console.log('3. Verifique a tabela "tickets" no Supabase');
    console.log('4. Teste a interface do CRM para ver os novos clientes');
  }
}

/**
 * Função para teste individual
 */
async function testSingleMessage(phone, name, message) {
  console.log('🧪 Teste individual...');
  
  const result = await simulateWebhook({
    name: 'Teste Individual',
    phone: phone,
    pushName: name,
    message: message,
    instance: 'test-single'
  });
  
  return result;
}

// Executar testes se este arquivo for chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

// Exportar funções para uso em outros arquivos
module.exports = {
  runTests,
  testSingleMessage,
  checkWebhookHealth,
  simulateWebhook
};

console.log('📚 Script de teste carregado!');
console.log('💡 Execute: node test-auto-customer-creation.js');
console.log('🔧 Ou use as funções exportadas em outros scripts'); 