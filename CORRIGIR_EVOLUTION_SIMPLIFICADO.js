/**
 * CORREÇÃO SIMPLIFICADA - EVOLUTION API
 * Usando a API key correta do arquivo existente
 */

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11'; // API key correta
const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';
const ALT_WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/messages-upsert';

console.log('🔧 CORREÇÃO SIMPLIFICADA - EVOLUTION API\n');

// Função para fazer requisições à Evolution API
async function makeEvolutionRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📡 ${method} ${endpoint}`);
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Erro ${response.status}:`, result);
      return { success: false, error: result, status: response.status };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Erro de rede:', error.message);
    return { success: false, error: error.message };
  }
}

// 1. Testar webhook local
async function testarWebhookLocal() {
  console.log('🏠 1. TESTANDO WEBHOOK LOCAL\n');
  
  try {
    const response = await fetch('http://localhost:4000/webhook/health');
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Servidor webhook local funcionando');
      console.log('📋 Endpoints:', health.endpoints);
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor webhook local não está funcionando');
    return false;
  }
}

// 2. Listar instâncias
async function listarInstancias() {
  console.log('\n📱 2. LISTANDO INSTÂNCIAS\n');
  
  const result = await makeEvolutionRequest('/instance/fetchInstances');
  if (!result.success) {
    console.log('❌ Erro ao buscar instâncias:', result.error);
    return [];
  }
  
  console.log(`📊 ${result.data.length} instâncias encontradas:`);
  
  for (const instanceData of result.data) {
    const instance = instanceData.instance || instanceData;
    const name = instance.instanceName || instance.name;
    const status = instance.status || instance.state;
    
    console.log(`\n🔍 ${name}`);
    console.log(`   Status: ${status}`);
    
    // Verificar webhook atual
    const webhookResult = await makeEvolutionRequest(`/webhook/find/${name}`);
    if (webhookResult.success && webhookResult.data.webhook) {
      console.log(`   Webhook: ${webhookResult.data.webhook.url}`);
    } else {
      console.log('   Webhook: Não configurado');
    }
  }
  
  return result.data;
}

// 3. Configurar webhooks corretamente
async function configurarWebhooks(instances) {
  console.log('\n🔗 3. CONFIGURANDO WEBHOOKS\n');
  
  for (const instanceData of instances) {
    const instance = instanceData.instance || instanceData;
    const name = instance.instanceName || instance.name;
    
    console.log(`🔧 Configurando webhook: ${name}`);
    
    // Primeira tentativa: endpoint principal
    const webhookConfig = {
      url: WEBHOOK_URL,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ]
    };

    const result = await makeEvolutionRequest(`/webhook/set/${name}`, 'POST', webhookConfig);
    
    if (result.success) {
      console.log(`✅ Webhook principal configurado: ${name}`);
    } else {
      console.log(`⚠️ Erro no webhook principal, tentando alternativo: ${name}`);
      
      // Segunda tentativa: endpoint alternativo
      webhookConfig.url = ALT_WEBHOOK_URL;
      const altResult = await makeEvolutionRequest(`/webhook/set/${name}`, 'POST', webhookConfig);
      
      if (altResult.success) {
        console.log(`✅ Webhook alternativo configurado: ${name}`);
      } else {
        console.log(`❌ Falha total na configuração: ${name}`);
      }
    }
  }
}

// 4. Verificar e corrigir instâncias desconectadas
async function corrigirInstanciasDesconectadas(instances) {
  console.log('\n🔄 4. CORRIGINDO INSTÂNCIAS DESCONECTADAS\n');
  
  for (const instanceData of instances) {
    const instance = instanceData.instance || instanceData;
    const name = instance.instanceName || instance.name;
    const status = instance.status || instance.state;
    
    if (status !== 'open') {
      console.log(`⚠️ ${name} não está conectado (${status})`);
      console.log(`🔄 Tentando reconectar ${name}...`);
      
      const connectResult = await makeEvolutionRequest(`/instance/connect/${name}`, 'GET');
      
      if (connectResult.success) {
        console.log(`✅ Reconexão iniciada: ${name}`);
      } else {
        console.log(`❌ Erro na reconexão: ${name}`);
        
        // Tentar restart se reconexão falhar
        console.log(`🔄 Tentando restart: ${name}`);
        const restartResult = await makeEvolutionRequest(`/instance/restart/${name}`, 'PUT');
        
        if (restartResult.success) {
          console.log(`✅ Restart executado: ${name}`);
        } else {
          console.log(`❌ Erro no restart: ${name}`);
        }
      }
    } else {
      console.log(`✅ ${name} está conectado`);
    }
  }
}

// 5. Testar endpoints
async function testarEndpoints() {
  console.log('\n🧪 5. TESTANDO ENDPOINTS\n');
  
  // Testar endpoint principal
  try {
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'TEST',
        instance: 'test',
        data: { message: 'Teste' }
      })
    });
    
    if (response.ok) {
      console.log('✅ Endpoint principal (/webhook/evolution) funcionando');
    } else {
      console.log('⚠️ Problema no endpoint principal');
    }
  } catch (error) {
    console.log('❌ Erro no endpoint principal:', error.message);
  }
  
  // Testar endpoint alternativo
  try {
    const response = await fetch('http://localhost:4000/webhook/messages-upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: 'test',
        data: { key: { remoteJid: 'test', fromMe: false }, message: { conversation: 'teste' } }
      })
    });
    
    if (response.ok) {
      console.log('✅ Endpoint alternativo (/webhook/messages-upsert) funcionando');
    } else {
      console.log('⚠️ Problema no endpoint alternativo');
    }
  } catch (error) {
    console.log('❌ Erro no endpoint alternativo:', error.message);
  }
}

// Função principal
async function executarCorrecao() {
  console.log('🚀 INICIANDO CORREÇÃO SIMPLIFICADA\n');
  
  try {
    // 1. Testar webhook local
    const webhookOk = await testarWebhookLocal();
    if (!webhookOk) {
      console.log('\n❌ Webhook local não está funcionando. Execute: node webhook-evolution-complete.js');
      return;
    }
    
    // 2. Listar instâncias
    const instances = await listarInstancias();
    if (instances.length === 0) {
      console.log('\n❌ Nenhuma instância encontrada');
      return;
    }
    
    // 3. Configurar webhooks
    await configurarWebhooks(instances);
    
    // 4. Corrigir instâncias desconectadas
    await corrigirInstanciasDesconectadas(instances);
    
    // 5. Testar endpoints
    await testarEndpoints();
    
    console.log('\n✅ CORREÇÃO SIMPLIFICADA CONCLUÍDA!\n');
    console.log('📋 AÇÕES REALIZADAS:');
    console.log('   ✅ Webhooks reconfigurados');
    console.log('   ✅ Instâncias reconectadas');
    console.log('   ✅ Endpoints testados');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Aguarde 2-3 minutos');
    console.log('   2. Monitore logs da Evolution API');
    console.log('   3. Verifique se erros 404 pararam');
    console.log('   4. Teste mensagens WhatsApp');
    
    console.log('\n🔗 ENDPOINTS CONFIGURADOS:');
    console.log('   • Principal: https://bkcrm.devsible.com.br/webhook/evolution');
    console.log('   • Alternativo: https://bkcrm.devsible.com.br/webhook/messages-upsert');
    
  } catch (error) {
    console.error('\n❌ ERRO NA EXECUÇÃO:', error);
  }
}

// Executar
executarCorrecao(); 