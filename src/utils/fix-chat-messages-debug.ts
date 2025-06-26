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

interface ChatMessage {
  id: string;
  ticket_id: string;
  content: string;
  sender_name: string;
  sender_id?: string;
  is_internal: boolean;
  created_at: string;
  type: 'message' | 'note' | 'system';
  metadata?: any;
}

interface DiagnosticResult {
  ticketId: string;
  wsConnected: boolean;
  messagesInDb: number;
  messagesInState: number;
  lastMessage?: ChatMessage;
  issues: string[];
  recommendations: string[];
}

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
const diagnoseChatSystem = async (ticketId: string): Promise<DiagnosticResult> => {
  console.log(`🔍 [DIAGNÓSTICO] Iniciando análise do ticket: ${ticketId}`);
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // 1. Verificar WebSocket
    const wsConnected = !!(window as any).wsSocket?.connected;
    console.log(`🔗 WebSocket Status: ${wsConnected ? 'Conectado' : 'Desconectado'}`);
    
    if (!wsConnected) {
      issues.push('WebSocket não está conectado');
      recommendations.push('Reconectar WebSocket');
    }
    
    // 2. Buscar mensagens diretamente do banco
    const { data: dbMessages, error: dbError } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (dbError) {
      console.error('❌ Erro ao buscar mensagens do banco:', dbError);
      issues.push(`Erro no banco de dados: ${dbError.message}`);
    }
    
    const messagesInDb = dbMessages?.length || 0;
    console.log(`💾 Mensagens no banco: ${messagesInDb}`);
    
    // 3. Verificar estado local
    const chatStore = (window as any).useChatStore?.getState?.();
    const messagesInState = chatStore?.messages?.[ticketId]?.length || 0;
    console.log(`📱 Mensagens no estado local: ${messagesInState}`);
    
    // 4. Última mensagem
    const lastMessage = dbMessages?.[dbMessages.length - 1];
    
    // 5. Análise de problemas
    if (messagesInDb > 0 && messagesInState === 0) {
      issues.push('Mensagens existem no banco mas não estão sendo carregadas no frontend');
      recommendations.push('Recarregar mensagens manualmente');
      recommendations.push('Verificar formato de dados do WebSocket');
    }
    
    if (messagesInDb === 0) {
      issues.push('Nenhuma mensagem encontrada no banco de dados');
      recommendations.push('Verificar se o ticket_id está correto');
      recommendations.push('Criar mensagem de teste');
    }
    
    if (wsConnected && messagesInState !== messagesInDb) {
      issues.push('Sincronização entre WebSocket e banco está desatualizada');
      recommendations.push('Forçar reload das mensagens');
    }
    
    return {
      ticketId,
      wsConnected,
      messagesInDb,
      messagesInState,
      lastMessage,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    issues.push(`Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    return {
      ticketId,
      wsConnected: false,
      messagesInDb: 0,
      messagesInState: 0,
      issues,
      recommendations: ['Verificar conexão com o banco de dados']
    };
  }
};

/**
 * 🔧 Correção forçada de carregamento de mensagens
 */
const forceReloadMessages = async (ticketId: string): Promise<void> => {
  console.log(`🔄 [RELOAD] Forçando reload das mensagens para ticket: ${ticketId}`);
  
  try {
    // 1. Buscar mensagens atualizadas do banco
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return;
    }
    
    console.log(`✅ ${messages?.length || 0} mensagens encontradas`);
    
    // 2. Atualizar store do chat se disponível
    const chatStore = (window as any).useChatStore?.getState?.();
    if (chatStore && chatStore.messages) {
      chatStore.messages[ticketId] = messages || [];
      console.log('✅ Estado local atualizado');
    }
    
    // 3. Disparar evento personalizado para notificar componentes
    const event = new CustomEvent('chat-messages-reloaded', {
      detail: { ticketId, messages: messages || [] }
    });
    window.dispatchEvent(event);
    
    console.log('✅ Evento de reload disparado');
    
  } catch (error) {
    console.error('❌ Erro ao forçar reload:', error);
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
 * 🛑 Parar loop de auto-retry
 */
const stopAutoRetry = () => {
  console.log('🛑 [STOP] Parando loops de auto-retry...');
  
  // Limpar timeouts e intervalos
  for (let i = 1; i < 99999; i++) {
    window.clearTimeout(i);
    window.clearInterval(i);
  }
  
  // Parar reconexões do WebSocket
  if ((window as any).wsSocket) {
    (window as any).wsSocket.disconnect();
    (window as any).wsSocket = null;
  }
  
  console.log('✅ Auto-retry loops interrompidos');
};

/**
 * 🧪 Criar mensagem de teste
 */
const createTestMessage = async (ticketId: string): Promise<void> => {
  console.log(`🧪 [TEST] Criando mensagem de teste para ticket: ${ticketId}`);
  
  try {
    const testMessage = {
      ticket_id: ticketId,
      content: `Mensagem de teste criada em ${new Date().toLocaleString()}`,
      sender_name: 'Sistema de Debug',
      sender_id: 'debug-system',
      is_internal: true,
      type: 'system',
      metadata: { source: 'debug-script', timestamp: Date.now() }
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert([testMessage])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar mensagem de teste:', error);
      return;
    }
    
    console.log('✅ Mensagem de teste criada:', data);
    
    // Forçar reload após criar a mensagem
    await forceReloadMessages(ticketId);
    
  } catch (error) {
    console.error('❌ Erro ao criar mensagem de teste:', error);
  }
};

/**
 * 🔧 Função principal de correção
 */
const fixAllProblems = async (ticketId: string): Promise<void> => {
  console.log(`🔧 [FIX-ALL] Iniciando correção completa para ticket: ${ticketId}`);
  
  try {
    // 1. Diagnóstico
    console.log('\n🩺 Fase 1: Diagnóstico...');
    const diagnostic = await diagnoseChatSystem(ticketId);
    
    console.table({
      'Ticket ID': diagnostic.ticketId,
      'WebSocket': diagnostic.wsConnected ? '✅ Conectado' : '❌ Desconectado',
      'Mensagens DB': diagnostic.messagesInDb,
      'Mensagens Local': diagnostic.messagesInState,
      'Problemas': diagnostic.issues.length,
      'Última Mensagem': diagnostic.lastMessage?.content?.substring(0, 50) || 'Nenhuma'
    });
    
    if (diagnostic.issues.length > 0) {
      console.log('\n⚠️ Problemas encontrados:');
      diagnostic.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
    }
    
    // 2. Parar loops de retry
    console.log('\n🛑 Fase 2: Parando auto-retry...');
    stopAutoRetry();
    
    // 3. Forçar reload
    console.log('\n🔄 Fase 3: Recarregando mensagens...');
    await forceReloadMessages(ticketId);
    
    // 4. Criar mensagem de teste se necessário
    if (diagnostic.messagesInDb === 0) {
      console.log('\n🧪 Fase 4: Criando mensagem de teste...');
      await createTestMessage(ticketId);
    }
    
    // 5. Diagnóstico final
    console.log('\n🔍 Fase 5: Verificação final...');
    const finalDiagnostic = await diagnoseChatSystem(ticketId);
    
    console.log('\n✅ CORREÇÃO FINALIZADA');
    console.table({
      'Antes - DB': diagnostic.messagesInDb,
      'Depois - DB': finalDiagnostic.messagesInDb,
      'Antes - Local': diagnostic.messagesInState,
      'Depois - Local': finalDiagnostic.messagesInState,
      'Problemas Restantes': finalDiagnostic.issues.length
    });
    
    if (finalDiagnostic.issues.length === 0) {
      console.log('🎉 Todos os problemas foram resolvidos!');
    } else {
      console.log('⚠️ Problemas restantes:');
      finalDiagnostic.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Erro na correção completa:', error);
  }
};

// 📊 Análise de performance
function analyzePerformance(): void {
  console.log('📊 [PERFORMANCE] Analisando performance do chat...');
  
  const performance = {
    timeouts: {
      active: 0,
      cleared: 0
    },
    intervals: {
      active: 0,
      cleared: 0
    },
    websockets: {
      connections: 0,
      status: 'unknown'
    },
    memory: {
      used: (performance as any).memory ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A',
      total: (performance as any).memory ? `${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB` : 'N/A'
    }
  };
  
  // Contar WebSockets ativos
  if ((window as any).wsSocket) {
    performance.websockets.connections = 1;
    performance.websockets.status = (window as any).wsSocket.connected ? 'connected' : 'disconnected';
  }
  
  console.table(performance);
  
  // Recomendações
  console.log('\n💡 Recomendações de Performance:');
  console.log('1. Use stopAutoRetry() para parar loops infinitos');
  console.log('2. Use forceReloadMessages(ticketId) para reload manual');
  console.log('3. Use fixAllProblems(ticketId) para correção completa');
}

// 🌍 Expor funções globalmente
const fixChatSystem = {
  diagnose: diagnoseChatSystem,
  reload: forceReloadMessages,
  stopRetry: stopAutoRetry,
  createTest: createTestMessage,
  fixAll: fixAllProblems,
  performance: analyzePerformance
};

// Adicionar ao window
(window as any).fixChatSystem = fixChatSystem;

// Log de inicialização
console.log('🔧 Sistema de correção de chat carregado!');
console.log('\n📋 Comandos disponíveis:');
console.log('- fixChatSystem.diagnose("ticket-id") - Diagnóstico completo');
console.log('- fixChatSystem.reload("ticket-id") - Recarregar mensagens');
console.log('- fixChatSystem.stopRetry() - Parar loops infinitos');
console.log('- fixChatSystem.createTest("ticket-id") - Criar mensagem teste');
console.log('- fixChatSystem.fixAll("ticket-id") - Correção completa');
console.log('- fixChatSystem.performance() - Análise de performance');

export default fixChatSystem; 