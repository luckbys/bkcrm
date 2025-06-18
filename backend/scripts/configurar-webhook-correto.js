// 🎯 Configuração CORRETA do Webhook Evolution API

const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

console.log('🎯 Configuração CORRETA do Webhook Evolution API');
console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
console.log(`📱 Instância: ${INSTANCE_NAME}`);
console.log('');

async function configureWebhookCorrect() {
  try {
    // Payload correto baseado no erro descoberto
    const correctPayload = {
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE', 
          'QRCODE_UPDATED'
        ],
        webhook_by_events: false,
        webhook_base64: false
      }
    };

    console.log('🔧 Configurando com payload correto...');
    console.log('📋 Payload:', JSON.stringify(correctPayload, null, 2));
    console.log('');

    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(correctPayload)
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📋 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n🎉 SUCESSO! Webhook configurado corretamente!');
      
      // Verificar se foi configurado
      console.log('\n🔍 Verificando configuração...');
      const checkResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
        headers: { 'apikey': API_KEY }
      });
      
      if (checkResponse.ok) {
        const webhook = await checkResponse.json();
        console.log('📋 Webhook configurado:', {
          url: webhook.webhook?.url || 'Não configurado',
          enabled: webhook.webhook?.enabled || false,
          events: webhook.webhook?.events || []
        });
        
        if (webhook.webhook?.url === WEBHOOK_URL && webhook.webhook?.enabled) {
          console.log('\n✅ CONFIRMADO! Webhook ativo e funcionando!');
          console.log('\n📱 Teste agora:');
          console.log('1. Envie uma mensagem WhatsApp para o número conectado');
          console.log('2. Verifique os logs do servidor webhook local');
          console.log('3. Confirme se o ticket foi criado no CRM');
          console.log('\n💡 Para ver logs do webhook em tempo real:');
          console.log('   node webhook-evolution-complete.js');
        }
      }
      
    } else {
      console.error('\n❌ Erro ao configurar webhook:');
      console.error('📋 Detalhes:', result);
      
      if (result.response?.message) {
        console.error('🔍 Mensagem específica:', result.response.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

configureWebhookCorrect().catch(console.error); 