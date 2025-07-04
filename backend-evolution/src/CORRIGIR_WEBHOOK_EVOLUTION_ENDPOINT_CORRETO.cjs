/**
 * CORREÇÃO - ENDPOINT CORRETO EVOLUTION API
 * 
 * Usa o endpoint correto para configurar webhooks na Evolution API
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 CORRIGINDO WEBHOOK COM ENDPOINT CORRETO\n');

async function testarWebhookLocal() {
  try {
    console.log('🧪 Testando webhook local...');
    
    const response = await axios.get('http://localhost:4000/webhook/health');
    console.log('✅ Webhook local funcionando:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Webhook local não está funcionando:', error.message);
    return false;
  }
}

async function configurarWebhookV1() {
  try {
    console.log('🔧 Tentativa 1: Endpoint /webhook/set...');
    
    const webhookConfig = {
      webhook: {
        url: WEBHOOK_URL_LOCAL,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        webhook_by_events: false,
        webhook_base64: false
      }
    };
    
    const response = await axios.put(
      `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configurado (v1):', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro v1:', error.response?.data || error.message);
    return false;
  }
}

async function configurarWebhookV2() {
  try {
    console.log('🔧 Tentativa 2: Endpoint /webhook...');
    
    const webhookConfig = {
      url: WEBHOOK_URL_LOCAL,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      webhook_by_events: false,
      webhook_base64: false
    };
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/webhook/${INSTANCE_NAME}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configurado (v2):', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro v2:', error.response?.data || error.message);
    return false;
  }
}

async function configurarWebhookV3() {
  try {
    console.log('🔧 Tentativa 3: Endpoint /instance/webhook...');
    
    const webhookConfig = {
      webhook: {
        url: WEBHOOK_URL_LOCAL,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        webhook_by_events: false,
        webhook_base64: false
      }
    };
    
    const response = await axios.put(
      `${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_NAME}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configurado (v3):', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro v3:', error.response?.data || error.message);
    return false;
  }
}

async function configurarWebhookV4() {
  try {
    console.log('🔧 Tentativa 4: Endpoint /instance/settings...');
    
    const webhookConfig = {
      webhook: {
        url: WEBHOOK_URL_LOCAL,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
      }
    };
    
    const response = await axios.put(
      `${EVOLUTION_API_URL}/instance/settings/${INSTANCE_NAME}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configurado (v4):', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro v4:', error.response?.data || error.message);
    return false;
  }
}

async function listarEndpoints() {
  try {
    console.log('📋 Tentando descobrir endpoints disponíveis...');
    
    // Tentar alguns endpoints comuns para ver quais existem
    const endpoints = [
      '/instance',
      '/webhook',
      '/instance/fetchInstances',
      '/instance/connect',
      '/instance/logout'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${EVOLUTION_API_URL}${endpoint}`, {
          headers: { 'apikey': API_KEY }
        });
        console.log(`✅ ${endpoint} - OK`);
      } catch (error) {
        const status = error.response?.status || 'ERR';
        console.log(`❌ ${endpoint} - ${status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar endpoints:', error.message);
  }
}

async function executarCorrecao() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO COM ENDPOINT CORRETO...\n');
    
    // 1. Verificar se webhook local está funcionando
    const localOk = await testarWebhookLocal();
    
    if (!localOk) {
      console.log('❌ Webhook local não está funcionando!');
      console.log('💡 Execute: node webhook-evolution-complete.js');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Listar endpoints disponíveis
    await listarEndpoints();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Tentar diferentes endpoints para configurar webhook
    const tentativas = [
      configurarWebhookV1,
      configurarWebhookV2,
      configurarWebhookV3,
      configurarWebhookV4
    ];
    
    let sucesso = false;
    
    for (const tentativa of tentativas) {
      const resultado = await tentativa();
      if (resultado) {
        sucesso = true;
        break;
      }
      console.log(''); // Linha em branco entre tentativas
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (sucesso) {
      console.log('🎉 WEBHOOK CONFIGURADO COM SUCESSO!');
      console.log('\n💡 TESTE AGORA:');
      console.log('   1. Envie uma mensagem WhatsApp');
      console.log('   2. Verifique os logs do webhook');
      console.log('   3. Confirme se o ticket é criado no CRM');
    } else {
      console.log('❌ TODAS AS TENTATIVAS FALHARAM');
      console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
      console.log('   1. Verificar documentação da Evolution API');
      console.log('   2. Verificar se a API key está correta');
      console.log('   3. Verificar se a instância existe e está ativa');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO:', error);
  }
}

// Executar correção
executarCorrecao(); 