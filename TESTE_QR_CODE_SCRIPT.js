// 🔧 SCRIPT DE TESTE - QR CODE WhatsApp Evolution API
// Execute este script no console do navegador (F12) para testar toda a funcionalidade

console.log('🚀 Iniciando Teste Completo do QR Code WhatsApp');
console.log('================================================');

async function testeCompletoQRCode() {
  const CREDENTIALS = {
    SERVER_URL: 'https://press-evolution-api.jhkbgs.easypanel.host/',
    API_KEY: '429683C4C977415CAAFCCE10F7D57E11'
  };

  // Função auxiliar para fazer requests
  async function makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'apikey': CREDENTIALS.API_KEY,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Erro na request para ${url}:`, error.message);
      throw error;
    }
  }

  try {
    // 1. Testar conectividade da API
    console.log('\n1️⃣ Testando conectividade da Evolution API...');
    const apiInfo = await makeRequest(CREDENTIALS.SERVER_URL);
    console.log('✅ API acessível:', apiInfo);

    // 2. Listar instâncias existentes
    console.log('\n2️⃣ Listando instâncias existentes...');
    const instances = await makeRequest(`${CREDENTIALS.SERVER_URL}instance/fetchInstances`);
    console.log('📋 Instâncias encontradas:', instances.length);
    instances.forEach((inst, i) => {
      console.log(`   ${i+1}. ${inst.instanceName} - Status: ${inst.status}`);
    });

    // 3. Criar instância de teste
    console.log('\n3️⃣ Criando instância de teste...');
    const testInstanceName = `teste_qr_${Date.now()}`;
    
    const createPayload = {
      instanceName: testInstanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook_by_events: true,
      events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE']
    };

    const createResponse = await makeRequest(
      `${CREDENTIALS.SERVER_URL}instance/create`,
      {
        method: 'POST',
        body: JSON.stringify(createPayload)
      }
    );
    console.log('✅ Instância criada:', createResponse);

    // 4. Aguardar instância ser criada
    console.log('\n4️⃣ Aguardando instância ser criada completamente...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Tentar conectar e obter QR Code
    console.log('\n5️⃣ Conectando instância para gerar QR Code...');
    
    try {
      const connectResponse = await makeRequest(
        `${CREDENTIALS.SERVER_URL}instance/connect/${testInstanceName}`,
        { method: 'GET' }
      );
      console.log('📡 Resposta da conexão:', connectResponse);

      if (connectResponse.qrcode) {
        console.log('🎯 QR Code encontrado na resposta da conexão!');
        console.log('📱 Tipo:', connectResponse.qrcode.startsWith('data:') ? 'Base64' : 'Texto');
        console.log('📏 Tamanho:', connectResponse.qrcode.length, 'caracteres');
        console.log('🔍 Início:', connectResponse.qrcode.substring(0, 50) + '...');
        
        // Tentar exibir o QR Code
        if (connectResponse.qrcode.startsWith('data:image')) {
          console.log('🖼️ QR Code em formato de imagem - pode ser exibido no modal');
        } else {
          console.log('📝 QR Code em formato de texto - será convertido para imagem no modal');
        }
      } else {
        console.log('⚠️ QR Code não encontrado na resposta da conexão');
      }
    } catch (connectError) {
      console.log('❌ Erro ao conectar:', connectError.message);
    }

    // 6. Verificar status da instância
    console.log('\n6️⃣ Verificando status da instância...');
    try {
      const statusResponse = await makeRequest(
        `${CREDENTIALS.SERVER_URL}instance/connectionState/${testInstanceName}`
      );
      console.log('📊 Status da instância:', statusResponse);

      if (statusResponse.instance && statusResponse.instance.qrcode) {
        console.log('🎯 QR Code encontrado no status da instância!');
      }
    } catch (statusError) {
      console.log('❌ Erro ao verificar status:', statusError.message);
    }

    // 7. Buscar na listagem de instâncias
    console.log('\n7️⃣ Buscando QR Code na listagem de instâncias...');
    try {
      const specificInstances = await makeRequest(
        `${CREDENTIALS.SERVER_URL}instance/fetchInstances?instanceName=${testInstanceName}`
      );
      console.log('🔍 Instância específica:', specificInstances);

      if (specificInstances.length > 0 && specificInstances[0].qrcode) {
        console.log('🎯 QR Code encontrado na listagem de instâncias!');
      }
    } catch (listError) {
      console.log('❌ Erro ao listar instâncias:', listError.message);
    }

    // 8. Limpeza - deletar instância de teste
    console.log('\n8️⃣ Limpando instância de teste...');
    try {
      await makeRequest(
        `${CREDENTIALS.SERVER_URL}instance/delete/${testInstanceName}`,
        { method: 'DELETE' }
      );
      console.log('🗑️ Instância de teste removida com sucesso');
    } catch (deleteError) {
      console.log('❌ Erro ao remover instância de teste:', deleteError.message);
    }

    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
    console.log('================================================');
    
    return {
      success: true,
      message: 'Teste executado com sucesso. Verifique os logs acima para detalhes.'
    };

  } catch (error) {
    console.error('\n❌ ERRO GERAL NO TESTE:', error);
    console.log('================================================');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste
testeCompletoQRCode()
  .then(result => {
    console.log('\n🎯 RESULTADO FINAL:', result);
    
    if (result.success) {
      console.log('\n✅ A Evolution API está funcionando corretamente!');
      console.log('💡 Agora você pode testar no sistema normalmente.');
    } else {
      console.log('\n❌ Problemas encontrados na Evolution API');
      console.log('🔧 Verifique as credenciais e conectividade');
    }
  })
  .catch(error => {
    console.error('\n💥 ERRO FATAL:', error);
  });

// Função para testar apenas conectividade
window.testarApenasConectividade = async function() {
  console.log('🔌 Testando apenas conectividade...');
  
  try {
    const response = await fetch('https://press-evolution-api.jhkbgs.easypanel.host/', {
      headers: { 'apikey': '429683C4C977415CAAFCCE10F7D57E11' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API acessível:', data);
      return true;
    } else {
      console.log('❌ API retornou erro:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
    return false;
  }
};

console.log('\n📋 COMANDOS DISPONÍVEIS:');
console.log('• testarApenasConectividade() - Testa apenas se a API está acessível');
console.log('• O teste completo já foi executado automaticamente');
console.log('\n⚡ Aguarde o resultado do teste completo...\n'); 