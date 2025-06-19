// DIAGNÓSTICO COMPLETO - ENVIO DE MENSAGENS CHAT → WHATSAPP
// Execução: node DIAGNOSTICO_ENVIO_MENSAGENS_DETALHADO.js

const axios = require('axios');

// Configurações
const WEBHOOK_URL = 'http://localhost:4000';
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

console.log('🔍 === DIAGNÓSTICO COMPLETO DE ENVIO DE MENSAGENS ===\n');

async function testarWebhookHealth() {
  console.log('1️⃣ Testando Webhook Server Health...');
  try {
    const response = await axios.get(`${WEBHOOK_URL}/webhook/health`);
    const data = response.data;
    
    console.log('✅ Webhook server está funcionando:');
    console.log(`   Status: ${data.status}`);
    console.log(`   Versão: ${data.version}`);
    console.log(`   Endpoints disponíveis: ${data.endpoints?.length || 0}`);
    return true;
  } catch (error) {
    console.log('❌ Erro ao conectar com webhook server:', error.message);
    return false;
  }
}

async function testarInstanciaEvolution() {
  console.log('\n2️⃣ Testando Status da Instância Evolution API...');
  try {
    const response = await axios.get(`${WEBHOOK_URL}/webhook/check-instance/${INSTANCE_NAME}`);
    const data = response.data;
    
    console.log('✅ Instância Evolution API:');
    console.log(`   Nome: ${data.instance}`);
    console.log(`   Status: ${data.state}`);
    console.log(`   Conectada: ${data.state === 'open' ? 'SIM' : 'NÃO'}`);
    return data.state === 'open';
  } catch (error) {
    console.log('❌ Erro ao verificar instância:', error.message);
    return false;
  }
}

async function testarEnvioMensagem(telefone = '5511999999999') {
  console.log('\n3️⃣ Testando Envio de Mensagem...');
  console.log(`📱 Telefone de teste: ${telefone}`);
  
  try {
    const payload = {
      phone: telefone,
      text: `🤖 Teste de envio - ${new Date().toLocaleString()}`,
      instance: INSTANCE_NAME,
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: false
      }
    };

    console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(`${WEBHOOK_URL}/webhook/send-message`, payload);
    const result = response.data;

    console.log(`📊 Resposta do webhook (${response.status}):`);
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log(`   Message ID: ${result.messageId || result.result?.key?.id}`);
      return true;
    } else {
      console.log('❌ Falha no envio:');
      console.log(`   Erro: ${result.error}`);
      console.log(`   Detalhes:`, result.details || result.result);
      return false;
    }

  } catch (error) {
    console.log('❌ Erro na requisição de envio:', error.message);
    if (error.response) {
      console.log('📊 Resposta de erro:', error.response.data);
    }
    return false;
  }
}

async function testarEvolutionDiretamente(telefone = '5511999999999') {
  console.log('\n4️⃣ Testando Evolution API Diretamente...');
  
  try {
    const payload = {
      number: telefone,
      text: `🔥 Teste direto Evolution API - ${new Date().toLocaleString()}`,
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: false
      }
    };

    console.log('🚀 Enviando direto para Evolution API...');
    console.log(`URL: ${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`);

    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        }
      }
    );

    const result = response.data;

    console.log(`📊 Resposta Evolution API (${response.status}):`);
    console.log(JSON.stringify(result, null, 2));

    console.log('✅ Evolution API respondeu com sucesso!');
    console.log(`   Message ID: ${result.key?.id}`);
    console.log(`   Status: ${result.status}`);
    return true;

  } catch (error) {
    console.log('❌ Evolution API retornou erro:', error.message);
    
    if (error.response) {
      const result = error.response.data;
      console.log(`📊 Resposta de erro (${error.response.status}):`);
      console.log(JSON.stringify(result, null, 2));
      
      // Verificar erro de número inexistente
      if (result.message && Array.isArray(result.message)) {
        const numberCheck = result.message.find(m => m.hasOwnProperty('exists'));
        if (numberCheck && !numberCheck.exists) {
          console.log('🚨 PROBLEMA IDENTIFICADO: NÚMERO NÃO EXISTE NO WHATSAPP!');
          console.log(`   O número ${numberCheck.number} não tem WhatsApp ativo.`);
          console.log('   💡 Use um número real com WhatsApp para testar.');
        }
      }
    }
    
    return false;
  }
}

async function diagnósticoCompleto() {
  console.log('🎯 Iniciando diagnóstico completo...\n');
  
  const webhookOK = await testarWebhookHealth();
  if (!webhookOK) {
    console.log('\n🚨 PARE AQUI: Webhook server não está funcionando!');
    console.log('💡 Solução: cd backend/webhooks && node webhook-evolution-complete-corrigido.js');
    return;
  }

  const instanciaOK = await testarInstanciaEvolution();
  if (!instanciaOK) {
    console.log('\n🚨 PROBLEMA: Instância Evolution API não está conectada!');
    console.log('💡 Verifique se a instância está pareada e ativa na Evolution API.');
  }

  // Testar com número de teste (provavelmente vai falhar)
  console.log('\n🧪 Teste com número fictício (esperado falhar):');
  await testarEnvioMensagem('5511999999999');
  await testarEvolutionDiretamente('5511999999999');

  console.log('\n📋 === RESUMO DO DIAGNÓSTICO ===');
  console.log(`✅ Webhook Server: ${webhookOK ? 'OK' : 'FALHA'}`);
  console.log(`✅ Instância Evolution: ${instanciaOK ? 'OK' : 'FALHA'}`);
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Se webhook/instância OK, teste com número REAL do WhatsApp');
  console.log('2. Para testar no frontend, abra ticket WhatsApp e envie mensagem');
  console.log('3. Verifique console do navegador para logs de envio');
  
  console.log('\n🔧 COMANDOS ÚTEIS:');
  console.log('// No console do navegador:');
  console.log('await window.diagnosticoEnvioMensagens("SEU_NUMERO_REAL");');
  console.log('// Ou teste direto:');
  console.log(`node DIAGNOSTICO_ENVIO_MENSAGENS_DETALHADO.js`);
}

// Auto-execução
if (require.main === module) {
  diagnósticoCompleto().catch(console.error);
}

module.exports = {
  testarWebhookHealth,
  testarInstanciaEvolution,
  testarEnvioMensagem,
  testarEvolutionDiretamente,
  diagnósticoCompleto
}; 