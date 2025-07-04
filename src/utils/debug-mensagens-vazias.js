// 🔧 Debug específico para problema de mensagens não aparecendo
// Para usar: Execute debugMensagensVazias() no console
// 🔍 Função principal de diagnóstico
const debugMensagensVazias = (ticketId) => {
    console.log('🔍 [DEBUG-VAZIAS] === DIAGNÓSTICO MENSAGENS NÃO APARECEM ===');
    try {
        // 1. Verificar estado do chatStore
        const chatStore = window.useChatStore?.getState?.();
        if (!chatStore) {
            console.error('❌ ChatStore não encontrado - verifique se o Zustand está configurado');
            return;
        }
        console.log('📊 [DEBUG-VAZIAS] Estado do ChatStore:', {
            isConnected: chatStore.isConnected,
            isLoading: chatStore.isLoading,
            error: chatStore.error,
            totalTickets: Object.keys(chatStore.messages).length,
            tickets: Object.keys(chatStore.messages),
            socket: chatStore.socket ? 'Existe' : 'Null'
        });
        // 2. Verificar mensagens específicas do ticket se fornecido
        if (ticketId) {
            const mensagensTicket = chatStore.messages[ticketId] || [];
            console.log(`📨 [DEBUG-VAZIAS] Mensagens do ticket ${ticketId}:`, {
                total: mensagensTicket.length,
                mensagens: mensagensTicket.map(m => ({
                    id: m.id,
                    content: m.content.substring(0, 50),
                    sender: m.sender,
                    timestamp: m.timestamp
                }))
            });
            if (mensagensTicket.length === 0) {
                console.warn(`⚠️ [DEBUG-VAZIAS] PROBLEMA IDENTIFICADO: Ticket ${ticketId} tem 0 mensagens`);
                console.log(`🔧 [DEBUG-VAZIAS] Possíveis causas:`);
                console.log(`   1. Ticket não existe no banco de dados`);
                console.log(`   2. WebSocket não está recebendo dados do backend`);
                console.log(`   3. Backend não está funcionando`);
                console.log(`   4. Filtros estão bloqueando as mensagens`);
                console.log(`   5. Problema de conversão de dados`);
            }
        }
        // 3. Verificar conexão WebSocket
        if (!chatStore.isConnected) {
            console.error('❌ [DEBUG-VAZIAS] WebSocket DESCONECTADO');
            console.log('🔧 [DEBUG-VAZIAS] Tentando reconectar...');
            chatStore.init();
        }
        else {
            console.log('✅ [DEBUG-VAZIAS] WebSocket conectado');
            // Verificar se socket está realmente funcionando
            if (chatStore.socket) {
                console.log('🔗 [DEBUG-VAZIAS] Socket ID:', chatStore.socket.id);
                console.log('🔗 [DEBUG-VAZIAS] Socket connected:', chatStore.socket.connected);
                console.log('🔗 [DEBUG-VAZIAS] Transport:', chatStore.socket.io.engine.transport.name);
            }
        }
        // 4. Verificar se existem mensagens em outros tickets
        const totalMensagens = Object.values(chatStore.messages).reduce((total, msgs) => total + msgs.length, 0);
        console.log(`📊 [DEBUG-VAZIAS] Total de mensagens no sistema: ${totalMensagens}`);
        if (totalMensagens === 0) {
            console.warn('⚠️ [DEBUG-VAZIAS] PROBLEMA GRAVE: Nenhuma mensagem em nenhum ticket');
            console.log('🔧 [DEBUG-VAZIAS] Isso indica problema no backend ou WebSocket');
        }
        // 5. Verificar se o modal está aberto
        const modal = document.querySelector('[role="dialog"]');
        console.log('🖥️ [DEBUG-VAZIAS] Modal aberto:', !!modal);
        // 6. Verificar se existem elementos de mensagens no DOM
        const messagesContainer = document.querySelector('[data-chat-messages]') ||
            document.querySelector('.chat-messages') ||
            document.querySelector('.messages-area');
        console.log('🖥️ [DEBUG-VAZIAS] Container de mensagens:', !!messagesContainer);
        if (messagesContainer) {
            const messageElements = messagesContainer.querySelectorAll('[data-message-id]');
            console.log('🖥️ [DEBUG-VAZIAS] Elementos de mensagem no DOM:', messageElements.length);
        }
        // 7. Mostrar recomendações
        console.log('💡 [DEBUG-VAZIAS] === RECOMENDAÇÕES ===');
        console.log('1. Execute: diagnosticoCompleto("' + (ticketId || 'SEU_TICKET_ID') + '")');
        console.log('2. Execute: verificarBackend()');
        console.log('3. Execute: forcarCarregamentoMensagens("' + (ticketId || 'SEU_TICKET_ID') + '")');
    }
    catch (error) {
        console.error('❌ [DEBUG-VAZIAS] Erro durante diagnóstico:', error);
    }
};
// 🔬 Diagnóstico completo com testes
const diagnosticoCompleto = async (ticketId) => {
    console.log(`🔬 [DIAGNOSTICO] === DIAGNÓSTICO COMPLETO TICKET ${ticketId} ===`);
    try {
        // 1. Testar WebSocket básico
        console.log('🔗 [DIAGNOSTICO] Teste 1: Conexão WebSocket');
        const chatStore = window.useChatStore?.getState?.();
        if (!chatStore?.isConnected) {
            console.log('🔄 [DIAGNOSTICO] Reconectando WebSocket...');
            chatStore?.init();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        // 2. Testar join do ticket
        console.log('🎯 [DIAGNOSTICO] Teste 2: Join no ticket');
        if (chatStore?.isConnected) {
            chatStore.join(ticketId);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // 3. Testar carregamento de mensagens
        console.log('📥 [DIAGNOSTICO] Teste 3: Carregamento de mensagens');
        if (chatStore?.isConnected) {
            chatStore.load(ticketId);
            // Aguardar resposta
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mensagens = chatStore.messages[ticketId] || [];
            console.log(`📊 [DIAGNOSTICO] Resultado: ${mensagens.length} mensagens carregadas`);
            if (mensagens.length === 0) {
                console.warn('⚠️ [DIAGNOSTICO] Nenhuma mensagem carregada - problema no backend');
            }
            else {
                console.log('✅ [DIAGNOSTICO] Mensagens carregadas com sucesso');
                mensagens.forEach((msg, i) => {
                    console.log(`  ${i + 1}. ${msg.sender}: ${msg.content.substring(0, 30)}...`);
                });
            }
        }
        // 4. Testar envio de mensagem de teste
        console.log('📤 [DIAGNOSTICO] Teste 4: Envio de mensagem teste');
        if (chatStore?.isConnected) {
            try {
                await chatStore.send(ticketId, 'Teste de diagnóstico - ' + new Date().toLocaleTimeString(), false);
                console.log('✅ [DIAGNOSTICO] Mensagem de teste enviada');
            }
            catch (error) {
                console.error('❌ [DIAGNOSTICO] Erro ao enviar mensagem teste:', error);
            }
        }
    }
    catch (error) {
        console.error('❌ [DIAGNOSTICO] Erro durante diagnóstico completo:', error);
    }
};
// 🔄 Forçar carregamento de mensagens
const forcarCarregamentoMensagens = async (ticketId) => {
    console.log(`🔄 [FORCAR] Forçando carregamento de mensagens para ${ticketId}`);
    try {
        const chatStore = window.useChatStore?.getState?.();
        if (!chatStore) {
            console.error('❌ ChatStore não encontrado');
            return;
        }
        // 1. Limpar mensagens existentes
        console.log('🧹 [FORCAR] Limpando mensagens existentes...');
        const currentState = chatStore;
        delete currentState.messages[ticketId];
        // 2. Reconectar se necessário
        if (!chatStore.isConnected) {
            console.log('🔄 [FORCAR] Reconectando...');
            chatStore.init();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        // 3. Join + Load múltiplas vezes
        for (let i = 0; i < 3; i++) {
            console.log(`🎯 [FORCAR] Tentativa ${i + 1}/3...`);
            if (chatStore.isConnected) {
                chatStore.join(ticketId);
                await new Promise(resolve => setTimeout(resolve, 500));
                chatStore.load(ticketId);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const mensagens = chatStore.messages[ticketId] || [];
                if (mensagens.length > 0) {
                    console.log(`✅ [FORCAR] Sucesso! ${mensagens.length} mensagens carregadas`);
                    break;
                }
            }
        }
        const mensagensFinal = chatStore.messages[ticketId] || [];
        if (mensagensFinal.length === 0) {
            console.warn('⚠️ [FORCAR] Falha: Nenhuma mensagem carregada após 3 tentativas');
            console.log('💡 [FORCAR] Execute: verificarBackend() para testar o servidor');
        }
    }
    catch (error) {
        console.error('❌ [FORCAR] Erro:', error);
    }
};
// 🖥️ Verificar backend
const verificarBackend = async () => {
    console.log('🖥️ [BACKEND] Verificando saúde do backend...');
    try {
        // Detectar URL do backend
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const backendUrl = isLocal ? 'http://localhost:4000' : 'https://websocket.bkcrm.devsible.com.br';
        console.log(`🔗 [BACKEND] URL detectada: ${backendUrl}`);
        // Testar health check
        try {
            const response = await fetch(`${backendUrl}/health`);
            if (response.ok) {
                const data = await response.text();
                console.log('✅ [BACKEND] Health check OK:', data);
            }
            else {
                console.error(`❌ [BACKEND] Health check falhou: ${response.status}`);
            }
        }
        catch (error) {
            console.error('❌ [BACKEND] Erro no health check:', error);
            console.log('💡 [BACKEND] Backend pode estar offline ou URL incorreta');
        }
        // Testar WebSocket endpoint
        try {
            const wsUrl = backendUrl.replace('http', 'ws');
            console.log(`🔗 [BACKEND] Testando WebSocket: ${wsUrl}`);
            const testSocket = new WebSocket(wsUrl);
            testSocket.onopen = () => {
                console.log('✅ [BACKEND] WebSocket conectou');
                testSocket.close();
            };
            testSocket.onerror = (error) => {
                console.error('❌ [BACKEND] WebSocket erro:', error);
            };
        }
        catch (error) {
            console.error('❌ [BACKEND] Erro ao testar WebSocket:', error);
        }
    }
    catch (error) {
        console.error('❌ [BACKEND] Erro geral:', error);
    }
};
// 🗄️ Testar banco de dados
const testarBancoDeDados = async (ticketId) => {
    console.log(`🗄️ [BANCO] Testando acesso ao banco para ticket ${ticketId}`);
    try {
        // Verificar se Supabase está disponível
        const supabase = window.supabase;
        if (!supabase) {
            console.error('❌ [BANCO] Supabase não encontrado');
            console.log('💡 [BANCO] Verifique se o Supabase está configurado');
            return;
        }
        // Buscar mensagens diretamente do banco
        console.log('📊 [BANCO] Buscando mensagens do banco...');
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('❌ [BANCO] Erro ao buscar mensagens:', error);
            return;
        }
        console.log(`📊 [BANCO] ${messages?.length || 0} mensagens encontradas no banco:`);
        messages?.forEach((msg, i) => {
            console.log(`  ${i + 1}. ${msg.sender_id ? 'Agent' : 'Client'}: ${msg.content?.substring(0, 30)}...`);
        });
        if (messages?.length === 0) {
            console.warn('⚠️ [BANCO] Nenhuma mensagem encontrada no banco');
            console.log('💡 [BANCO] Ticket pode não existir ou não ter mensagens');
        }
    }
    catch (error) {
        console.error('❌ [BANCO] Erro ao testar banco:', error);
    }
};
// 🚀 Exportar funções para o window object
if (typeof window !== 'undefined') {
    window.debugMensagensVazias = debugMensagensVazias;
    window.diagnosticoCompleto = diagnosticoCompleto;
    window.forcarCarregamentoMensagens = forcarCarregamentoMensagens;
    window.verificarBackend = verificarBackend;
    window.testarBancoDeDados = testarBancoDeDados;
    console.log('🔧 [DEBUG-VAZIAS] Funções de debug carregadas:');
    console.log('  - debugMensagensVazias(ticketId?)');
    console.log('  - diagnosticoCompleto(ticketId)');
    console.log('  - forcarCarregamentoMensagens(ticketId)');
    console.log('  - verificarBackend()');
    console.log('  - testarBancoDeDados(ticketId)');
}
