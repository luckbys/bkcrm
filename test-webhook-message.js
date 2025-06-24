const axios = require('axios');
const io = require('socket.io-client');

// Conectar ao WebSocket para testar diretamente
const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('🔗 Conectado ao WebSocket para teste');
  
  // Juntar-se ao ticket que está ativo
  const ticketId = '788a5f10-a693-4cfa-8410-ed5cd082e555';
  console.log(`🎯 Juntando-se ao ticket ${ticketId}...`);
  socket.emit('join-ticket', { ticketId, userId: 'test-user' });
  
  // Após 2 segundos, simular mensagem do WhatsApp para este ticket específico
  setTimeout(() => {
    console.log('📨 Simulando mensagem do cliente via WebSocket...');
    
    const newMessage = {
      id: `whatsapp-${Date.now()}`,
      ticket_id: ticketId,
      content: 'Olá! Esta é uma mensagem teste direta do WhatsApp!',
      sender_id: null, // Cliente não tem sender_id
      sender_name: 'Cliente WhatsApp Teste',
      is_internal: false,
      created_at: new Date().toISOString(),
      type: 'text'
    };
    
    // Transmitir via WebSocket como se fosse do webhook
    socket.emit('new-message', newMessage);
    console.log('✅ Mensagem enviada via WebSocket!');
    
    // Verificar estatísticas
    setTimeout(() => {
      axios.get('http://localhost:4000/webhook/ws-stats')
        .then(response => {
          console.log('📊 Estatísticas WebSocket:', response.data);
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Erro ao obter estatísticas:', err.message);
          process.exit(1);
        });
    }, 1000);
    
  }, 2000);
});

socket.on('joined-ticket', (data) => {
  console.log('✅ Juntou-se ao ticket:', data);
});

socket.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error);
});

// Também testar via webhook tradicional
const testMessage = {
  event: "MESSAGES_UPSERT",
  instance: "atendimento-ao-cliente-suporte",
  data: {
    key: {
      id: "test-message-" + Date.now(),
      remoteJid: "5512981022013@s.whatsapp.net",
      fromMe: false
    },
    message: {
      conversation: "Esta é uma mensagem de teste via webhook!"
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: "Cliente Webhook Teste"
  }
};

// Testar webhook após 5 segundos
setTimeout(async () => {
  try {
    console.log('🧪 Testando também via webhook...');
    const response = await axios.post('http://localhost:4000/webhook/evolution', testMessage);
    console.log('✅ Resposta webhook:', response.data);
  } catch (error) {
    console.error('❌ Erro webhook:', error.message);
  }
}, 5000); 