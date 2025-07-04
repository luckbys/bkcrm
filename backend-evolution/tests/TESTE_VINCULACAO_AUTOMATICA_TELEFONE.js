/**
 * 🧪 TESTE DA VINCULAÇÃO AUTOMÁTICA DE TELEFONE
 * 
 * Script para testar se o webhook está capturando e vinculando
 * automaticamente o telefone do remetente aos tickets WhatsApp
 */

// Função de teste disponível globalmente
if (typeof window !== 'undefined') {
  window.testeVinculacaoAutomaticaTelefone = testeVinculacaoAutomaticaTelefone;
  window.verificarTicketsComTelefone = verificarTicketsComTelefone;
  window.simularMensagemWhatsApp = simularMensagemWhatsApp;
}

/**
 * 🔍 VERIFICAR TICKETS COM TELEFONE
 */
async function verificarTicketsComTelefone() {
  console.log('🔍 === VERIFICANDO TICKETS COM TELEFONE ===');
  
  try {
    // 1. Verificar webhook funcionando
    console.log('\n🔗 1. VERIFICANDO WEBHOOK:');
    try {
      const response = await fetch('http://localhost:4000/webhook/health');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Webhook: ${data.status} (v${data.version})`);
      } else {
        console.log(`   ❌ Webhook: HTTP ${response.status}`);
        return;
      }
    } catch (error) {
      console.log(`   ❌ Webhook não está rodando na porta 4000`);
      return;
    }
    
    // 2. Buscar tickets WhatsApp no banco
    console.log('\n📋 2. VERIFICANDO TICKETS WHATSAPP NO BANCO:');
    
    // Simular busca no Supabase (usar o hook real do frontend)
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: tickets, error } = await window.supabase
        .from('tickets')
        .select('*')
        .eq('channel', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('❌ Erro ao buscar tickets:', error);
        return;
      }
      
      console.log(`   📊 Total de tickets WhatsApp: ${tickets.length}`);
      
      // Verificar telefones vinculados
      const ticketsComTelefone = tickets.filter(ticket => 
        ticket.client_phone || 
        ticket.customerPhone || 
        ticket.metadata?.whatsapp_phone ||
        ticket.metadata?.client_phone
      );
      
      console.log(`   📱 Tickets com telefone: ${ticketsComTelefone.length}`);
      
      // Mostrar exemplos
      console.log('\n📋 EXEMPLOS DE TICKETS COM TELEFONE:');
      ticketsComTelefone.slice(0, 3).forEach((ticket, index) => {
        const phone = ticket.client_phone || 
                     ticket.customerPhone || 
                     ticket.metadata?.whatsapp_phone ||
                     ticket.metadata?.client_phone;
                     
        console.log(`   ${index + 1}. Ticket: ${ticket.id}`);
        console.log(`      Título: ${ticket.title}`);
        console.log(`      Telefone: ${phone}`);
        console.log(`      Cliente: ${ticket.client || 'N/A'}`);
        console.log(`      Status: ${ticket.status}`);
        console.log(`      Criado: ${new Date(ticket.created_at).toLocaleString()}`);
        console.log('');
      });
      
    } else {
      console.log('   ⚠️ Supabase não disponível no contexto atual');
      console.log('   💡 Execute este teste no console do navegador com o CRM aberto');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

/**
 * 🧪 SIMULAR MENSAGEM WHATSAPP
 */
async function simularMensagemWhatsApp() {
  console.log('🧪 === SIMULANDO MENSAGEM WHATSAPP ===');
  
  const payload = {
    event: "messages.upsert",
    instance: "atendimento-ao-cliente-suporte",
    data: {
      key: {
        remoteJid: "5511999998888@s.whatsapp.net",
        fromMe: false,
        id: "test_" + Date.now()
      },
      pushName: "Cliente Teste",
      messageTimestamp: Math.floor(Date.now() / 1000),
      message: {
        conversation: "Olá! Esta é uma mensagem de teste para verificar a vinculação automática do telefone."
      }
    }
  };
  
  try {
    console.log('📤 Enviando payload de teste para webhook...');
    console.log('📱 Telefone simulado: +5511999998888');
    
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook processou a mensagem:');
      console.log('   📋 Processado:', result.processed);
      console.log('   🎫 Ticket ID:', result.result?.ticketId);
      console.log('   👤 Cliente ID:', result.result?.customerId);
      console.log('   💬 Mensagem ID:', result.result?.messageId);
      
      // Aguardar um pouco e verificar se ticket foi criado com telefone
      setTimeout(async () => {
        console.log('\n🔍 Verificando se ticket foi criado com telefone...');
        await verificarTicketsComTelefone();
      }, 2000);
      
    } else {
      console.error('❌ Erro no webhook:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao simular mensagem:', error);
  }
}

/**
 * 🧪 TESTE COMPLETO
 */
async function testeVinculacaoAutomaticaTelefone() {
  console.log('🧪 === TESTE VINCULAÇÃO AUTOMÁTICA TELEFONE ===');
  console.log('📋 Verificando se webhook captura e vincula telefone automaticamente...\n');
  
  try {
    // 1. Verificar estado atual
    await verificarTicketsComTelefone();
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Simular nova mensagem
    console.log('\n🧪 SIMULANDO NOVA MENSAGEM:');
    await simularMensagemWhatsApp();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ TESTE COMPLETO!');
    console.log('📋 O que foi testado:');
    console.log('   ✅ Status do webhook Evolution API');
    console.log('   ✅ Tickets WhatsApp existentes no banco');
    console.log('   ✅ Vinculação de telefone nos tickets');
    console.log('   ✅ Simulação de nova mensagem');
    console.log('\n📱 Se funcionando corretamente:');
    console.log('   • Webhook captura telefone da mensagem');
    console.log('   • Vincula automaticamente ao ticket');
    console.log('   • Campos client_phone/customerPhone preenchidos');
    console.log('   • Frontend pode acessar telefone diretamente');
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  }
}

// Log de funções disponíveis
console.log('🚀 Funções de teste de vinculação automática registradas:');
console.log('   testeVinculacaoAutomaticaTelefone() - Teste completo');
console.log('   verificarTicketsComTelefone() - Verificar tickets existentes');
console.log('   simularMensagemWhatsApp() - Simular nova mensagem');

// Auto-executar se rodando no Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testeVinculacaoAutomaticaTelefone,
    verificarTicketsComTelefone,
    simularMensagemWhatsApp
  };
  
  // Executar se chamado diretamente
  if (require.main === module) {
    testeVinculacaoAutomaticaTelefone();
  }
} 