import axios from 'axios';

// Teste simples de número de telefone
const testeNumero = {
  "event": "MESSAGES_UPSERT",
  "instance": "atendimento-ao-cliente-suporte",
  "data": {
    "key": {
      "remoteJid": "5511987654321@s.whatsapp.net",
      "fromMe": false,
      "id": "TEST123"
    },
    "message": {
      "conversation": "Teste de número - Por favor me ajude"
    },
    "pushName": "Cliente Real",
    "messageTimestamp": 1750033200
  }
};

console.log('📱 TESTE DE NÚMERO DE TELEFONE');
console.log('=====================================');
console.log('📤 Enviando mensagem de teste para webhook...');
console.log('📞 Número esperado: 5511987654321');
console.log('👤 Nome: Cliente Real');
console.log('💬 Mensagem: Teste de número - Por favor me ajude');

try {
  const response = await axios.post('http://localhost:4000/webhook/evolution', testeNumero, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });
  
  console.log('\n✅ RESPOSTA DO WEBHOOK:');
  console.log('Status:', response.status);
  console.log('Dados:', JSON.stringify(response.data, null, 2));
  
  if (response.data.processed) {
    console.log('\n🎉 SUCESSO! Mensagem processada com êxito');
    console.log('🎫 Ticket ID:', response.data.ticketId);
  } else {
    console.log('\n❌ ERRO: Mensagem não foi processada');
    console.log('📝 Motivo:', response.data.message);
  }
  
} catch (error) {
  console.error('\n❌ ERRO na requisição:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Dados:', error.response.data);
  }
}

console.log('\n📋 IMPORTANTE:');
console.log('💡 Se o teste passou, significa que a extração do número está funcionando!');
console.log('💡 Verifique no banco de dados se o cliente foi criado com o número correto: 5511987654321'); 