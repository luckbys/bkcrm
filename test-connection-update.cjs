// Script de teste para verificar rota /connection-update
// Simula evento da Evolution API

const fetch = require('node-fetch');

async function testConnectionUpdate() {
  try {
    console.log('🧪 Testando endpoint /webhook/evolution/connection-update...');
    
    const response = await fetch('http://localhost:4000/webhook/evolution/connection-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instance: 'atendimento-ao-cliente-suporte-n1',
        data: {
          state: 'connecting',
          statusReason: 200
        }
      })
    });

    const result = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('🎉 Endpoint /connection-update funcionando corretamente!');
    } else {
      console.log('❌ Endpoint retornou erro');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testConnectionUpdate(); 