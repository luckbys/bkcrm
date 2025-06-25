console.log('🚀 TESTE WEBSOCKET SIMPLES - CARREGADO!');

// 1. TESTAR SERVIDOR
async function testarServidor() {
    console.log('\n📡 TESTANDO SERVIDOR...');
    try {
        const response = await fetch('http://localhost:4000/webhook/health');
        const data = await response.json();
        console.log('✅ Servidor ativo:', data);
        return true;
    } catch (error) {
        console.error('❌ Servidor erro:', error.message);
        return false;
    }
}

// 2. VERIFICAR SOCKET
function verificarSocket() {
    console.log('\n🔌 VERIFICANDO SOCKET...');
    
    const { chatStore } = window;
    if (!chatStore) {
        console.error('❌ ChatStore não encontrado');
        console.log('💡 Abra o chat primeiro!');
        return false;
    }
    
    const socket = chatStore.getState().socket;
    if (!socket) {
        console.error('❌ Socket não encontrado');
        return false;
    }
    
    console.log('🔍 Socket status:', {
        connected: socket.connected,
        id: socket.id
    });
    
    return socket.connected;
}

// 3. FORÇAR RECONEXÃO
function reconectar() {
    console.log('\n🔄 RECONECTANDO...');
    
    const { chatStore } = window;
    if (!chatStore) {
        console.error('❌ ChatStore não encontrado');
        return;
    }
    
    const socket = chatStore.getState().socket;
    if (!socket) {
        console.error('❌ Socket não encontrado');
        return;
    }
    
    console.log('🔌 Desconectando...');
    socket.disconnect();
    
    setTimeout(() => {
        console.log('🔌 Reconectando...');
        socket.connect();
        
        socket.on('connect', () => {
            console.log('✅ Reconectado! ID:', socket.id);
            
            // Rejoin no ticket
            const ticketId = '788a5f10-a693-4cfa-8410-ed5cd082e555';
            console.log('🎫 Entrando no ticket:', ticketId);
            socket.emit('join-ticket', { ticketId });
        });
    }, 1000);
}

// 4. TESTE COMPLETO
async function testeCompleto() {
    console.log('🎯 === EXECUTANDO TESTE COMPLETO ===');
    
    const servidorOk = await testarServidor();
    if (!servidorOk) {
        console.log('❌ FALHA: Servidor não responde');
        return;
    }
    
    const socketOk = verificarSocket();
    if (!socketOk) {
        console.log('❌ FALHA: Socket desconectado');
        console.log('💡 Execute: reconectar()');
        return;
    }
    
    console.log('✅ SISTEMA FUNCIONANDO!');
    console.log('📋 Agora teste enviar uma mensagem no WhatsApp');
}

// Expor funções globalmente
window.testarServidor = testarServidor;
window.verificarSocket = verificarSocket;
window.reconectar = reconectar;
window.testeCompleto = testeCompleto;

console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('   testeCompleto() - Teste geral');
console.log('   reconectar() - Força reconexão');
console.log('\n🎯 Execute: testeCompleto()'); 