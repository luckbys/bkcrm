/**
 * CORREÇÃO - ENDPOINT OFICIAL EVOLUTION API V2
 * 
 * Usa o endpoint oficial correto: POST /webhook/instance
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 CORRIGINDO WEBHOOK COM ENDPOINT OFICIAL V2\n');

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

async function configurarWebhookOficial() {
  try {
    console.log('🔧 Configurando webhook com endpoint oficial...');
    console.log(`📡 URL: ${EVOLUTION_API_URL}/webhook/instance`);
    console.log(`🎯 Instância: ${INSTANCE_NAME}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL_LOCAL}`);
    
    const webhookConfig = {
      instanceName: INSTANCE_NAME,
      enabled: true,
      url: WEBHOOK_URL_LOCAL,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ]
    };
    
    console.log('📋 Configuração:', JSON.stringify(webhookConfig, null, 2));
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/webhook/instance`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook configurado com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Erro:', error.message);
    }
    
    return false;
  }
}

async function verificarWebhookConfigurado() {
  try {
    console.log('🔍 Verificando webhook configurado...');
    
    const response = await axios.get(
      `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook encontrado:');
    console.log('📊 Configuração atual:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Erro:', error.message);
    }
    
    return null;
  }
}

async function executarCorrecao() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO COM ENDPOINT OFICIAL...\n');
    
    // 1. Verificar se webhook local está funcionando
    const localOk = await testarWebhookLocal();
    
    if (!localOk) {
      console.log('❌ Webhook local não está funcionando!');
      console.log('💡 Execute: node webhook-evolution-complete.js');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Verificar configuração atual do webhook
    console.log('📋 VERIFICANDO CONFIGURAÇÃO ATUAL...\n');
    const webhookAtual = await verificarWebhookConfigurado();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Configurar webhook com endpoint oficial
    console.log('🔧 CONFIGURANDO WEBHOOK...\n');
    const sucesso = await configurarWebhookOficial();
    
    console.log('\n' + '='.repeat(50));
    
    if (sucesso) {
      console.log('🎉 WEBHOOK CONFIGURADO COM SUCESSO!');
      
      // 4. Verificar configuração após mudança
      console.log('\n📋 VERIFICANDO NOVA CONFIGURAÇÃO...\n');
      await verificarWebhookConfigurado();
      
      console.log('\n💡 TESTE AGORA:');
      console.log('   1. Envie uma mensagem WhatsApp para a instância');
      console.log('   2. Verifique os logs do webhook local');
      console.log('   3. Confirme se o ticket é criado automaticamente no CRM');
      
      console.log('\n📱 MONITORAMENTO:');
      console.log('   - Logs do webhook: verifique o terminal onde está rodando o webhook');
      console.log('   - Logs da Evolution API: verifique se não há mais erros 404');
      console.log('   - CRM: verifique se novos tickets aparecem automaticamente');
      
    } else {
      console.log('❌ FALHA NA CONFIGURAÇÃO DO WEBHOOK');
      console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
      console.log('   1. Verificar se a API key está correta');
      console.log('   2. Verificar se a instância existe e está ativa');
      console.log('   3. Verificar se o servidor Evolution API está acessível');
      console.log('   4. Verificar se o webhook local está realmente funcionando');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO:', error);
  }
}

// Executar correção
executarCorrecao(); 