// 🔧 Corrigir Webhook Evolution API para Local
// Este script corrige o webhook da instância para apontar para localhost

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

async function corrigirWebhook() {
  console.log('🔧 CORRIGINDO WEBHOOK PARA LOCAL');
  console.log('='.repeat(50));
  console.log(`🏷️ Instância: ${INSTANCE_NAME}`);
  console.log(`📡 Novo Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  // 1. Verificar webhook atual
  console.log('1️⃣ Verificando webhook atual...');
  const webhookAtual = await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  console.log('');

  // 2. Tentar a sintaxe completa do Evolution API v1.6+
  console.log('2️⃣ Configurando webhook (sintaxe v1.6+)...');
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
      webhook_base64: false
    }
  };
  
  const resultado = await makeRequest(`/webhook/set/${INSTANCE_NAME}`, 'POST', webhookConfig);
  console.log('');

  // 3. Se falhou, tentar sintaxe alternativa
  if (!resultado.success) {
    console.log('3️⃣ Tentando sintaxe alternativa...');
    const webhookConfigAlt = {
      url: WEBHOOK_URL,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ],
      webhook_by_events: true,
      webhook_base64: false
    };
    
    await makeRequest(`/webhook/set/${INSTANCE_NAME}`, 'POST', webhookConfigAlt);
    console.log('');
  }

  // 4. Verificar se funcionou
  console.log('4️⃣ Verificando configuração final...');
  const webhookFinal = await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  
  if (webhookFinal.success && webhookFinal.data.url === WEBHOOK_URL) {
    console.log('');
    console.log('🎉 SUCESSO! Webhook configurado corretamente para localhost!');
    console.log('📲 Agora envie uma mensagem WhatsApp para testar');
    console.log('👀 Monitore os logs do webhook local: node webhook-evolution-complete.js');
  } else {
    console.log('');
    console.log('⚠️ Webhook pode não ter sido configurado corretamente.');
    console.log('🔍 Verifique a documentação da Evolution API');
  }
}

// Executar correção
corrigirWebhook().catch(console.error); 