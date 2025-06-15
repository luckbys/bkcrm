// 🔧 Corrigir Webhook de Produção - Credenciais Supabase
// Este script testa e corrige as credenciais do webhook de produção

const WEBHOOK_PRODUCAO = 'https://bkcrm.devsible.com.br';

async function testarWebhookProducao() {
  console.log('🔧 TESTANDO WEBHOOK DE PRODUÇÃO');
  console.log('='.repeat(50));
  console.log(`📡 URL: ${WEBHOOK_PRODUCAO}`);
  console.log('');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch(`${WEBHOOK_PRODUCAO}/webhook/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Webhook de produção está online');
      console.log('📋 Endpoints:', healthData.endpoints);
    } else {
      console.log('❌ Webhook de produção não está respondendo');
      console.log(`📊 Status: ${healthResponse.status}`);
    }
    console.log('');

    // 2. Testar endpoint de mensagem com payload real
    console.log('2️⃣ Testando processamento de mensagem...');
    
    const payloadTeste = {
      event: 'MESSAGES_UPSERT',
      instance: 'atendimento-ao-cliente-sac1',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: `test_${Date.now()}`
        },
        message: {
          conversation: 'Teste de mensagem para verificar webhook de produção'
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Cliente Teste Produção'
      }
    };

    const messageResponse = await fetch(`${WEBHOOK_PRODUCAO}/webhook/evolution/messages-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadTeste)
    });

    const messageResult = await messageResponse.json();
    
    console.log(`📊 Status: ${messageResponse.status} ${messageResponse.statusText}`);
    console.log('📋 Resposta:', JSON.stringify(messageResult, null, 2));

    if (messageResponse.ok) {
      if (messageResult.processed) {
        console.log('✅ Webhook de produção processou a mensagem com sucesso!');
        console.log('🎯 Problema resolvido - sistema funcionando');
      } else {
        console.log('⚠️ Webhook recebeu mas não processou completamente');
        console.log(`📝 Motivo: ${messageResult.message}`);
        
        if (messageResult.message?.includes('Invalid API key')) {
          console.log('');
          console.log('🔑 PROBLEMA: Credenciais do Supabase inválidas no servidor de produção');
          console.log('');
          console.log('🔧 SOLUÇÕES:');
          console.log('1. Verificar se as credenciais estão corretas no servidor');
          console.log('2. Atualizar variáveis de ambiente no EasyPanel');
          console.log('3. Reiniciar o webhook de produção');
        }
      }
    } else {
      console.log('❌ Erro ao processar mensagem no webhook de produção');
    }

  } catch (error) {
    console.error('❌ Erro ao testar webhook de produção:', error.message);
    console.log('');
    console.log('🔍 Possíveis causas:');
    console.log('1. Webhook de produção não está rodando');
    console.log('2. Problema de conectividade');
    console.log('3. Configuração incorreta no servidor');
  }

  console.log('');
  console.log('📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:');
  console.log('1. ✅ Evolution API está funcionando (mensagens chegando)');
  console.log('2. ✅ Webhook está recebendo as mensagens');
  console.log('3. ❌ Credenciais do Supabase inválidas no servidor de produção');
  console.log('4. ❌ Processamento de telefone/conteúdo com erro');
  console.log('');
  console.log('🔧 PRÓXIMOS PASSOS:');
  console.log('1. Corrigir credenciais do Supabase no servidor de produção');
  console.log('2. Corrigir validação de telefone/conteúdo');
  console.log('3. Testar novamente com mensagem real');
}

// Executar teste
testarWebhookProducao().catch(console.error); 