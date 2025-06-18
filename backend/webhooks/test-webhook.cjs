const axios = require('axios');

async function testWebhook() {
  try {
    const payload = {
      event: "MESSAGES_UPSERT",
      instance: "atendimento-ao-cliente-sac1",
      data: {
        key: {
          remoteJid: "5512981022013@s.whatsapp.net",
          fromMe: true,
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
    
    const response = await axios.post('http://localhost:4000/webhook/evolution', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    if (error.response) {
      console.error('📥 Resposta de erro:', error.response.data);
    }
  } finally {
    console.log('✅ Teste concluído');
  }
}

testWebhook(); 