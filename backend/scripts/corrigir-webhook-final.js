// 🔧 Corrigir Webhook Evolution API para Local - Sintaxe Correta
// Este script usa a sintaxe exata que a Evolution API v1.6+ espera

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';
const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';

async function makeRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📡 ${method} ${EVOLUTION_API_URL}${endpoint}`);
    if (data) {
      console.log(`📋 Payload:`, JSON.stringify(data, null, 2));
    }
    
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error.message);
    return { success: false, error: error.message };
  }
}

async function corrigirWebhookFinal() {
  console.log('🔧 CORRIGINDO WEBHOOK - SINTAXE CORRETA');
  console.log('='.repeat(50));
  console.log(`🏷️ Instância: ${INSTANCE_NAME}`);
  console.log(`📡 Novo Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  // 1. Verificar webhook atual
  console.log('1️⃣ Verificando webhook atual...');
  await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  console.log('');

  // 2. Usar sintaxe EXATA da Evolution API v1.6+
  console.log('2️⃣ Configurando webhook (sintaxe correta)...');
  const webhookConfig = {
    webhook: {
      url: WEBHOOK_URL,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ],
      webhook_by_events: true,
      webhook_base64: false,
      enabled: true  // <- Esta propriedade estava faltando!
    }
  };
  
  const resultado = await makeRequest(`/webhook/set/${INSTANCE_NAME}`, 'POST', webhookConfig);
  console.log('');

  // 3. Aguardar alguns segundos e verificar
  console.log('3️⃣ Aguardando atualização...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('4️⃣ Verificando configuração final...');
  const webhookFinal = await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  
  if (webhookFinal.success && webhookFinal.data.url === WEBHOOK_URL) {
    console.log('');
    console.log('🎉 SUCESSO! Webhook configurado para localhost!');
    console.log('📱 URL configurada:', webhookFinal.data.url);
    console.log('🔔 Eventos:', webhookFinal.data.events?.join(', '));
    console.log('✅ Habilitado:', webhookFinal.data.enabled);
    console.log('');
    console.log('🧪 COMO TESTAR:');
    console.log('1. Certifique-se que o webhook local está rodando: node webhook-evolution-complete.js');
    console.log('2. Envie uma mensagem WhatsApp para o número conectado');
    console.log('3. Monitore os logs do webhook para ver se recebe a mensagem');
    console.log('4. Verifique se um ticket foi criado no CRM');
  } else {
    console.log('');
    console.log('⚠️ Webhook ainda não foi configurado corretamente.');
    if (webhookFinal.data?.url) {
      console.log(`🔍 URL atual: ${webhookFinal.data.url}`);
      console.log(`📡 URL desejada: ${WEBHOOK_URL}`);
    }
  }
}

// Executar correção
corrigirWebhookFinal().catch(console.error); 