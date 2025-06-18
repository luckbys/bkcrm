// 🧪 Teste do Servidor Webhook Local
// Este script simula um webhook da Evolution API para testar se o servidor está funcionando

const WEBHOOK_LOCAL_URL = 'http://localhost:4000/webhook/evolution';

// Payload de exemplo do webhook MESSAGES_UPSERT
const webhookPayload = {
  event: 'MESSAGES_UPSERT',
  instance: 'atendimento-ao-cliente-sac1',
  data: {
    key: {
      remoteJid: '5511999887766@s.whatsapp.net',
      fromMe: false,
      id: 'BAE5EXAMPLE123456789'
    },
    pushName: 'Cliente Teste',
    message: {
      conversation: 'Olá! Preciso de ajuda com um problema.'
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  },
  destination: 'https://bkcrm.devsible.com.br/webhook/evolution',
  date_time: new Date().toISOString(),
  sender: '5511999887766@s.whatsapp.net',
  server_url: 'https://press-evolution-api.jhkbgs.easypanel.host',
  apikey: '429683C4C977415CAAFCCE10F7D57E11'
};

// Função para testar o webhook
async function testarWebhook() {
  console.log('🧪 Testando servidor webhook local...');
  console.log(`📡 URL: ${WEBHOOK_LOCAL_URL}`);
  console.log('');

  try {
    // 1. Teste de health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch('http://localhost:4000/health', {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check OK:', healthData);
    } else {
      console.log('❌ Health check falhou:', healthResponse.status);
      return;
    }

    console.log('');

    // 2. Teste de webhook endpoint
    console.log('2️⃣ Testando endpoint principal...');
    const rootResponse = await fetch('http://localhost:4000', {
      method: 'GET'
    });
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Endpoint principal OK:', rootData);
    } else {
      console.log('❌ Endpoint principal falhou:', rootResponse.status);
    }

    console.log('');

    // 3. Teste do webhook simulado
    console.log('3️⃣ Enviando webhook simulado...');
    console.log('📨 Payload:', {
      event: webhookPayload.event,
      instance: webhookPayload.instance,
      cliente: webhookPayload.data.pushName,
      mensagem: webhookPayload.data.message.conversation
    });

    const webhookResponse = await fetch(WEBHOOK_LOCAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook processado com sucesso!');
      console.log('📝 Resposta:', webhookData);
      
      if (webhookData.ticketId) {
        console.log(`🎫 Ticket criado/atualizado: ${webhookData.ticketId}`);
      }
    } else {
      console.log('❌ Webhook falhou:', webhookResponse.status);
      const errorText = await webhookResponse.text();
      console.log('📄 Erro:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }

  console.log('\n🔍 Próximos passos:');
  console.log('1. Verifique os logs do servidor webhook');
  console.log('2. Verifique se o ticket foi criado no banco de dados');
  console.log('3. Configure a Evolution API para usar um serviço de túnel (ngrok, etc)');
}

// Executar teste
testarWebhook().catch(console.error); 