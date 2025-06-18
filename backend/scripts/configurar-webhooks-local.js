// 🔧 Configurador Automático de Webhooks Evolution API - Versão ES Module
// Este script configura os webhooks para todas as instâncias ativas

const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution'; // Para produção
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const WEBHOOK_EVENTS = [
  'MESSAGES_UPSERT',
  'CONNECTION_UPDATE', 
  'QRCODE_UPDATED',
  'SEND_MESSAGE'
];

// Função para fazer requisições à Evolution API
async function makeEvolutionRequest(endpoint, method = 'GET', data = null) {
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
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.message || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Erro na requisição ${endpoint}:`, error.message);
    throw error;
  }
}

// Listar todas as instâncias
async function listInstances() {
  console.log('📱 Listando instâncias...');
  const instances = await makeEvolutionRequest('/instance/fetchInstances');
  console.log(`✅ Encontradas ${instances.length} instâncias`);
  return instances;
}

// Configurar webhook para uma instância
async function configureWebhook(instanceName) {
  console.log(`🔧 Configurando webhook para ${instanceName}...`);
  
  const webhookConfig = {
    url: WEBHOOK_URL,
    events: WEBHOOK_EVENTS,
    webhook_by_events: false,
    webhook_base64: false
  };

  try {
    const result = await makeEvolutionRequest(`/webhook/set/${instanceName}`, 'POST', webhookConfig);
    console.log(`✅ Webhook configurado para ${instanceName}`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao configurar webhook para ${instanceName}:`, error.message);
    throw error;
  }
}

// Verificar webhook de uma instância
async function checkWebhook(instanceName) {
  try {
    const webhook = await makeEvolutionRequest(`/webhook/find/${instanceName}`);
    console.log(`🔍 Webhook atual de ${instanceName}:`, {
      url: webhook.webhook?.url || 'Não configurado',
      events: webhook.webhook?.events || []
    });
    return webhook;
  } catch (error) {
    console.error(`❌ Erro ao verificar webhook de ${instanceName}:`, error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando configuração de webhooks Evolution API LOCAL...');
  console.log(`📡 URL do webhook: ${WEBHOOK_URL}`);
  console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
  console.log('');

  try {
    // 1. Listar instâncias
    const instances = await listInstances();
    
    if (instances.length === 0) {
      console.log('⚠️ Nenhuma instância encontrada');
      return;
    }

    // 2. Processar cada instância
    let successCount = 0;
    let errorCount = 0;

    for (const instance of instances) {
      const instanceName = instance.name || instance.instance;
      console.log(`\n--- Processando ${instanceName} ---`);
      
      try {
        // Verificar status da instância
        console.log(`📊 Status: ${instance.state || instance.status || 'Desconhecido'}`);
        
        // Verificar webhook atual
        await checkWebhook(instanceName);
        
        // Configurar webhook
        await configureWebhook(instanceName);
        
        // Verificar se foi configurado corretamente
        console.log('🔍 Verificando configuração...');
        const updatedWebhook = await checkWebhook(instanceName);
        
        if (updatedWebhook?.webhook?.url === WEBHOOK_URL) {
          console.log(`✅ ${instanceName}: Webhook configurado corretamente!`);
          successCount++;
        } else {
          console.log(`⚠️ ${instanceName}: Webhook pode não ter sido configurado corretamente`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ ${instanceName}: ${error.message}`);
        errorCount++;
      }
    }

    // 3. Resumo final
    console.log('\n🎉 Configuração concluída!');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total: ${instances.length}`);

    if (successCount > 0) {
      console.log('\n🧪 TESTE DE WEBHOOK LOCAL:');
      console.log('1. Envie uma mensagem para qualquer número conectado');
      console.log('2. Verifique os logs do servidor webhook');
      console.log('3. Verifique se o ticket foi criado no CRM');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Executar função principal
main().catch(console.error); 