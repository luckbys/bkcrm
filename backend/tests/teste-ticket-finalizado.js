import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: './webhook.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE: SISTEMA DE TICKETS FINALIZADOS');
console.log('==========================================');

const numeroTeste = '5511123456789';
const clienteNome = 'Cliente Teste Finalizado';

// Função para enviar mensagem via webhook
async function enviarMensagem(mensagem, pushName = clienteNome) {
  const webhookData = {
    "event": "MESSAGES_UPSERT",
    "instance": "atendimento-ao-cliente-suporte",
    "data": {
      "key": {
        "remoteJid": `${numeroTeste}@s.whatsapp.net`,
        "fromMe": false,
        "id": `TEST_${Date.now()}`
      },
      "message": {
        "conversation": mensagem
      },
      "pushName": pushName,
      "messageTimestamp": Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await axios.post('http://localhost:4000/webhook/evolution', webhookData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    return null;
  }
}

// Função para finalizar ticket
async function finalizarTicket(ticketId) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        status: 'finalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao finalizar ticket:', error);
      return false;
    }

    console.log('✅ Ticket finalizado:', {
      id: data.id,
      status: data.status,
      title: data.title
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao finalizar ticket:', error);
    return false;
  }
}

// Função para buscar tickets do cliente
async function buscarTickets(telefone) {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, status, created_at, metadata')
      .or(`metadata->>whatsapp_phone.eq.${telefone},metadata->>client_phone.eq.${telefone}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar tickets:', error);
      return [];
    }

    return tickets || [];
  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error);
    return [];
  }
}

// Executar teste
async function executarTeste() {
  console.log('\n🎯 CENÁRIO DE TESTE:');
  console.log('1. Cliente envia primeira mensagem → Criar ticket inicial');
  console.log('2. Finalizar o ticket manualmente');
  console.log('3. Cliente envia nova mensagem → Deve criar NOVO ticket');
  console.log('4. Verificar se ticket antigo permanece finalizado');
  
  try {
    // Limpar tickets anteriores do teste
    console.log('\n🧹 Limpando tickets de teste anteriores...');
    await supabase
      .from('tickets')
      .delete()
      .or(`metadata->>whatsapp_phone.eq.${numeroTeste},metadata->>client_phone.eq.${numeroTeste}`);

    console.log('\n📤 PASSO 1: Enviando primeira mensagem...');
    const resposta1 = await enviarMensagem('Olá, preciso de ajuda com meu pedido!');
    
    if (!resposta1 || !resposta1.processed) {
      console.error('❌ Falha no Passo 1');
      return;
    }
    
    console.log('✅ Primeira mensagem processada:', {
      ticketId: resposta1.ticketId,
      processed: resposta1.processed
    });

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🏁 PASSO 2: Finalizando o ticket...');
    const finalizou = await finalizarTicket(resposta1.ticketId);
    
    if (!finalizou) {
      console.error('❌ Falha no Passo 2');
      return;
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📤 PASSO 3: Enviando segunda mensagem (após finalização)...');
    const resposta2 = await enviarMensagem('Oi novamente! Tenho uma nova dúvida sobre outro produto.');
    
    if (!resposta2 || !resposta2.processed) {
      console.error('❌ Falha no Passo 3');
      return;
    }
    
    console.log('✅ Segunda mensagem processada:', {
      ticketId: resposta2.ticketId,
      processed: resposta2.processed
    });

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 PASSO 4: Verificando resultados...');
    const tickets = await buscarTickets(numeroTeste);
    
    console.log(`\n📋 TICKETS ENCONTRADOS (${tickets.length}):`);
    
    tickets.forEach((ticket, index) => {
      console.log(`\n🎫 Ticket ${index + 1}:`);
      console.log('  ID:', ticket.id);
      console.log('  Título:', ticket.title);
      console.log('  Status:', ticket.status);
      console.log('  Criado em:', new Date(ticket.created_at).toLocaleString('pt-BR'));
      
      if (ticket.metadata) {
        console.log('  Sequência:', ticket.metadata.ticket_sequence || 'N/A');
        console.log('  Nova conversa:', ticket.metadata.is_new_conversation || false);
        console.log('  Tickets anteriores:', ticket.metadata.previous_tickets_count || 0);
      }
    });

    // Validar resultados
    console.log('\n🎯 VALIDAÇÃO DOS RESULTADOS:');
    
    if (tickets.length !== 2) {
      console.log('❌ ERRO: Deveria ter exatamente 2 tickets, mas encontrou:', tickets.length);
      return;
    }

    const ticketFinalizado = tickets.find(t => t.status === 'finalizado');
    const ticketAberto = tickets.find(t => t.status === 'open');

    if (!ticketFinalizado) {
      console.log('❌ ERRO: Não encontrou ticket finalizado');
      return;
    }

    if (!ticketAberto) {
      console.log('❌ ERRO: Não encontrou ticket aberto');
      return;
    }

    if (ticketFinalizado.id === ticketAberto.id) {
      console.log('❌ ERRO: Os dois tickets têm o mesmo ID');
      return;
    }

    console.log('✅ SUCESSO: Ticket antigo permanece finalizado');
    console.log('✅ SUCESSO: Novo ticket foi criado para nova mensagem');
    console.log('✅ SUCESSO: Os tickets são independentes');
    
    if (ticketAberto.metadata?.is_new_conversation) {
      console.log('✅ SUCESSO: Novo ticket marcado como nova conversa');
    }

    if (ticketAberto.title?.includes('Novo Atendimento')) {
      console.log('✅ SUCESSO: Título do novo ticket indica continuação');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Sistema funcionando corretamente:');
    console.log('   - Tickets finalizados não são reabertos');
    console.log('   - Novas mensagens criam novos tickets');
    console.log('   - Histórico é preservado');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Verificar se webhook está rodando
async function verificarWebhook() {
  try {
    const response = await axios.get('http://localhost:4000/webhook/health', { timeout: 5000 });
    console.log('✅ Webhook está rodando');
    return true;
  } catch (error) {
    console.error('❌ Webhook não está rodando. Execute: node webhook-evolution-complete.js');
    return false;
  }
}

// Executar
console.log('🚀 Iniciando teste...\n');

if (await verificarWebhook()) {
  await executarTeste();
} else {
  console.log('\n💡 Para executar este teste:');
  console.log('1. Em um terminal: node webhook-evolution-complete.js');
  console.log('2. Em outro terminal: node teste-ticket-finalizado.js');
}

console.log('\n✅ Teste finalizado!'); 