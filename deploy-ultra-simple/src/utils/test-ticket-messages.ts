/**
 * Script para testar se existem mensagens no banco para o ticket
 */

import { supabase } from '../lib/supabase';

// Função para testar mensagens de um ticket específico
export const testTicketMessages = async (ticketId: string) => {
  console.log(`🔍 Testando mensagens para ticket: ${ticketId}`);
  
  try {
    // Buscar mensagens do ticket
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return;
    }

    console.log(`📊 Resultado:`, {
      ticketId,
      totalMessages: count,
      messagesFound: messages?.length || 0,
      firstMessages: messages?.slice(0, 3)?.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 50) + '...',
        sender_name: m.sender_name,
        sender_id: m.sender_id,
        is_internal: m.is_internal,
        created_at: m.created_at
      })) || []
    });

    if (messages && messages.length > 0) {
      console.log('✅ Mensagens encontradas! O problema não é no banco.');
      return { hasMessages: true, count: messages.length, messages };
    } else {
      console.log('⚠️ Nenhuma mensagem encontrada no banco para este ticket.');
      return { hasMessages: false, count: 0, messages: [] };
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { hasMessages: false, error: (error as Error).message };
  }
};

// Função para testar com o ticket que apareceu nos logs
export const testCurrentTicket = () => {
  const ticketId = '9f2be6d3-3d5d-4beb-a661-f2d9e3d0746a'; // Do log
  return testTicketMessages(ticketId);
};

// Função para testar o ticket específico que está sendo usado no WebSocket
export const testWebSocketTicket = () => {
  const ticketId = '274ac0c9-53d9-4e50-be21-8a98a0f6a63e'; // Do log WebSocket
  console.log('🧪 Testando ticket específico do WebSocket...');
  return testTicketMessages(ticketId);
};

// Função para buscar todos os tickets e suas mensagens
export const debugAllTickets = async () => {
  console.log('🔍 Buscando todos os tickets e suas mensagens...');
  
  try {
    // Buscar tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError);
      return;
    }

    console.log(`📋 Encontrados ${tickets?.length || 0} tickets:`);

    for (const ticket of tickets || []) {
      const result = await testTicketMessages(ticket.id);
      console.log(`   🎫 ${ticket.title}: ${result?.count || 0} mensagens`);
    }

  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error);
  }
};

// Função para criar uma mensagem de teste
export const createTestMessage = async (ticketId: string) => {
  console.log(`📝 Criando mensagem de teste para ticket: ${ticketId}`);
  
  try {
    const testMessage = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      content: `🧪 Mensagem de teste criada em ${new Date().toLocaleString()}`,
      sender_name: 'Teste Sistema',
      sender_id: null, // Simular mensagem de cliente
      type: 'text',
      is_internal: false,
      metadata: {
        test_message: true,
        created_via: 'debug_script'
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([testMessage])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar mensagem de teste:', error);
      return false;
    }

    console.log('✅ Mensagem de teste criada:', {
      id: data.id,
      content: data.content,
      ticket_id: data.ticket_id
    });

    return true;

  } catch (error) {
    console.error('❌ Erro ao criar mensagem:', error);
    return false;
  }
};

// Disponibilizar no window
declare global {
  interface Window {
    testTicketMessages: {
      testCurrentTicket: () => Promise<any>;
      testWebSocketTicket: () => Promise<any>;
      testTicketMessages: (ticketId: string) => Promise<any>;
      debugAllTickets: () => Promise<void>;
      createTestMessage: (ticketId: string) => Promise<boolean>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.testTicketMessages = {
    testCurrentTicket,
    testWebSocketTicket,
    testTicketMessages,
    debugAllTickets,
    createTestMessage
  };
  
  console.log('🧪 Funções de teste disponíveis:');
  console.log('- testTicketMessages.testCurrentTicket()');
  console.log('- testTicketMessages.testWebSocketTicket()');
  console.log('- testTicketMessages.debugAllTickets()');
  console.log('- testTicketMessages.createTestMessage("ticket-id")');
} 