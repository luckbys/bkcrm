import axios from 'axios';

// Script para debugar dados do webhook Evolution API
console.log('🔍 TESTE DE DADOS DO WEBHOOK EVOLUTION API');

// Simulação de dados que podem vir do webhook
const exemplosWebhookData = {
  // Exemplo 1: Estrutura padrão Evolution API
  exemplo1: {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '5511999887766@s.whatsapp.net',
        fromMe: false,
        id: 'BAE51234567890ABCDEF',
        participant: null
      },
      message: {
        conversation: 'Olá, preciso de ajuda'
      },
      pushName: 'João Silva',
      messageTimestamp: 1750033200
    }
  },
  
  // Exemplo 2: Mensagem de grupo
  exemplo2: {
    event: 'MESSAGES_UPSERT', 
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '120363123456789012@g.us',
        fromMe: false,
        id: 'BAE51234567890ABCDEF',
        participant: '5511999887766@s.whatsapp.net'
      },
      message: {
        conversation: 'Mensagem em grupo'
      },
      pushName: 'Maria Santos',
      messageTimestamp: 1750033200
    }
  },

  // Exemplo 3: Número sem código do país
  exemplo3: {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1', 
    data: {
      key: {
        remoteJid: '11999887766@s.whatsapp.net',
        fromMe: false,
        id: 'BAE51234567890ABCDEF'
      },
      message: {
        conversation: 'Teste sem código do país'
      },
      pushName: 'Cliente Teste',
      messageTimestamp: 1750033200
    }
  },

  // Exemplo 4: Número com @c.us (formato antigo)
  exemplo4: {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '5511999887766@c.us',
        fromMe: false,
        id: 'BAE51234567890ABCDEF'
      },
      message: {
        conversation: 'Formato antigo @c.us'
      },
      pushName: 'Pedro Costa',
      messageTimestamp: 1750033200
    }
  },

  // Exemplo 5: Mensagem sem pushName
  exemplo5: {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-sac1',
    data: {
      key: {
        remoteJid: '5511987654321@s.whatsapp.net',
        fromMe: false,
        id: 'BAE51234567890ABCDEF'
      },
      message: {
        conversation: 'Sem nome de contato'
      },
      messageTimestamp: 1750033200
    }
  }
};

// Função de extração de telefone do arquivo original
function extractPhoneFromJid(jid) {
  if (!jid) return null;
  
  // Remover sufixos do WhatsApp  
  const cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  
  // Verificar se é um número válido
  if (!/^\d+$/.test(cleanJid)) return null;
  
  return cleanJid;
}

// Função melhorada de extração
function extractPhoneFromJidMelhorado(jid) {
  console.log('📱 Extraindo telefone de:', jid);
  
  if (!jid) {
    console.log('❌ JID vazio ou nulo');
    return null;
  }
  
  // Detectar se é mensagem de grupo
  if (jid.includes('@g.us')) {
    console.log('👥 Mensagem de grupo detectada, JID inválido para extração de telefone individual');
    return null;
  }
  
  // Remover sufixos do WhatsApp
  let cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  console.log('🧹 JID limpo:', cleanJid);
  
  // Verificar se é um número válido (apenas dígitos)
  if (!/^\d+$/.test(cleanJid)) {
    console.log('❌ JID não contém apenas números:', cleanJid);
    return null;
  }
  
  // Verificar tamanho mínimo
  if (cleanJid.length < 10) {
    console.log('❌ Número muito curto:', cleanJid);
    return null;
  }
  
  // Adicionar código do país se necessário (Brasil = 55)
  if (cleanJid.length >= 10 && !cleanJid.startsWith('55')) {
    console.log('🇧🇷 Adicionando código do país (55)');
    cleanJid = '55' + cleanJid;
  }
  
  console.log('✅ Número extraído:', cleanJid);
  return cleanJid;
}

// Testar todos os exemplos
console.log('\n=== TESTANDO EXTRAÇÃO DE TELEFONE ===\n');

Object.entries(exemplosWebhookData).forEach(([nomeExemplo, dados]) => {
  console.log(`🧪 ${nomeExemplo.toUpperCase()}:`);
  console.log('📥 Dados recebidos:', {
    event: dados.event,
    instance: dados.instance,
    remoteJid: dados.data.key?.remoteJid,
    fromMe: dados.data.key?.fromMe,
    participant: dados.data.key?.participant,
    pushName: dados.data.pushName
  });
  
  // Testar função original
  const telefoneOriginal = extractPhoneFromJid(dados.data.key.remoteJid);
  console.log('📞 Função original:', telefoneOriginal);
  
  // Testar função melhorada
  const telefoneMelhorado = extractPhoneFromJidMelhorado(dados.data.key.remoteJid);
  console.log('📞 Função melhorada:', telefoneMelhorado);
  
  // Para grupos, tentar extrair do participant
  if (dados.data.key.participant) {
    console.log('👥 Tentando extrair do participant (grupo):');
    const telefoneParticipant = extractPhoneFromJidMelhorado(dados.data.key.participant);
    console.log('📞 Participant:', telefoneParticipant);
  }
  
  console.log('---');
});

// Função para testar webhook real
async function testarWebhookReal() {
  try {
    console.log('\n🌐 TESTANDO WEBHOOK REAL...\n');
    
    // Health check
    const healthResponse = await axios.get('http://localhost:4000/webhook/health', {
      timeout: 5000
    });
    
    console.log('✅ Webhook está rodando:', healthResponse.data);
    
    // Testar com dados simulados
    for (const [nome, dados] of Object.entries(exemplosWebhookData)) {
      try {
        console.log(`\n📤 Testando ${nome}...`);
        
        const response = await axios.post('http://localhost:4000/webhook/evolution', dados, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Resposta:', response.data);
        
      } catch (error) {
        console.error(`❌ Erro em ${nome}:`, error.message);
      }
      
      // Aguardar entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do webhook:', error.message);
    console.log('💡 Certifique-se de que o webhook está rodando em http://localhost:4000');
  }
}

// Executar testes
console.log('🚀 Iniciando testes...\n');

// Testes offline primeiro
await new Promise(resolve => setTimeout(resolve, 100));

// Depois tentar webhook real se especificado
if (process.argv.includes('--real')) {
  await testarWebhookReal();
} else {
  console.log('\n💡 Para testar com webhook real, execute: node teste-webhook-dados.js --real');
}

console.log('\n✅ Testes concluídos!'); 