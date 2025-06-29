// Script para corrigir URL do webhook na Evolution API
// Resolve erro 404 reconfigurando para usar endpoint correto

const https = require('https');

const EVOLUTION_API_CONFIG = {
  baseURL: 'https://press-evolution-api.jhkbgs.easypanel.host',
  apiKey: '429683C4C977415CAAFCCE10F7D57E11',
  instance: 'atendimento-ao-cliente-suporte'
};

const WEBHOOK_URLs = {
  // Usar o endpoint que existe e está funcionando
  primary: 'https://websocket.bkcrm.devsible.com.br/webhook/evolution',
  // Fallback para quando o /connection-update for deployado
  fallback: 'https://websocket.bkcrm.devsible.com.br/connection-update'
};

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getCurrentWebhook() {
  console.log('🔍 Verificando configuração atual do webhook...');
  
  const options = {
    hostname: 'press-evolution-api.jhkbgs.easypanel.host',
    path: `/webhook/${EVOLUTION_API_CONFIG.instance}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_CONFIG.apiKey
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('📋 Configuração atual:', JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Erro ao obter configuração:', error.message);
    return null;
  }
}

async function updateWebhook() {
  console.log('🔧 Atualizando URL do webhook...');
  
  const webhookConfig = {
    url: WEBHOOK_URLs.primary,
    events: [
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED', 
      'CONNECTION_UPDATE',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONTACTS_UPDATE',
      'CONTACTS_UPSERT',
      'PRESENCE_UPDATE',
      'CHATS_UPDATE',
      'CHATS_UPSERT',
      'CHATS_DELETE',
      'GROUPS_UPSERT',
      'GROUPS_UPDATE',
      'GROUP_PARTICIPANTS_UPDATE'
    ]
  };

  const options = {
    hostname: 'press-evolution-api.jhkbgs.easypanel.host',
    path: `/webhook/${EVOLUTION_API_CONFIG.instance}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_CONFIG.apiKey
    }
  };

  try {
    const response = await makeRequest(options, webhookConfig);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Webhook atualizado com sucesso!');
      console.log('📤 Nova URL:', WEBHOOK_URLs.primary);
      console.log('🎯 Events configurados:', webhookConfig.events.length);
      return true;
    } else {
      console.log('⚠️ Resposta inesperada:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar webhook:', error.message);
    return false;
  }
}

async function testWebhook() {
  console.log('🧪 Testando endpoint do webhook...');
  
  const testData = {
    instance: EVOLUTION_API_CONFIG.instance,
    data: {
      state: 'open',
      statusReason: 200
    },
    event: 'CONNECTION_UPDATE'
  };

  const options = {
    hostname: 'websocket.bkcrm.devsible.com.br',
    path: '/webhook/evolution',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, testData);
    
    if (response.status === 200) {
      console.log('✅ Endpoint webhook funcionando!');
      console.log('📨 Resposta:', response.data);
      return true;
    } else {
      console.log('⚠️ Endpoint com problema:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando correção do webhook Evolution API...\n');
  
  // 1. Verificar configuração atual
  await getCurrentWebhook();
  console.log('');
  
  // 2. Testar endpoint atual
  const endpointWorking = await testWebhook();
  console.log('');
  
  // 3. Atualizar configuração se necessário
  if (endpointWorking) {
    console.log('✅ Endpoint já está funcionando, webhook pode estar configurado corretamente.');
    console.log('📝 Se ainda há erros 404, verificar se Evolution API está enviando para URL correta.');
  } else {
    console.log('⚠️ Endpoint com problemas, tentando reconfigurar...');
    const updated = await updateWebhook();
    
    if (updated) {
      console.log('');
      console.log('🎉 Configuração atualizada! Aguarde alguns minutos para os efeitos...');
    }
  }
  
  console.log('\n📋 Resumo da Correção:');
  console.log('• URL Primary:', WEBHOOK_URLs.primary);
  console.log('• Instância:', EVOLUTION_API_CONFIG.instance);
  console.log('• Events: CONNECTION_UPDATE, MESSAGES_UPSERT, etc.');
  console.log('\n💡 Próximo passo: Fazer deploy do endpoint /connection-update no servidor de produção');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, updateWebhook, testWebhook, getCurrentWebhook }; 