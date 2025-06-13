// 🧪 Teste Simples de Configuração Webhook Evolution API

const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-sac1';

console.log('🔧 Teste de Configuração Webhook Evolution API');
console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
console.log(`📱 Instância: ${INSTANCE_NAME}`);
console.log('');

// Função de teste com fetch nativo
async function testWebhookConfig() {
  
  // 1. Testar conectividade com Evolution API
  console.log('1️⃣ Testando conectividade Evolution API...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': API_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const instances = await response.json();
    console.log(`✅ Conectividade OK - ${instances.length} instâncias encontradas`);
    
    // Mostrar detalhes da instância
    const instance = instances.find(i => i.name === INSTANCE_NAME || i.instance === INSTANCE_NAME);
    if (instance) {
      console.log(`📱 Instância encontrada: ${instance.name || instance.instance}`);
      console.log(`📊 Status: ${instance.state || instance.status || 'Desconhecido'}`);
    } else {
      console.log(`❌ Instância ${INSTANCE_NAME} não encontrada`);
      return;
    }
    
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    return;
  }

  // 2. Verificar webhook atual
  console.log('\n2️⃣ Verificando webhook atual...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      headers: { 'apikey': API_KEY }
    });
    
    if (response.ok) {
      const webhook = await response.json();
      console.log('📋 Webhook atual:', {
        url: webhook.webhook?.url || 'Não configurado',
        events: webhook.webhook?.events || []
      });
    } else {
      console.log('⚠️ Webhook não configurado ou erro ao verificar');
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar webhook:', error.message);
  }

  // 3. Configurar webhook
  console.log('\n3️⃣ Configurando webhook...');
  try {
    const webhookConfig = {
      url: WEBHOOK_URL,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      webhook_by_events: false,
      webhook_base64: false
    };

    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('📋 Resposta:', result);
    } else {
      console.error('❌ Erro ao configurar webhook:');
      console.error('📋 Status:', response.status);
      console.error('📋 Resposta:', result);
      
      // Tentar payload alternativo
      console.log('\n🔄 Tentando payload alternativo...');
      const simpleConfig = {
        url: WEBHOOK_URL,
        events: ['MESSAGES_UPSERT']
      };
      
      const retryResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify(simpleConfig)
      });
      
      const retryResult = await retryResponse.json();
      
      if (retryResponse.ok) {
        console.log('✅ Configuração alternativa bem-sucedida!');
        console.log('📋 Resposta:', retryResult);
      } else {
        console.error('❌ Erro também na configuração alternativa:');
        console.error('📋 Status:', retryResponse.status);
        console.error('📋 Resposta:', retryResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
  }

  // 4. Verificar se foi configurado
  console.log('\n4️⃣ Verificando configuração final...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      headers: { 'apikey': API_KEY }
    });
    
    if (response.ok) {
      const webhook = await response.json();
      console.log('📋 Webhook final:', {
        url: webhook.webhook?.url || 'Não configurado',
        events: webhook.webhook?.events || []
      });
      
      if (webhook.webhook?.url === WEBHOOK_URL) {
        console.log('\n🎉 SUCESSO! Webhook configurado corretamente!');
        console.log('\n📱 Próximos passos:');
        console.log('1. Envie uma mensagem WhatsApp para o número conectado');
        console.log('2. Verifique os logs do servidor webhook');
        console.log('3. Confirme se o ticket foi criado no CRM');
      } else {
        console.log('\n⚠️ Webhook ainda não está configurado corretamente');
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar configuração final:', error.message);
  }
}

// Executar teste
testWebhookConfig().catch(console.error); 