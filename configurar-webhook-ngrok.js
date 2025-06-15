// 🔧 Configurar Evolution API com URL do Ngrok
// Este script configura o webhook da Evolution API para usar ngrok

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

async function configurarWebhookNgrok() {
  const ngrokUrl = process.argv[2];
  
  if (!ngrokUrl) {
    console.log('❌ URL do ngrok não fornecida!');
    console.log('');
    console.log('📋 USO:');
    console.log('node configurar-webhook-ngrok.js https://abc123.ngrok.io');
    console.log('');
    console.log('🔧 PASSOS:');
    console.log('1. Execute: ngrok http 4000');
    console.log('2. Copie a URL https://xxx.ngrok.io');
    console.log('3. Execute: node configurar-webhook-ngrok.js https://xxx.ngrok.io');
    return;
  }

  console.log('🔧 CONFIGURANDO WEBHOOK COM NGROK');
  console.log('='.repeat(50));
  console.log(`📡 Ngrok URL: ${ngrokUrl}`);
  console.log(`🏢 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`📱 Instância: ${INSTANCE_NAME}`);
  console.log('');

  try {
    // Configuração do webhook
    const webhookConfig = {
      enabled: true,
      url: `${ngrokUrl}/webhook/evolution`,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ],
      webhook_by_events: false,
      webhook_base64: false
    };

    console.log('1️⃣ Configurando webhook...');
    console.log('📋 Configuração:', JSON.stringify(webhookConfig, null, 2));

    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('📋 Resposta:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Erro ao configurar webhook');
      console.log('📊 Status:', response.status);
      console.log('📋 Erro:', JSON.stringify(result, null, 2));
      return;
    }

    // Verificar configuração
    console.log('');
    console.log('2️⃣ Verificando configuração...');
    
    const checkResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const checkResult = await checkResponse.json();

    if (checkResponse.ok) {
      console.log('✅ Configuração verificada!');
      console.log('📋 Webhook ativo:', JSON.stringify(checkResult, null, 2));
    } else {
      console.log('⚠️ Não foi possível verificar configuração');
    }

    console.log('');
    console.log('🎯 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('');
    console.log('📞 **TESTE AGORA:**');
    console.log(`Envie mensagem WhatsApp para: 5512981022013`);
    console.log('');
    console.log('👀 **MONITORAR:**');
    console.log('1. Terminal do webhook: node webhook-evolution-complete.js');
    console.log('2. Terminal do ngrok: ngrok http 4000');
    console.log('3. Logs do webhook mostrarão mensagens chegando');
    console.log('');
    console.log('✅ **RESULTADO ESPERADO:**');
    console.log('• Mensagem chega no webhook local');
    console.log('• Ticket é criado no banco Supabase');
    console.log('• Mensagem aparece no CRM');

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    console.log('');
    console.log('🔍 VERIFICAÇÕES:');
    console.log('1. Ngrok está rodando? (ngrok http 4000)');
    console.log('2. URL do ngrok está correta?');
    console.log('3. Webhook local está rodando? (node webhook-evolution-complete.js)');
  }
}

// Executar configuração
configurarWebhookNgrok().catch(console.error); 