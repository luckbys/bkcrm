// 🔧 TESTE CONEXÃO WEBSOCKET FINAL
// Diagnóstico completo da conexão entre frontend e backend

console.log('🚀 === INICIANDO TESTE WEBSOCKET COMPLETO ===');

// 1. TESTE DE SERVIDOR
async function testarServidor() {
    console.log('\n📡 1. TESTANDO SERVIDOR WEBSOCKET...');
    
    try {
        const response = await fetch('http://localhost:4000/webhook/health');
        const data = await response.json();
        console.log('✅ Servidor WebSocket ativo:', data);
        
        if (data.websocket?.enabled) {
            console.log(`📊 Conexões ativas: ${data.websocket.connections}`);
            console.log(`🎫 Tickets ativos: ${data.websocket.activeTickets}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Servidor WebSocket não responde:', error.message);
        return false;
    }
}

// 2. TESTE DE CONEXÃO SOCKET.IO
async function testarConexaoSocketIO() {
    console.log('\n🔌 2. TESTANDO CONEXÃO SOCKET.IO...');
    
    return new Promise((resolve) => {
        try {
            // Importar Socket.IO do store
            const { chatStore } = window;
            
            if (!chatStore) {
                console.error('❌ ChatStore não encontrado no window');
                console.log('💡 Certifique-se de que o modal de chat está aberto');
                resolve(false);
                return;
            }
            
            const socket = chatStore.getState().socket;
            
            if (!socket) {
                console.error('❌ Socket não encontrado no chatStore');
                resolve(false);
                return;
            }
            
            console.log('🔍 Socket encontrado:', {
                connected: socket.connected,
                id: socket.id,
                transport: socket.io?.engine?.transport?.name
            });
            
            if (socket.connected) {
                console.log('✅ Socket já conectado!');
                resolve(true);
            } else {
                console.log('🔄 Tentando reconectar...');
                
                socket.on('connect', () => {
                    console.log('✅ Socket conectado com sucesso!');
                    console.log('📋 Socket ID:', socket.id);
                    resolve(true);
                });
                
                socket.on('connect_error', (error) => {
                    console.error('❌ Erro de conexão Socket.IO:', error.message);
                    resolve(false);
                });
                
                // Forçar reconexão
                socket.connect();
                
                // Timeout após 10 segundos
                setTimeout(() => {
                    if (!socket.connected) {
                        console.error('❌ Timeout na conexão Socket.IO');
                        resolve(false);
                    }
                }, 10000);
            }
            
        } catch (error) {
            console.error('❌ Erro ao testar Socket.IO:', error);
            resolve(false);
        }
    });
}

// 3. FORÇA RECONEXÃO
function forcarReconexao() {
    console.log('🔄 FORÇANDO RECONEXÃO WEBSOCKET...');
    
    const { chatStore } = window;
    if (!chatStore) {
        console.error('❌ ChatStore não encontrado');
        return;
    }
    
    const state = chatStore.getState();
    const socket = state.socket;
    
    if (socket) {
        console.log('🔌 Desconectando socket atual...');
        socket.disconnect();
        
        setTimeout(() => {
            console.log('🔌 Reconectando socket...');
            socket.connect();
            
            socket.on('connect', () => {
                console.log('✅ Socket reconectado com sucesso!');
                console.log('📋 Novo Socket ID:', socket.id);
                
                // Rejoin no ticket
                const ticketId = state.ticketId;
                if (ticketId) {
                    console.log(`🎫 Rejoining ticket: ${ticketId}`);
                    socket.emit('join-ticket', { ticketId });
                }
            });
        }, 1000);
    }
}

// 4. TESTE COMPLETO
async function testeCompleto() {
    console.log('🎯 === EXECUTANDO TESTE COMPLETO ===\n');
    
    const servidorOk = await testarServidor();
    if (!servidorOk) {
        console.log('\n❌ FALHA: Servidor não está rodando');
        console.log('💡 Execute: node webhook-evolution-websocket.js');
        return;
    }
    
    const socketOk = await testarConexaoSocketIO();
    if (!socketOk) {
        console.log('\n❌ FALHA: Socket.IO não conectou');
        console.log('💡 Tente executar: forcarReconexao()');
        return;
    }
    
    console.log('\n🎯 === TESTE CONCLUÍDO ===');
    console.log('✅ Sistema funcionando! Agora teste enviar uma mensagem.');
}

// Expor funções globalmente
window.testarServidor = testarServidor;
window.testarConexaoSocketIO = testarConexaoSocketIO;
window.testeCompleto = testeCompleto;
window.forcarReconexao = forcarReconexao;

console.log('🛠️ === FUNÇÕES DISPONÍVEIS ===');
console.log('   testeCompleto() - Executa todos os testes');
console.log('   forcarReconexao() - Força reconexão WebSocket');
console.log('\n🎯 Para começar, execute: testeCompleto()');
