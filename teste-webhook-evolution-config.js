const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarConfigWebhook() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO WEBHOOK EVOLUTION API');
  console.log('================================================');
  
  const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
  const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
  const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';
  
  try {
    // 1. Verificar status da instância
    console.log('📱 1. Verificando status da instância...');
    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const statusData = await statusResponse.json();
    console.log(`✅ Status da instância: ${statusData.state || 'Desconhecido'}`);
    
    // 2. Verificar configuração do webhook
    console.log('🔗 2. Verificando configuração do webhook...');
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const webhookData = await webhookResponse.json();
    console.log('📋 Configuração atual do webhook:');
    console.log(JSON.stringify(webhookData, null, 2));
    
    // 3. Verificar se o webhook está apontando para o endereço correto
    const expectedWebhookUrl = 'https://bkcrm.devsible.com.br/webhook/evolution';
    console.log(`🎯 URL esperada: ${expectedWebhookUrl}`);
    
    if (webhookData.url) {
      console.log(`🔍 URL atual: ${webhookData.url}`);
      
      if (webhookData.url === expectedWebhookUrl) {
        console.log('✅ Webhook configurado corretamente!');
      } else {
        console.log('❌ Webhook configurado incorretamente!');
        console.log('💡 Será necessário reconfigurar o webhook...');
        
        // 4. Tentar reconfigurar o webhook
        console.log('🔧 4. Reconfigurando webhook...');
        const updateResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({
            url: expectedWebhookUrl,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE'
            ],
            webhook_by_events: false
          })
        });
        
        const updateData = await updateResponse.json();
        console.log('🔄 Resultado da reconfiguração:');
        console.log(JSON.stringify(updateData, null, 2));
        
        if (updateResponse.ok) {
          console.log('✅ Webhook reconfigurado com sucesso!');
        } else {
          console.log('❌ Erro ao reconfigurar webhook');
        }
      }
    } else {
      console.log('❌ Webhook não configurado');
      
      // Configurar webhook pela primeira vez
      console.log('🔧 Configurando webhook pela primeira vez...');
      const createResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          url: expectedWebhookUrl,
          events: [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE'
          ],
          webhook_by_events: false
        })
      });
      
      const createData = await createResponse.json();
      console.log('🔄 Resultado da configuração:');
      console.log(JSON.stringify(createData, null, 2));
    }
    
    // 5. Teste final
    console.log('\n🧪 5. TESTE FINAL - Envie uma mensagem do WhatsApp agora!');
    console.log('📱 Envie uma mensagem para o número da instância');
    console.log('🔍 Verifique se aparece nos logs do servidor webhook');
    console.log('⏰ Aguardando 30 segundos para teste...');
    
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error);
  }
}

// Executar teste
testarConfigWebhook().catch(console.error); 