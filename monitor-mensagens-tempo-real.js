const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function monitorarMensagens() {
  console.log('📡 MONITOR DE MENSAGENS EM TEMPO REAL');
  console.log('====================================');
  console.log('');
  console.log('🔍 Monitorando webhook em tempo real...');
  console.log('📱 Envie uma mensagem do WhatsApp para testar!');
  console.log('');
  
  // Função para testar o webhook
  async function testarWebhook() {
    try {
      const response = await fetch('https://bkcrm.devsible.com.br/webhook/health');
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Webhook online:', data.timestamp);
        
        // Verificar estatísticas WebSocket
        try {
          const statsResponse = await fetch('https://bkcrm.devsible.com.br/webhook/ws-stats');
          const statsData = await statsResponse.json();
          console.log('📊 WebSocket Stats:', {
            conexoes: statsData.totalConnections,
            tickets: statsData.activeTickets,
            timestamp: new Date().toLocaleTimeString()
          });
        } catch (statsError) {
          console.log('⚠️ Erro ao obter stats WebSocket');
        }
      } else {
        console.log('❌ Webhook offline');
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com webhook:', error.message);
    }
  }
  
  // Função para simular uma mensagem de teste
  async function enviarMensagemTeste() {
    console.log('');
    console.log('🧪 Enviando mensagem de teste para webhook...');
    
    const payloadTeste = {
      event: 'MESSAGES_UPSERT',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'TEST_MONITOR_' + Date.now()
        },
        message: {
          conversation: `🧪 Teste monitor: ${new Date().toLocaleString()}`
        },
        messageTimestamp: Date.now(),
        pushName: 'Monitor Teste'
      }
    };
    
    try {
      const response = await fetch('https://bkcrm.devsible.com.br/webhook/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadTeste)
      });
      
      const result = await response.json();
      
      console.log('📤 Resposta do webhook:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Processado: ${result.processed}`);
      console.log(`   Ticket ID: ${result.ticketId}`);
      console.log(`   WebSocket: ${result.websocket}`);
      console.log(`   Mensagem: ${result.message}`);
      
      if (result.processed) {
        console.log('✅ Mensagem processada com sucesso!');
      } else {
        console.log('❌ Mensagem não foi processada');
        console.log('💡 Verifique os logs do servidor');
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem teste:', error.message);
    }
  }
  
  // Monitorar a cada 10 segundos
  console.log('⏰ Iniciando monitoramento...');
  
  // Teste inicial
  await testarWebhook();
  
  // Aguardar 5 segundos e enviar mensagem teste
  setTimeout(async () => {
    await enviarMensagemTeste();
  }, 5000);
  
  // Monitorar continuamente
  const interval = setInterval(async () => {
    await testarWebhook();
  }, 15000);
  
  // Parar após 2 minutos
  setTimeout(() => {
    clearInterval(interval);
    console.log('');
    console.log('🏁 Monitor finalizado');
    console.log('📋 RESUMO:');
    console.log('   - Se a mensagem foi processada: Sistema funcionando!');
    console.log('   - Se não foi processada: Verifique logs do servidor');
    console.log('   - Se não recebeu no frontend: Problema no WebSocket');
  }, 120000);
}

// Executar monitor
monitorarMensagens().catch(console.error); 