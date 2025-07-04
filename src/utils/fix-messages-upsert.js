// 🔧 CORREÇÃO PARA ENDPOINT /messages-upsert
// Execute: fixMessagesUpsert() no console
export const fixMessagesUpsert = async () => {
    console.log('🔧 [UPSERT-FIX] Diagnosticando endpoint /messages-upsert...');
    console.log('='.repeat(60));
    const diagnostics = [];
    // 1. Verificar se servidor WebSocket está rodando
    console.log('1️⃣ Verificando servidor WebSocket...');
    try {
        const healthResponse = await fetch('http://localhost:4000/webhook/health');
        const healthData = await healthResponse.json();
        if (healthResponse.ok) {
            diagnostics.push({
                step: 'WebSocket Server Health',
                status: 'OK',
                details: healthData
            });
            console.log('✅ [UPSERT-FIX] Servidor WebSocket OK');
        }
        else {
            diagnostics.push({
                step: 'WebSocket Server Health',
                status: 'ERROR',
                details: healthData,
                suggestion: 'Reiniciar servidor WebSocket na porta 4000'
            });
            console.log('❌ [UPSERT-FIX] Servidor WebSocket com problemas');
            return;
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'WebSocket Server Health',
            status: 'ERROR',
            details: error,
            suggestion: 'Executar: cd backend/webhooks && node webhook-evolution-websocket.js'
        });
        console.log('❌ [UPSERT-FIX] Erro ao verificar servidor:', error);
        return;
    }
    // 2. Testar endpoint /messages-upsert
    console.log('2️⃣ Testando endpoint /messages-upsert...');
    try {
        const testPayload = {
            event: 'MESSAGES_UPSERT',
            instance: 'atendimento-ao-cliente-suporte',
            data: {
                key: {
                    id: 'TEST_MESSAGE_' + Date.now(),
                    remoteJid: '5512981022013@s.whatsapp.net',
                    fromMe: false
                },
                message: {
                    conversation: '🔧 Teste de diagnóstico /messages-upsert - ' + new Date().toLocaleTimeString()
                },
                messageTimestamp: Date.now(),
                pushName: 'Teste Diagnóstico'
            }
        };
        console.log('📤 [UPSERT-FIX] Enviando payload de teste:', {
            endpoint: '/webhook/messages-upsert',
            phone: '5512981022013',
            content: testPayload.data.message.conversation,
            messageId: testPayload.data.key.id
        });
        const upsertResponse = await fetch('http://localhost:4000/webhook/messages-upsert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        const upsertResult = await upsertResponse.json();
        if (upsertResponse.ok && upsertResult.processed) {
            diagnostics.push({
                step: 'Messages Upsert Endpoint',
                status: 'OK',
                details: {
                    processed: upsertResult.processed,
                    ticketId: upsertResult.ticketId,
                    messageId: upsertResult.messageId,
                    broadcast: upsertResult.broadcast
                }
            });
            console.log('✅ [UPSERT-FIX] Endpoint /messages-upsert funcionando:', {
                ticketId: upsertResult.ticketId,
                messageId: upsertResult.messageId,
                broadcast: upsertResult.broadcast
            });
        }
        else {
            diagnostics.push({
                step: 'Messages Upsert Endpoint',
                status: 'ERROR',
                details: upsertResult,
                suggestion: 'Verificar logs do servidor WebSocket para erros específicos'
            });
            console.log('❌ [UPSERT-FIX] Endpoint /messages-upsert com problemas:', upsertResult);
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'Messages Upsert Endpoint',
            status: 'ERROR',
            details: error,
            suggestion: 'Verificar se servidor está rodando e endpoint está disponível'
        });
        console.log('❌ [UPSERT-FIX] Erro ao testar endpoint:', error);
    }
    // 3. Testar endpoint principal /webhook/evolution
    console.log('3️⃣ Testando endpoint principal /webhook/evolution...');
    try {
        const mainPayload = {
            event: 'MESSAGES_UPSERT',
            instance: 'atendimento-ao-cliente-suporte',
            data: {
                key: {
                    id: 'TEST_MAIN_' + Date.now(),
                    remoteJid: '5512981022013@s.whatsapp.net',
                    fromMe: false
                },
                message: {
                    conversation: '🔧 Teste endpoint principal - ' + new Date().toLocaleTimeString()
                },
                messageTimestamp: Date.now(),
                pushName: 'Teste Principal'
            }
        };
        const mainResponse = await fetch('http://localhost:4000/webhook/evolution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mainPayload)
        });
        const mainResult = await mainResponse.json();
        if (mainResponse.ok && mainResult.processed) {
            diagnostics.push({
                step: 'Main Evolution Endpoint',
                status: 'OK',
                details: {
                    processed: mainResult.processed,
                    ticketId: mainResult.ticketId,
                    websocket: mainResult.websocket
                }
            });
            console.log('✅ [UPSERT-FIX] Endpoint principal funcionando:', {
                ticketId: mainResult.ticketId,
                websocket: mainResult.websocket
            });
        }
        else {
            diagnostics.push({
                step: 'Main Evolution Endpoint',
                status: 'ERROR',
                details: mainResult,
                suggestion: 'Verificar logs do servidor para erros de processamento'
            });
            console.log('❌ [UPSERT-FIX] Endpoint principal com problemas:', mainResult);
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'Main Evolution Endpoint',
            status: 'ERROR',
            details: error,
            suggestion: 'Verificar conectividade com servidor WebSocket'
        });
        console.log('❌ [UPSERT-FIX] Erro ao testar endpoint principal:', error);
    }
    // 4. Verificar banco de dados Supabase
    console.log('4️⃣ Verificando conexão com banco de dados...');
    try {
        // Importar Supabase dinamicamente
        const { supabase } = await import('../lib/supabase');
        // Testar conexão básica
        const { data, error } = await supabase
            .from('tickets')
            .select('id, title, status')
            .limit(1);
        if (error) {
            diagnostics.push({
                step: 'Database Connection',
                status: 'ERROR',
                details: error,
                suggestion: 'Verificar credenciais do Supabase e conectividade'
            });
            console.log('❌ [UPSERT-FIX] Erro na conexão com banco:', error);
        }
        else {
            diagnostics.push({
                step: 'Database Connection',
                status: 'OK',
                details: { recordsFound: data?.length || 0 }
            });
            console.log('✅ [UPSERT-FIX] Conexão com banco OK');
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'Database Connection',
            status: 'ERROR',
            details: error,
            suggestion: 'Verificar importação do Supabase e configurações'
        });
        console.log('❌ [UPSERT-FIX] Erro ao testar banco:', error);
    }
    // 5. Verificar tickets criados recentemente
    console.log('5️⃣ Verificando tickets recentes...');
    try {
        const { supabase } = await import('../lib/supabase');
        const { data: recentTickets, error } = await supabase
            .from('tickets')
            .select('id, title, created_at, channel, nunmsg, metadata')
            .eq('channel', 'whatsapp')
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) {
            diagnostics.push({
                step: 'Recent WhatsApp Tickets',
                status: 'ERROR',
                details: error,
                suggestion: 'Verificar estrutura da tabela tickets'
            });
            console.log('❌ [UPSERT-FIX] Erro ao buscar tickets:', error);
        }
        else {
            diagnostics.push({
                step: 'Recent WhatsApp Tickets',
                status: 'OK',
                details: {
                    count: recentTickets?.length || 0,
                    tickets: recentTickets?.map(t => ({
                        id: t.id,
                        title: t.title,
                        phone: t.nunmsg,
                        created: t.created_at
                    }))
                }
            });
            console.log('✅ [UPSERT-FIX] Tickets WhatsApp encontrados:', recentTickets?.length || 0);
            if (recentTickets && recentTickets.length > 0) {
                console.log('📋 [UPSERT-FIX] Tickets recentes:');
                recentTickets.forEach(ticket => {
                    console.log(`   📱 ${ticket.title} (${ticket.nunmsg}) - ${ticket.created_at}`);
                });
            }
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'Recent WhatsApp Tickets',
            status: 'ERROR',
            details: error,
            suggestion: 'Verificar acesso à tabela tickets'
        });
        console.log('❌ [UPSERT-FIX] Erro ao verificar tickets:', error);
    }
    // 6. Verificar mensagens recentes
    console.log('6️⃣ Verificando mensagens recentes...');
    try {
        const { supabase } = await import('../lib/supabase');
        const { data: recentMessages, error } = await supabase
            .from('messages')
            .select('id, ticket_id, content, sender_name, created_at, metadata')
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) {
            diagnostics.push({
                step: 'Recent Messages',
                status: 'ERROR',
                details: error,
                suggestion: 'Verificar estrutura da tabela messages'
            });
            console.log('❌ [UPSERT-FIX] Erro ao buscar mensagens:', error);
        }
        else {
            diagnostics.push({
                step: 'Recent Messages',
                status: 'OK',
                details: {
                    count: recentMessages?.length || 0,
                    messages: recentMessages?.map(m => ({
                        id: m.id,
                        ticketId: m.ticket_id,
                        content: m.content?.substring(0, 50) + '...',
                        sender: m.sender_name,
                        created: m.created_at
                    }))
                }
            });
            console.log('✅ [UPSERT-FIX] Mensagens encontradas:', recentMessages?.length || 0);
            if (recentMessages && recentMessages.length > 0) {
                console.log('📋 [UPSERT-FIX] Mensagens recentes:');
                recentMessages.forEach(msg => {
                    console.log(`   💬 ${msg.sender_name}: ${msg.content?.substring(0, 30)}... - ${msg.created_at}`);
                });
            }
        }
    }
    catch (error) {
        diagnostics.push({
            step: 'Recent Messages',
            status: 'ERROR',
            details: error,
            suggestion: 'Verificar acesso à tabela messages'
        });
        console.log('❌ [UPSERT-FIX] Erro ao verificar mensagens:', error);
    }
    // 7. Resumo do diagnóstico
    console.log('='.repeat(60));
    console.log('📊 RESUMO DO DIAGNÓSTICO:');
    console.log('='.repeat(60));
    const okSteps = diagnostics.filter(d => d.status === 'OK');
    const errorSteps = diagnostics.filter(d => d.status === 'ERROR');
    const warningSteps = diagnostics.filter(d => d.status === 'WARNING');
    console.log(`✅ Funcionando: ${okSteps.length}`);
    console.log(`❌ Com erro: ${errorSteps.length}`);
    console.log(`⚠️ Com aviso: ${warningSteps.length}`);
    if (errorSteps.length > 0) {
        console.log('\n❌ PROBLEMAS ENCONTRADOS:');
        errorSteps.forEach(step => {
            console.log(`❌ ${step.step}: ${step.suggestion || 'Verificar logs'}`);
        });
    }
    if (okSteps.length === diagnostics.length) {
        console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
        console.log('💡 Se ainda há problemas, verifique:');
        console.log('   1. Logs do servidor WebSocket no terminal');
        console.log('   2. Configuração da Evolution API');
        console.log('   3. Webhook URL configurado corretamente');
    }
    else {
        console.log('\n🔧 AÇÕES RECOMENDADAS:');
        console.log('   1. Corrigir problemas identificados acima');
        console.log('   2. Reiniciar servidor WebSocket se necessário');
        console.log('   3. Verificar logs detalhados no terminal do servidor');
        console.log('   4. Testar novamente após correções');
    }
    // Expor resultados para análise
    window.lastUpsertDiagnostics = diagnostics;
    console.log('\n🔧 FUNÇÕES DISPONÍVEIS:');
    console.log('📊 fixMessagesUpsert() - Executar diagnóstico completo');
    console.log('🧪 testMessageUpsertFlow() - Testar fluxo completo');
    console.log('📋 showUpsertLogs() - Mostrar logs detalhados');
};
// Função para testar fluxo completo
export const testMessageUpsertFlow = async () => {
    console.log('🧪 [UPSERT-TEST] Testando fluxo completo...');
    const testPhone = '5512981022013';
    const testMessage = 'Teste completo do fluxo /messages-upsert - ' + new Date().toLocaleTimeString();
    try {
        // 1. Enviar via /messages-upsert
        console.log('1️⃣ Enviando via /messages-upsert...');
        const payload = {
            event: 'MESSAGES_UPSERT',
            instance: 'atendimento-ao-cliente-suporte',
            data: {
                key: {
                    id: 'FLOW_TEST_' + Date.now(),
                    remoteJid: testPhone + '@s.whatsapp.net',
                    fromMe: false
                },
                message: {
                    conversation: testMessage
                },
                messageTimestamp: Date.now(),
                pushName: 'Teste Fluxo'
            }
        };
        const response = await fetch('http://localhost:4000/webhook/messages-upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.processed && result.ticketId) {
            console.log('✅ [UPSERT-TEST] Mensagem processada:', {
                ticketId: result.ticketId,
                messageId: result.messageId
            });
            // 2. Verificar no banco
            console.log('2️⃣ Verificando no banco de dados...');
            const { supabase } = await import('../lib/supabase');
            const { data: ticket } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', result.ticketId)
                .single();
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', result.ticketId)
                .order('created_at', { ascending: false })
                .limit(1);
            if (ticket && messages && messages.length > 0) {
                console.log('✅ [UPSERT-TEST] Dados salvos no banco:', {
                    ticket: {
                        id: ticket.id,
                        title: ticket.title,
                        phone: ticket.nunmsg,
                        channel: ticket.channel
                    },
                    message: {
                        id: messages[0].id,
                        content: messages[0].content,
                        sender: messages[0].sender_name
                    }
                });
                console.log('🎉 [UPSERT-TEST] Fluxo completo funcionando!');
            }
            else {
                console.log('❌ [UPSERT-TEST] Dados não encontrados no banco');
            }
        }
        else {
            console.log('❌ [UPSERT-TEST] Falha no processamento:', result);
        }
    }
    catch (error) {
        console.error('❌ [UPSERT-TEST] Erro no teste:', error);
    }
};
// Função para mostrar logs detalhados
export const showUpsertLogs = () => {
    const diagnostics = window.lastUpsertDiagnostics;
    if (!diagnostics) {
        console.log('⚠️ Execute fixMessagesUpsert() primeiro para gerar logs');
        return;
    }
    console.log('📋 LOGS DETALHADOS DO DIAGNÓSTICO:');
    console.log('='.repeat(60));
    diagnostics.forEach((diag, index) => {
        const icon = diag.status === 'OK' ? '✅' : diag.status === 'ERROR' ? '❌' : '⚠️';
        console.log(`${index + 1}. ${icon} ${diag.step}`);
        console.log(`   Status: ${diag.status}`);
        console.log(`   Detalhes:`, diag.details);
        if (diag.suggestion) {
            console.log(`   Sugestão: ${diag.suggestion}`);
        }
        console.log('');
    });
};
// Expor funções globalmente
window.fixMessagesUpsert = fixMessagesUpsert;
window.testMessageUpsertFlow = testMessageUpsertFlow;
window.showUpsertLogs = showUpsertLogs;
console.log('🔧 [UPSERT-FIX] Sistema de correção /messages-upsert carregado');
console.log('🔧 Execute: fixMessagesUpsert() para diagnosticar problemas');
console.log('🧪 Execute: testMessageUpsertFlow() para testar fluxo completo');
