// 🧪 TESTE AGORA - Enviar mensagem de teste

const axios = require('axios');

async function testeAgora() {
  try {
    const testMessage = {
      event: 'messages.upsert',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: `test-agora-${Date.now()}`,
          remoteJid: '5512981022013@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: `🎯 TESTE AGORA - ${new Date().toLocaleTimeString()} - Frontend deve receber!`
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Teste Agora'
      }
    };

    console.log('📨 Enviando mensagem de teste...');
    const response = await axios.post('http://localhost:4000/webhook/evolution', testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📊 Response:', response.data);
      console.log('');
      console.log('🎯 AGORA FAÇA NO NAVEGADOR:');
      console.log('1. Abra o chat do ticket 788a5f10-a693-4cfa-8410-ed5cd082e555');
      console.log('2. Clique no botão ⚡ (reconectar WebSocket) se status estiver OFF');
      console.log('3. Aguarde aparecer "WS: 🟢 ON"');
      console.log('4. A mensagem deve aparecer automaticamente!');
    } else {
      console.log('❌ Erro na resposta:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testeAgora(); 