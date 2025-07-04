// 🧪 Teste Direto do Webhook - Simular Evolution API
// Este script testa se o webhook está processando mensagens corretamente

const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution/messages-upsert';

async function testarWebhookDireto() {
  console.log('🧪 TESTE DIRETO DO WEBHOOK');
  console.log('='.repeat(50));
  console.log(`📡 URL: ${WEBHOOK_URL}`);
  console.log('');

  // Simular payload da Evolution API
  const payloadSimulado = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: `test_${Date.now()}`
      },
      message: {
        conversation: 'Olá, esta é uma mensagem de teste!'
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Cliente Teste'
    },
    destination: 'http://localhost:4000/webhook/evolution',
    date_time: new Date().toISOString(),
    sender: '5511999999999@s.whatsapp.net',
    server_url: 'https://press-evolution-api.jhkbgs.easypanel.host'
  };

  try {
    console.log('📤 Enviando payload simulado...');
    console.log('📋 Payload:', JSON.stringify(payloadSimulado, null, 2));
    console.log('');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadSimulado)
    });

    const result = await response.json();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Resposta:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('');
      console.log('✅ SUCESSO! Webhook está funcionando corretamente!');
      console.log('🎯 O problema pode estar na configuração da Evolution API');
      console.log('');
      console.log('🔍 Próximos passos:');
      console.log('1. Verificar se a Evolution API está enviando para a URL correta');
      console.log('2. Verificar logs da Evolution API');
      console.log('3. Testar conectividade da Evolution API para localhost');
    } else {
      console.log('');
      console.log('❌ ERRO! Webhook não está funcionando corretamente');
    }

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    console.log('');
    console.log('🔍 Possíveis causas:');
    console.log('1. Webhook não está rodando na porta 4000');
    console.log('2. Firewall bloqueando conexão');
    console.log('3. Erro no código do webhook');
  }
}

// Executar teste
testarWebhookDireto().catch(console.error); 