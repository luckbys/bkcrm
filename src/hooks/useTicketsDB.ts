import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface DatabaseTicket {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  agent_id?: string;
  department_id?: string;
  title: string;
  description?: string;
  subject?: string;
  status: 'pendente' | 'atendimento' | 'finalizado' | 'cancelado' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente' | 'low' | 'medium' | 'high' | 'urgent';
  channel: 'whatsapp' | 'email' | 'telefone' | 'chat' | 'site' | 'indicacao';
  tags: string[];
  metadata: any;
  unread: boolean;
  is_internal: boolean;
  last_message_at: string;
  closed_at?: string;
}

export interface DatabaseMessage {
  id: string;
  created_at: string;
  updated_at: string;
  ticket_id: string;
  sender_id?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'internal' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  is_internal: boolean;
  is_read: boolean;
  metadata: any;
  sender_name?: string;
  sender_email?: string;
}

// Interface para compatibilidade com o componente existente
export interface CompatibilityTicket {
  id: number;
  client: string;
  subject: string;
  status: 'pendente' | 'atendimento' | 'finalizado' | 'cancelado';
  channel: string;
  lastMessage: string;
  unread: boolean;
  priority: 'alta' | 'normal' | 'baixa';
  agent?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  description?: string;
}

export function useTicketsDB() {
  const [tickets, setTickets] = useState<DatabaseTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Carregar tickets (filtrados por departamento)
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Primeiro, verificar se a tabela tickets existe e buscar dados básicos
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (fetchError) {
        // Se a tabela não existe, definir como lista vazia
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('does not exist')) {
          console.warn('Tabela tickets não existe ainda. Execute a migração no painel do Supabase.');
          setTickets([]);
          setError('Tabela tickets não encontrada. Execute a migração no painel do Supabase.');
          return;
        }
        throw fetchError;
      }

      // Buscar informações do usuário atual para verificar seu departamento
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('id, role, department')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.warn('Erro ao buscar informações do usuário:', userError);
      }

      // Buscar departamentos disponíveis para mapeamento
      let departmentMapping: Record<string, string> = {};
      try {
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('is_active', true);
        
        if (!deptError && departments) {
          // Criar mapeamento: nome -> id
          departmentMapping = departments.reduce((acc, dept) => {
            acc[dept.name] = dept.id;
            return acc;
          }, {} as Record<string, string>);
          
          console.log('📋 Mapeamento de departamentos:', departmentMapping);
        }
      } catch (deptError) {
        console.warn('Erro ao carregar departamentos:', deptError);
      }

        // Calcular ID do departamento do usuário
  const userDepartmentId = currentUser?.department ? departmentMapping[currentUser.department] : null;

  // Debug: mostrar informações do usuário
  console.log('🔍 Debug - Informações do usuário:', {
    userId: user.id,
    userRole: currentUser?.role,
    userDepartment: currentUser?.department,
    departmentId: userDepartmentId
  });

  // Se os tickets existem, tentar buscar com relacionamentos
  try {
    let query = supabase
          .from('tickets')
          .select(`
            *,
            customer:profiles!tickets_customer_id_fkey (
              id,
              name,
              email
            ),
            agent:profiles!tickets_agent_id_fkey (
              id,
              name,
              email
            ),
            department:departments!tickets_department_id_fkey (
              id,
              name,
              color
            )
          `);

        // Aplicar filtro de departamento usando mapeamento
        
        if (currentUser?.role === 'agent' && userDepartmentId) {
          // Agents só veem tickets do seu departamento
          query = query.eq('department_id', userDepartmentId);
          console.log('🎯 Filtro Agent aplicado - Departamento ID:', userDepartmentId);
        } else if (currentUser?.role === 'admin' && userDepartmentId) {
          // Admins com departamento específico só veem tickets do seu departamento
          query = query.eq('department_id', userDepartmentId);
          console.log('🎯 Filtro Admin aplicado - Departamento ID:', userDepartmentId);
        } else if (currentUser?.role === 'customer') {
          // Customers só veem seus próprios tickets
          query = query.eq('customer_id', user.id);
          console.log('🎯 Filtro Customer aplicado - User ID:', user.id);
        } else {
          console.log('🎯 Nenhum filtro aplicado - Admin sem departamento ou erro no mapeamento');
        }

        const { data: ticketsWithRelations, error: relationError } = await query
          .order('last_message_at', { ascending: false });

        // Debug: log do filtro aplicado
        console.log('🎯 Debug - Filtro aplicado:', {
          userRole: currentUser?.role,
          userDepartment: currentUser?.department,
          userDepartmentId,
          filterApplied: currentUser?.role === 'agent' && userDepartmentId ? `Agent - Departamento ${currentUser.department}` :
                         currentUser?.role === 'admin' && userDepartmentId ? `Admin - Departamento ${currentUser.department}` :
                         currentUser?.role === 'customer' ? 'Customer - Próprios tickets' :
                         'Sem filtro - Admin global ou erro no mapeamento',
          totalTicketsFound: ticketsWithRelations?.length || 0
        });

        if (relationError) {
          // Se houver erro nos relacionamentos, usar dados básicos com filtro manual
          console.warn('Erro nos relacionamentos, usando dados básicos:', relationError);
          let filteredData = data || [];
          
          // Aplicar filtro manual usando mapeamento
          if (currentUser?.role === 'agent' && userDepartmentId) {
            filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
          } else if (currentUser?.role === 'admin' && userDepartmentId) {
            filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
          } else if (currentUser?.role === 'customer') {
            filteredData = filteredData.filter(ticket => ticket.customer_id === user.id);
          }
          
          setTickets(filteredData);
        } else {
          setTickets(ticketsWithRelations || []);
        }
      } catch (relationErr) {
        // Fallback para dados básicos com filtro manual
        console.warn('Fallback para dados básicos dos tickets');
        let filteredData = data || [];
        
        // Aplicar filtro manual usando mapeamento
        if (currentUser?.role === 'agent' && userDepartmentId) {
          filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
        } else if (currentUser?.role === 'admin' && userDepartmentId) {
          filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
        } else if (currentUser?.role === 'customer') {
          filteredData = filteredData.filter(ticket => ticket.customer_id === user.id);
        }
        
        setTickets(filteredData);
      }

    } catch (err: any) {
      console.error('Erro ao carregar tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Atualizar lista
  const refreshTickets = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Criar ticket
  const createTicket = useCallback(async (ticketData: Partial<DatabaseTicket>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('tickets')
        .insert([{
          ...ticketData,
          customer_id: ticketData.customer_id || user.id,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Atualizar lista local
      await fetchTickets();
      
      return data;
    } catch (err: any) {
      console.error('Erro ao criar ticket:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, fetchTickets]);

  // Atualizar ticket
  const updateTicket = useCallback(async (ticketId: string, updates: Partial<DatabaseTicket>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar lista local
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...data } : ticket
        )
      );

      return data;
    } catch (err: any) {
      console.error('Erro ao atualizar ticket:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar ticket
  const deleteTicket = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (deleteError) throw deleteError;

      // Remover da lista local
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    } catch (err: any) {
      console.error('Erro ao deletar ticket:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar mensagens de um ticket
  const fetchMessages = useCallback(async (ticketId: string): Promise<DatabaseMessage[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: any) {
      console.error('Erro ao carregar mensagens:', err);
      throw err;
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (messageData: Partial<DatabaseMessage>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: sendError } = await supabase
        .from('messages')
        .insert([{
          ...messageData,
          sender_id: messageData.sender_id || user.id,
        }])
        .select()
        .single();

      if (sendError) throw sendError;

      return data;
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    }
  }, [user]);

  // Função para converter tickets do banco para o formato esperado pelo componente
  const getCompatibilityTickets = useCallback((): CompatibilityTicket[] => {
    return tickets.map(ticket => ({
      id: parseInt(ticket.id.replace(/-/g, '').substring(0, 8), 16), // Converter UUID para número
      client: ticket.metadata?.client_name || 
              (ticket as any).customer?.name || 
              (ticket as any).profiles?.name || 
              ticket.metadata?.anonymous_contact || 
              'Cliente Anônimo',
      subject: ticket.subject || ticket.title,
      status: ticket.status as 'pendente' | 'atendimento' | 'finalizado' | 'cancelado',
      channel: ticket.channel,
      lastMessage: formatLastMessage(ticket.last_message_at),
      unread: ticket.unread,
      priority: mapPriority(ticket.priority),
      agent: (ticket as any).agent?.name || 'Não atribuído',
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
      tags: ticket.tags,
      description: ticket.description
    }));
  }, [tickets]);

  // Funções auxiliares
  const formatLastMessage = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  };

  const mapPriority = (priority: string): 'alta' | 'normal' | 'baixa' => {
    const priorityMap: Record<string, 'alta' | 'normal' | 'baixa'> = {
      'urgent': 'alta',
      'urgente': 'alta',
      'high': 'alta',
      'alta': 'alta',
      'medium': 'normal',
      'normal': 'normal',
      'low': 'baixa',
      'baixa': 'baixa'
    };
    return priorityMap[priority] || 'normal';
  };

  // Carregar tickets na inicialização
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user, fetchTickets]);

  return {
    // Dados
    tickets,
    compatibilityTickets: getCompatibilityTickets(),
    loading,
    error,
    
    // Ações
    refreshTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    fetchMessages,
    sendMessage,
    
    // Utilidades
    formatLastMessage,
    mapPriority
  };
} 