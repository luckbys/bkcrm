// ========================================
// TESTE ESPECÍFICO: Analisar Erro 400
// ========================================

import axios from 'axios';

console.log('🔍 TESTE: Analisando erro 400 da Evolution API...');

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

const testarComDetalhes = async () => {
  try {
    console.log('\\n📤 Enviando mensagem com logs detalhados...');
    
    const payload = {
      number: '5511999887766',
      text: 'Teste simples',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: true
      }
    };
    
    console.log('📋 URL:', `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`);
    console.log('📋 Headers:', {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json'
    });
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    
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
    
    console.log('✅ Sucesso:', response.data);
    
  } catch (error) {
    console.error('❌ ERRO 400 DETALHADO:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    
    // Logs mais detalhados
    if (error.response?.data) {
      console.error('🔍 Resposta completa:', JSON.stringify(error.response.data, null, 2));
      
      // Se há um array de mensagens, vamos ver o que contém
      if (error.response.data.response?.message) {
        console.error('📝 Mensagens de erro:', JSON.stringify(error.response.data.response.message, null, 2));
      }
    }
    
    // Tentar payload alternativo
    console.log('\\n🔄 Tentativa 2: Payload simplificado...');
    
    try {
      const payloadSimples = {
        number: '5511999887766',
        text: 'Teste'
      };
      
      console.log('📋 Payload simples:', JSON.stringify(payloadSimples, null, 2));
      
      const response2 = await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        payloadSimples,
        {
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Sucesso com payload simples:', response2.data);
      
    } catch (error2) {
      console.error('❌ Erro também no payload simples:', {
        status: error2.response?.status,
        data: JSON.stringify(error2.response?.data, null, 2)
      });
    }
    
    // Tentar formato de número diferente
    console.log('\\n🔄 Tentativa 3: Formato de número com @s.whatsapp.net...');
    
    try {
      const payloadComSufixo = {
        number: '5511999887766@s.whatsapp.net',
        text: 'Teste'
      };
      
      const response3 = await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        payloadComSufixo,
        {
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Sucesso com @s.whatsapp.net:', response3.data);
      
    } catch (error3) {
      console.error('❌ Erro também com @s.whatsapp.net:', {
        status: error3.response?.status,
        data: JSON.stringify(error3.response?.data, null, 2)
      });
    }
  }
};

testarComDetalhes(); 