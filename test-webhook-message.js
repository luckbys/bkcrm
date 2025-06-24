const axios = require('axios');

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
      conversation: "Olá, esta é uma mensagem de teste do cliente!"
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: "Cliente Teste Debug"
  }
};

async function testWebhook() {
  try {
    console.log('🧪 Enviando mensagem de teste para o webhook...');
    console.log('📦 Payload:', JSON.stringify(testMessage, null, 2));
    
    const response = await axios.post('http://localhost:4000/webhook/evolution', testMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    
    console.log('✅ Resposta do webhook:', result);
    
    if (result.processed) {
      console.log('🎉 Mensagem processada com sucesso!');
      console.log(`📋 Ticket ID: ${result.ticketId}`);
      console.log(`📨 WebSocket broadcast: ${result.websocket}`);
    } else {
      console.log('❌ Erro no processamento:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWebhook(); 