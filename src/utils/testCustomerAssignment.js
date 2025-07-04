import { supabase } from '@/lib/supabase';
// Script para testar a vinculação de clientes aos tickets
export const testCustomerAssignment = async () => {
    console.log('🧪 [TESTE] Iniciando teste de vinculação de clientes...');
    try {
        // 1. Buscar um ticket existente
        const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('id, title, customer_id, metadata')
            .limit(5);
        if (ticketsError) {
            console.error('❌ [TESTE] Erro ao buscar tickets:', ticketsError);
            return;
        }
        if (!tickets || tickets.length === 0) {
            console.log('⚠️ [TESTE] Nenhum ticket encontrado');
            return;
        }
        const testTicket = tickets[0];
        console.log('📋 [TESTE] Ticket de teste selecionado:', {
            id: testTicket.id,
            title: testTicket.title,
            current_customer_id: testTicket.customer_id
        });
        // 2. Buscar um cliente existente
        const { data: customers, error: customersError } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .eq('role', 'customer')
            .limit(5);
        if (customersError) {
            console.error('❌ [TESTE] Erro ao buscar clientes:', customersError);
            return;
        }
        if (!customers || customers.length === 0) {
            console.log('⚠️ [TESTE] Nenhum cliente encontrado');
            return;
        }
        const testCustomer = customers[0];
        console.log('👤 [TESTE] Cliente de teste selecionado:', {
            id: testCustomer.id,
            name: testCustomer.name,
            email: testCustomer.email
        });
        // 3. Testar vinculação
        console.log('🔗 [TESTE] Testando vinculação...');
        const { data: updateResult, error: updateError } = await supabase
            .from('tickets')
            .update({
            customer_id: testCustomer.id,
            metadata: {
                ...testTicket.metadata,
                test_assignment: true,
                test_timestamp: new Date().toISOString(),
                assigned_customer: {
                    id: testCustomer.id,
                    name: testCustomer.name,
                    email: testCustomer.email
                }
            },
            updated_at: new Date().toISOString()
        })
            .eq('id', testTicket.id)
            .select()
            .single();
        if (updateError) {
            console.error('❌ [TESTE] Erro na vinculação:', updateError);
            return;
        }
        console.log('✅ [TESTE] Vinculação realizada:', updateResult);
        // 4. Verificar se a vinculação foi persistida
        console.log('🔍 [TESTE] Verificando persistência...');
        const { data: verifyTicket, error: verifyError } = await supabase
            .from('tickets')
            .select(`
        id,
        customer_id,
        metadata,
        customer:profiles!tickets_customer_id_fkey (
          id,
          name,
          email
        )
      `)
            .eq('id', testTicket.id)
            .single();
        if (verifyError) {
            console.error('❌ [TESTE] Erro na verificação:', verifyError);
            return;
        }
        if (verifyTicket.customer_id === testCustomer.id) {
            console.log('✅ [TESTE] Vinculação confirmada no banco!', {
                ticket_id: verifyTicket.id,
                customer_id: verifyTicket.customer_id,
                customer_name: verifyTicket.customer?.name,
                metadata_test: verifyTicket.metadata?.test_assignment
            });
            return {
                success: true,
                ticket: verifyTicket,
                customer: testCustomer
            };
        }
        else {
            console.error('❌ [TESTE] Vinculação NÃO foi persistida!', {
                expected_customer_id: testCustomer.id,
                actual_customer_id: verifyTicket.customer_id
            });
            return {
                success: false,
                error: 'Vinculação não persistida'
            };
        }
    }
    catch (error) {
        console.error('❌ [TESTE] Erro geral:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
};
// Função para testar o carregamento de tickets com clientes
export const testTicketWithCustomerLoading = async () => {
    console.log('🔄 [TESTE] Testando carregamento de tickets com clientes...');
    try {
        const { data: ticketsWithCustomers, error } = await supabase
            .from('tickets')
            .select(`
        id,
        title,
        status,
        customer_id,
        metadata,
        customer:profiles!tickets_customer_id_fkey (
          id,
          name,
          email,
          phone,
          metadata
        )
      `)
            .not('customer_id', 'is', null)
            .limit(10);
        if (error) {
            console.error('❌ [TESTE] Erro ao carregar tickets:', error);
            return;
        }
        console.log('✅ [TESTE] Tickets com clientes carregados:', {
            total: ticketsWithCustomers?.length || 0,
            tickets: ticketsWithCustomers?.map(t => ({
                id: t.id,
                title: t.title,
                customer_name: t.customer?.name,
                customer_id: t.customer_id
            }))
        });
        return ticketsWithCustomers;
    }
    catch (error) {
        console.error('❌ [TESTE] Erro no carregamento:', error);
    }
};
// Função para limpar dados de teste
export const cleanupTestData = async () => {
    console.log('🧹 [LIMPEZA] Removendo dados de teste...');
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({
            metadata: supabase.rpc('jsonb_set', {
                target: 'metadata',
                path: '{test_assignment}',
                new_value: 'null'
            })
        })
            .not('metadata->>test_assignment', 'is', null)
            .select('id');
        if (error) {
            console.error('❌ [LIMPEZA] Erro:', error);
            return;
        }
        console.log('✅ [LIMPEZA] Dados de teste removidos:', data?.length || 0);
    }
    catch (error) {
        console.error('❌ [LIMPEZA] Erro geral:', error);
    }
};
