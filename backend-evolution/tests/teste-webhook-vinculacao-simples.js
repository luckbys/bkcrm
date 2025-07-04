/**
 * 🧪 TESTE SIMPLES DE VINCULAÇÃO AUTOMÁTICA DE TELEFONE
 * 
 * Script Node.js simples para testar webhook sem dependências externas
 */

const http = require('http');

async function testarWebhookVinculacao() {
  console.log('🧪 === TESTE SIMPLES - VINCULAÇÃO AUTOMÁTICA ===\n');

  try {
    // 1. Verificar se webhook está funcionando
    console.log('🔗 1. VERIFICANDO WEBHOOK:');
    
    const healthCheck = await makeRequest('GET', 'localhost', 4000, '/webhook/health');
    
    if (healthCheck.success) {
      const data = JSON.parse(healthCheck.data);
      console.log(`   ✅ Webhook: ${data.status} (v${data.version})`);
      console.log(`   📋 Endpoints: ${data.endpoints?.length || 0} disponíveis`);
    } else {
      console.log('   ❌ Webhook não está funcionando');
      console.log('   💡 Inicie o webhook: node backend/webhooks/webhook-evolution-complete-corrigido.js');
      return;
    }

    // 2. Enviar mensagem de teste
    console.log('\n📤 2. ENVIANDO MENSAGEM DE TESTE:');
    
    const testPayload = {
      event: "messages.upsert",
      instance: "atendimento-ao-cliente-suporte",
      data: {
        key: {
          remoteJid: "5511777889999@s.whatsapp.net",
          fromMe: false,
          id: "test_vinculacao_" + Date.now()
        },
        pushName: "Cliente Teste Vinculação",
        messageTimestamp: Math.floor(Date.now() / 1000),
        message: {
          conversation: "Testando vinculação automática de telefone via webhook! 📱"
        }
      }
    };

    console.log('   📱 Telefone de teste: +5511777889999');
    console.log('   📝 Enviando payload para webhook...');

    const webhookResponse = await makeRequest(
      'POST', 
      'localhost', 
      4000, 
      '/webhook/evolution',
      JSON.stringify(testPayload),
      { 'Content-Type': 'application/json' }
    );

    if (webhookResponse.success) {
      const result = JSON.parse(webhookResponse.data);
      console.log('   ✅ Webhook processou mensagem:');
      console.log(`      📋 Processado: ${result.processed}`);
      console.log(`      🎫 Ticket ID: ${result.result?.ticketId || 'N/A'}`);
      console.log(`      👤 Cliente ID: ${result.result?.customerId || 'N/A'}`);
      console.log(`      💬 Mensagem ID: ${result.result?.messageId || 'N/A'}`);
      
      if (result.result?.ticketId) {
        console.log('\n🎉 SUCESSO: Ticket criado com sucesso!');
        console.log('📱 O telefone deve ter sido vinculado automaticamente');
        console.log('💡 Verifique no frontend se o ticket aparece com telefone');
      } else {
        console.log('\n⚠️ ATENÇÃO: Webhook processou mas não retornou ticket ID');
      }
    } else {
      console.log('   ❌ Erro no webhook:', webhookResponse.error);
    }

    // 3. Resultado e próximos passos
    console.log('\n📋 3. PRÓXIMOS PASSOS:');
    console.log('   1. ✅ Abra o CRM no navegador (http://localhost:3000)');
    console.log('   2. ✅ Vá para a lista de tickets/conversas');
    console.log('   3. ✅ Procure pelo ticket "Atendimento WhatsApp - +5511777889999"');
    console.log('   4. ✅ Abra o chat do ticket');
    console.log('   5. ✅ Verifique se o telefone aparece no cabeçalho/sidebar');
    console.log('   6. ✅ Teste envio de mensagem (deve usar o telefone vinculado)');

    console.log('\n🧪 TESTE COMPLETO!');
    console.log('📱 Se funcionando: webhook captura número → vincula ao ticket → frontend acessa');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

/**
 * 🔧 FUNÇÃO AUXILIAR: Fazer requisição HTTP
 */
function makeRequest(method, hostname, port, path, data = null, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: responseData,
          error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarWebhookVinculacao();
}

module.exports = { testarWebhookVinculacao }; 