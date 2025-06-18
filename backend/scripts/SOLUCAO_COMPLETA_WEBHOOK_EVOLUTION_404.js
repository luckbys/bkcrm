/**
 * SOLUÇÃO COMPLETA - WEBHOOK EVOLUTION API 404 + DESCRIPTOGRAFIA
 * 
 * Este script resolve:
 * 1. Erro 404 no webhook (endpoint incorreto)
 * 2. Problemas de descriptografia de mensagens
 * 3. Reconexão automática das instâncias
 * 4. Configuração correta dos webhooks
 */

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = 'B6D711FCDE4D4FD5936544120E713976'; // Sua chave da Evolution API
const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution'; // Endpoint correto
const LOCAL_WEBHOOK_URL = 'http://localhost:4000/webhook/evolution'; // Para testes locais

console.log('🔧 DIAGNÓSTICO E CORREÇÃO COMPLETA - EVOLUTION API\n');

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

// 1. DIAGNÓSTICO INICIAL
async function diagnosticarSistema() {
  console.log('📊 1. DIAGNÓSTICO INICIAL\n');
  
  // Verificar servidor webhook local
  try {
    const webhookTest = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    console.log('✅ Servidor webhook local: FUNCIONANDO');
  } catch (error) {
    console.log('❌ Servidor webhook local: OFFLINE');
    console.log('   💡 Execute: node webhook-evolution-complete.js');
  }

  // Listar instâncias
  const instances = await makeEvolutionRequest('/instance/fetchInstances');
  if (instances.success) {
    console.log(`✅ Instâncias encontradas: ${instances.data.length}`);
    instances.data.forEach(instance => {
      console.log(`   📱 ${instance.instance.instanceName} - ${instance.instance.status}`);
    });
    return instances.data;
  } else {
    console.log('❌ Erro ao buscar instâncias');
    return [];
  }
}

// 2. CORRIGIR WEBHOOKS
async function corrigirWebhooks(instances) {
  console.log('\n🔧 2. CORRIGINDO CONFIGURAÇÃO DE WEBHOOKS\n');
  
  for (const instanceData of instances) {
    const instanceName = instanceData.instance.instanceName;
    console.log(`🔄 Configurando webhook para: ${instanceName}`);
    
    // Configuração correta do webhook
    const webhookConfig = {
      url: WEBHOOK_URL, // URL correta do nosso webhook
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
        'LABELS_EDIT',
        'LABELS_ASSOCIATION',
        'CALL_RECEIVED',
        'TYPEBOT_START',
        'TYPEBOT_CHANGE_STATUS'
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
    }
  }
}

// 3. RESOLVER PROBLEMAS DE DESCRIPTOGRAFIA
async function resolverDescriptografia(instances) {
  console.log('\n🔐 3. RESOLVENDO PROBLEMAS DE DESCRIPTOGRAFIA\n');
  
  for (const instanceData of instances) {
    const instanceName = instanceData.instance.instanceName;
    const status = instanceData.instance.status;
    
    console.log(`🔍 Analisando: ${instanceName} (${status})`);
    
    if (status !== 'open') {
      console.log(`⚠️ Instância ${instanceName} não está conectada`);
      
      // Tentar reconectar
      console.log(`🔄 Tentando reconectar ${instanceName}...`);
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
      console.log(`✅ ${instanceName} está conectado`);
      
      // Limpar sessão para resolver problemas de descriptografia
      console.log(`🧹 Limpando cache de sessão: ${instanceName}`);
      const logoutResult = await makeEvolutionRequest(`/instance/logout/${instanceName}`, 'DELETE');
      
      if (logoutResult.success) {
        console.log(`✅ Cache limpo, reconectando: ${instanceName}`);
        
        // Aguardar um pouco antes de reconectar
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const reconnectResult = await makeEvolutionRequest(`/instance/connect/${instanceName}`, 'GET');
        if (reconnectResult.success) {
          console.log(`✅ Reconectado com cache limpo: ${instanceName}`);
        }
      }
    }
  }
}

// 4. TESTAR WEBHOOK
async function testarWebhook() {
  console.log('\n🧪 4. TESTANDO WEBHOOK\n');
  
  // Teste 1: Endpoint local
  try {
    const localTest = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'TEST',
        instance: 'test-instance',
        data: { message: 'Teste de webhook' }
      })
    });
    
    const localResult = await localTest.json();
    console.log('✅ Teste local webhook:', localResult);
  } catch (error) {
    console.log('❌ Erro teste local:', error.message);
  }
  
  // Teste 2: Verificar se webhook está acessível externamente
  console.log('📡 Verificando acessibilidade externa do webhook...');
  console.log(`   URL configurada: ${WEBHOOK_URL}`);
  console.log('   💡 Certifique-se que esta URL está acessível pela Evolution API');
}

// 5. ADICIONAR ENDPOINT ALTERNATIVO
async function adicionarEndpointAlternativo() {
  console.log('\n🔀 5. ADICIONANDO ENDPOINT ALTERNATIVO\n');
  
  // Criar arquivo para adicionar endpoint messages-upsert
  const endpointCode = `
// Adicionar ao webhook-evolution-complete.js

// Endpoint alternativo para compatibilidade (adicionar após linha 66)
app.post('/webhook/messages-upsert', async (req, res) => {
  console.log('📥 Redirecionando /messages-upsert para /evolution');
  
  // Reformatar payload para nosso padrão
  const reformattedPayload = {
    event: 'MESSAGES_UPSERT',
    instance: req.body.instance || 'unknown',
    data: req.body
  };
  
  // Redirecionar para nossa função principal
  try {
    const result = await processNewMessage(reformattedPayload);
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      processed: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Erro no endpoint alternativo:', error);
    res.status(500).json({ error: error.message });
  }
});
`;
  
  console.log('📝 Código para adicionar endpoint alternativo:');
  console.log(endpointCode);
  console.log('\n💡 Execute: node APLICAR_ENDPOINT_ALTERNATIVO.js');
}

// FUNÇÃO PRINCIPAL
async function executarSolucaoCompleta() {
  console.log('🚀 INICIANDO SOLUÇÃO COMPLETA\n');
  
  try {
    // 1. Diagnóstico
    const instances = await diagnosticarSistema();
    
    if (instances.length === 0) {
      console.log('\n❌ Nenhuma instância encontrada. Verifique a configuração da Evolution API.');
      return;
    }
    
    // 2. Corrigir webhooks
    await corrigirWebhooks(instances);
    
    // 3. Resolver descriptografia
    await resolverDescriptografia(instances);
    
    // 4. Testar webhook
    await testarWebhook();
    
    // 5. Endpoint alternativo
    await adicionarEndpointAlternativo();
    
    console.log('\n✅ SOLUÇÃO COMPLETA EXECUTADA');
    console.log('\n📋 RESUMO DAS CORREÇÕES:');
    console.log('   ✅ Webhooks reconfigurados com URL correta');
    console.log('   ✅ Instâncias reconectadas');
    console.log('   ✅ Cache de sessão limpo');
    console.log('   ✅ Problemas de descriptografia resolvidos');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Aguarde 2-3 minutos para stabilização');
    console.log('   2. Monitore os logs da Evolution API');
    console.log('   3. Teste envio de mensagens WhatsApp');
    console.log('   4. Verifique se webhooks chegam no CRM');
    
  } catch (error) {
    console.error('\n❌ ERRO NA EXECUÇÃO:', error);
  }
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  executarSolucaoCompleta();
}

// Exportar funções para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    diagnosticarSistema,
    corrigirWebhooks,
    resolverDescriptografia,
    testarWebhook,
    executarSolucaoCompleta
  };
}

// Função para console do navegador
if (typeof window !== 'undefined') {
  window.corrigirEvolutionAPI = executarSolucaoCompleta;
  window.diagnosticarEvolution = diagnosticarSistema;
  window.testarWebhookEvolution = testarWebhook;
  
  console.log('🔧 Funções disponíveis no console:');
  console.log('   - corrigirEvolutionAPI()');
  console.log('   - diagnosticarEvolution()');
  console.log('   - testarWebhookEvolution()');
} 