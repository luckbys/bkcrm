// =============================================================================
// 🧪 TESTE SIMPLES: Verificar se webhook salva campo nunmsg
// =============================================================================

const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:4000';

async function testarNunmsgWebhook() {
  console.log('\n🧪 === TESTE: Campo nunmsg no Webhook ===\n');

  // 1. VERIFICAR SE WEBHOOK ESTÁ RODANDO
  console.log('1️⃣ Verificando se webhook está ativo...');
  try {
    const healthResponse = await fetch(`${WEBHOOK_URL}/webhook/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Webhook está rodando:', health.version);
    } else {
      console.log('❌ Webhook não está respondendo');
      return;
    }
  } catch (err) {
    console.error('❌ Erro ao conectar com webhook:', err.message);
    return;
  }

  // 2. SIMULAR MENSAGEM WHATSAPP
  console.log('\n2️⃣ Enviando mensagem de teste...');
  
  const testMessage = {
    event: 'messages.upsert',
    instance: 'teste-nunmsg',
    data: {
      key: {
        remoteJid: '5511999887766@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_NUNMSG_' + Date.now()
      },
      message: {
        conversation: '[TESTE NUNMSG] Verificando se campo nunmsg é preenchido automaticamente'
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste Nunmsg'
    }
  };

  console.log('📤 Enviando payload para webhook...');
  console.log('📱 Telefone de teste: 5511999887766');
  
  try {
    const response = await fetch(`${WEBHOOK_URL}/webhook/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook processou mensagem:', result);
      
      if (result.processed) {
        console.log('\n🎯 SUCESSO: Mensagem foi processada pelo webhook!');
        console.log('📋 Detalhes:');
        console.log(`   📞 Telefone: ${result.phone || '5511999887766'}`);
        console.log(`   👤 Cliente ID: ${result.customerId || 'criado automaticamente'}`);
        console.log(`   🎫 Ticket ID: ${result.ticketId || 'criado automaticamente'}`);
        console.log(`   💬 Mensagem ID: ${result.messageId || 'salva automaticamente'}`);
        
        console.log('\n⏱️ Aguarde 5 segundos e verifique no Supabase se:');
        console.log('   ✅ Novo ticket foi criado com channel = "whatsapp"');
        console.log('   ✅ Campo nunmsg está preenchido com "+5511999887766"');
        console.log('   ✅ Metadata contém os dados do WhatsApp');
        
        // Aguardar um pouco para processamento
        setTimeout(() => {
          console.log('\n🔍 Para verificar no Supabase, execute esta query:');
          console.log('```sql');
          console.log('SELECT id, title, nunmsg, channel, metadata, created_at');
          console.log('FROM tickets');
          console.log('WHERE nunmsg = \'+5511999887766\'');
          console.log('ORDER BY created_at DESC;');
          console.log('```');
          
          console.log('\n✅ Se o campo nunmsg estiver preenchido, o webhook está funcionando corretamente!');
        }, 2000);
        
      } else {
        console.log('⚠️ Webhook recebeu mensagem mas não processou completamente');
      }
      
    } else {
      console.error('❌ Erro na resposta do webhook:', result);
    }

  } catch (err) {
    console.error('❌ Erro ao enviar mensagem para webhook:', err.message);
  }
}

// EXECUTAR TESTE
console.log('🚀 Iniciando teste do campo nunmsg...');
testarNunmsgWebhook()
  .then(() => {
    console.log('\n🏁 Teste concluído!');
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error);
  });

module.exports = { testarNunmsgWebhook }; 