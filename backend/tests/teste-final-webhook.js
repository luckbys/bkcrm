import axios from 'axios';

console.log('🧪 TESTE FINAL - RASTREAMENTO COMPLETO DO WEBHOOK');
console.log('==================================================');

// Dados de teste com número específico
const testeWebhook = {
  "event": "MESSAGES_UPSERT",
  "instance": "atendimento-ao-cliente-sac1",
  "data": {
    "key": {
      "remoteJid": "5512345678900@s.whatsapp.net",
      "fromMe": false,
      "id": "TESTE_FINAL_2025"
    },
    "message": {
      "conversation": "TESTE FINAL - Quero verificar se meu número está sendo extraído corretamente: 5512345678900"
    },
    "pushName": "Cliente Teste Final",
    "messageTimestamp": Math.floor(Date.now() / 1000)
  }
};

console.log('📤 Enviando dados de teste:');
console.log('📞 Número esperado: 5512345678900');
console.log('🏷️ JID completo:', testeWebhook.data.key.remoteJid);
console.log('👤 Nome:', testeWebhook.data.pushName);
console.log('💬 Mensagem:', testeWebhook.data.message.conversation);

try {
  const response = await axios.post('http://localhost:4000/webhook/evolution', testeWebhook, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
  
  console.log('\n✅ RESPOSTA RECEBIDA:');
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  console.log('Dados:', JSON.stringify(response.data, null, 2));
  
  if (response.data.processed) {
    console.log('\n🎯 ANÁLISE DA RESPOSTA:');
    console.log('✅ Processamento: SUCESSO');
    console.log('🎫 Ticket criado:', response.data.ticketId);
    
    if (response.data.customerId) {
      console.log('👤 Cliente criado:', response.data.customerId);
    } else {
      console.log('⚠️ Customer ID não retornado na resposta');
    }
  } else {
    console.log('\n❌ PROCESSAMENTO FALHOU');
    console.log('📝 Motivo:', response.data.message);
  }
  
} catch (error) {
  console.error('\n❌ ERRO NA REQUISIÇÃO:', error.message);
  if (error.response) {
    console.error('Status HTTP:', error.response.status);
    console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));
  }
}

console.log('\n📋 AÇÕES RECOMENDADAS:');
console.log('1. Verificar logs do webhook no terminal onde está rodando');
console.log('2. Verificar se há erros na criação do cliente no banco');
console.log('3. Verificar se a tabela customers existe e tem as colunas corretas');
console.log('4. Verificar se as credenciais do Supabase estão corretas'); 