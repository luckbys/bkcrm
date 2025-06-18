// 🧪 TESTE DE UUID CORRIGIDO - Verificar se o problema foi resolvido
// Execute: node teste-uuid-corrigido.js

console.log('🧪 TESTANDO CORREÇÃO DE UUID DO WEBHOOK');
console.log('=====================================');

// Simular payload de mensagem WhatsApp
const testePayload = {
  event: 'MESSAGES_UPSERT',
  instance: 'atendimento-ao-cliente-sac1',
  data: {
    key: {
      remoteJid: '5512981022013@s.whatsapp.net',
      fromMe: false,
      id: 'teste-uuid-' + Date.now(),
      participant: undefined
    },
    message: {
      conversation: 'Teste de correção de UUID - mensagem de teste'
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'Lucas Borges'
  }
};

console.log('📤 Enviando payload de teste para webhook...');
console.log('📱 Telefone:', '5512981022013');
console.log('👤 Nome:', 'Lucas Borges');
console.log('💬 Mensagem:', 'Teste de correção de UUID');

// Função para testar o webhook
async function testarWebhookCorrigido() {
  try {
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testePayload)
    });

    const resultado = await response.json();

    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('======================');
    console.log('Status HTTP:', response.status);
    console.log('Processado:', resultado.processed);
    console.log('Mensagem:', resultado.message);
    console.log('Ticket ID:', resultado.ticketId);
    console.log('Timestamp:', resultado.timestamp);

    if (response.status === 200 && resultado.processed) {
      console.log('\n✅ TESTE PASSOU! UUID está funcionando corretamente');
      console.log('🎯 O problema de UUID inválido foi resolvido');
      
      // Verificar se o ticket ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (resultado.ticketId && uuidRegex.test(resultado.ticketId)) {
        console.log('✅ Ticket ID é um UUID válido:', resultado.ticketId);
      } else {
        console.log('⚠️ Ticket ID não é um UUID válido:', resultado.ticketId);
      }
    } else {
      console.log('\n❌ TESTE FALHOU!');
      console.log('❌ Ainda há problemas no processamento');
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.log('❌ Webhook pode não estar rodando na porta 4000');
  }
}

// Executar teste
testarWebhookCorrigido();

console.log('\n📋 INSTRUÇÕES:');
console.log('===============');
console.log('1. Certifique-se que o webhook está rodando: node webhook-evolution-complete-corrigido.js');
console.log('2. Execute o script SQL no Supabase: CORRECAO_BANCO_DEFINITIVA.sql');
console.log('3. Se o teste passou, envie uma mensagem WhatsApp real para confirmar');
console.log('4. Monitore os logs do webhook para verificar se não há mais erros de UUID'); 