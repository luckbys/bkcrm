// Script de teste para verificar se webhook esta processando mensagens corretamente
// Simula mensagem chegando da Evolution API

const fetch = require('node-fetch');

console.log('🧪 Testando webhook /messages-upsert...\n');

// Payload de teste simulando mensagem do WhatsApp
const testPayload = {
  instance: 'atendimento-ao-cliente-suporte',
  data: {
    key: {
      remoteJid: '5511999998888@s.whatsapp.net',
      fromMe: false,
      id: 'TEST_MESSAGE_' + Date.now()
    },
    message: {
      conversation: 'Oi, preciso de ajuda com meu pedido'
    },
    pushName: 'Cliente Teste',
    messageTimestamp: Math.floor(Date.now() / 1000)
  }
};

async function testarWebhook() {
  try {
    console.log('📤 Enviando mensagem de teste para /messages-upsert...');
    
    const response = await fetch('http://localhost:4000/messages-upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log('📥 Resposta do webhook:');
    console.log('   Status:', response.status);
    console.log('   Received:', result.received);
    console.log('   Processed:', result.processed);
    console.log('   Ticket ID:', result.ticketId);
    console.log('   Message:', result.message);
    console.log('   Endpoint:', result.endpoint);
    
    if (response.ok && result.processed) {
      console.log('\n✅ SUCESSO: Webhook esta processando mensagens corretamente!');
      console.log('🎫 Ticket criado/atualizado:', result.ticketId);
    } else {
      console.log('\n❌ ERRO: Webhook nao processou a mensagem');
      console.log('📋 Detalhes:', result);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO ao testar webhook:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 CAUSA PROVAVEL: Servidor webhook nao esta rodando na porta 4000');
      console.log('💡 SOLUCAO: Execute "npm start" em outro terminal');
    }
  }
}

// Executar teste
testarWebhook(); 