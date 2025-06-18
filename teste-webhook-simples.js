// 🧪 Teste Simples do Webhook Corrigido
console.log('🧪 TESTE: Webhook Evolution API Corrigido');
console.log('=========================================');

// Simular dados de mensagem WhatsApp
const testMessage = {
  data: {
    key: {
      remoteJid: '5512981022013@s.whatsapp.net',
      fromMe: false,
      id: 'test-message-123'
    },
    pushName: 'Lucas Borges Teste',
    messageTimestamp: Math.floor(Date.now() / 1000),
    message: {
      conversation: 'Olá! Este é um teste do webhook corrigido.'
    }
  },
  instance: 'atendimento-ao-cliente-sac1'
};

console.log('\n📱 Dados de teste simulados:');
console.log('JID:', testMessage.data.key.remoteJid);
console.log('Nome:', testMessage.data.pushName);
console.log('Mensagem:', testMessage.data.message.conversation);
console.log('Instância:', testMessage.instance);

console.log('\n🔍 Verificando extração de telefone...');

// Extrair telefone (função simplificada)
function extractPhone(jid) {
  if (!jid || jid.includes('@g.us')) {
    return null;
  }
  
  const clean = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  
  if (clean.length < 10) {
    return null;
  }
  
  // Formatar número brasileiro
  if (clean.startsWith('55') && clean.length >= 12) {
    const ddd = clean.substring(2, 4);
    const number = clean.substring(4);
    if (number.length === 9) {
      return {
        raw: clean,
        formatted: `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`,
        country: 'brazil'
      };
    }
  }
  
  return {
    raw: clean,
    formatted: clean,
    country: 'unknown'
  };
}

const phoneResult = extractPhone(testMessage.data.key.remoteJid);

if (phoneResult) {
  console.log('✅ Telefone extraído com sucesso:');
  console.log('   Raw:', phoneResult.raw);
  console.log('   Formatado:', phoneResult.formatted);
  console.log('   País:', phoneResult.country);
} else {
  console.log('❌ Falha na extração do telefone');
}

console.log('\n🗄️ Dados que seriam enviados para o banco:');
console.log({
  cliente: {
    nome: testMessage.data.pushName,
    telefone: phoneResult?.raw,
    telefoneFormatado: phoneResult?.formatted
  },
  ticket: {
    titulo: `WhatsApp: ${testMessage.data.pushName}`,
    telefone: phoneResult?.raw,
    instancia: testMessage.instance,
    canal: 'whatsapp'
  },
  mensagem: {
    conteudo: testMessage.data.message.conversation,
    remetente: testMessage.data.pushName,
    telefone: phoneResult?.raw
  }
});

console.log('\n✅ TESTE CONCLUÍDO!');
console.log('\n📝 Próximos passos:');
console.log('1. Execute o script SQL: CORRECAO_BANCO_PROFILES_PHONE.sql');
console.log('2. Reinicie o webhook: node webhook-evolution-complete-corrigido.js');
console.log('3. Envie mensagem WhatsApp real para testar');
console.log('4. Verifique logs sem erros de banco');

console.log('\n🎯 Aguardando correção do banco de dados...'); 