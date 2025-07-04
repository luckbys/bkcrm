// Script para debugar a Evolution API
const debugEvolutionAPI = async () => {
  console.log('🔍 DIAGNÓSTICO DA EVOLUTION API');
  console.log('================================');

  // 1. Verificar configurações
  console.log('1. 📋 CONFIGURAÇÕES:');
  console.log('- URL:', import.meta.env.VITE_EVOLUTION_API_URL || 'https://webhook.bkcrm.devsible.com.br/api');
  console.log('- API Key:', import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11');
  console.log('');

  // 2. Testar conectividade básica
  console.log('2. 🌐 TESTANDO CONECTIVIDADE:');
  const baseUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://webhook.bkcrm.devsible.com.br/api';
  
  try {
    const response = await fetch(baseUrl + '/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
      }
    });
    
    console.log('- Status HTTP:', response.status);
    console.log('- Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('- Resposta:', data);
    } else {
      const errorText = await response.text();
      console.log('- Erro:', errorText);
    }
  } catch (error) {
    console.error('- Erro de rede:', error.message);
  }
  
  console.log('');

  // 3. Testar endpoints específicos
  console.log('3. 🔧 TESTANDO ENDPOINTS:');
  
  const endpoints = [
    '/health',
    '/stats', 
    '/instance',
    '/instances'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`- Testando ${endpoint}...`);
      const response = await fetch(baseUrl + endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
        }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('  ✅ Sucesso');
      } else {
        console.log('  ❌ Falha');
      }
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    }
  }

  console.log('');

  // 4. Testar criação de instância
  console.log('4. 🚀 TESTANDO CRIAÇÃO DE INSTÂNCIA:');
  const testInstanceName = `debug-test-${Date.now()}`;
  
  try {
    const createData = {
      instanceName: testInstanceName,
      token: '',
      qrcode: true,
      webhook: 'https://webhook.bkcrm.devsible.com.br/webhook/evolution'
    };

    console.log('- Dados de criação:', createData);
    
    const createResponse = await fetch(baseUrl + '/instance/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
      },
      body: JSON.stringify(createData)
    });

    console.log('- Status da criação:', createResponse.status, createResponse.statusText);
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('- ✅ Instância criada:', createResult);

      // Limpar instância de teste
      setTimeout(async () => {
        try {
          await fetch(baseUrl + `/instance/${testInstanceName}/delete`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
            }
          });
          console.log('- 🧹 Instância de teste removida');
        } catch (cleanupError) {
          console.log('- ⚠️ Erro ao limpar instância de teste:', cleanupError.message);
        }
      }, 5000);

    } else {
      const errorText = await createResponse.text();
      console.log('- ❌ Erro na criação:', errorText);
    }
  } catch (error) {
    console.log('- ❌ Erro na criação:', error.message);
  }

  console.log('');
  console.log('✅ Diagnóstico concluído!');
};

// Função simplificada para teste rápido
const quickTest = async () => {
  console.log('🚀 TESTE RÁPIDO DA EVOLUTION API');
  
  try {
    const baseUrl = 'https://webhook.bkcrm.devsible.com.br/api';
    const apiKey = '429683C4C977415CAAFCCE10F7D57E11';
    
    const response = await fetch(baseUrl + '/health', {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando!', data);
      return true;
    } else {
      console.log('❌ API não respondeu:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.debugEvolutionAPI = debugEvolutionAPI;
  window.quickTestEvolution = quickTest;
}

export { debugEvolutionAPI, quickTest }; 