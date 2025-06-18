/**
 * CORREÇÃO FINAL - ENDPOINT CORRETO EVOLUTION API
 * 
 * Usa o endpoint oficial correto: POST /webhook/set/{instance}
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 CORREÇÃO FINAL - ENDPOINT OFICIAL\n');

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

async function configurarWebhookFinal() {
  try {
    console.log('🔧 Configurando webhook com endpoint oficial final...');
    console.log(`📡 URL: ${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`);
    console.log(`🎯 Instância: ${INSTANCE_NAME}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL_LOCAL}`);
    
    // Configuração correta segundo a documentação
    const webhookConfig = {
      enabled: true,
      url: WEBHOOK_URL_LOCAL,
      webhook_by_events: false,  // IMPORTANTE: desabilitar para usar URL única
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'SEND_MESSAGE'
      ]
    };
    
    console.log('📋 Configuração final:', JSON.stringify(webhookConfig, null, 2));
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
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

async function verificarWebhookFinal() {
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
      console.log('🔗 Evolution API agora enviará mensagens para:', WEBHOOK_URL_LOCAL);
      return true;
    } else {
      console.log('\n⚠️ Configuração ainda precisa de ajustes');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.response?.data || error.message);
    return false;
  }
}

async function executarCorrecaoFinal() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO FINAL...\n');
    
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
    await verificarWebhookFinal();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Configurar webhook com endpoint correto
    console.log('🔧 CONFIGURANDO WEBHOOK...\n');
    const sucesso = await configurarWebhookFinal();
    
    if (sucesso) {
      console.log('\n' + '='.repeat(50));
      
      // 4. Verificar configuração após atualização
      console.log('📋 VERIFICANDO CONFIGURAÇÃO FINAL...\n');
      const configuracaoOk = await verificarWebhookFinal();
      
      if (configuracaoOk) {
        console.log('\n🎉 PROBLEMA RESOLVIDO COMPLETAMENTE!');
        console.log('\n✅ RESULTADOS:');
        console.log('   • Webhook local funcionando na porta 4000');
        console.log('   • Evolution API configurada para usar webhook local');
        console.log('   • Webhook por eventos desabilitado (sem /messages-upsert)');
        console.log('   • Não haverá mais erros 404');
        
        console.log('\n💡 TESTE AGORA:');
        console.log('   1. Envie uma mensagem WhatsApp para a instância');
        console.log('   2. Verifique os logs do webhook (deve receber a mensagem)');
        console.log('   3. Confirme se o ticket é criado automaticamente no CRM');
        
        console.log('\n📱 MONITORAMENTO:');
        console.log('   - Terminal webhook: deve mostrar mensagens recebidas');
        console.log('   - Evolution API: não deve mais mostrar erros 404');
        console.log('   - CRM: deve criar tickets automaticamente');
        
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('   1. Para produção: configure webhook público no servidor');
        console.log('   2. Para desenvolvimento: mantenha webhook local funcionando');
        
      } else {
        console.log('\n⚠️ Webhook configurado mas ainda há problemas');
      }
      
    } else {
      console.log('\n❌ FALHA NA CONFIGURAÇÃO FINAL');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO FINAL:', error);
  }
}

// Executar correção final
executarCorrecaoFinal(); 