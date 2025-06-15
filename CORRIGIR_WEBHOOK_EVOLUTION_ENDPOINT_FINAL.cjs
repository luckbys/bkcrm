/**
 * CORREÇÃO FINAL - MÚLTIPLOS ENDPOINTS E MÉTODOS
 * 
 * Tenta diferentes endpoints e métodos HTTP para configurar o webhook
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 CORREÇÃO FINAL - MÚLTIPLOS MÉTODOS\n');

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

async function tentarConfigurarWebhook() {
  const webhookConfig = {
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

  const tentativas = [
    // Tentativa 1: POST /webhook/set/{instance}
    {
      method: 'POST',
      url: `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'POST /webhook/set/{instance}'
    },
    
    // Tentativa 2: PUT /webhook/set/{instance}
    {
      method: 'PUT',
      url: `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'PUT /webhook/set/{instance}'
    },
    
    // Tentativa 3: POST /webhook/{instance}
    {
      method: 'POST',
      url: `${EVOLUTION_API_URL}/webhook/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'POST /webhook/{instance}'
    },
    
    // Tentativa 4: PUT /webhook/{instance}
    {
      method: 'PUT',
      url: `${EVOLUTION_API_URL}/webhook/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'PUT /webhook/{instance}'
    },
    
    // Tentativa 5: POST /instance/webhook/{instance}
    {
      method: 'POST',
      url: `${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'POST /instance/webhook/{instance}'
    },
    
    // Tentativa 6: PUT /instance/webhook/{instance}
    {
      method: 'PUT',
      url: `${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_NAME}`,
      data: webhookConfig,
      description: 'PUT /instance/webhook/{instance}'
    }
  ];

  for (const tentativa of tentativas) {
    try {
      console.log(`🔧 Tentando: ${tentativa.description}`);
      console.log(`   URL: ${tentativa.url}`);
      
      const response = await axios({
        method: tentativa.method,
        url: tentativa.url,
        data: tentativa.data,
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ SUCESSO!');
      console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
      return { sucesso: true, metodo: tentativa.description };
      
    } catch (error) {
      const status = error.response?.status || 'ERR';
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Falhou: ${status} - ${message}`);
    }
    
    console.log(''); // Linha em branco
  }
  
  return { sucesso: false, metodo: null };
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
    
    return { urlCorreta, eventosDesabilitados, habilitado, config };
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.response?.data || error.message);
    return null;
  }
}

async function executarCorrecaoCompleta() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO COMPLETA...\n');
    
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
    const verificacaoInicial = await verificarWebhookFinal();
    
    if (verificacaoInicial && verificacaoInicial.urlCorreta && verificacaoInicial.eventosDesabilitados) {
      console.log('\n🎉 WEBHOOK JÁ ESTÁ CONFIGURADO CORRETAMENTE!');
      console.log('✅ Não é necessário fazer alterações');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Tentar configurar webhook com diferentes métodos
    console.log('🔧 TENTANDO CONFIGURAR WEBHOOK...\n');
    const resultado = await tentarConfigurarWebhook();
    
    console.log('\n' + '='.repeat(50));
    
    if (resultado.sucesso) {
      console.log(`🎉 WEBHOOK CONFIGURADO COM SUCESSO!`);
      console.log(`✅ Método que funcionou: ${resultado.metodo}`);
      
      // 4. Verificar configuração após atualização
      console.log('\n📋 VERIFICANDO CONFIGURAÇÃO FINAL...\n');
      const verificacaoFinal = await verificarWebhookFinal();
      
      if (verificacaoFinal && verificacaoFinal.urlCorreta && verificacaoFinal.eventosDesabilitados) {
        console.log('\n🎉 PROBLEMA RESOLVIDO COMPLETAMENTE!');
        console.log('\n✅ RESULTADOS:');
        console.log('   • Webhook local funcionando na porta 4000');
        console.log('   • Evolution API configurada para usar webhook local');
        console.log('   • Webhook por eventos desabilitado');
        console.log('   • Não haverá mais erros 404');
        
        console.log('\n💡 TESTE AGORA:');
        console.log('   1. Envie uma mensagem WhatsApp para a instância');
        console.log('   2. Verifique os logs do webhook');
        console.log('   3. Confirme se o ticket é criado automaticamente');
        
      } else {
        console.log('\n⚠️ Webhook configurado mas ainda há problemas na verificação');
      }
      
    } else {
      console.log('❌ TODAS AS TENTATIVAS FALHARAM');
      console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
      console.log('   1. Verificar se a versão da Evolution API suporta webhook');
      console.log('   2. Verificar se a API key tem permissões suficientes');
      console.log('   3. Verificar se a instância existe e está ativa');
      console.log('   4. Contatar suporte da Evolution API');
      
      console.log('\n💡 ALTERNATIVA:');
      console.log('   Configure o webhook manualmente através do manager:');
      console.log('   https://press-evolution-api.jhkbgs.easypanel.host/manager');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO COMPLETA:', error);
  }
}

// Executar correção completa
executarCorrecaoCompleta(); 