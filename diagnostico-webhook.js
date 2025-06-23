const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

async function diagnosticoCompleto() {
  console.log('🚀 DIAGNÓSTICO DO WEBHOOK EVOLUTION API');
  console.log('=======================================\n');

  // 1. Verificar instância
  console.log('1. 🔍 Verificando instância Evolution API...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Instância encontrada:');
      console.log('      Nome:', INSTANCE_NAME);
      console.log('      Estado:', data.state);
      console.log('      Status:', data.state === 'open' ? 'CONECTADA' : 'DESCONECTADA');
    } else {
      console.log('   ❌ Erro ao verificar instância:', data);
    }
  } catch (error) {
    console.log('   ❌ Erro de conexão:', error.message);
  }

  console.log('');

  // 2. Verificar webhook local
  console.log('2. 🧪 Testando servidor webhook local...');
  try {
    const response = await fetch('http://localhost:4000/webhook/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Servidor webhook funcionando:');
      console.log('      Status:', data.status);
      console.log('      Conexões WebSocket:', data.websocket?.connections || 0);
    } else {
      console.log('   ❌ Problema no servidor webhook:', data);
    }
  } catch (error) {
    console.log('   ❌ Servidor webhook não está rodando:', error.message);
  }

  console.log('');

  // 3. Verificar webhook configurado na Evolution API
  console.log('3. 🔍 Verificando webhook configurado na Evolution API...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data = await response.json();
    
    if (response.ok && data.url) {
      console.log('   ✅ Webhook configurado:');
      console.log('      URL:', data.url);
      console.log('      Habilitado:', data.enabled);
      console.log('      Eventos:', data.events);
    } else {
      console.log('   ⚠️ Webhook não configurado ou não encontrado');
    }
  } catch (error) {
    console.log('   ❌ Erro ao verificar webhook:', error.message);
  }

  console.log('');

  // 4. Configurar webhook
  console.log('4. 🔧 Configurando webhook na Evolution API...');
  try {
    const webhookConfig = {
      url: WEBHOOK_URL,
      enabled: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      webhookByEvents: false,
      base64: false
    };

    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ Webhook configurado com sucesso:');
      console.log('      URL:', webhookConfig.url);
      console.log('      Eventos:', webhookConfig.events);
    } else {
      console.log('   ❌ Erro ao configurar webhook:', data);
    }
  } catch (error) {
    console.log('   ❌ Erro ao configurar webhook:', error.message);
  }

  console.log('');

  // 5. Teste de mensagem simulada
  console.log('5. 🧪 Testando webhook com mensagem simulada...');
  try {
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: INSTANCE_NAME,
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'TEST_MESSAGE_' + Date.now()
        },
        message: {
          conversation: '🧪 Mensagem de teste do diagnóstico - ' + new Date().toLocaleString()
        },
        messageTimestamp: Date.now(),
        pushName: 'Cliente Teste Diagnóstico'
      }
    };

    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ Simulação processada com sucesso:');
      console.log('      Recebido:', data.received);
      console.log('      Processado:', data.processed);
      console.log('      Evento:', data.event);
      console.log('      Ticket ID:', data.ticketId);
    } else {
      console.log('   ❌ Erro na simulação:', data);
    }
  } catch (error) {
    console.log('   ❌ Erro ao simular mensagem:', error.message);
  }

  console.log('');
  console.log('📝 PRÓXIMOS PASSOS:');
  console.log('1. Envie uma mensagem WhatsApp real para testar');
  console.log('2. Verifique os logs do servidor webhook (devem aparecer dados completos)');
  console.log('3. As mensagens devem aparecer automaticamente no CRM');
  console.log('4. Se ainda não funcionar, verifique se o webhook está acessível externamente');
  console.log('');
  
  console.log('💡 URLS IMPORTANTES:');
  console.log('- Webhook Local: http://localhost:4000/webhook/evolution');
  console.log('- Health Check: http://localhost:4000/webhook/health');
  console.log('- Evolution API:', EVOLUTION_API_URL);
}

diagnosticoCompleto().catch(console.error); 