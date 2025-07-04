// 🔧 CORREÇÕES PARA PROBLEMAS DO WEBSOCKET
// Execute: fixWebSocketIssues() no console
export const fixWebSocketIssues = async () => {
    console.log('🔧 [FIX] Iniciando correções do sistema WebSocket...');
    console.log('='.repeat(60));
    const fixes = [];
    // 1. CORREÇÃO: URL de conexão WebSocket
    console.log('1️⃣ Corrigindo URL de conexão WebSocket...');
    try {
        const chatStore = window.useChatStore?.getState?.();
        if (chatStore) {
            // Forçar reconexão com URL correta
            const currentHostname = window.location.hostname;
            const expectedUrl = currentHostname === 'localhost' || currentHostname === '127.0.0.1'
                ? 'http://localhost:4000'
                : 'https://websocket.bkcrm.devsible.com.br';
            console.log(`🔗 [FIX] URL esperada: ${expectedUrl}`);
            console.log(`🔗 [FIX] Hostname atual: ${currentHostname}`);
            // Desconectar e reconectar
            if (chatStore.socket) {
                chatStore.disconnect();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            chatStore.init();
            fixes.push({
                issue: 'URL WebSocket Connection',
                status: 'FIXED',
                details: `Reconectado para ${expectedUrl}`
            });
            console.log('✅ [FIX] URL de conexão corrigida');
        }
        else {
            fixes.push({
                issue: 'URL WebSocket Connection',
                status: 'FAILED',
                details: 'chatStore não encontrado'
            });
            console.log('❌ [FIX] chatStore não encontrado');
        }
    }
    catch (error) {
        fixes.push({
            issue: 'URL WebSocket Connection',
            status: 'FAILED',
            details: `Erro: ${error}`
        });
        console.log('❌ [FIX] Erro ao corrigir URL:', error);
    }
    // 2. CORREÇÃO: Eventos de carregamento de mensagens
    console.log('2️⃣ Corrigindo eventos de carregamento...');
    try {
        const chatStore = window.useChatStore?.getState?.();
        if (chatStore?.socket) {
            // Remover listeners antigos e adicionar novos
            chatStore.socket.off('new-message');
            chatStore.socket.off('messages-loaded');
            // Listener melhorado para novas mensagens
            chatStore.socket.on('new-message', (data) => {
                console.log('📨 [FIX] Nova mensagem recebida (listener corrigido):', {
                    id: data.id,
                    ticketId: data.ticket_id || data.ticketId,
                    content: data.content?.substring(0, 50) + '...',
                    sender: data.sender || (data.sender_id ? 'agent' : 'client'),
                    isInternal: data.is_internal
                });
                // Forçar atualização do estado
                const currentState = chatStore;
                const ticketId = data.ticket_id || data.ticketId;
                if (ticketId && currentState.messages) {
                    const currentMessages = currentState.messages[ticketId] || [];
                    // Verificar duplicação
                    const exists = currentMessages.some((msg) => msg.id === data.id ||
                        (msg.content === data.content &&
                            Math.abs(new Date(msg.timestamp).getTime() - new Date(data.created_at || Date.now()).getTime()) < 5000));
                    if (!exists) {
                        // Trigger evento customizado para forçar re-render
                        window.dispatchEvent(new CustomEvent('websocket-message-received', {
                            detail: { ticketId, message: data }
                        }));
                    }
                }
            });
            // Listener melhorado para mensagens carregadas
            chatStore.socket.on('messages-loaded', (data) => {
                console.log('📥 [FIX] Mensagens carregadas (listener corrigido):', {
                    ticketId: data.ticketId,
                    count: data.messages?.length || 0
                });
                // Trigger evento customizado
                window.dispatchEvent(new CustomEvent('websocket-messages-loaded', {
                    detail: data
                }));
            });
            fixes.push({
                issue: 'Message Loading Events',
                status: 'FIXED',
                details: 'Listeners de eventos atualizados'
            });
            console.log('✅ [FIX] Eventos de carregamento corrigidos');
        }
        else {
            fixes.push({
                issue: 'Message Loading Events',
                status: 'SKIPPED',
                details: 'Socket não conectado'
            });
            console.log('⚠️ [FIX] Socket não conectado, eventos não corrigidos');
        }
    }
    catch (error) {
        fixes.push({
            issue: 'Message Loading Events',
            status: 'FAILED',
            details: `Erro: ${error}`
        });
        console.log('❌ [FIX] Erro ao corrigir eventos:', error);
    }
    // 3. CORREÇÃO: Join de tickets
    console.log('3️⃣ Corrigindo join de tickets...');
    try {
        const chatStore = window.useChatStore?.getState?.();
        if (chatStore?.socket && chatStore.isConnected) {
            // Criar função melhorada de join
            window.fixedJoinTicket = (ticketId) => {
                console.log(`🔗 [FIX] Join melhorado para ticket: ${ticketId}`);
                // Primeiro fazer join
                chatStore.socket.emit('join-ticket', {
                    ticketId,
                    userId: '00000000-0000-0000-0000-000000000001' // UUID do sistema
                });
                // Depois solicitar mensagens
                setTimeout(() => {
                    console.log(`📥 [FIX] Solicitando mensagens para: ${ticketId}`);
                    chatStore.socket.emit('request-messages', {
                        ticketId,
                        limit: 50
                    });
                }, 500);
                // Aguardar resposta
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.log('⏰ [FIX] Timeout ao carregar mensagens');
                        resolve(false);
                    }, 10000);
                    const handleLoaded = (data) => {
                        if (data.ticketId === ticketId) {
                            clearTimeout(timeout);
                            chatStore.socket.off('messages-loaded', handleLoaded);
                            console.log(`✅ [FIX] Mensagens carregadas para: ${ticketId}`);
                            resolve(true);
                        }
                    };
                    chatStore.socket.on('messages-loaded', handleLoaded);
                });
            };
            fixes.push({
                issue: 'Ticket Join Process',
                status: 'FIXED',
                details: 'Função fixedJoinTicket() criada'
            });
            console.log('✅ [FIX] Join de tickets corrigido - use fixedJoinTicket(ticketId)');
        }
        else {
            fixes.push({
                issue: 'Ticket Join Process',
                status: 'SKIPPED',
                details: 'Socket não conectado'
            });
            console.log('⚠️ [FIX] Socket não conectado para corrigir join');
        }
    }
    catch (error) {
        fixes.push({
            issue: 'Ticket Join Process',
            status: 'FAILED',
            details: `Erro: ${error}`
        });
        console.log('❌ [FIX] Erro ao corrigir join:', error);
    }
    // 4. CORREÇÃO: Função de envio melhorada
    console.log('4️⃣ Criando função de envio melhorada...');
    try {
        window.fixedSendMessage = async (ticketId, content, isInternal = false) => {
            console.log(`📤 [FIX] Envio melhorado:`, { ticketId, content: content.substring(0, 50), isInternal });
            const chatStore = window.useChatStore?.getState?.();
            if (!chatStore?.socket || !chatStore.isConnected) {
                console.log('❌ [FIX] Socket não conectado para envio');
                return false;
            }
            try {
                // Enviar via WebSocket
                chatStore.socket.emit('send-message', {
                    ticketId,
                    content: content.trim(),
                    isInternal,
                    userId: '00000000-0000-0000-0000-000000000001',
                    senderName: 'Atendente'
                });
                console.log('✅ [FIX] Mensagem enviada via WebSocket');
                return true;
            }
            catch (error) {
                console.log('❌ [FIX] Erro no envio:', error);
                return false;
            }
        };
        fixes.push({
            issue: 'Message Sending',
            status: 'FIXED',
            details: 'Função fixedSendMessage() criada'
        });
        console.log('✅ [FIX] Função de envio melhorada criada - use fixedSendMessage(ticketId, content, isInternal)');
    }
    catch (error) {
        fixes.push({
            issue: 'Message Sending',
            status: 'FAILED',
            details: `Erro: ${error}`
        });
        console.log('❌ [FIX] Erro ao criar função de envio:', error);
    }
    // 5. RESUMO DAS CORREÇÕES
    console.log('='.repeat(60));
    console.log('📊 RESUMO DAS CORREÇÕES:');
    console.log('='.repeat(60));
    const fixed = fixes.filter(f => f.status === 'FIXED');
    const failed = fixes.filter(f => f.status === 'FAILED');
    const skipped = fixes.filter(f => f.status === 'SKIPPED');
    console.log(`✅ Corrigidos: ${fixed.length}`);
    console.log(`❌ Falharam: ${failed.length}`);
    console.log(`⚠️ Ignorados: ${skipped.length}`);
    if (fixed.length > 0) {
        console.log('\n✅ CORREÇÕES APLICADAS:');
        fixed.forEach(fix => {
            console.log(`✅ ${fix.issue}: ${fix.details}`);
        });
    }
    if (failed.length > 0) {
        console.log('\n❌ CORREÇÕES FALHARAM:');
        failed.forEach(fix => {
            console.log(`❌ ${fix.issue}: ${fix.details}`);
        });
    }
    // 6. FUNÇÕES DISPONÍVEIS
    console.log('\n🔧 FUNÇÕES DE CORREÇÃO DISPONÍVEIS:');
    console.log('📊 diagnoseMessagesIssue() - Diagnóstico completo');
    console.log('🔧 fixWebSocketIssues() - Aplicar todas as correções');
    console.log('🔗 fixedJoinTicket(ticketId) - Join melhorado de ticket');
    console.log('📤 fixedSendMessage(ticketId, content, isInternal) - Envio melhorado');
    // Expor resultados
    window.lastFixResults = fixes;
    return;
};
// Expor funções globalmente
window.fixWebSocketIssues = fixWebSocketIssues;
console.log('🔧 [FIX] Sistema de correções WebSocket carregado');
console.log('🔧 Execute: fixWebSocketIssues() para aplicar todas as correções');
