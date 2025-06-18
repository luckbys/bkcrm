// ========================================
// TESTE DETALHADO: Evolution API
// ========================================

import axios from 'axios';

console.log('🔍 TESTE DETALHADO: Analisando Evolution API...');

// Configurações diretas
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

// 1. Testar conexão direta com Evolution API
const testarConexaoEvolution = async () => {
  try {
    console.log('\\n🔌 1. Testando conexão direta com Evolution API...');
    
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Conexão Evolution API OK:', {
      status: response.status,
      data: response.data
    });
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ Erro na conexão Evolution API:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    return { success: false, error: error.message };
  }
};

// 2. Testar status da instância
const testarStatusInstancia = async () => {
  try {
    console.log('\\n📱 2. Verificando status da instância...');
    
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('📊 Status da instância:', {
      status: response.status,
      connectionState: response.data?.instance?.state,
      qrcode: response.data?.instance?.qrcode ? 'Disponível' : 'Não disponível'
    });
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    return { success: false, error: error.message };
  }
};

// 3. Testar envio direto via Evolution API
const testarEnvioDireto = async () => {
  try {
    console.log('\\n📤 3. Testando envio direto via Evolution API...');
    
    const payload = {
      number: '5511999887766',
      text: 'Teste direto da Evolution API - Funcionando!',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: true
      }
    };
    
    console.log('📋 Payload do teste:', payload);
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      payload,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Envio direto OK:', {
      status: response.status,
      messageId: response.data?.key?.id,
      success: response.data?.message ? true : false
    });
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ Erro no envio direto:', {
      status: error.response?.status,
      message: error.message,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Mostrar mais detalhes do erro
    if (error.response?.data) {
      console.error('🔍 Detalhes do erro Evolution:', error.response.data);
    }
    
    return { success: false, error: error.message, details: error.response?.data };
  }
};

// 4. Testar via webhook local
const testarViaWebhook = async () => {
  try {
    console.log('\\n🌐 4. Testando via webhook local...');
    
    const payload = {
      phone: '5511999887766',
      text: 'Teste via webhook local - Funcionando!',
      instance: INSTANCE_NAME,
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: true
      }
    };
    
    const response = await axios.post(
      'http://localhost:4000/webhook/send-message',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Webhook local OK:', {
      status: response.status,
      success: response.data?.success,
      messageId: response.data?.messageId,
      error: response.data?.error
    });
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ Erro no webhook local:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    return { success: false, error: error.message };
  }
};

// Executar todos os testes
const executarTestesDetalhados = async () => {
  console.log('🎯 INICIANDO TESTES DETALHADOS...\\n');
  
  const resultados = {
    conexao: await testarConexaoEvolution(),
    status: await testarStatusInstancia(), 
    envioDireto: await testarEnvioDireto(),
    webhook: await testarViaWebhook()
  };
  
  console.log('\\n📋 RESUMO DETALHADO:');
  Object.entries(resultados).forEach(([teste, resultado]) => {
    const status = resultado.success ? '✅ OK' : '❌ FALHOU';
    console.log(`  ${teste}: ${status}`);
    if (!resultado.success && resultado.error) {
      console.log(`    Erro: ${resultado.error}`);
    }
  });
  
  const todosOK = Object.values(resultados).every(r => r.success);
  
  if (todosOK) {
    console.log('\\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ A Evolution API está funcionando corretamente');
  } else {
    console.log('\\n❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique as configurações ou status da instância');
  }
  
  return resultados;
};

// Executar
executarTestesDetalhados(); 