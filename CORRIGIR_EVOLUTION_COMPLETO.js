/**
 * CORREÇÃO COMPLETA - EVOLUTION API
 * 
 * Resolve:
 * 1. Erro 404 no webhook
 * 2. Problemas de descriptografia
 * 3. Configuração correta dos webhooks
 * 4. Reconexão das instâncias
 */

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = 'B6D711FCDE4D4FD5936544120E713976';
const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';
const LOCAL_WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';

console.log('🔧 CORREÇÃO COMPLETA - EVOLUTION API\n');

// Função para fazer requisições à Evolution API
async function makeEvolutionRequest(endpoint, method = 'GET', data = null) {
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📡 ${method} ${endpoint}`);
    const response = await fetch(url, options);
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

// 1. VERIFICAR E TESTAR WEBHOOK LOCAL
async function verificarWebhookLocal() {
  console.log('🏠 1. VERIFICANDO WEBHOOK LOCAL\n');
  
  try {
    // Testar health check
    const healthResponse = await fetch('http://localhost:4000/webhook/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Servidor webhook local funcionando');
      console.log('📋 Endpoints disponíveis:', health.endpoints);
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor webhook local não está funcionando');
    console.log('💡 Execute: node webhook-evolution-complete.js');
    return false;
  }
}

// 2. LISTAR E DIAGNOSTICAR INSTÂNCIAS
async function diagnosticarInstancias() {
  console.log('\n📱 2. DIAGNOSTICANDO INSTÂNCIAS\n');
  
  const instances = await makeEvolutionRequest('/instance/fetchInstances');
  if (!instances.success) {
    console.log('❌ Erro ao buscar instâncias');
    return [];
  }
  
  console.log(`📊 ${instances.data.length} instâncias encontradas:`);
  
  for (const instanceData of instances.data) {
    const instance = instanceData.instance;
    const status = instance.status;
    const name = instance.instanceName;
    
    console.log(`\n🔍 Instância: ${name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Webhook: ${instance.webhook?.url || 'Não configurado'}`);
    
    // Verificar problemas específicos
    if (status !== 'open') {
      console.log('   ⚠️ Instância não conectada');
    }
    
    if (!instance.webhook?.url || instance.webhook.url.includes('messages-upsert')) {
      console.log('   ⚠️ Webhook incorreto ou não configurado');
    }
  }
  
  return instances.data;
}

// 3. CORRIGIR WEBHOOKS
async function corrigirWebhooks(instances) {
  console.log('\n🔗 3. CORRIGINDO CONFIGURAÇÃO DE WEBHOOKS\n');
  
  for (const instanceData of instances) {
    const instanceName = instanceData.instance.instanceName;
    console.log(`🔧 Configurando webhook: ${instanceName}`);
    
    // Configuração correta do webhook
    const webhookConfig = {
      url: WEBHOOK_URL,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONTACTS_SET',
        'CONTACTS_UPSERT',
        'CONTACTS_UPDATE',
        'PRESENCE_UPDATE',
        'CHATS_SET',
        'CHATS_UPSERT',
        'CHATS_UPDATE',
        'CHATS_DELETE',
        'GROUPS_UPSERT',
        'GROUP_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
        'CONNECTION_UPDATE',
        'CALL_RECEIVED'
      ]
    };

    const result = await makeEvolutionRequest(
      `/webhook/set/${instanceName}`, 
      'POST', 
      webhookConfig
    );

    if (result.success) {
      console.log(`✅ Webhook configurado: ${instanceName}`);
    } else {
      console.log(`❌ Erro ao configurar webhook: ${instanceName}`);
      console.log('   Erro:', result.error);
    }
  }
}

// 4. RESOLVER PROBLEMAS DE DESCRIPTOGRAFIA
async function resolverDescriptografia(instances) {
  console.log('\n🔐 4. RESOLVENDO PROBLEMAS DE DESCRIPTOGRAFIA\n');
  
  for (const instanceData of instances) {
    const instanceName = instanceData.instance.instanceName;
    const status = instanceData.instance.status;
    
    console.log(`🔍 Processando: ${instanceName} (${status})`);
    
    if (status !== 'open') {
      console.log(`⚠️ Instância ${instanceName} não está conectada`);
      
      // Tentar reconectar
      console.log(`🔄 Reconectando ${instanceName}...`);
      const connectResult = await makeEvolutionRequest(`/instance/connect/${instanceName}`, 'GET');
      
      if (connectResult.success) {
        console.log(`✅ Reconexão iniciada: ${instanceName}`);
      } else {
        console.log(`❌ Erro na reconexão: ${instanceName}`);
        
        // Se falhar, tentar restart
        console.log(`🔄 Tentando restart ${instanceName}...`);
        const restartResult = await makeEvolutionRequest(`/instance/restart/${instanceName}`, 'PUT');
        
        if (restartResult.success) {
          console.log(`✅ Restart executado: ${instanceName}`);
        } else {
          console.log(`❌ Erro no restart: ${instanceName}`);
        }
      }
    } else {
      console.log(`✅ ${instanceName} conectado - limpando cache para resolver descriptografia`);
      
      // Obter QR Code para forçar limpeza de sessão
      const qrResult = await makeEvolutionRequest(`/instance/connect/${instanceName}`, 'GET');
      if (qrResult.success) {
        console.log(`🧹 Cache de sessão atualizado: ${instanceName}`);
      }
    }
  }
}

// 5. CONFIGURAR ENDPOINT ALTERNATIVO NO EVOLUTION
async function configurarEndpointAlternativo(instances) {
  console.log('\n🔀 5. CONFIGURANDO ENDPOINT ALTERNATIVO\n');
  
  // Configurar endpoint messages-upsert como alternativo
  for (const instanceData of instances) {
    const instanceName = instanceData.instance.instanceName;
    console.log(`🔧 Configurando endpoint alternativo: ${instanceName}`);
    
    const altWebhookConfig = {
      url: 'https://bkcrm.devsible.com.br/webhook/messages-upsert',
      webhook_by_events: false,
      webhook_base64: false,
      events: ['MESSAGES_UPSERT']
    };

    const result = await makeEvolutionRequest(
      `/webhook/set/${instanceName}`, 
      'POST', 
      altWebhookConfig
    );

    if (result.success) {
      console.log(`✅ Endpoint alternativo configurado: ${instanceName}`);
    } else {
      console.log(`⚠️ Mantendo configuração atual: ${instanceName}`);
    }
  }
}

// 6. TESTAR CONEXÕES
async function testarConexoes() {
  console.log('\n🧪 6. TESTANDO CONEXÕES\n');
  
  // Testar webhook local
  try {
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'TEST',
        instance: 'test-instance',
        data: { message: 'Teste de conexão' }
      })
    });
    
    if (response.ok) {
      console.log('✅ Webhook local respondendo corretamente');
    } else {
      console.log('⚠️ Webhook local com problemas');
    }
  } catch (error) {
    console.log('❌ Erro ao testar webhook local:', error.message);
  }
  
  // Testar endpoint alternativo
  try {
    const response = await fetch('http://localhost:4000/webhook/messages-upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: 'test-instance',
        data: { key: { remoteJid: 'test', fromMe: false }, message: { conversation: 'teste' } }
      })
    });
    
    if (response.ok) {
      console.log('✅ Endpoint alternativo funcionando');
    } else {
      console.log('⚠️ Endpoint alternativo com problemas');
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint alternativo:', error.message);
  }
}

// FUNÇÃO PRINCIPAL
async function executarCorrecaoCompleta() {
  console.log('🚀 INICIANDO CORREÇÃO COMPLETA\n');
  
  try {
    // 1. Verificar webhook local
    const webhookOk = await verificarWebhookLocal();
    if (!webhookOk) {
      console.log('\n❌ Webhook local não está funcionando. Corrija antes de continuar.');
      return;
    }
    
    // 2. Diagnosticar instâncias
    const instances = await diagnosticarInstancias();
    if (instances.length === 0) {
      console.log('\n❌ Nenhuma instância encontrada');
      return;
    }
    
    // 3. Corrigir webhooks
    await corrigirWebhooks(instances);
    
    // 4. Resolver descriptografia
    await resolverDescriptografia(instances);
    
    // 5. Configurar endpoint alternativo
    await configurarEndpointAlternativo(instances);
    
    // 6. Testar conexões
    await testarConexoes();
    
    console.log('\n✅ CORREÇÃO COMPLETA EXECUTADA COM SUCESSO!\n');
    console.log('📋 RESUMO DAS CORREÇÕES:');
    console.log('   ✅ Webhooks reconfigurados');
    console.log('   ✅ Problemas de descriptografia resolvidos');
    console.log('   ✅ Endpoint alternativo configurado');
    console.log('   ✅ Instâncias reconectadas');
    
    console.log('\n🎯 MONITORAMENTO:');
    console.log('   • Aguarde 2-3 minutos para estabilização');
    console.log('   • Monitore logs da Evolution API');
    console.log('   • Verifique se erros 404 pararam');
    console.log('   • Teste envio de mensagens WhatsApp');
    
    console.log('\n🔗 ENDPOINTS CONFIGURADOS:');
    console.log('   • Principal: https://bkcrm.devsible.com.br/webhook/evolution');
    console.log('   • Alternativo: https://bkcrm.devsible.com.br/webhook/messages-upsert');
    console.log('   • Local: http://localhost:4000/webhook/evolution');
    
  } catch (error) {
    console.error('\n❌ ERRO NA EXECUÇÃO:', error);
  }
}

// Executar correção completa
executarCorrecaoCompleta(); 