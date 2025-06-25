import { supabase } from '@/lib/supabase';

// Script para debugar problemas de vinculação após atualização da página
export const debugTicketAssignment = async (ticketId?: string) => {
  console.log('🔍 [DEBUG] Iniciando debug de vinculação de tickets...');
  
  try {
    // 1. Se não foi fornecido um ticketId, buscar tickets com clientes vinculados
    if (!ticketId) {
      console.log('📋 [DEBUG] Buscando tickets com clientes vinculados...');
      
      const { data: ticketsWithCustomers, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          customer_id,
          created_at,
          metadata,
          customer:profiles!tickets_customer_id_fkey (
            id,
            name,
            email,
            metadata
          )
        `)
        .not('customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ [DEBUG] Erro ao buscar tickets:', error);
        return;
      }

      if (!ticketsWithCustomers || ticketsWithCustomers.length === 0) {
        console.log('⚠️ [DEBUG] Nenhum ticket com cliente vinculado encontrado');
        return;
      }

      console.log('✅ [DEBUG] Tickets com clientes encontrados:', {
        total: ticketsWithCustomers.length,
        tickets: ticketsWithCustomers.map(t => ({
          id: t.id,
          title: t.title,
          customer_id: t.customer_id,
          customer_name: (t.customer as any)?.name,
          has_customer_data: !!t.customer
        }))
      });

      // Usar o primeiro ticket encontrado para debug detalhado
      ticketId = ticketsWithCustomers[0].id;
      console.log(`🎯 [DEBUG] Usando ticket ${ticketId} para debug detalhado`);
    }

    // 2. Buscar dados completos do ticket específico
    console.log(`🔍 [DEBUG] Analisando ticket ${ticketId}...`);
    
    const { data: fullTicket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey (
          id,
          name,
          email,
          metadata
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('❌ [DEBUG] Erro ao buscar ticket completo:', ticketError);
      return;
    }

    if (!fullTicket) {
      console.error('❌ [DEBUG] Ticket não encontrado');
      return;
    }

    // 3. Análise detalhada dos dados
    console.log('📊 [DEBUG] Análise detalhada do ticket:');
    console.log('├── ID:', fullTicket.id);
    console.log('├── Título:', fullTicket.title);
    console.log('├── Customer ID:', fullTicket.customer_id);
    console.log('├── Tem dados do cliente:', !!fullTicket.customer);
    
    if (fullTicket.customer) {
      const customerData = fullTicket.customer as any;
      console.log('├── Nome do cliente:', customerData.name);
      console.log('├── Email do cliente:', customerData.email);
      console.log('├── Telefone do cliente:', customerData.metadata?.phone);
    }

    // 4. Verificar metadados
    console.log('📋 [DEBUG] Metadados do ticket:');
    if (fullTicket.metadata) {
      console.log('├── Client name (metadata):', fullTicket.metadata.client_name);
      console.log('├── Client phone (metadata):', fullTicket.metadata.client_phone);
      console.log('├── Customer assigned:', fullTicket.metadata.customer_assigned);
      console.log('├── Customer data (metadata):', fullTicket.metadata.customer_data);
    } else {
      console.log('├── Sem metadados');
    }

    // 5. Simular como o frontend processaria esses dados
    console.log('🖥️ [DEBUG] Simulando processamento do frontend:');
    
    let clientName = 'Cliente Anônimo';
    let clientEmail = 'Email não informado';
    let clientPhone = 'Telefone não informado';

    if (fullTicket.customer_id && fullTicket.customer) {
      // Dados do cliente vinculado têm prioridade
      const customerData = fullTicket.customer as any;
      clientName = customerData.name || 'Cliente';
      clientEmail = customerData.email || 'Email não informado';
      clientPhone = customerData.metadata?.phone || 'Telefone não informado';
      
      console.log('├── Usando dados do cliente vinculado');
    } else if (fullTicket.metadata?.client_name) {
      // Fallback para dados do WhatsApp
      clientName = fullTicket.metadata.client_name;
      clientPhone = fullTicket.metadata.client_phone || 'Telefone não informado';
      clientEmail = 'Email não informado';
      
      console.log('├── Usando dados do WhatsApp (metadata)');
    }

    console.log('├── Nome final:', clientName);
    console.log('├── Email final:', clientEmail);
    console.log('├── Telefone final:', clientPhone);

    // 6. Verificar se há inconsistências
    const issues = [];
    
    if (fullTicket.customer_id && !fullTicket.customer) {
      issues.push('Customer ID definido mas dados do cliente não carregados');
    }
    
    if (fullTicket.customer_id && fullTicket.metadata?.customer_assigned === false) {
      issues.push('Customer ID definido mas metadata indica não atribuído');
    }

    if (issues.length > 0) {
      console.log('⚠️ [DEBUG] Inconsistências encontradas:');
      issues.forEach((issue, index) => {
        console.log(`├── ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ [DEBUG] Nenhuma inconsistência encontrada');
    }

    // 7. Retornar dados para uso externo
    return {
      ticketId: fullTicket.id,
      hasCustomerLinked: !!fullTicket.customer_id,
      hasCustomerData: !!fullTicket.customer,
      processedData: {
        clientName,
        clientEmail,
        clientPhone
      },
      rawData: fullTicket,
      issues
    };

  } catch (error) {
    console.error('❌ [DEBUG] Erro geral no debug:', error);
    return null;
  }
};

// Função para debug rápido do ticket atualmente aberto
export const debugCurrentTicket = () => {
  console.log('🔍 [DEBUG] Analisando ticket atual no localStorage...');
  
  try {
    // Verificar se há dados de ticket no localStorage
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('ticket') || key.includes('chat') || key.includes('customer')
    );
    
    console.log('📋 [DEBUG] Chaves relacionadas encontradas no localStorage:', keys);
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          console.log(`├── ${key}:`, parsed);
        }
      } catch (e) {
        console.log(`├── ${key}: ${localStorage.getItem(key)}`);
      }
    });

    // Verificar estado do React no window (se disponível)
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 [DEBUG] React DevTools detectado - verifique o estado dos componentes');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Erro ao analisar localStorage:', error);
  }
};

// Função para forçar recarregamento de dados do ticket
export const forceTicketReload = async (ticketId: string) => {
  console.log('🔄 [DEBUG] Forçando recarregamento do ticket:', ticketId);
  
  try {
    // Limpar cache do browser para este ticket
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          if (request.url.includes(ticketId)) {
            await cache.delete(request);
            console.log('🗑️ [DEBUG] Cache removido para:', request.url);
          }
        }
      }
    }

    // Recarregar dados do Supabase
    const reloadedData = await debugTicketAssignment(ticketId);
    
    if (reloadedData) {
      console.log('✅ [DEBUG] Dados recarregados com sucesso');
      return reloadedData;
    } else {
      console.log('❌ [DEBUG] Falha no recarregamento');
      return null;
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro no recarregamento forçado:', error);
    return null;
  }
};

// Adicionar funções ao window para uso no console
declare global {
  interface Window {
    debugTicketAssignment: typeof debugTicketAssignment;
    debugCurrentTicket: typeof debugCurrentTicket;
    forceTicketReload: typeof forceTicketReload;
  }
} 