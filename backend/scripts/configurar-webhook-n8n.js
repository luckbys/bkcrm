/**
 * 🔧 Script para Configurar Webhook Evolution API → n8n
 * 
 * Este script configura o webhook da Evolution API para enviar dados para o n8n
 * que depois processa e envia para o BKCRM
 */

const https = require('https');

// 🔧 Configurações - AJUSTE ESTAS URLs
const CONFIG = {
  EVOLUTION_API_URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
  EVOLUTION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
  N8N_WEBHOOK_URL: 'https://sua-instancia-n8n.com/webhook/evolution-webhook', // ⚠️ SUBSTITUA pela sua URL do n8n
  INSTANCE_NAME: 'atendimento-ao-cliente-sac1', // ⚠️ Nome da sua instância
  BKCRM_WEBHOOK_URL: 'https://bkcrm.devsible.com.br/webhook/evolution'
};

// 📋 Configuração do webhook para n8n
const webhookConfig = {
  url: CONFIG.N8N_WEBHOOK_URL,
  enabled: true,
  events: [
    'MESSAGES_UPSERT',
    'CONNECTION_UPDATE',
    'QRCODE_UPDATED'
  ],
  webhook_by_events: true
};

// 📋 Configuração alternativa direta para BKCRM (caso não use n8n)
const webhookConfigDirect = {
  url: CONFIG.BKCRM_WEBHOOK_URL,
  enabled: true,
  events: [
    'MESSAGES_UPSERT',
    'CONNECTION_UPDATE',
    'QRCODE_UPDATED'
  ],
  webhook_by_events: true
};

/**
 * 🔧 Função para fazer requisição HTTP
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.EVOLUTION_API_URL);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.EVOLUTION_API_KEY
      }
    };

    console.log(`📡 ${method} ${url.toString()}`);
    
    const req = https.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📄 Response:`, JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log(`📄 Raw response:`, body);
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro na requisição:`, error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 🔍 Verificar instâncias disponíveis
 */
async function listarInstancias() {
  console.log('\n🔍 Listando instâncias disponíveis...');
  try {
    const response = await makeRequest('GET', '/instance/fetchInstances');
    
    if (response && Array.isArray(response)) {
      console.log(`\n📱 Encontradas ${response.length} instâncias:`);
      response.forEach((instance, index) => {
        console.log(`${index + 1}. ${instance.instance?.instanceName || instance.instanceName || 'N/A'} - Status: ${instance.instance?.status || instance.status || 'N/A'}`);
      });
      return response;
    } else {
      console.log('❌ Não foi possível listar instâncias');
      return [];
    }
  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error.message);
    return [];
  }
}

/**
 * 🔧 Configurar webhook para n8n
 */
async function configurarWebhookN8n() {
  console.log('\n🔧 Configurando webhook para n8n...');
  console.log(`🎯 Instância: ${CONFIG.INSTANCE_NAME}`);
  console.log(`🌐 n8n URL: ${CONFIG.N8N_WEBHOOK_URL}`);
  
  try {
    const response = await makeRequest(
      'POST', 
      `/webhook/set/${CONFIG.INSTANCE_NAME}`, 
      webhookConfig
    );
    
    if (response) {
      console.log('✅ Webhook configurado com sucesso para n8n!');
      return true;
    } else {
      console.log('❌ Falha ao configurar webhook');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    return false;
  }
}

/**
 * 🔧 Configurar webhook direto para BKCRM (sem n8n)
 */
async function configurarWebhookDireto() {
  console.log('\n🔧 Configurando webhook direto para BKCRM...');
  console.log(`🎯 Instância: ${CONFIG.INSTANCE_NAME}`);
  console.log(`🌐 BKCRM URL: ${CONFIG.BKCRM_WEBHOOK_URL}`);
  
  try {
    const response = await makeRequest(
      'POST', 
      `/webhook/set/${CONFIG.INSTANCE_NAME}`, 
      webhookConfigDirect
    );
    
    if (response) {
      console.log('✅ Webhook configurado com sucesso para BKCRM!');
      return true;
    } else {
      console.log('❌ Falha ao configurar webhook');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    return false;
  }
}

/**
 * 🔍 Verificar webhook configurado
 */
async function verificarWebhook() {
  console.log('\n🔍 Verificando webhook configurado...');
  try {
    const response = await makeRequest('GET', `/webhook/find/${CONFIG.INSTANCE_NAME}`);
    
    if (response && response.url) {
      console.log('✅ Webhook encontrado:');
      console.log(`🌐 URL: ${response.url}`);
      console.log(`🔄 Habilitado: ${response.enabled}`);
      console.log(`📨 Eventos: ${response.events?.join(', ') || 'N/A'}`);
      return response;
    } else {
      console.log('❌ Nenhum webhook configurado para esta instância');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.message);
    return null;
  }
}

/**
 * 🧪 Testar webhook
 */
async function testarWebhook() {
  console.log('\n🧪 Testando webhook...');
  const testData = {
    event: 'MESSAGES_UPSERT',
    instance: CONFIG.INSTANCE_NAME,
    data: {
      key: {
        id: 'test-' + Date.now(),
        remoteJid: '5511999999999@s.whatsapp.net'
      },
      message: {
        conversation: 'Teste do webhook via script'
      },
      timestamp: Date.now()
    }
  };
  
  console.log('📤 Dados de teste:', JSON.stringify(testData, null, 2));
  
  // Aqui você pode implementar um teste real enviando para o webhook
  console.log('ℹ️ Para testar completamente, envie uma mensagem real no WhatsApp');
}

/**
 * 🎯 Função principal
 */
async function main() {
  console.log('🚀 Configurador de Webhook Evolution API → n8n → BKCRM');
  console.log('='.repeat(60));
  
  // Verificar configurações
  if (CONFIG.N8N_WEBHOOK_URL.includes('sua-instancia-n8n.com')) {
    console.log('⚠️ ATENÇÃO: Você precisa configurar a URL do n8n no script!');
    console.log('📝 Edite a variável N8N_WEBHOOK_URL com sua URL real do n8n');
    process.exit(1);
  }
  
  // Menu interativo
  const args = process.argv.slice(2);
  const comando = args[0];
  
  switch (comando) {
    case 'listar':
      await listarInstancias();
      break;
      
    case 'configurar-n8n':
      await configurarWebhookN8n();
      break;
      
    case 'configurar-direto':
      await configurarWebhookDireto();
      break;
      
    case 'verificar':
      await verificarWebhook();
      break;
      
    case 'testar':
      await testarWebhook();
      break;
      
    case 'completo':
      await listarInstancias();
      await configurarWebhookN8n();
      await verificarWebhook();
      break;
      
    default:
      console.log('📋 Comandos disponíveis:');
      console.log('  node configurar-webhook-n8n.js listar           # Listar instâncias');
      console.log('  node configurar-webhook-n8n.js configurar-n8n   # Configurar para n8n');
      console.log('  node configurar-webhook-n8n.js configurar-direto # Configurar direto para BKCRM');
      console.log('  node configurar-webhook-n8n.js verificar        # Verificar configuração');
      console.log('  node configurar-webhook-n8n.js testar           # Testar webhook');
      console.log('  node configurar-webhook-n8n.js completo         # Executar tudo');
      console.log('');
      console.log('⚠️ Antes de usar, configure:');
      console.log('1. N8N_WEBHOOK_URL - URL do seu webhook n8n');
      console.log('2. INSTANCE_NAME - Nome da sua instância WhatsApp');
      break;
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  configurarWebhookN8n,
  configurarWebhookDireto,
  verificarWebhook,
  listarInstancias
}; 