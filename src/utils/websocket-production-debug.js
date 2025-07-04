// 🔧 Script de Diagnóstico WebSocket Produção
// Executar: diagnoseProductionWebSocket() no console
// 🎯 Função principal de diagnóstico
export async function diagnoseProductionWebSocket() {
    const hostname = window.location.hostname;
    const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
    const expectedUrl = isProduction ? 'https://bkcrm.devsible.com.br' : 'http://localhost:4000';
    console.log('🔍 [WEBSOCKET-DEBUG] Iniciando diagnóstico...');
    console.log('🌐 [WEBSOCKET-DEBUG] Hostname:', hostname);
    console.log('📍 [WEBSOCKET-DEBUG] Ambiente:', isProduction ? 'PRODUÇÃO' : 'LOCAL');
    console.log('🔗 [WEBSOCKET-DEBUG] URL esperada:', expectedUrl);
    const diagnostic = {
        environment: isProduction ? 'production' : 'local',
        hostname,
        expectedUrl,
        actualUrl: expectedUrl,
        isConnected: false,
        connectionTests: {
            healthCheck: false,
            socketIO: false,
            webhook: false
        },
        errors: [],
        recommendations: []
    };
    // 🔍 Teste 1: Health Check
    try {
        console.log('🏥 [WEBSOCKET-DEBUG] Testando health check...');
        const healthUrl = isProduction ? 'https://bkcrm.devsible.com.br/webhook/health' : 'http://localhost:4000/webhook/health';
        const healthResponse = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (healthResponse.ok) {
            const healthData = await healthResponse.text();
            console.log('✅ [WEBSOCKET-DEBUG] Health check OK:', healthData);
            diagnostic.connectionTests.healthCheck = true;
        }
        else {
            throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
        }
    }
    catch (error) {
        console.error('❌ [WEBSOCKET-DEBUG] Health check FALHOU:', error.message);
        diagnostic.errors.push(`Health check falhou: ${error.message}`);
        diagnostic.recommendations.push('Verificar se o servidor WebSocket está rodando na porta 4000');
    }
    // 🔍 Teste 2: Socket.IO endpoint
    try {
        console.log('🔌 [WEBSOCKET-DEBUG] Testando endpoint Socket.IO...');
        const socketUrl = isProduction ? 'https://bkcrm.devsible.com.br/socket.io/' : 'http://localhost:4000/socket.io/';
        const socketResponse = await fetch(socketUrl, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });
        if (socketResponse.status === 400 || socketResponse.status === 200) {
            // Socket.IO normalmente retorna 400 para requests HTTP diretos
            console.log('✅ [WEBSOCKET-DEBUG] Endpoint Socket.IO acessível');
            diagnostic.connectionTests.socketIO = true;
        }
        else {
            throw new Error(`HTTP ${socketResponse.status}: ${socketResponse.statusText}`);
        }
    }
    catch (error) {
        console.error('❌ [WEBSOCKET-DEBUG] Endpoint Socket.IO FALHOU:', error.message);
        diagnostic.errors.push(`Socket.IO endpoint falhou: ${error.message}`);
        if (isProduction) {
            diagnostic.recommendations.push('Configurar proxy nginx para /socket.io/');
        }
    }
    // 🔍 Teste 3: Webhook endpoint
    try {
        console.log('🌐 [WEBSOCKET-DEBUG] Testando webhook endpoint...');
        const webhookUrl = isProduction ? 'https://bkcrm.devsible.com.br/webhook/evolution' : 'http://localhost:4000/webhook/evolution';
        const webhookResponse = await fetch(webhookUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (webhookResponse.ok || webhookResponse.status === 405) {
            // 405 é normal para GET em endpoint POST
            console.log('✅ [WEBSOCKET-DEBUG] Webhook endpoint acessível');
            diagnostic.connectionTests.webhook = true;
        }
        else {
            throw new Error(`HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`);
        }
    }
    catch (error) {
        console.error('❌ [WEBSOCKET-DEBUG] Webhook endpoint FALHOU:', error.message);
        diagnostic.errors.push(`Webhook endpoint falhou: ${error.message}`);
        if (isProduction) {
            diagnostic.recommendations.push('Verificar configuração nginx para /webhook/');
        }
    }
    // 🔍 Teste 4: Conectividade WebSocket real
    try {
        console.log('🚀 [WEBSOCKET-DEBUG] Testando conexão WebSocket real...');
        const { io } = await import('socket.io-client');
        const testSocket = io(expectedUrl, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            autoConnect: false,
            forceNew: true
        });
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                testSocket.disconnect();
                reject(new Error('Timeout de conexão (10s)'));
            }, 10000);
            testSocket.on('connect', () => {
                console.log('✅ [WEBSOCKET-DEBUG] Conexão WebSocket SUCESSO!');
                clearTimeout(timeout);
                diagnostic.isConnected = true;
                testSocket.disconnect();
                resolve();
            });
            testSocket.on('connect_error', (error) => {
                console.error('❌ [WEBSOCKET-DEBUG] Erro de conexão WebSocket:', error);
                clearTimeout(timeout);
                testSocket.disconnect();
                reject(error);
            });
            testSocket.connect();
        });
    }
    catch (error) {
        console.error('❌ [WEBSOCKET-DEBUG] Conexão WebSocket FALHOU:', error.message);
        diagnostic.errors.push(`Conexão WebSocket falhou: ${error.message}`);
        if (isProduction) {
            diagnostic.recommendations.push('Verificar configuração de proxy WebSocket no nginx');
            diagnostic.recommendations.push('Verificar se o servidor está rodando na porta 4000');
            diagnostic.recommendations.push('Verificar configuração SSL/TLS');
        }
    }
    // 📊 Resultado final
    console.log('📊 [WEBSOCKET-DEBUG] === RESULTADO DO DIAGNÓSTICO ===');
    console.table(diagnostic.connectionTests);
    if (diagnostic.errors.length > 0) {
        console.error('❌ [WEBSOCKET-DEBUG] ERROS ENCONTRADOS:');
        diagnostic.errors.forEach((error, i) => console.error(`${i + 1}. ${error}`));
    }
    if (diagnostic.recommendations.length > 0) {
        console.warn('💡 [WEBSOCKET-DEBUG] RECOMENDAÇÕES:');
        diagnostic.recommendations.forEach((rec, i) => console.warn(`${i + 1}. ${rec}`));
    }
    if (diagnostic.isConnected) {
        console.log('🎉 [WEBSOCKET-DEBUG] DIAGNÓSTICO: WebSocket funcionando corretamente!');
    }
    else {
        console.error('🚨 [WEBSOCKET-DEBUG] DIAGNÓSTICO: WebSocket com problemas de conectividade!');
    }
    return diagnostic;
}
// 🎯 Teste rápido de conectividade
export async function quickWebSocketTest() {
    const hostname = window.location.hostname;
    const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
    const testUrl = isProduction ? 'https://bkcrm.devsible.com.br' : 'http://localhost:4000';
    try {
        const { io } = await import('socket.io-client');
        const testSocket = io(testUrl, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
            autoConnect: false,
            forceNew: true
        });
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                testSocket.disconnect();
                resolve(false);
            }, 5000);
            testSocket.on('connect', () => {
                clearTimeout(timeout);
                testSocket.disconnect();
                resolve(true);
            });
            testSocket.on('connect_error', () => {
                clearTimeout(timeout);
                testSocket.disconnect();
                resolve(false);
            });
            testSocket.connect();
        });
    }
    catch (error) {
        return false;
    }
}
// 🌐 Expor funções globalmente para debug no console
if (typeof window !== 'undefined') {
    window.diagnoseProductionWebSocket = diagnoseProductionWebSocket;
    window.quickWebSocketTest = quickWebSocketTest;
    console.log('🔧 [WEBSOCKET-DEBUG] Funções de debug disponíveis:');
    console.log('📊 diagnoseProductionWebSocket() - Diagnóstico completo');
    console.log('⚡ quickWebSocketTest() - Teste rápido de conectividade');
}
