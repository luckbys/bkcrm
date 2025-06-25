// 🎵 TESTE SIMPLES DE ÁUDIO WHATSAPP
const fetch = require('node-fetch');

async function testAudio() {
  console.log('🎵 Testando mensagem de áudio...');
  
  const payload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        id: `audio-test-${Date.now()}`,
        remoteJid: '5512981022013@s.whatsapp.net',
        fromMe: false
      },
      message: {
        audioMessage: {
          key: {
            remoteJid: '5512981022013@s.whatsapp.net',
            id: `audio-${Date.now()}`
          },
          seconds: 30,
          mimetype: 'audio/ogg; codecs=opus'
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste Áudio'
    }
  };

  try {
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('✅ Resultado:', result);
    
    if (result.ticketId) {
      console.log('🎉 Áudio processado! Ticket ID:', result.ticketId);
      console.log('📱 Verifique no frontend se aparece o player de áudio');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAudio(); 