// 🔍 Script de Diagnóstico da Instância Evolution API
// Este script verifica o status detalhado da instância e tenta configurar webhook

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';
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

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DA INSTÂNCIA EVOLUTION API');
  console.log('='.repeat(50));
  console.log(`🏷️ Instância: ${INSTANCE_NAME}`);
  console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  // 1. Verificar se a instância existe
  console.log('1️⃣ Listando todas as instâncias...');
  await makeRequest('/instance/fetchInstances');
  console.log('');

  // 2. Verificar status específico da instância
  console.log('2️⃣ Verificando status da instância...');
  await makeRequest(`/instance/connectionState/${INSTANCE_NAME}`);
  console.log('');

  // 3. Verificar webhook atual
  console.log('3️⃣ Verificando webhook atual...');
  await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  console.log('');

  // 4. Tentar configurar webhook simples
  console.log('4️⃣ Tentando configurar webhook...');
  const webhookConfig = {
    url: WEBHOOK_URL,
    events: ['MESSAGES_UPSERT'],
    webhook_by_events: false
  };
  await makeRequest(`/webhook/set/${INSTANCE_NAME}`, 'POST', webhookConfig);
  console.log('');

  // 5. Verificar se a instância está conectada
  console.log('5️⃣ Verificando QR Code (se disponível)...');
  await makeRequest(`/instance/connect/${INSTANCE_NAME}`);
  console.log('');

  // 6. Tentar restart da instância se necessário
  console.log('6️⃣ Tentando restart da instância...');
  await makeRequest(`/instance/restart/${INSTANCE_NAME}`, 'PUT');
  console.log('');

  // 7. Teste final do webhook
  console.log('7️⃣ Verificação final do webhook...');
  await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
}

// Executar diagnóstico
diagnosticar().catch(console.error); 