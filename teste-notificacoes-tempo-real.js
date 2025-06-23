const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarNotificacoesTempoReal() {
  console.log('🧪 TESTANDO SISTEMA DE NOTIFICAÇÕES EM TEMPO REAL');
  console.log('================================================');
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://bkcrm.devsible.com.br' 
    : 'http://localhost:4000';
  
  console.log('🌐 URL Base:', baseUrl);
  
  // 1. Testar webhook de produção
  console.log('\n1. 📡 Testando webhook de produção...');
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_NOTIFICACAO_' + Date.now()
      },
      message: {
        conversation: '🧪 Teste notificação tempo real: ' + new Date().toLocaleString()
      },
      messageTimestamp: Date.now(),
      pushName: 'Cliente Teste Notificação'
    }
  };

  try {
    const response = await fetch(`${baseUrl}/webhook/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log('📊 Resultado Webhook:');
    console.log('   Status:', response.status);
    console.log('   Processado:', data.processed);
    console.log('   Ticket ID:', data.ticketId);
    console.log('   WebSocket:', data.websocket);
    console.log('   Mensagem:', data.message);
    
    if (data.processed === true) {
      console.log('✅ Webhook funcionando!');
      
      // 2. Testar WebSocket
      console.log('\n2. 🔗 Testando WebSocket...');
      
      const wsUrl = process.env.NODE_ENV === 'production'
        ? 'https://ws.bkcrm.devsible.com.br'
        : 'http://localhost:4000';
      
      console.log('🔌 WebSocket URL:', wsUrl);
      console.log('💡 Para testar WebSocket, abra o navegador e:');
      console.log('   1. Vá para o CRM');
      console.log('   2. Abra o console (F12)');
      console.log('   3. Execute: testWebSocketConnection()');
      console.log('   4. Envie uma mensagem WhatsApp');
      console.log('   5. Veja se aparece notificação instantânea');
      
    } else {
      console.log('❌ Webhook não processou a mensagem');
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
  
  // 3. Instruções para teste manual
  console.log('\n3. 📋 INSTRUÇÕES PARA TESTE MANUAL:');
  console.log('=====================================');
  console.log('');
  console.log('🔧 Para testar notificações em tempo real:');
  console.log('');
  console.log('1. Abra o CRM no navegador');
  console.log('2. Verifique se o ícone de notificação aparece no header');
  console.log('3. Envie uma mensagem WhatsApp para o número configurado');
  console.log('4. A mensagem deve aparecer instantaneamente no CRM');
  console.log('5. Uma notificação toast deve aparecer na tela');
  console.log('6. O contador de notificações deve incrementar');
  console.log('');
  console.log('🎯 RESULTADO ESPERADO:');
  console.log('- Mensagem aparece sem recarregar a página');
  console.log('- Notificação toast aparece');
  console.log('- Contador de notificações atualiza');
  console.log('- Notificação push do navegador (se permitido)');
  console.log('');
  console.log('✅ SISTEMA PRONTO PARA TESTE!');
}

// Função para testar WebSocket no navegador
const testWebSocketConnection = `
function testWebSocketConnection() {
  console.log('🔗 Testando conexão WebSocket...');
  
  const WEBSOCKET_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://ws.bkcrm.devsible.com.br';
  
  const socket = io(WEBSOCKET_URL, {
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ WebSocket conectado!');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ WebSocket desconectado');
  });
  
  socket.on('new-message', (message) => {
    console.log('📨 Nova mensagem recebida:', message);
    console.log('🎉 Notificação deve aparecer na tela!');
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ Erro de conexão:', error);
  });
  
  return socket;
}

// Executar teste
const socket = testWebSocketConnection();
console.log('🧪 Teste WebSocket iniciado. Envie uma mensagem WhatsApp agora!');
`;

console.log('\n📝 Função para testar no navegador:');
console.log(testWebSocketConnection);

testarNotificacoesTempoReal().catch(console.error); 