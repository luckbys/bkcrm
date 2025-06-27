// 🔍 Verificador de Webhooks Evolution API
// Este script verifica as configurações atuais dos webhooks

const EVOLUTION_API_URL = 'https://evochat.devsible.com.br/';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

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
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Erro na requisição ${endpoint}:`, error.message);
    throw error;
  }
}

// Função principal para verificar webhooks
async function verificarWebhooks() {
  console.log('🔍 Verificando configurações atuais dos webhooks...');
  console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}\n`);

  try {
    // 1. Listar instâncias
    console.log('📱 Listando instâncias...');
    const instances = await makeEvolutionRequest('/instance/fetchInstances');
    console.log(`✅ Encontradas ${instances.length} instâncias\n`);

    // 2. Verificar webhook de cada instância
    for (const instance of instances) {
      const instanceName = instance.name || instance.instance;
      console.log(`--- ${instanceName} ---`);
      console.log(`📊 Status: ${instance.state || instance.status || 'Desconhecido'}`);
      
      try {
        const webhook = await makeEvolutionRequest(`/webhook/find/${instanceName}`);
        
        if (webhook.webhook) {
          console.log(`🔗 Webhook URL: ${webhook.webhook.url || 'Não configurado'}`);
          console.log(`📋 Eventos: ${webhook.webhook.events?.join(', ') || 'Nenhum'}`);
          console.log(`⚙️ Webhook por eventos: ${webhook.webhook.webhook_by_events ? 'Sim' : 'Não'}`);
          console.log(`📄 Base64: ${webhook.webhook.webhook_base64 ? 'Sim' : 'Não'}`);
        } else {
          console.log('❌ Webhook não configurado');
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar webhook: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
verificarWebhooks().catch(console.error); 