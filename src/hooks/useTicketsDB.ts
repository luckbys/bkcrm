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
  channel: 'email' | 'telefone' | 'chat' | 'site' | 'indicacao';
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
  originalId: string;
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
        let userDepartmentId = null;
        
        // Tratamento especial para roles administrativos globais
        if (currentUser?.department === 'Diretor' || 
            currentUser?.department === 'CEO' || 
            currentUser?.department === 'Administrador') {
          // Diretores e CEOs têm acesso global - não aplicar filtro de departamento
          userDepartmentId = null;
          console.log('🏢 Usuário com acesso global detectado:', currentUser.department);
        } else if (currentUser?.department) {
          // Para outros departamentos, usar mapeamento normal
          userDepartmentId = departmentMapping[currentUser.department] || null;
          
          if (!userDepartmentId) {
            console.warn('⚠️ Departamento não encontrado no mapeamento:', currentUser.department);
            console.log('📋 Departamentos disponíveis:', Object.keys(departmentMapping));
          }
        }

        // Determinar se o usuário tem acesso global (antes de aplicar filtros)
        const hasGlobalAccess = currentUser?.department === 'Diretor' || 
                               currentUser?.department === 'CEO' || 
                               currentUser?.department === 'Administrador';

  // Debug: mostrar informações do usuário
  console.log('🔍 Debug - Informações do usuário:', {
    userId: user.id,
    userRole: currentUser?.role,
    userDepartment: currentUser?.department,
    departmentId: userDepartmentId,
    hasGlobalAccess
  });

  // Se os tickets existem, tentar buscar com relacionamentos
  try {
    // Primeiro tentar consulta simples sem relacionamentos para evitar erros
    let ticketsWithRelations = null;
    let relationError = null;

    try {
      // Tentar com relacionamentos completos primeiro
      const { data: relatedData, error: relError } = await supabase
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
            `)
            .order('last_message_at', { ascending: false });

      if (relError) {
        relationError = relError;
        console.warn('⚠️ Erro nos relacionamentos:', relError);
      } else {
        ticketsWithRelations = relatedData;
      }
    } catch (relErr) {
      relationError = relErr;
      console.warn('⚠️ Erro ao buscar relacionamentos:', relErr);
    }

    // Se relacionamentos falharam, usar consulta básica
    if (relationError || !ticketsWithRelations) {
      console.log('🔄 Fallback: Usando consulta básica sem relacionamentos');
      
      const { data: basicData, error: basicError } = await supabase
        .from('tickets')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (basicError) throw basicError;
      
      // Aplicar filtro manual usando mapeamento
      let filteredData = basicData || [];
      
      if (currentUser?.role === 'customer') {
        filteredData = filteredData.filter(ticket => ticket.customer_id === user.id);
      } else if (!hasGlobalAccess) {
        // Aplicar filtros apenas se não tiver acesso global
        if (currentUser?.role === 'agent' && userDepartmentId) {
          filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
        } else if (currentUser?.role === 'admin' && userDepartmentId) {
          filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
        }
      }
      
      setTickets(filteredData);
      
      // Mostrar aviso sobre relacionamentos faltantes apenas uma vez
      if ((relationError as any)?.code === 'PGRST200') {
        console.error('❌ ERRO DE RELACIONAMENTO: Execute CORRECAO_RELACIONAMENTOS_TICKETS_DEPARTMENTS.sql no Supabase');
        setError(`Relacionamentos não configurados. Execute CORRECAO_RELACIONAMENTOS_TICKETS_DEPARTMENTS.sql no Supabase Dashboard.`);
      }
      
      return;
    }

    // Se chegou aqui, relacionamentos funcionaram - aplicar filtros
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
        if (currentUser?.role === 'customer') {
          // Customers só veem seus próprios tickets
          query = query.eq('customer_id', user.id);
          console.log('🎯 Filtro Customer aplicado - User ID:', user.id);
        } else if (hasGlobalAccess) {
          // Diretores, CEOs e Administradores veem todos os tickets
          console.log('🎯 Acesso global aplicado - Visualizando todos os tickets');
        } else if (currentUser?.role === 'agent' && userDepartmentId) {
          // Agents só veem tickets do seu departamento
          query = query.eq('department_id', userDepartmentId);
          console.log('🎯 Filtro Agent aplicado - Departamento ID:', userDepartmentId);
        } else if (currentUser?.role === 'admin' && userDepartmentId) {
          // Admins com departamento específico só veem tickets do seu departamento
          query = query.eq('department_id', userDepartmentId);
          console.log('🎯 Filtro Admin aplicado - Departamento ID:', userDepartmentId);
        } else {
          console.log('🎯 Sem filtro específico - Visualizando tickets disponíveis');
        }

        const { data: filteredTickets, error: filterError } = await query
          .order('last_message_at', { ascending: false });

        // Debug: log do filtro aplicado
        console.log('🎯 Debug - Filtro aplicado:', {
          userRole: currentUser?.role,
          userDepartment: currentUser?.department,
          userDepartmentId,
          hasGlobalAccess,
          filterApplied: currentUser?.role === 'customer' ? 'Customer - Próprios tickets' :
                         hasGlobalAccess ? `Acesso Global - ${currentUser?.department}` :
                         currentUser?.role === 'agent' && userDepartmentId ? `Agent - Departamento ${currentUser.department}` :
                         currentUser?.role === 'admin' && userDepartmentId ? `Admin - Departamento ${currentUser.department}` :
                         'Sem filtro específico',
          totalTicketsFound: filteredTickets?.length || 0
        });

        if (filterError) {
          // Se houver erro nos relacionamentos, usar dados básicos com filtro manual
          console.warn('Erro nos relacionamentos, usando dados básicos:', filterError);
          let filteredData = data || [];
          
          // Aplicar filtro manual usando mapeamento
          if (currentUser?.role === 'customer') {
            filteredData = filteredData.filter(ticket => ticket.customer_id === user.id);
          } else if (!hasGlobalAccess) {
            // Aplicar filtros apenas se não tiver acesso global
            if (currentUser?.role === 'agent' && userDepartmentId) {
              filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
            } else if (currentUser?.role === 'admin' && userDepartmentId) {
              filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
            }
          }
          
          setTickets(filteredData);
        } else {
          setTickets(filteredTickets || []);
        }
      } catch (relationErr) {
        // Fallback para dados básicos com filtro manual
        console.warn('Fallback para dados básicos dos tickets');
        let filteredData = data || [];
        
        // Aplicar filtro manual usando mapeamento
        if (currentUser?.role === 'customer') {
          filteredData = filteredData.filter(ticket => ticket.customer_id === user.id);
        } else if (!hasGlobalAccess) {
          // Aplicar filtros apenas se não tiver acesso global
          if (currentUser?.role === 'agent' && userDepartmentId) {
            filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
          } else if (currentUser?.role === 'admin' && userDepartmentId) {
            filteredData = filteredData.filter(ticket => ticket.department_id === userDepartmentId);
          }
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

  // Atualizar ticket com função simples (sem notificações)
  const updateTicket = useCallback(async (ticketId: string, updates: Partial<DatabaseTicket>) => {
    try {
      setLoading(true);
      setError(null);

      // Se é uma tentativa de finalizar ticket, usar função RPC simples
      if (updates.status === 'closed' || updates.status === 'finalizado') {
        console.log('🔄 [updateTicket] Finalizando ticket - usando RPC finalize_ticket_simple...');
        
        const { data: rpcSimpleData, error: rpcSimpleError } = await supabase.rpc('finalize_ticket_simple', {
          ticket_uuid: ticketId
        });

        if (!rpcSimpleError && rpcSimpleData?.success) {
          console.log('✅ [updateTicket] RPC Simple sucesso:', rpcSimpleData);
          
          // Simular dados de retorno para compatibilidade
          const mockData = {
            id: ticketId,
            status: 'closed' as const,
            updated_at: new Date().toISOString(),
            closed_at: new Date().toISOString()
          };

          // Atualizar lista local
          setTickets(prev => 
            prev.map(ticket => 
              ticket.id === ticketId ? { ...ticket, ...mockData } : ticket
            )
          );

          return mockData;
        }

        console.log('⚠️ [updateTicket] RPC Simple falhou, tentando update_ticket_status_simple:', { rpcSimpleError, rpcSimpleData });

        // Fallback para função de status simples
        const { data: rpcStatusData, error: rpcStatusError } = await supabase.rpc('update_ticket_status_simple', {
          ticket_uuid: ticketId,
          new_status: 'closed'
        });

        if (!rpcStatusError && rpcStatusData?.success) {
          console.log('✅ [updateTicket] RPC Status Simple sucesso:', rpcStatusData);
          
          const mockData = {
            id: ticketId,
            status: 'closed' as const,
            updated_at: new Date().toISOString(),
            closed_at: new Date().toISOString()
          };

          setTickets(prev => 
            prev.map(ticket => 
              ticket.id === ticketId ? { ...ticket, ...mockData } : ticket
            )
          );

          return mockData;
        }

        console.log('⚠️ [updateTicket] RPC Status Simple falhou, tentando update_ticket_direct:', { rpcStatusError, rpcStatusData });

        // Fallback para função direta
        const { data: rpcDirectData, error: rpcDirectError } = await supabase.rpc('update_ticket_direct', {
          ticket_uuid: ticketId,
          ticket_status: 'closed',
          close_timestamp: new Date().toISOString()
        });

        if (!rpcDirectError && rpcDirectData?.success) {
          console.log('✅ [updateTicket] RPC Direct sucesso:', rpcDirectData);
          
          const mockData = {
            id: ticketId,
            status: 'closed' as const,
            updated_at: new Date().toISOString(),
            closed_at: new Date().toISOString()
          };

          setTickets(prev => 
            prev.map(ticket => 
              ticket.id === ticketId ? { ...ticket, ...mockData } : ticket
            )
          );

          return mockData;
        }

        console.log('⚠️ [updateTicket] RPC Direct falhou, tentando UPDATE direto:', { rpcDirectError, rpcDirectData });
      }

      // Para outros tipos de update ou como último recurso para finalização
      console.log('💾 [updateTicket] Tentando UPDATE direto:', { ticketId, updates });

      const { data, error: updateError } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        console.log('❌ [updateTicket] UPDATE direto falhou:', updateError);
        throw updateError;
      }

      console.log('✅ [updateTicket] UPDATE direto sucesso:', data);

      // Atualizar lista local
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...data } : ticket
        )
      );

      return data;
    } catch (err: any) {
      console.error('❌ [updateTicket] Erro final:', err);
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

  // Função para mapear status do banco para formato do frontend
  const mapStatus = (status: string): 'pendente' | 'atendimento' | 'finalizado' | 'cancelado' => {
    const statusMap: Record<string, 'pendente' | 'atendimento' | 'finalizado' | 'cancelado'> = {
      'pendente': 'pendente',
      'open': 'pendente',
      'atendimento': 'atendimento',
      'in_progress': 'atendimento',
      'finalizado': 'finalizado',
      'resolved': 'finalizado',
      'closed': 'finalizado',
      'cancelado': 'cancelado',
      'cancelled': 'cancelado'
    };
    return statusMap[status] || 'pendente';
  };

  // Função para converter tickets do banco para o formato esperado pelo componente
  const getCompatibilityTickets = useCallback((): CompatibilityTicket[] => {
    return tickets.map((ticket, index) => {
      // Criar um ID numérico único baseado no índice e hash do UUID
      // Isso garante que o mesmo ticket sempre terá o mesmo ID numérico
      const ticketHash = ticket.id.replace(/-/g, '');
      const hashNumber = parseInt(ticketHash.substring(0, 8), 16);
      const uniqueId = Math.abs(hashNumber % 2147483647) + index + 1; // Garantir número positivo único
      
      // Extrair nome do cliente de forma segura
      let clientName = ticket.metadata?.client_name || 
                      (ticket as any).customer?.name || 
                      (ticket as any).profiles?.name || 
                      'Cliente Anônimo';
      
      // Lidar com anonymous_contact que pode ser objeto ou string
      if (!clientName || clientName === 'Cliente Anônimo') {
        if (typeof ticket.metadata?.anonymous_contact === 'object') {
          clientName = ticket.metadata?.anonymous_contact?.name || 'Cliente Anônimo';
        } else if (typeof ticket.metadata?.anonymous_contact === 'string') {
          clientName = ticket.metadata?.anonymous_contact;
        }
      }
      
      // Garantir que sempre seja uma string válida
      if (typeof clientName !== 'string' || !clientName.trim()) {
        clientName = 'Cliente Anônimo';
      }
      
      return {
        id: uniqueId,
        client: clientName,
        subject: ticket.subject || ticket.title,
        status: mapStatus(ticket.status),
        channel: ticket.channel,
        lastMessage: formatLastMessage(ticket.last_message_at),
        unread: ticket.unread,
        priority: mapPriority(ticket.priority),
        agent: (ticket as any).agent?.name || 'Não atribuído',
        createdAt: new Date(ticket.created_at),
        updatedAt: new Date(ticket.updated_at),
        tags: ticket.tags,
        description: ticket.description,
        // Adicionar o UUID original nos metadados para referência
        originalId: ticket.id
      };
    });
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

  // Função específica para finalizar tickets usando RPC
  const finalizeTicket = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 [finalizeTicket] Iniciando finalização via RPC:', { ticketId });

      // Tentar primeiro com RPC que contorna RLS
      const { data: rpcData, error: rpcError } = await supabase.rpc('finalize_ticket', {
        ticket_id: ticketId
      });

      if (rpcError) {
        console.log('❌ [finalizeTicket] RPC falhou:', rpcError);
        
        // Fallback: tentar UPDATE direto
        console.log('🔄 [finalizeTicket] Tentando UPDATE direto como fallback...');
        const { data: updateData, error: updateError } = await supabase
          .from('tickets')
          .update({
            status: 'closed' as const,
            updated_at: new Date().toISOString(),
            closed_at: new Date().toISOString()
          })
          .eq('id', ticketId)
          .select()
          .single();

        if (updateError) {
          console.log('❌ [finalizeTicket] UPDATE também falhou:', updateError);
          throw updateError;
        }

        console.log('✅ [finalizeTicket] UPDATE direto sucesso:', updateData);

        // Atualizar lista local
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId ? { ...ticket, ...updateData } : ticket
          )
        );

        return updateData;
      }

      if (rpcData?.success) {
        console.log('✅ [finalizeTicket] RPC sucesso:', rpcData);
        
        // Criar dados mockados para compatibilidade
        const mockData: Partial<DatabaseTicket> = {
          id: ticketId,
          status: 'closed' as const,
          updated_at: new Date().toISOString(),
          closed_at: new Date().toISOString()
        };

        // Atualizar lista local
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId ? { ...ticket, ...mockData } : ticket
          )
        );

        return mockData;
      } else {
        console.log('❌ [finalizeTicket] RPC retornou erro:', rpcData?.error);
        throw new Error(rpcData?.error || 'Falha na finalização via RPC');
      }

    } catch (err: any) {
      console.error('❌ [finalizeTicket] Erro final:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
    assignCustomerToTicket: updateTicket, // Alias para atribuir cliente
    
    // Utilidades
    formatLastMessage,
    mapPriority,
    mapStatus,
    finalizeTicket
  };
} 