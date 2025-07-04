// 🔧 DIAGNÓSTICO E CONFIGURAÇÃO DO WEBHOOK EVOLUTION API
// Para resolver problema de recebimento de mensagens WhatsApp

const fetch = require('node-fetch');

// === CONFIGURAÇÕES ===
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = 'EvolutionApiKey-bkcrm';
const WEBHOOK_URL = 'http://localhost:4000/webhook/evolution';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

// === FUNÇÕES DE DIAGNÓSTICO ===

async function verificarInstancia() {
  console.log('🔍 Verificando status da instância...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Instância encontrada:', {
        name: INSTANCE_NAME,
        state: data.state,
        status: response.status
      });
      return data.state === 'open';
    } else {
      console.error('❌ Erro ao verificar instância:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}

async function verificarWebhookConfigurado() {
  console.log('🔍 Verificando webhook configurado...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok && data.url) {
      console.log('✅ Webhook encontrado:', {
        url: data.url,
        enabled: data.enabled,
        events: data.events
      });
      return data;
    } else {
      console.log('⚠️ Webhook não configurado ou não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.message);
    return null;
  }
}

async function configurarWebhook() {
  console.log('🔧 Configurando webhook...');
  
  try {
    const webhookConfig = {
      url: WEBHOOK_URL,
      enabled: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      webhookByEvents: false,
      base64: false
    };

    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Webhook configurado com sucesso:', data);
      return true;
    } else {
      console.error('❌ Erro ao configurar webhook:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    return false;
  }
}

async function testarWebhookLocal() {
  console.log('🧪 Testando webhook local...');
  
  try {
    const response = await fetch('http://localhost:4000/webhook/health', {
      method: 'GET'
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Webhook local funcionando:', {
        status: data.status,
        connections: data.websocket?.connections || 0
      });
      return true;
    } else {
      console.error('❌ Webhook local com problemas:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook local não está rodando:', error.message);
    return false;
  }
}

async function simularMensagemTeste() {
  console.log('🧪 Simulando recebimento de mensagem...');
  
  try {
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: INSTANCE_NAME,
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'TEST_MESSAGE_' + Date.now()
        },
        message: {
          conversation: 'Mensagem de teste do diagnóstico'
        },
        messageTimestamp: Date.now(),
        pushName: 'Cliente Teste'
      }
    };

    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Simulação processada:', {
        received: data.received,
        processed: data.processed,
        event: data.event,
        ticketId: data.ticketId
      });
      return true;
    } else {
      console.error('❌ Erro na simulação:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao simular mensagem:', error.message);
    return false;
  }
}

async function enviarMensagemReal() {
  console.log('📱 Enviando mensagem real de teste...');
  
  try {
    const payload = {
      number: '5511999999999', // Substitua por um número real para teste
      text: `🧪 Teste de envio: ${new Date().toLocaleString()}\n\nResponda esta mensagem para testar o recebimento!`,
      options: {
        delay: 1000,
        presence: 'composing'
      }
    };

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Mensagem real enviada:', {
        messageId: data.key?.id,
        status: data.status
      });
      console.log('📝 Responda no WhatsApp para testar o recebimento!');
      return true;
    } else {
      console.error('❌ Erro ao enviar mensagem real:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    return false;
  }
}

// === DIAGNÓSTICO COMPLETO ===

async function diagnosticoCompleto() {
  console.log('🚀 INICIANDO DIAGNÓSTICO DO WEBHOOK\n');

  // 1. Verificar instância
  const instanciaOk = await verificarInstancia();
  console.log('');

  // 2. Verificar webhook local
  const webhookLocalOk = await testarWebhookLocal();
  console.log('');

  // 3. Verificar configuração do webhook
  const webhookAtual = await verificarWebhookConfigurado();
  console.log('');

  // 4. Configurar webhook se necessário
  if (!webhookAtual || webhookAtual.url !== WEBHOOK_URL) {
    await configurarWebhook();
    console.log('');
  }

  // 5. Testar simulação
  if (webhookLocalOk) {
    await simularMensagemTeste();
    console.log('');
  }

  // 6. Oferecer teste real
  if (instanciaOk && webhookLocalOk) {
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('1. Execute: enviarMensagemReal() para enviar teste');
    console.log('2. Responda no WhatsApp');
    console.log('3. Verifique logs do servidor webhook');
    console.log('');
  }

  // Resumo
  console.log('📊 RESUMO DO DIAGNÓSTICO:');
  console.log(`- Instância Evolution API: ${instanciaOk ? '✅' : '❌'}`);
  console.log(`- Webhook Local: ${webhookLocalOk ? '✅' : '❌'}`);
  console.log(`- Webhook Configurado: ${webhookAtual ? '✅' : '❌'}`);
  console.log('');
}

// === EXPORTAR FUNÇÕES ===

if (require.main === module) {
  // Executar diagnóstico se rodado diretamente
  diagnosticoCompleto();
} else {
  // Exportar funções para uso em outros arquivos
  module.exports = {
    verificarInstancia,
    verificarWebhookConfigurado,
    configurarWebhook,
    testarWebhookLocal,
    simularMensagemTeste,
    enviarMensagemReal,
    diagnosticoCompleto
  };
}

// Disponibilizar funções globalmente para teste no terminal
global.verificarInstancia = verificarInstancia;
global.configurarWebhook = configurarWebhook;
global.simularMensagemTeste = simularMensagemTeste;
global.enviarMensagemReal = enviarMensagemReal;
global.diagnosticoCompleto = diagnosticoCompleto; 