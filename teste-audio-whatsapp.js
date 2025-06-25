// 🎵 SCRIPT DE TESTE PARA MENSAGENS DE ÁUDIO DO WHATSAPP
// Este script simula uma mensagem de áudio recebida do WhatsApp

const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';
const TEST_PHONE = '5512981022013';

async function testAudioMessage() {
  console.log('🎵 [TESTE] Iniciando teste de mensagem de áudio...');
  
  // Simular payload de áudio do WhatsApp
  const audioPayload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        id: `test-audio-${Date.now()}`,
        remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
        fromMe: false,
        participant: `${TEST_PHONE}@s.whatsapp.net`
      },
      message: {
        audioMessage: {
          key: {
            remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
            id: `audio-${Date.now()}`
          },
          seconds: 15,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: false,
          url: 'https://example.com/audio.ogg'
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Cliente Teste Áudio',
      status: 'PENDING'
    },
    destination: 'https://bkcrm.devsible.com.br/webhook',
    date_time: new Date().toISOString(),
    sender: `${TEST_PHONE}@s.whatsapp.net`,
    server_url: 'https://press-evolution-api.jhkbgs.easypanel.host',
    apikey: '5CFA92D7-A434-43E8-8D3F-2482FA7E1B28'
  };

  try {
    console.log('📤 [TESTE] Enviando payload de áudio para webhook...');
    console.log('📋 [TESTE] Dados do áudio:', {
      duration: audioPayload.data.message.audioMessage.seconds + 's',
      mimetype: audioPayload.data.message.audioMessage.mimetype,
      messageId: audioPayload.data.key.id
    });

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(audioPayload)
    });

    const result = await response.json();
    
    console.log('✅ [TESTE] Resposta do webhook:', {
      status: response.status,
      success: result.success,
      messageId: result.messageId,
      ticketId: result.ticketId
    });

    if (result.success) {
      console.log('🎉 [TESTE] Mensagem de áudio processada com sucesso!');
      console.log('📱 [TESTE] Verifique no frontend se o player de áudio aparece');
      console.log('🔗 [TESTE] URL esperada do áudio:', `https://press-evolution-api.jhkbgs.easypanel.host/chat/getBase64FromMediaMessage/${TEST_PHONE}@s.whatsapp.net/${audioPayload.data.message.audioMessage.key.id}`);
    } else {
      console.log('❌ [TESTE] Erro ao processar mensagem de áudio:', result.error);
    }

  } catch (error) {
    console.error('❌ [TESTE] Erro na requisição:', error.message);
  }
}

// Teste de mensagem de texto normal para comparação
async function testTextMessage() {
  console.log('\n📝 [TESTE] Iniciando teste de mensagem de texto...');
  
  const textPayload = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        id: `test-text-${Date.now()}`,
        remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
        fromMe: false
      },
      message: {
        conversation: '🎵 Teste: Esta é uma mensagem de texto normal para comparação com áudio'
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Cliente Teste Texto'
    }
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(textPayload)
    });

    const result = await response.json();
    console.log('✅ [TESTE] Mensagem de texto processada:', result.success ? 'Sucesso' : 'Erro');
  } catch (error) {
    console.error('❌ [TESTE] Erro na mensagem de texto:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 [TESTE] Iniciando testes de mensagens WhatsApp...\n');
  
  await testTextMessage();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
  await testAudioMessage();
  
  console.log('\n✅ [TESTE] Testes concluídos!');
  console.log('📋 [TESTE] Verifique no frontend:');
  console.log('   1. Mensagem de texto deve aparecer normalmente');
  console.log('   2. Mensagem de áudio deve mostrar player de áudio');
  console.log('   3. Player deve ter botão play/pause e barra de progresso');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { testAudioMessage, testTextMessage, runTests }; 