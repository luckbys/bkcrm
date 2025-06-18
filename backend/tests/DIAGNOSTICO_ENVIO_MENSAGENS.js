// ========================================
// DIAGNÓSTICO COMPLETO - ENVIO DE MENSAGENS EVOLUTION API
// ========================================

console.log('🔍 INICIANDO DIAGNÓSTICO DE ENVIO DE MENSAGENS...');

// 1. VERIFICAR CONFIGURAÇÕES EVOLUTION API
async function verificarConfiguracoes() {
  console.log('\n📋 1. VERIFICANDO CONFIGURAÇÕES...');
  
  // URLs que devem funcionar
  const URLs = {
    webhookLocal: 'http://localhost:4000',
    webhookProd: 'https://bkcrm.devsible.com.br',
    evolutionAPI: 'https://press-evolution-api.jhkbgs.easypanel.host'
  };
  
  console.log('URLs configuradas:', URLs);
  
  // Detectar ambiente atual
  const isLocal = window.location.hostname === 'localhost';
  const webhookURL = isLocal ? URLs.webhookLocal : URLs.webhookProd;
  
  console.log(`🌐 Ambiente detectado: ${isLocal ? 'LOCAL' : 'PRODUÇÃO'}`);
  console.log(`📡 Webhook URL ativa: ${webhookURL}`);
  
  return { URLs, webhookURL, isLocal };
}

// 2. TESTAR SAÚDE DO WEBHOOK
async function testarSaudeWebhook(webhookURL) {
  console.log('\n🏥 2. TESTANDO SAÚDE DO WEBHOOK...');
  
  try {
    const response = await fetch(`${webhookURL}/webhook/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook está funcionando:', data);
      return { success: true, data };
    } else {
      console.error('❌ Webhook retornou erro:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com webhook:', error.message);
    return { success: false, error: error.message };
  }
}

// 3. TESTAR ENDPOINT DE ENVIO
async function testarEndpointEnvio(webhookURL) {
  console.log('\n📤 3. TESTANDO ENDPOINT DE ENVIO...');
  
  const payloadTeste = {
    phone: '5511999999999',
    text: 'TESTE DIAGNÓSTICO - Esta é uma mensagem de teste para verificar o funcionamento do sistema',
    instance: 'atendimento-ao-cliente-suporte',
    options: {
      delay: 1000,
      presence: 'composing',
      linkPreview: false
    }
  };
  
  console.log('📋 Payload de teste:', payloadTeste);
  
  try {
    console.log(`🎯 Fazendo requisição para: ${webhookURL}/webhook/send-message`);
    
    const response = await fetch(`${webhookURL}/webhook/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadTeste)
    });
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Resposta bruta:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📋 Resposta parsada:', data);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError.message);
      return { success: false, error: 'Resposta não é JSON válido', rawResponse: responseText };
    }
    
    if (response.ok) {
      console.log('✅ Endpoint de envio respondeu corretamente');
      return { success: true, data, status: response.status };
    } else {
      console.error('❌ Endpoint de envio retornou erro');
      return { success: false, data, status: response.status };
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição de envio:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. VERIFICAR CONFIGURAÇÕES EVOLUTION API
async function verificarEvolutionAPI() {
  console.log('\n🔧 4. VERIFICANDO EVOLUTION API...');
  
  // Configurações que devem estar definidas
  const configs = {
    EVOLUTION_API_URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
    EVOLUTION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11', // ⚠️ Deve ser configurada corretamente
    EVOLUTION_DEFAULT_INSTANCE: 'atendimento-ao-cliente-suporte'
  };
  
  console.log('📋 Configurações Evolution API necessárias:');
  Object.entries(configs).forEach(([key, value]) => {
    const isKey = key.includes('KEY');
    const displayValue = isKey ? (value ? '***configurada***' : '❌ NÃO CONFIGURADA') : value;
    console.log(`   ${key}: ${displayValue}`);
  });
  
  return configs;
}

// 5. TESTAR INSTÂNCIA EVOLUTION
async function testarInstanciaEvolution(webhookURL) {
  console.log('\n🔌 5. TESTANDO INSTÂNCIA EVOLUTION...');
  
  try {
    // Testar se a instância está conectada via nosso webhook
    const response = await fetch(`${webhookURL}/webhook/check-instance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instance: 'atendimento-ao-cliente-suporte'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Status da instância:', data);
      return { success: true, data };
    } else {
      console.warn('⚠️ Endpoint de verificação de instância não disponível');
      return { success: false, error: 'Endpoint não disponível' };
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível verificar instância:', error.message);
    return { success: false, error: error.message };
  }
}

// 6. VERIFICAR LOGS DO CONSOLE
function verificarLogsConsole() {
  console.log('\n📝 6. INSTRUÇÕES PARA VERIFICAR LOGS...');
  
  console.log('🔍 Para diagnosticar problemas, verifique:');
  console.log('   1. Console do navegador (F12) para erros de frontend');
  console.log('   2. Logs do servidor webhook (terminal onde roda o webhook)');
  console.log('   3. Logs da Evolution API');
  
  console.log('\n🚨 ERROS COMUNS:');
  console.log('   ❌ CORS: Problema de política de origem cruzada');
  console.log('   ❌ 404: Endpoint não encontrado ou webhook offline');
  console.log('   ❌ 500: Erro interno no servidor webhook');
  console.log('   ❌ 401: API Key da Evolution API inválida');
  console.log('   ❌ Timeout: Instância Evolution desconectada');
}

// 7. FUNÇÃO PRINCIPAL DE DIAGNÓSTICO
async function executarDiagnostico() {
  console.log('🚀 DIAGNÓSTICO INICIADO');
  
  const resultado = {
    configuracoes: null,
    saudeWebhook: null,
    endpointEnvio: null,
    evolutionAPI: null,
    instanciaEvolution: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // 1. Verificar configurações
    resultado.configuracoes = await verificarConfiguracoes();
    const { webhookURL } = resultado.configuracoes;
    
    // 2. Testar saúde do webhook
    resultado.saudeWebhook = await testarSaudeWebhook(webhookURL);
    
    // 3. Testar endpoint de envio
    resultado.endpointEnvio = await testarEndpointEnvio(webhookURL);
    
    // 4. Verificar configurações Evolution API
    resultado.evolutionAPI = await verificarEvolutionAPI();
    
    // 5. Testar instância Evolution
    resultado.instanciaEvolution = await testarInstanciaEvolution(webhookURL);
    
    // 6. Verificar logs
    verificarLogsConsole();
    
    // RELATÓRIO FINAL
    console.log('\n📊 RELATÓRIO FINAL DO DIAGNÓSTICO:');
    console.log('================================================');
    
    const status = {
      webhook: resultado.saudeWebhook?.success ? '✅' : '❌',
      envio: resultado.endpointEnvio?.success ? '✅' : '❌',
      instancia: resultado.instanciaEvolution?.success ? '✅' : '⚠️'
    };
    
    console.log(`   Webhook Health: ${status.webhook}`);
    console.log(`   Endpoint Envio: ${status.envio}`);
    console.log(`   Instância Evolution: ${status.instancia}`);
    
    if (!resultado.saudeWebhook?.success) {
      console.log('\n🚨 PROBLEMA PRINCIPAL: Webhook não está funcionando');
      console.log('   Verifique se o servidor webhook está rodando na porta 4000');
      console.log('   Comando: npm run webhook (ou node webhook-evolution-complete.js)');
    } else if (!resultado.endpointEnvio?.success) {
      console.log('\n🚨 PROBLEMA PRINCIPAL: Endpoint de envio com erro');
      console.log('   Verifique os logs do servidor webhook para detalhes');
      console.log('   Possível problema: API Key Evolution inválida ou instância desconectada');
    } else {
      console.log('\n✅ SISTEMA APARENTEMENTE FUNCIONANDO');
      console.log('   Caso ainda não funcione, verifique:');
      console.log('   - Se a instância WhatsApp está conectada');
      console.log('   - Se o número de telefone está correto');
      console.log('   - Se há rate limiting na Evolution API');
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERRO GERAL NO DIAGNÓSTICO:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

// ====== FUNÇÕES AUXILIARES PARA TESTE MANUAL ======

// Função para testar envio manual
window.testarEnvioManual = async function(telefone, mensagem) {
  console.log('🧪 TESTE MANUAL DE ENVIO');
  
  const configs = await verificarConfiguracoes();
  
  return await testarEndpointEnvio(configs.webhookURL);
};

// Função para verificar apenas saúde
window.verificarSaude = async function() {
  console.log('🏥 VERIFICAÇÃO RÁPIDA DE SAÚDE');
  
  const configs = await verificarConfiguracoes();
  return await testarSaudeWebhook(configs.webhookURL);
};

// ====== EXECUTAR DIAGNÓSTICO AUTOMATICAMENTE ======

console.log('⚡ Executando diagnóstico automático em 2 segundos...');
setTimeout(executarDiagnostico, 2000);

// Disponibilizar função global
window.diagnosticoEnvioMensagens = executarDiagnostico;

console.log('\n💡 COMANDOS DISPONÍVEIS:');
console.log('   diagnosticoEnvioMensagens() - Executar diagnóstico completo');
console.log('   testarEnvioManual() - Testar envio manual');
console.log('   verificarSaude() - Verificação rápida'); 