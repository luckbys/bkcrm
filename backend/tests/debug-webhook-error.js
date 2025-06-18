// 🐞 Debug Detalhado do Erro de Webhook Evolution API

const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

console.log('🐞 Debug Detalhado - Erro Webhook Evolution API');
console.log('');

async function debugWebhookError() {
  try {
    // Testar diferentes payloads
    const payloads = [
      {
        name: 'Payload Completo',
        data: {
          url: WEBHOOK_URL,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
          webhook_by_events: false,
          webhook_base64: false
        }
      },
      {
        name: 'Payload Simples',
        data: {
          url: WEBHOOK_URL,
          events: ['MESSAGES_UPSERT']
        }
      },
      {
        name: 'Payload Mínimo',
        data: {
          url: WEBHOOK_URL
        }
      },
      {
        name: 'Payload Oficial',
        data: {
          webhook: {
            url: WEBHOOK_URL,
            events: ['MESSAGES_UPSERT']
          }
        }
      }
    ];

    for (const payload of payloads) {
      console.log(`🧪 Testando: ${payload.name}`);
      console.log('📋 Payload:', JSON.stringify(payload.data, null, 2));
      
      try {
        const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
          },
          body: JSON.stringify(payload.data)
        });

        const result = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Resposta:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
          console.log('✅ SUCESSO com este payload!');
          break;
        } else {
          console.log('❌ Falhou');
          
          // Mostrar detalhes do erro se disponível
          if (result.response?.message) {
            console.log('🔍 Detalhes do erro:', result.response.message);
          }
        }
        
      } catch (error) {
        console.error('❌ Erro de rede:', error.message);
      }
      
      console.log('─'.repeat(50));
    }

    // Testar endpoint alternativo
    console.log('\n🔄 Testando endpoint alternativo...');
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/webhook/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          events: ['MESSAGES_UPSERT']
        })
      });

      const result = await response.json();
      console.log(`📊 Status alternativo: ${response.status}`);
      console.log('📋 Resposta alternativa:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Erro endpoint alternativo:', error.message);
    }

    // Verificar documentação da API
    console.log('\n📚 Verificando endpoints disponíveis...');
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/webhook`, {
        headers: { 'apikey': API_KEY }
      });
      console.log(`📊 Status endpoints: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Endpoints webhook:', result);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar endpoints');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugWebhookError().catch(console.error); 