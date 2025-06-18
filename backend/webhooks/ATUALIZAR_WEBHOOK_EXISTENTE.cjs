/**
 * ATUALIZAR WEBHOOK EXISTENTE
 * 
 * Atualiza a configuração de webhook que já existe na Evolution API
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 ATUALIZANDO WEBHOOK EXISTENTE\n');

async function atualizarWebhookExistente() {
  try {
    console.log('🔧 Atualizando configuração de webhook existente...');
    console.log(`📡 URL: ${EVOLUTION_API_URL}/webhook/instance`);
    console.log(`🎯 Instância: ${INSTANCE_NAME}`);
    console.log(`🔗 Nova URL: ${WEBHOOK_URL_LOCAL}`);
    
    // Configuração corrigida
    const webhookConfig = {
      instanceName: INSTANCE_NAME,
      enabled: true,
      url: WEBHOOK_URL_LOCAL,
      webhook_by_events: false,  // IMPORTANTE: desabilitar webhook por eventos
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ]
    };
    
    console.log('📋 Nova configuração:', JSON.stringify(webhookConfig, null, 2));
    
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
    
    console.log('✅ Webhook atualizado com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar webhook:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Erro:', error.message);
    }
    
    return false;
  }
}

async function verificarWebhookAtualizado() {
  try {
    console.log('🔍 Verificando webhook atualizado...');
    
    const response = await axios.get(
      `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Configuração atual do webhook:');
    console.log('📊 Dados:', JSON.stringify(response.data, null, 2));
    
    const config = response.data;
    
    // Verificar se a configuração está correta
    const urlCorreta = config.url === WEBHOOK_URL_LOCAL;
    const eventosDesabilitados = config.webhookByEvents === false;
    const habilitado = config.enabled === true;
    
    console.log('\n📋 VERIFICAÇÃO DA CONFIGURAÇÃO:');
    console.log(`   ✅ URL correta: ${urlCorreta ? 'SIM' : 'NÃO'} (${config.url})`);
    console.log(`   ✅ Webhook por eventos desabilitado: ${eventosDesabilitados ? 'SIM' : 'NÃO'}`);
    console.log(`   ✅ Webhook habilitado: ${habilitado ? 'SIM' : 'NÃO'}`);
    
    if (urlCorreta && eventosDesabilitados && habilitado) {
      console.log('\n🎉 CONFIGURAÇÃO PERFEITA!');
      return true;
    } else {
      console.log('\n⚠️ Configuração precisa de ajustes');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.response?.data || error.message);
    return false;
  }
}

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

async function executarAtualizacao() {
  try {
    console.log('🚀 INICIANDO ATUALIZAÇÃO DO WEBHOOK...\n');
    
    // 1. Verificar se webhook local está funcionando
    const localOk = await testarWebhookLocal();
    
    if (!localOk) {
      console.log('❌ Webhook local não está funcionando!');
      console.log('💡 Execute: node webhook-evolution-complete.js');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Verificar configuração atual
    console.log('📋 VERIFICANDO CONFIGURAÇÃO ATUAL...\n');
    await verificarWebhookAtualizado();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Atualizar webhook
    console.log('🔧 ATUALIZANDO WEBHOOK...\n');
    const sucesso = await atualizarWebhookExistente();
    
    if (sucesso) {
      console.log('\n' + '='.repeat(50));
      
      // 4. Verificar configuração após atualização
      console.log('📋 VERIFICANDO CONFIGURAÇÃO ATUALIZADA...\n');
      const configuracaoOk = await verificarWebhookAtualizado();
      
      if (configuracaoOk) {
        console.log('\n🎉 WEBHOOK ATUALIZADO COM SUCESSO!');
        console.log('\n💡 AGORA TESTE:');
        console.log('   1. Envie uma mensagem WhatsApp para a instância');
        console.log('   2. Verifique os logs do webhook local (deve receber a mensagem)');
        console.log('   3. Confirme se o ticket é criado automaticamente no CRM');
        console.log('   4. Verifique se não há mais erros 404 nos logs da Evolution API');
        
        console.log('\n📱 MONITORAMENTO:');
        console.log('   - Terminal webhook: deve mostrar mensagens recebidas');
        console.log('   - Evolution API: não deve mais mostrar erros 404');
        console.log('   - CRM: deve criar tickets automaticamente');
        
      } else {
        console.log('\n⚠️ Webhook atualizado mas configuração ainda não está perfeita');
      }
      
    } else {
      console.log('\n❌ FALHA NA ATUALIZAÇÃO DO WEBHOOK');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA ATUALIZAÇÃO:', error);
  }
}

// Executar atualização
executarAtualizacao(); 