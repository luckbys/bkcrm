const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarWebhookLocal() {
  console.log('🧪 TESTANDO WEBHOOK LOCAL');
  console.log('==========================');
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_LOCAL_' + Date.now()
      },
      message: {
        conversation: 'Teste webhook local: ' + new Date().toLocaleString()
      },
      messageTimestamp: Date.now(),
      pushName: 'Cliente Teste Local'
    }
  };

  try {
    console.log('📡 Enviando para webhook local...');
    
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('📊 Resultado:');
    console.log('   Status HTTP:', response.status);
    console.log('   Recebido:', data.received);
    console.log('   Processado:', data.processed);
    console.log('   Evento:', data.event);
    console.log('   Instância:', data.instance);
    console.log('   Ticket ID:', data.ticketId);
    console.log('   WebSocket:', data.websocket);
    console.log('   Mensagem:', data.message);

    if (data.processed === true) {
      console.log('\n✅ SUCESSO: Webhook local funcionando!');
      console.log('🎯 Sistema pronto para deploy em produção!');
    } else {
      console.log('\n❌ Local ainda não funcionando');
      console.log('💡 Verificar se servidor local está rodando na porta 4000');
    }

  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log('💡 Certifique-se que o servidor local está rodando:');
    console.log('   cd backend/webhooks');
    console.log('   node webhook-evolution-websocket.js');
  }
}

testarWebhookLocal(); 