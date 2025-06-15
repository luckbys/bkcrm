// 🧪 Configurar Webhook para Produção (TESTE TEMPORÁRIO)
// Este script configura o webhook para produção para testar se funciona

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';
const WEBHOOK_PRODUCAO = 'https://bkcrm.devsible.com.br/webhook/evolution';

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

async function configurarProducaoTeste() {
  console.log('🧪 CONFIGURANDO WEBHOOK PARA PRODUÇÃO (TESTE)');
  console.log('='.repeat(50));
  console.log(`🏷️ Instância: ${INSTANCE_NAME}`);
  console.log(`📡 Webhook Produção: ${WEBHOOK_PRODUCAO}`);
  console.log('');
  console.log('⚠️ ATENÇÃO: Isso é apenas um teste!');
  console.log('💡 Se funcionar, confirma que o problema é conectividade local');
  console.log('');

  // 1. Verificar webhook atual
  console.log('1️⃣ Verificando webhook atual...');
  await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  console.log('');

  // 2. Configurar para produção
  console.log('2️⃣ Configurando webhook para PRODUÇÃO...');
  const webhookConfig = {
    webhook: {
      url: WEBHOOK_PRODUCAO,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ],
      webhook_by_events: true,
      webhook_base64: false,
      enabled: true
    }
  };
  
  const resultado = await makeRequest(`/webhook/set/${INSTANCE_NAME}`, 'POST', webhookConfig);
  console.log('');

  // 3. Verificar se funcionou
  console.log('3️⃣ Verificando configuração...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const webhookFinal = await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  
  if (webhookFinal.success && webhookFinal.data.url === WEBHOOK_PRODUCAO) {
    console.log('');
    console.log('✅ SUCESSO! Webhook configurado para produção!');
    console.log('');
    console.log('🧪 TESTE AGORA:');
    console.log('1. Envie uma mensagem WhatsApp para o número conectado');
    console.log('2. Verifique se aparece no CRM de produção');
    console.log('3. Se funcionar, confirma que o problema é conectividade local');
    console.log('');
    console.log('🔄 PARA VOLTAR AO LOCAL:');
    console.log('1. Use ngrok para expor localhost:4000');
    console.log('2. Configure webhook com URL do ngrok');
    console.log('3. Ou faça deploy do webhook em servidor público');
  } else {
    console.log('');
    console.log('❌ Erro ao configurar webhook para produção');
  }
}

// Executar configuração
configurarProducaoTeste().catch(console.error); 