// 🧪 TESTE CONEXÃO WEBSOCKET PRODUÇÃO
import { io } from 'socket.io-client';
// 🔧 Função para testar conexão com servidor de produção
export const testProductionWebSocket = () => {
    console.log('\n🧪 ===== TESTE CONEXÃO WEBSOCKET PRODUÇÃO =====\n');
    const productionURL = 'https://websocket.bkcrm.devsible.com.br';
    console.log(`🔗 Testando conexão com: ${productionURL}`);
    const socket = io(productionURL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // Desabilitar para teste
        forceNew: true,
        secure: true,
        rejectUnauthorized: false,
        extraHeaders: {
            'Origin': window.location.origin
        }
    });
    let testCompleted = false;
    socket.on('connect', () => {
        if (testCompleted)
            return;
        testCompleted = true;
        console.log('✅ [TESTE] Conectado com sucesso ao WebSocket produção!');
        console.log(`🔌 [TESTE] Socket ID: ${socket.id}`);
        // Teste de health check
        fetch(`${productionURL}/webhook/health`)
            .then(response => response.json())
            .then(data => {
            console.log('✅ [TESTE] Health check OK:', data);
            socket.disconnect();
        })
            .catch(error => {
            console.log('❌ [TESTE] Health check falhou:', error);
            socket.disconnect();
        });
    });
    socket.on('connect_error', (error) => {
        if (testCompleted)
            return;
        testCompleted = true;
        console.log('❌ [TESTE] Erro de conexão:', error);
        // Teste HTTP alternativo
        console.log('🔄 [TESTE] Tentando health check direto...');
        fetch(`${productionURL}/webhook/health`)
            .then(response => response.json())
            .then(data => {
            console.log('✅ [TESTE] Health check HTTP OK:', data);
            console.log('⚠️ [TESTE] Servidor OK mas WebSocket bloqueado');
        })
            .catch(error => {
            console.log('❌ [TESTE] Servidor inacessível:', error);
        });
    });
    socket.on('disconnect', () => {
        console.log('🔌 [TESTE] Desconectado do servidor');
    });
    // Timeout de segurança
    setTimeout(() => {
        if (!testCompleted) {
            testCompleted = true;
            console.log('⏰ [TESTE] Timeout - teste finalizado');
            socket.disconnect();
        }
    }, 15000);
};
// 🧪 Função para testar o chat store atual
export const testCurrentChatStore = async () => {
    console.log('\n🧪 ===== TESTE CHAT STORE ATUAL =====\n');
    // Importar dinamicamente o store
    const { useChatStore } = await import('../stores/chatStore');
    const store = useChatStore.getState();
    console.log('🔗 [TESTE] Inicializando chat store...');
    try {
        await store.init();
        console.log('✅ [TESTE] Chat store inicializado com sucesso!');
        console.log('🔌 [TESTE] Status conexão:', store.isConnected);
        console.log('⏳ [TESTE] Status loading:', store.isLoading);
        console.log('❌ [TESTE] Erro:', store.error);
    }
    catch (error) {
        console.log('❌ [TESTE] Erro ao inicializar chat store:', error);
    }
};
// 🧪 Função para debug rápido
export const debugWebSocketConfig = () => {
    console.log('\n🔧 ===== DEBUG CONFIGURAÇÃO WEBSOCKET =====\n');
    console.log('🌐 Frontend URL:', window.location.origin);
    console.log('🌐 Frontend hostname:', window.location.hostname);
    console.log('🌐 Frontend port:', window.location.port);
    console.log('🔗 WebSocket URL configurada: https://websocket.bkcrm.devsible.com.br');
    console.log('🚀 Socket.IO client version:', 'v4');
    // Teste de CORS
    console.log('\n🧪 Testando CORS...');
    fetch('https://websocket.bkcrm.devsible.com.br/webhook/health', {
        method: 'GET',
        headers: {
            'Origin': window.location.origin
        }
    })
        .then(response => {
        console.log('✅ [CORS] Status:', response.status);
        console.log('✅ [CORS] Headers:', response.headers);
        return response.json();
    })
        .then(data => {
        console.log('✅ [CORS] Resposta:', data);
    })
        .catch(error => {
        console.log('❌ [CORS] Erro:', error);
    });
};
// Expor globalmente
if (typeof window !== 'undefined') {
    window.testProductionWebSocket = testProductionWebSocket;
    window.testCurrentChatStore = testCurrentChatStore;
    window.debugWebSocketConfig = debugWebSocketConfig;
    console.log('🧪 Funções de teste disponíveis:');
    console.log('   • testProductionWebSocket() - Testar conexão direta');
    console.log('   • testCurrentChatStore() - Testar chat store atual');
    console.log('   • debugWebSocketConfig() - Debug de configuração');
}
