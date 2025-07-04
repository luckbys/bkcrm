/**
 * 🔍 DIAGNÓSTICO: TICKETS REAIS NÃO CHEGAM NO CRM
 *
 * Execute no console do navegador: diagnosticoTicketsCompleto()
 */
import { supabase } from '@/lib/supabase';
// Função para ser executada no console
async function diagnosticoTicketsCompleto() {
    console.log('🚀 DIAGNÓSTICO COMPLETO: Tickets não chegam no CRM');
    console.log('=' * 60);
    const problemas = [];
    const solucoes = [];
    try {
        // 1. VERIFICAR WEBHOOK
        console.log('\n📡 1. TESTANDO WEBHOOK...');
        try {
            const webhookResponse = await fetch('https://websocket.bkcrm.devsible.com.br/webhook/health');
            if (webhookResponse.ok) {
                const health = await webhookResponse.json();
                console.log('✅ Webhook funcionando:', health);
            }
            else {
                console.log('❌ Webhook não responde');
                problemas.push('Webhook não está funcionando');
                solucoes.push('Verificar deploy do webhook no EasyPanel');
            }
        }
        catch (error) {
            console.log('❌ Webhook inacessível:', error);
            problemas.push('Webhook inacessível');
            solucoes.push('Iniciar webhook local: node webhook-evolution-websocket.js');
        }
        // 2. VERIFICAR BANCO DE DADOS
        console.log('\n💾 2. TESTANDO BANCO DE DADOS...');
        const { data: allTickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (ticketsError) {
            console.log('❌ Erro no banco:', ticketsError);
            problemas.push('Erro ao acessar tabela tickets');
            solucoes.push('Verificar credenciais Supabase');
        }
        else {
            console.log(`✅ Total de tickets no banco: ${allTickets.length}`);
            // Verificar tickets WhatsApp
            const whatsappTickets = allTickets.filter(ticket => ticket.channel === 'whatsapp' ||
                ticket.metadata?.created_from_whatsapp ||
                ticket.metadata?.evolution_instance_name);
            console.log(`📱 Tickets WhatsApp: ${whatsappTickets.length}`);
            if (whatsappTickets.length > 0) {
                console.log('📋 Últimos tickets WhatsApp:');
                whatsappTickets.slice(0, 5).forEach(ticket => {
                    console.log(`  🎫 ${ticket.id.substring(0, 8)}... | ${ticket.title} | Dept: ${ticket.department_id || 'NULL'}`);
                });
            }
        }
        // 3. VERIFICAR USUÁRIO ATUAL
        console.log('\n👤 3. VERIFICANDO USUÁRIO ATUAL...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('❌ Usuário não autenticado');
            problemas.push('Usuário não logado');
            solucoes.push('Fazer login no sistema');
            return;
        }
        const { data: currentProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, department')
            .eq('id', user.id)
            .single();
        if (profileError) {
            console.log('❌ Erro ao buscar perfil:', profileError);
            problemas.push('Perfil do usuário não encontrado');
            solucoes.push('Verificar configuração do usuário');
        }
        else {
            console.log('✅ Usuário logado:', {
                id: currentProfile.id.substring(0, 8) + '...',
                role: currentProfile.role,
                department: currentProfile.department
            });
        }
        // 4. VERIFICAR DEPARTAMENTOS
        console.log('\n🏢 4. VERIFICANDO DEPARTAMENTOS...');
        const { data: departments, error: deptError } = await supabase
            .from('departments')
            .select('*');
        if (deptError) {
            console.log('❌ Erro ao buscar departamentos:', deptError);
            problemas.push('Tabela departments com problema');
            solucoes.push('Executar migração de departamentos no Supabase');
        }
        else {
            console.log(`✅ Departamentos encontrados: ${departments.length}`);
            departments.forEach(dept => {
                console.log(`  🏢 ${dept.name} (ID: ${dept.id})`);
            });
        }
        // 5. SIMULAR FILTROS
        console.log('\n🎯 5. SIMULANDO FILTROS DO FRONTEND...');
        if (!currentProfile) {
            console.log('❌ Não é possível simular filtros sem perfil');
        }
        else {
            const hasGlobalAccess = ['diretor', 'ceo', 'administrador'].includes(currentProfile.department?.toLowerCase() || '');
            console.log('📊 Configuração de filtros:', {
                role: currentProfile.role,
                department: currentProfile.department,
                hasGlobalAccess,
                filterRule: currentProfile.role === 'customer' ? 'Apenas próprios tickets' :
                    hasGlobalAccess ? 'Acesso global - todos tickets' :
                        currentProfile.role === 'agent' ? 'Apenas tickets do departamento' :
                            currentProfile.role === 'admin' ? 'Apenas tickets do departamento' :
                                'Sem filtro específico'
            });
            // Simular query com filtros
            let query = supabase.from('tickets').select('id, title, department_id, customer_id');
            if (currentProfile.role === 'customer') {
                query = query.eq('customer_id', user.id);
            }
            else if (!hasGlobalAccess && currentProfile.role === 'agent') {
                // Buscar department_id baseado no nome
                const userDept = departments?.find(d => d.name.toLowerCase() === currentProfile.department?.toLowerCase());
                if (userDept) {
                    query = query.eq('department_id', userDept.id);
                }
            }
            const { data: filteredTickets, error: filterError } = await query.limit(10);
            if (filterError) {
                console.log('❌ Erro ao aplicar filtros:', filterError);
                problemas.push('Erro nos filtros de departamento');
                solucoes.push('Revisar configuração de relacionamentos');
            }
            else {
                console.log(`✅ Tickets visíveis com filtros: ${filteredTickets.length}`);
                if (filteredTickets.length === 0 && allTickets.length > 0) {
                    console.log('⚠️ PROBLEMA IDENTIFICADO: Tickets existem no banco mas filtros bloqueiam visualização!');
                    problemas.push('Filtros de departamento bloqueando tickets');
                    solucoes.push('Corrigir department_id dos tickets ou configuração do usuário');
                }
            }
        }
        // 6. TESTAR WEBHOOK DIRETO
        console.log('\n🧪 6. TESTE DIRETO DE WEBHOOK...');
        try {
            const testPayload = {
                event: 'MESSAGES_UPSERT',
                instance: 'teste-diagnostico',
                data: {
                    key: {
                        remoteJid: '5511999887766@s.whatsapp.net',
                        fromMe: false,
                        id: `DIAGNOSTICO_${Date.now()}`
                    },
                    message: {
                        conversation: `[TESTE DIAGNÓSTICO] ${new Date().toLocaleString()}`
                    },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    pushName: 'Diagnóstico CRM'
                }
            };
            const webhookTest = await fetch('https://websocket.bkcrm.devsible.com.br/webhook/evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            });
            if (webhookTest.ok) {
                const result = await webhookTest.json();
                console.log('✅ Webhook processou teste:', result);
                if (result.ticketId) {
                    console.log(`🎫 Ticket criado: ${result.ticketId}`);
                    // Verificar se aparece no banco
                    setTimeout(async () => {
                        const { data: createdTicket } = await supabase
                            .from('tickets')
                            .select('*')
                            .eq('id', result.ticketId)
                            .single();
                        if (createdTicket) {
                            console.log('✅ Ticket confirmado no banco:', {
                                id: createdTicket.id.substring(0, 8) + '...',
                                department_id: createdTicket.department_id,
                                channel: createdTicket.channel
                            });
                        }
                        else {
                            console.log('❌ Ticket não encontrado no banco após criação');
                            problemas.push('Webhook não salva no banco');
                        }
                    }, 2000);
                }
            }
            else {
                console.log('❌ Teste de webhook falhou:', webhookTest.status);
                problemas.push('Webhook não processa mensagens de teste');
            }
        }
        catch (error) {
            console.log('❌ Erro no teste de webhook:', error);
        }
        // RESUMO FINAL
        console.log('\n📊 RESUMO DO DIAGNÓSTICO');
        console.log('========================');
        if (problemas.length === 0) {
            console.log('✅ NENHUM PROBLEMA IDENTIFICADO!');
            console.log('💡 Os tickets devem estar chegando normalmente.');
            console.log('   Verifique se está na aba correta (Pendentes/Todos)');
        }
        else {
            console.log('❌ PROBLEMAS IDENTIFICADOS:');
            problemas.forEach((problema, index) => {
                console.log(`  ${index + 1}. ${problema}`);
            });
            console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
            solucoes.forEach((solucao, index) => {
                console.log(`  ${index + 1}. ${solucao}`);
            });
        }
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('1. Execute: removerFiltrosTemporariamente() para ver todos os tickets');
        console.log('2. Execute: criarTicketTeste() para criar um ticket manual');
        console.log('3. Execute: verificarWebhookEvolution() para testar webhook');
    }
    catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
}
// Função para remover filtros temporariamente
async function removerFiltrosTemporariamente() {
    console.log('🔓 Removendo filtros temporariamente...');
    const { data: todosTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) {
        console.log('❌ Erro:', error);
    }
    else {
        console.log(`📊 TODOS OS TICKETS (sem filtros): ${todosTickets.length}`);
        const whatsappTickets = todosTickets.filter(t => t.channel === 'whatsapp' ||
            t.metadata?.created_from_whatsapp);
        console.log(`📱 Tickets WhatsApp: ${whatsappTickets.length}`);
        if (whatsappTickets.length > 0) {
            console.log('📋 Tickets WhatsApp encontrados:');
            whatsappTickets.slice(0, 10).forEach(ticket => {
                console.log(`  🎫 ${ticket.title} | Dept: ${ticket.department_id || 'NULL'} | ${ticket.created_at}`);
            });
        }
        else {
            console.log('⚠️ Nenhum ticket WhatsApp encontrado no banco');
        }
    }
}
// Função para criar ticket de teste
async function criarTicketTeste() {
    console.log('🧪 Criando ticket de teste...');
    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([{
            title: 'TESTE DIAGNÓSTICO - ' + new Date().toLocaleString(),
            description: 'Ticket criado pelo diagnóstico para teste',
            status: 'open',
            priority: 'medium',
            channel: 'whatsapp',
            metadata: {
                test_diagnostic: true,
                created_from_whatsapp: true,
                client_name: 'Cliente Teste',
                client_phone: '+5511999887766'
            }
        }])
        .select()
        .single();
    if (error) {
        console.log('❌ Erro ao criar ticket:', error);
    }
    else {
        console.log('✅ Ticket de teste criado:', ticket.id);
        console.log('💡 Agora verifique se aparece na interface do CRM');
    }
}
// Função para verificar webhook Evolution
async function verificarWebhookEvolution() {
    console.log('🔗 Verificando webhook Evolution API...');
    try {
        const response = await fetch('https://press-evolution-api.jhkbgs.easypanel.host/instance/fetchInstances', {
            headers: {
                'apikey': '429683C4C977415CAAFCCE10F7D57E11'
            }
        });
        if (response.ok) {
            const instances = await response.json();
            console.log(`✅ Evolution API funcionando. Instâncias: ${instances.length}`);
            instances.forEach((instance) => {
                console.log(`📱 ${instance.name} | Status: ${instance.connectionStatus}`);
            });
        }
        else {
            console.log('❌ Evolution API não responde');
        }
    }
    catch (error) {
        console.log('❌ Erro ao conectar Evolution API:', error);
    }
}
window.diagnosticoTicketsCompleto = diagnosticoTicketsCompleto;
window.removerFiltrosTemporariamente = removerFiltrosTemporariamente;
window.criarTicketTeste = criarTicketTeste;
window.verificarWebhookEvolution = verificarWebhookEvolution;
export { diagnosticoTicketsCompleto, removerFiltrosTemporariamente, criarTicketTeste, verificarWebhookEvolution };
