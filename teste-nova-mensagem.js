// 🎯 TESTE NOVA MENSAGEM - Testar broadcast WebSocket
console.log('🎯 Testando se mensagem do WhatsApp aparece no frontend...');

const axios = require('axios');
const io = require('socket.io-client');

// 1. Conectar ao WebSocket como o frontend
const socket = io('http://localhost:4000');
const targetTicket = '788a5f10-a693-4cfa-8410-ed5cd082e555';

socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket (simulando frontend)');
  
  // Juntar-se ao ticket
  socket.emit('join-ticket', { ticketId: targetTicket, userId: 'frontend-test' });
});

socket.on('joined-ticket', (data) => {
  console.log('✅ Juntou-se ao ticket:', data.ticketId);
  
  // Após conectar, aguardar 2 segundos e simular mensagem do WhatsApp
  setTimeout(() => {
    console.log('\n📱 Simulando mensagem do WhatsApp via webhook...');
    
    const whatsappMessage = {
      event: "MESSAGES_UPSERT",
      instance: "atendimento-ao-cliente-suporte",
      data: {
        key: {
          id: "test-whatsapp-" + Date.now(),
          remoteJid: "5512981022013@s.whatsapp.net",
          fromMe: false // IMPORTANTE: Mensagem do cliente
        },
        message: {
          conversation: "🎯 TESTE: Mensagem do cliente WhatsApp para verificar se aparece no frontend!"
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: "Cliente Teste Broadcast"
      }
    };
    
    // Enviar para o webhook
    axios.post('http://localhost:4000/webhook/evolution', whatsappMessage)
      .then(response => {
        console.log('✅ Webhook processou mensagem:', {
          processed: response.data.processed,
          ticketId: response.data.ticketId,
          broadcast: response.data.websocket
        });
        
        if (response.data.processed && response.data.websocket) {
          console.log('✅ Backend confirmou que fez broadcast via WebSocket!');
        } else {
          console.log('❌ Backend NÃO fez broadcast!');
        }
      })
      .catch(error => {
        console.error('❌ Erro no webhook:', error.message);
      });
  }, 2000);
});

// Escutar por novas mensagens (como o frontend faz)
socket.on('new-message', (data) => {
  console.log('\n🎉 SUCESSO! Nova mensagem recebida no frontend:');
  console.log('�� Dados:', {
    id: data.id,
    ticketId: data.ticket_id,
    content: data.content,
    senderName: data.sender_name,
    isFromClient: !data.sender_id,
    timestamp: data.created_at
  });
  
  console.log('\n✅ CONFIRMADO: Sistema está funcionando!');
  console.log('✅ Mensagem do WhatsApp chegou no frontend!');
  
  // Encerrar teste após 1 segundo
  setTimeout(() => {
    console.log('\n🎯 Teste concluído com sucesso!');
    process.exit(0);
  }, 1000);
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout: Mensagem não chegou em 10 segundos');
  console.log('❌ Problema: Backend não está fazendo broadcast ou frontend não está recebendo');
  process.exit(1);
}, 10000);

console.log('🔄 Aguardando conexão WebSocket...'); 