// Script de teste para verificar rota /connection-update
// Simula evento da Evolution API

const fetch = require('node-fetch');

console.log('🧪 Testando rota /connection-update...\n');

// Payload de teste simulando connection.update da Evolution API
const testPayload = {
  instance: 'atendimento-ao-cliente-suporte-n1',
  data: {
    instance: 'atendimento-ao-cliente-suporte-n1',
    wuid: '5512981022013@s.whatsapp.net',
    profileName: 'Lucas Borges',
    profilePictureUrl: 'https://pps.whatsapp.net/v/t61.24694-24/test.jpg',
    state: 'open',
    statusReason: 200
  }
};

async function testarConnectionUpdate() {
  try {
    console.log('📤 Enviando connection.update para /connection-update...');
    
    const response = await fetch('http://localhost:4000/connection-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 10000
    });

    console.log(`📊 Status Response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📥 Resposta do webhook:');
      console.log(JSON.stringify(data, null, 2));
      console.log('✅ SUCESSO: Rota /connection-update esta funcionando!');
    } else {
      console.log('❌ ERRO: Webhook retornou status', response.status);
      const errorText = await response.text();
      console.log('📄 Erro:', errorText);
    }
    
  } catch (error) {
    console.log('❌ ERRO ao testar webhook:', error.message);
    console.log('🔌 CAUSA PROVAVEL: Servidor webhook nao esta rodando na porta 4000');
    console.log('💡 SOLUCAO: Execute "npm run webhook" em outro terminal');
  }
}

testarConnectionUpdate(); 