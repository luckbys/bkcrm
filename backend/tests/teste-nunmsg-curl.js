// =============================================================================
// 🧪 TESTE CURL: Campo nunmsg no webhook
// =============================================================================

const https = require('https');
const http = require('http');

function testarWebhookNunmsg() {
  console.log('\n🧪 === TESTE: Campo nunmsg no Webhook ===\n');

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

  const postData = JSON.stringify(testMessage);
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/webhook/evolution',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📤 Enviando mensagem de teste para webhook...');
  console.log('📱 Telefone: 5511999887766');
  console.log('📋 Esperado: ticket criado com nunmsg = "+5511999887766"');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('\n✅ WEBHOOK RESPONDEU COM SUCESSO!');
          console.log('📋 Resposta:', response);
          
          if (response.processed) {
            console.log('\n🎯 MENSAGEM PROCESSADA PELO WEBHOOK!');
            console.log('📞 Telefone processado:', response.phone || '5511999887766');
            console.log('👤 Cliente ID:', response.customerId || 'criado');
            console.log('🎫 Ticket ID:', response.ticketId || 'criado');
            console.log('💬 Mensagem ID:', response.messageId || 'salva');
            
            console.log('\n🔍 VERIFICAÇÃO NO SUPABASE:');
            console.log('Execute esta query para confirmar:');
            console.log('```sql');
            console.log('SELECT id, title, nunmsg, channel, metadata');
            console.log('FROM tickets');
            console.log('WHERE nunmsg = \'+5511999887766\'');
            console.log('ORDER BY created_at DESC LIMIT 1;');
            console.log('```');
            
            console.log('\n✅ Se retornar um ticket com nunmsg preenchido, o webhook está funcionando!');
          } else {
            console.log('⚠️ Webhook recebeu mas não processou completamente');
          }
        } else {
          console.log('❌ Erro na resposta:', response);
        }
      } catch (err) {
        console.error('❌ Erro ao processar resposta:', err.message);
        console.log('📋 Resposta bruta:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Erro na requisição:', err.message);
    console.log('💡 Certifique-se de que o webhook está rodando na porta 4000');
  });

  req.write(postData);
  req.end();
}

// EXECUTAR TESTE
console.log('🚀 Iniciando teste curl do campo nunmsg...');
testarWebhookNunmsg();

module.exports = { testarWebhookNunmsg }; 