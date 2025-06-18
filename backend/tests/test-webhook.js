const axios = require('axios');

async function testWebhook() {
  try {
    const payload = {
      instance: "atendimento-ao-cliente-sac1",
      data: {
        key: {
          remoteJid: "5512981022013@s.whatsapp.net",
          fromMe: false,
          id: "test123"
        },
        pushName: "Lucas Borges",
        message: {
          conversation: "Mensagem de teste"
        }
      }
    };

    console.log('🚀 Iniciando teste do webhook...');
    console.log('📤 Enviando mensagem de teste:', JSON.stringify(payload, null, 2));
    
    console.log('🔄 Fazendo requisição para http://localhost:4000/webhook/evolution/messages-upsert');
    const response = await axios.post('http://localhost:4000/webhook/evolution/messages-upsert', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Headers da resposta:', response.headers);
    console.log('📥 Dados da resposta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    if (error.response) {
      console.error('📥 Status do erro:', error.response.status);
      console.error('📥 Headers do erro:', error.response.headers);
      console.error('📥 Dados do erro:', error.response.data);
    }
  }
}

testWebhook(); 