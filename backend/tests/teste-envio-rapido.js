// TESTE RÁPIDO - ENVIO DE MENSAGENS WHATSAPP
// Execução: node backend/tests/teste-envio-rapido.js

console.log('🧪 TESTE RÁPIDO - ENVIO DE MENSAGENS WHATSAPP\n');

const WEBHOOK_URL = 'http://localhost:4000';

// Função para testar envio
async function testarEnvio(telefone, mensagem) {
  try {
    console.log(`📤 Testando envio para: ${telefone}`);
    console.log(`💬 Mensagem: ${mensagem}`);
    
    const response = await fetch(`${WEBHOOK_URL}/webhook/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: telefone,
        text: mensagem,
        instance: 'atendimento-ao-cliente-suporte'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ SUCESSO!');
      console.log(`   📱 ID da mensagem: ${result.messageId}`);
      console.log(`   📊 Status: ${result.status}`);
      return true;
    } else {
      console.log('❌ ERRO!');
      console.log(`   🚨 Erro: ${result.error}`);
      if (result.details) {
        console.log(`   📋 Detalhes:`, result.details);
      }
      return false;
    }

  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO!');
    console.log(`   🚨 Erro: ${error.message}`);
    return false;
  }
}

// Função para verificar status do webhook
async function verificarWebhook() {
  try {
    console.log('🔍 Verificando status do webhook...');
    
    const response = await fetch(`${WEBHOOK_URL}/webhook/health`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Webhook OK!');
      console.log(`   📋 Versão: ${data.version}`);
      console.log(`   📤 Envio habilitado: ${data.endpoints.includes('POST /webhook/send-message') ? 'SIM' : 'NÃO'}`);
      return true;
    } else {
      console.log('❌ Webhook com problema!');
      return false;
    }

  } catch (error) {
    console.log('❌ Webhook não está rodando!');
    console.log(`   🚨 Erro: ${error.message}`);
    console.log('   💡 Execute: node backend/webhooks/webhook-evolution-complete-corrigido.js');
    return false;
  }
}

// Execução principal
async function executarTeste() {
  console.log('🚀 Iniciando teste...\n');

  // 1. Verificar webhook
  const webhookOk = await verificarWebhook();
  console.log('');

  if (!webhookOk) {
    console.log('🛑 Teste interrompido - webhook não está funcionando');
    return;
  }

  // 2. Testar envio para número que já funcionou antes
  const telefoneTest = '5512981022013'; // Lucas Borges
  const mensagem = `🧪 TESTE AUTOMÁTICO - ${new Date().toLocaleString('pt-BR')}`;
  
  const envioOk = await testarEnvio(telefoneTest, mensagem);
  console.log('');

  // 3. Resultado final
  if (envioOk) {
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Webhook está funcionando perfeitamente');
    console.log('✅ Envio de mensagens WhatsApp ativo');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Teste no seu sistema TK enviando uma mensagem');
    console.log('   2. Verifique se a mensagem chegou no WhatsApp');
    console.log('   3. Se não funcionar, verifique os logs do webhook');
  } else {
    console.log('❌ TESTE FALHOU!');
    console.log('🔧 Verifique:');
    console.log('   1. Se a instância Evolution API está conectada');
    console.log('   2. Se o telefone tem WhatsApp ativo');
    console.log('   3. Os logs do webhook para mais detalhes');
  }
}

// Para uso direto no Node.js
if (require.main === module) {
  executarTeste().catch(console.error);
}

// Para uso no navegador (global)
if (typeof window !== 'undefined') {
  window.testarEnvioWhatsApp = executarTeste;
  console.log('✅ Função global criada: testarEnvioWhatsApp()');
}

module.exports = {
  testarEnvio,
  verificarWebhook,
  executarTeste
}; 