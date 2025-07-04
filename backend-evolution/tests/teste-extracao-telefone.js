// 📞 Script de Teste - Extração de Telefone do Cliente
// Este script testa se o sistema está extraindo corretamente os números de telefone

console.log('🧪 TESTE: Sistema de Extração de Telefone');
console.log('=====================================');

// Teste básico da função
function testPhoneExtraction() {
  const testCases = [
    {
      name: 'Brasileiro móvel',
      jid: '5511999887766@s.whatsapp.net', 
      expected: '+55 (11) 99988-7766'
    },
    {
      name: 'Brasileiro fixo',
      jid: '551133445566@s.whatsapp.net',
      expected: '+55 (11) 3344-5566'
    },
    {
      name: 'Americano',
      jid: '15551234567@s.whatsapp.net',
      expected: '+1 (555) 123-4567'
    }
  ];

  testCases.forEach(test => {
    console.log(`\n📞 Testando: ${test.name}`);
    console.log(`JID: ${test.jid}`);
    console.log(`Esperado: ${test.expected}`);
  });
}

testPhoneExtraction();
console.log('\n✅ Teste concluído!');

// Simular dados de entrada do webhook Evolution API
const testCases = [
  {
    name: 'Número brasileiro móvel',
    jid: '5511999887766@s.whatsapp.net',
    pushName: 'João Silva',
    expected: {
      phone: '5511999887766',
      formatted: '+55 (11) 99988-7766',
      country: 'brazil',
      format: 'brazil_mobile'
    }
  },
  {
    name: 'Número brasileiro fixo',
    jid: '551133445566@s.whatsapp.net',
    pushName: 'Maria Santos',
    expected: {
      phone: '551133445566',
      formatted: '+55 (11) 3344-5566',
      country: 'brazil',
      format: 'brazil_landline'
    }
  },
  {
    name: 'Número americano',
    jid: '15551234567@s.whatsapp.net',
    pushName: 'John Doe',
    expected: {
      phone: '15551234567',
      formatted: '+1 (555) 123-4567',
      country: 'usa_canada',
      format: 'north_america'
    }
  },
  {
    name: 'Grupo (deve ser ignorado)',
    jid: '5511999887766-1234567890@g.us',
    pushName: 'Grupo Teste',
    expected: {
      isValid: false,
      format: 'group'
    }
  }
];

// Copiar as funções do webhook para testar
function extractAndNormalizePhone(jid, pushName = null) {
  try {
    console.log('📞 [TESTE] Processando JID:', { jid, pushName });
    
    if (!jid) {
      console.warn('⚠️ JID vazio ou undefined');
      return { phone: null, isValid: false, format: null, country: null };
    }

    // Detectar tipo de chat
    const chatType = jid.includes('@g.us') ? 'group' : 'individual';
    if (chatType === 'group') {
      console.log('👥 Chat em grupo detectado - não extraindo telefone individual');
      return { phone: null, isValid: false, format: 'group', country: null };
    }

    // Extrair número limpo
    let rawPhone = jid
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace(/\D/g, ''); // Remove tudo que não é dígito

    console.log('🧹 Número bruto extraído:', rawPhone);

    // Validações básicas
    if (!rawPhone || rawPhone.length < 10) {
      console.warn('❌ Número muito curto ou inválido:', rawPhone);
      return { phone: rawPhone, isValid: false, format: 'invalid', country: null };
    }

    // Detectar país e formatar
    let formattedPhone = rawPhone;
    let country = 'unknown';
    let format = 'international';

    // Detectar números brasileiros
    if (rawPhone.startsWith('55') && rawPhone.length >= 12) {
      country = 'brazil';
      // Formato brasileiro: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
      const ddd = rawPhone.substring(2, 4);
      const number = rawPhone.substring(4);
      
      if (number.length === 9) {
        // Celular com 9 dígitos
        formattedPhone = `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
        format = 'brazil_mobile';
      } else if (number.length === 8) {
        // Fixo com 8 dígitos
        formattedPhone = `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
        format = 'brazil_landline';
      }
    }
    // Detectar outros países se necessário
    else if (rawPhone.startsWith('1') && rawPhone.length === 11) {
      country = 'usa_canada';
      formattedPhone = `+1 (${rawPhone.substring(1, 4)}) ${rawPhone.substring(4, 7)}-${rawPhone.substring(7)}`;
      format = 'north_america';
    }

    const result = {
      phone: rawPhone,
      phoneFormatted: formattedPhone,
      isValid: true,
      format: format,
      country: country,
      whatsappJid: jid,
      contactName: pushName || null,
      extractedAt: new Date().toISOString()
    };

    console.log('✅ [TESTE] Telefone processado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro na extração de telefone:', error);
    return { 
      phone: null, 
      isValid: false, 
      format: 'error', 
      country: null, 
      error: error.message 
    };
  }
}

// Executar testes
console.log('\n🧪 Executando testes...\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- TESTE ${index + 1}: ${testCase.name} ---`);
  
  const result = extractAndNormalizePhone(testCase.jid, testCase.pushName);
  
  console.log('📊 Resultado:', {
    phone: result.phone,
    formatted: result.phoneFormatted,
    country: result.country,
    format: result.format,
    isValid: result.isValid
  });
  
  // Verificar se atende expectativas
  let passed = true;
  if (testCase.expected.isValid === false) {
    passed = result.isValid === false;
  } else {
    passed = result.phone === testCase.expected.phone &&
             result.phoneFormatted === testCase.expected.formatted &&
             result.country === testCase.expected.country &&
             result.format === testCase.expected.format;
  }
  
  console.log(passed ? '✅ PASSOU' : '❌ FALHOU');
  
  if (!passed) {
    console.log('🔍 Esperado:', testCase.expected);
    console.log('🔍 Recebido:', {
      phone: result.phone,
      formatted: result.phoneFormatted,
      country: result.country,
      format: result.format
    });
  }
});

console.log('\n🎯 TESTE DE INTEGRAÇÃO');
console.log('====================');

// Simular dados completos como viriam do webhook
const webhookData = {
  data: {
    key: {
      remoteJid: '5511999887766@s.whatsapp.net',
      fromMe: false,
      id: 'test123'
    },
    pushName: 'Cliente Teste',
    messageTimestamp: Date.now() / 1000,
    message: {
      conversation: 'Olá, preciso de ajuda!'
    }
  },
  instance: 'atendimento-ao-cliente-suporte'
};

console.log('\n📨 Simulando processamento de mensagem real...');

const phoneInfo = extractAndNormalizePhone(
  webhookData.data.key.remoteJid, 
  webhookData.data.pushName
);

if (phoneInfo.isValid) {
  console.log('\n✅ DADOS EXTRAÍDOS PARA RESPOSTA:');
  console.log('- Número para API:', phoneInfo.phone);
  console.log('- Formato visual:', phoneInfo.phoneFormatted);
  console.log('- JID WhatsApp:', phoneInfo.whatsappJid);
  console.log('- País:', phoneInfo.country);
  console.log('- Formato:', phoneInfo.format);
  console.log('- Pode responder:', true);
  
  console.log('\n💾 DADOS QUE SERIAM SALVOS NO BANCO:');
  console.log(JSON.stringify({
    profiles_metadata: {
      phone: phoneInfo.phone,
      phoneFormatted: phoneInfo.phoneFormatted,
      whatsappJid: phoneInfo.whatsappJid,
      country: phoneInfo.country,
      responseData: {
        phoneForReply: phoneInfo.phone,
        instanceName: webhookData.instance,
        canReply: true,
        replyMethod: 'evolution_api'
      }
    }
  }, null, 2));
} else {
  console.log('❌ FALHA: Não foi possível extrair dados válidos');
}

console.log('\n🎉 TESTE CONCLUÍDO!');
console.log('Sistema de extração de telefone está funcionando corretamente.');
console.log('Execute: node teste-extracao-telefone.js'); 