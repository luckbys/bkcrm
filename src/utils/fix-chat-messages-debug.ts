/**
 * 🔧 CORREÇÃO COMPLETA: Mensagens Vazias e Duplicação de Tickets
 * 
 * Este script diagnostica e corrige:
 * 1. Problema de mensagens vazias no chat
 * 2. Loop infinito de auto-retry 
 * 3. Duplicação de tickets
 * 4. Performance degradada do WebSocket
 */

import { supabase } from '../lib/supabase';

interface ChatDiagnostic {
  ticketId: string;
  isConnected: boolean;
  messagesCount: number;
  retryCount: number;
  lastRequest: Date | null;
  problem: string[];
  solutions: string[];
}

interface TicketDuplication {
  phone: string;
  duplicates: Array<{
    id: string;
    title: string;
    created_at: string;
    customer_id: string;
    status: string;
  }>;
  count: number;
}

/**
 * 🔍 Diagnóstico completo do sistema de chat
 */
const diagnoseChatSystem = async (ticketId?: string): Promise<ChatDiagnostic> => {
  console.log('🔍 [DIAGNOSE] === DIAGNÓSTICO COMPLETO DO SISTEMA DE CHAT ===');
  
  const chatStore = (window as any).useChatStore?.getState?.();
  const diagnostic: ChatDiagnostic = {
    ticketId: ticketId || 'all',
    isConnected: chatStore?.isConnected || false,
    messagesCount: 0,
    retryCount: 0,
    lastRequest: null,
    problem: [],
    solutions: []
  };

  try {
    // 1. Verificar estado do WebSocket
    if (!chatStore) {
      diagnostic.problem.push('ChatStore não encontrado');
      diagnostic.solutions.push('Recarregar a página');
      return diagnostic;
    }

    if (!chatStore.isConnected) {
      diagnostic.problem.push('WebSocket desconectado');
      diagnostic.solutions.push('Reconectar WebSocket: chatStore.init()');
    }

    // 2. Verificar mensagens específicas do ticket
    if (ticketId) {
      const messages = chatStore.messages[ticketId] || [];
      diagnostic.messagesCount = messages.length;
      
      if (messages.length === 0) {
        diagnostic.problem.push(`Zero mensagens para ticket ${ticketId}`);
        
        // Verificar se existe mensagens no banco
        const { data: dbMessages, error } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (error) {
          diagnostic.problem.push(`Erro ao buscar no banco: ${error.message}`);
          diagnostic.solutions.push('Verificar conexão com Supabase');
        } else if (dbMessages && dbMessages.length > 0) {
          diagnostic.problem.push(`${dbMessages.length} mensagens no banco, mas 0 no frontend`);
          diagnostic.solutions.push('Problema na conversão WebSocket → Frontend');
          diagnostic.solutions.push('Executar: forceReloadMessages()');
        } else {
          diagnostic.problem.push('Ticket sem mensagens no banco de dados');
          diagnostic.solutions.push('Criar mensagem de teste ou verificar se ticket é válido');
        }
      }
    }

    // 3. Verificar qualidade da conexão WebSocket
    if (chatStore.socket) {
      const transport = chatStore.socket.io?.engine?.transport?.name;
      console.log(`🔗 [DIAGNOSE] Transport: ${transport}`);
      
      if (transport !== 'websocket') {
        diagnostic.problem.push(`Usando ${transport} ao invés de websocket`);
        diagnostic.solutions.push('Verificar configuração do servidor WebSocket');
      }
    }

    // 4. Verificar se está em loop de retry
    const lastLog = performance.now();
    setTimeout(() => {
      // Simular verificação de retry excessivo
      if (diagnostic.problem.includes('Zero mensagens') && chatStore.isLoading) {
        diagnostic.problem.push('Possível loop infinito de retry');
        diagnostic.solutions.push('Parar auto-retry: stopAutoRetry()');
      }
    }, 1000);

    console.log('📊 [DIAGNOSE] Resultado:', diagnostic);
    return diagnostic;

  } catch (error) {
    diagnostic.problem.push(`Erro no diagnóstico: ${error}`);
    return diagnostic;
  }
};

/**
 * 🔧 Correção forçada de carregamento de mensagens
 */
const forceReloadMessages = async (ticketId: string) => {
  console.log(`🔧 [FIX] Forçando reload de mensagens para ticket ${ticketId}`);
  
  try {
    // 1. Parar qualquer loading/retry em andamento
    const chatStore = (window as any).useChatStore?.getState?.();
    if (chatStore) {
      // Resetar estados problemáticos
      chatStore.setLoading?.(false);
      chatStore.setError?.(null);
    }

    // 2. Buscar mensagens diretamente do banco
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        sender_name,
        sender_email,
        is_internal,
        type,
        created_at,
        metadata
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [FIX] Erro ao buscar mensagens:', error);
      return false;
    }

    console.log(`📥 [FIX] ${messages?.length || 0} mensagens encontradas no banco`);

    // 3. Converter e atualizar diretamente no store
    if (messages && messages.length > 0 && chatStore) {
      const convertedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_id ? 'agent' : 'client',
        senderName: msg.sender_name || 'Cliente',
        senderEmail: msg.sender_email || '',
        isInternal: msg.is_internal || false,
        type: msg.type || 'text',
        timestamp: new Date(msg.created_at).toISOString(),
        metadata: msg.metadata || {}
      }));

      // Atualizar store diretamente
      chatStore.setMessages?.(ticketId, convertedMessages);
      
      console.log(`✅ [FIX] ${convertedMessages.length} mensagens carregadas com sucesso`);
      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ [FIX] Erro ao forçar reload:', error);
    return false;
  }
};

/**
 * 🔍 Detectar duplicação de tickets
 */
const detectTicketDuplication = async (): Promise<TicketDuplication[]> => {
  console.log('🔍 [DUPLICATE] Detectando duplicação de tickets...');
  
  try {
    // Buscar tickets dos últimos 7 dias agrupados por telefone
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, created_at, customer_id, status, metadata')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [DUPLICATE] Erro ao buscar tickets:', error);
      return [];
    }

    // Agrupar por telefone
    const phoneGroups: Record<string, any[]> = {};
    
    tickets?.forEach(ticket => {
      const phone = ticket.metadata?.whatsapp_phone || 
                   ticket.metadata?.client_phone || 
                   ticket.metadata?.phone || 
                   'unknown';
      
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      phoneGroups[phone].push(ticket);
    });

    // Identificar duplicações (mais de 1 ticket por telefone)
    const duplications: TicketDuplication[] = [];
    
    Object.entries(phoneGroups).forEach(([phone, phoneTickets]) => {
      if (phoneTickets.length > 1) {
        duplications.push({
          phone,
          duplicates: phoneTickets.map(t => ({
            id: t.id,
            title: t.title,
            created_at: t.created_at,
            customer_id: t.customer_id,
            status: t.status
          })),
          count: phoneTickets.length
        });
      }
    });

    console.log(`📊 [DUPLICATE] ${duplications.length} telefones com duplicação encontrados`);
    duplications.forEach(dup => {
      console.log(`📱 [DUPLICATE] ${dup.phone}: ${dup.count} tickets`);
    });

    return duplications;

  } catch (error) {
    console.error('❌ [DUPLICATE] Erro ao detectar duplicação:', error);
    return [];
  }
};

/**
 * 🔧 Corrigir duplicação de tickets
 */
const fixTicketDuplication = async (phone: string, keepLatest: boolean = true) => {
  console.log(`🔧 [FIX-DUP] Corrigindo duplicação para telefone ${phone}`);
  
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, created_at, status, metadata')
      .eq('channel', 'whatsapp')
      .or(`metadata->>whatsapp_phone.eq.${phone},metadata->>client_phone.eq.${phone}`)
      .order('created_at', { ascending: false });

    if (error || !tickets || tickets.length <= 1) {
      console.log('✅ [FIX-DUP] Nenhuma duplicação para corrigir');
      return;
    }

    // Manter o mais recente (primeiro da lista) e fechar os outros
    const [keepTicket, ...duplicateTickets] = tickets;
    
    console.log(`🎯 [FIX-DUP] Mantendo ticket ${keepTicket.id}, fechando ${duplicateTickets.length} duplicados`);

    // Fechar tickets duplicados
    const closePromises = duplicateTickets.map(ticket => 
      supabase
        .from('tickets')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString(),
          metadata: {
            ...ticket.metadata,
            closed_reason: 'duplicate_ticket',
            merged_into: keepTicket.id,
            auto_closed: true
          }
        })
        .eq('id', ticket.id)
    );

    await Promise.all(closePromises);
    
    console.log(`✅ [FIX-DUP] ${duplicateTickets.length} tickets duplicados fechados para ${phone}`);

  } catch (error) {
    console.error('❌ [FIX-DUP] Erro ao corrigir duplicação:', error);
  }
};

/**
 * 🔧 Parar loop de auto-retry
 */
const stopAutoRetry = () => {
  console.log('🛑 [STOP] Parando auto-retry...');
  
  const chatStore = (window as any).useChatStore?.getState?.();
  if (chatStore) {
    // Parar loading
    chatStore.setLoading?.(false);
    
    // Limpar error
    chatStore.setError?.(null);
    
    // Parar qualquer interval de retry
    if ((window as any).chatRetryInterval) {
      clearInterval((window as any).chatRetryInterval);
      (window as any).chatRetryInterval = null;
    }
    
    console.log('✅ [STOP] Auto-retry interrompido');
  }
};

/**
 * 🧪 Simular mensagem para teste
 */
const createTestMessage = async (ticketId: string, fromClient: boolean = true) => {
  console.log(`🧪 [TEST] Criando mensagem de teste para ticket ${ticketId}`);
  
  try {
    const messageData = {
      ticket_id: ticketId,
      content: `📝 Mensagem de teste ${fromClient ? 'do cliente' : 'do agente'} - ${new Date().toLocaleTimeString()}`,
      sender_id: fromClient ? null : '00000000-0000-0000-0000-000000000001', // UUID do sistema para agente
      sender_name: fromClient ? 'Cliente Teste' : 'Agente Sistema',
      sender_type: fromClient ? 'client' : 'agent',
      type: 'text',
      is_internal: false,
      created_at: new Date().toISOString(),
      metadata: {
        test_message: true,
        created_by: 'debug_script'
      }
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('❌ [TEST] Erro ao criar mensagem:', error);
      return false;
    }

    console.log('✅ [TEST] Mensagem de teste criada:', message.id);
    
    // Tentar recarregar mensagens após criar
    setTimeout(() => forceReloadMessages(ticketId), 1000);
    
    return true;

  } catch (error) {
    console.error('❌ [TEST] Erro ao criar mensagem de teste:', error);
    return false;
  }
};

/**
 * 🔧 Correção completa para um ticket
 */
const fixAllProblems = async (ticketId: string) => {
  console.log(`🔧 [FIX-ALL] === CORREÇÃO COMPLETA PARA TICKET ${ticketId} ===`);
  
  try {
    // 1. Parar retry
    stopAutoRetry();
    
    // 2. Diagnóstico
    const diagnostic = await diagnoseChatSystem(ticketId);
    
    // 3. Se não tem mensagens, tentar força reload
    if (diagnostic.messagesCount === 0) {
      console.log('🔄 [FIX-ALL] Tentando forçar reload...');
      const reloaded = await forceReloadMessages(ticketId);
      
      if (!reloaded) {
        console.log('🧪 [FIX-ALL] Criando mensagem de teste...');
        await createTestMessage(ticketId, true);
      }
    }
    
    // 4. Detectar e corrigir duplicação
    const duplicates = await detectTicketDuplication();
    if (duplicates.length > 0) {
      console.log('🔧 [FIX-ALL] Corrigindo duplicações...');
      for (const dup of duplicates) {
        await fixTicketDuplication(dup.phone);
      }
    }
    
    console.log('✅ [FIX-ALL] Correção completa finalizada');
    
  } catch (error) {
    console.error('❌ [FIX-ALL] Erro na correção completa:', error);
  }
};

// 🌐 Exportar funções globalmente
declare global {
  interface Window {
    fixChatSystem: {
      diagnose: (ticketId?: string) => Promise<ChatDiagnostic>;
      forceReload: (ticketId: string) => Promise<boolean>;
      detectDuplicates: () => Promise<TicketDuplication[]>;
      fixDuplicates: (phone: string) => Promise<void>;
      stopRetry: () => void;
      createTest: (ticketId: string, fromClient?: boolean) => Promise<boolean>;
      fixAll: (ticketId: string) => Promise<void>;
    };
  }
}

// Registrar funções globalmente
if (typeof window !== 'undefined') {
  window.fixChatSystem = {
    diagnose: diagnoseChatSystem,
    forceReload: forceReloadMessages,
    detectDuplicates: detectTicketDuplication,
    fixDuplicates: fixTicketDuplication,
    stopRetry: stopAutoRetry,
    createTest: createTestMessage,
    fixAll: fixAllProblems
  };

  console.log(`
🔧 SISTEMA DE CORREÇÃO DO CHAT ATIVADO

📋 Comandos disponíveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DIAGNÓSTICO:
fixChatSystem.diagnose("TICKET_ID")

🔧 CORREÇÕES:
fixChatSystem.forceReload("TICKET_ID")     // Recarregar mensagens
fixChatSystem.stopRetry()                  // Parar loop infinito
fixChatSystem.createTest("TICKET_ID")      // Criar mensagem teste

🔍 DUPLICAÇÃO:
fixChatSystem.detectDuplicates()           // Detectar duplicados
fixChatSystem.fixDuplicates("PHONE")       // Corrigir por telefone

🚀 CORREÇÃO COMPLETA:
fixChatSystem.fixAll("TICKET_ID")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

export {
  diagnoseChatSystem,
  forceReloadMessages,
  detectTicketDuplication,
  fixTicketDuplication,
  stopAutoRetry,
  createTestMessage,
  fixAllProblems
}; 