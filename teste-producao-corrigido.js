
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarProducaoCorrigido() {
  console.log('🧪 TESTANDO PRODUÇÃO CORRIGIDO');
  console.log('==============================');
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_CORRIGIDO_' + Date.now()
      },
      message: {
        conversation: '🧪 Teste produção corrigido: ' + new Date().toLocaleString()
      },
      messageTimestamp: Date.now(),
      pushName: 'Cliente Teste Corrigido'
    }
  };

  try {
    const response = await fetch('https://bkcrm.devsible.com.br/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log('📊 Resultado:');
    console.log('   Status:', response.status);
    console.log('   Processado:', data.processed);
    console.log('   Ticket ID:', data.ticketId);
    console.log('   WebSocket:', data.websocket);
    console.log('   Mensagem:', data.message);
    
    if (data.processed === true) {
      console.log('\n✅ SUCESSO: Produção corrigida!');
      console.log('🎉 Agora as mensagens devem aparecer instantaneamente!');
    } else {
      console.log('\n❌ Ainda não funcionando');
      console.log('💡 Verificar se o deploy foi aplicado');
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testarProducaoCorrigido();
