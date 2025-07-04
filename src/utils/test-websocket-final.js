// 🎯 Teste Final WebSocket - Validação Completa do Sistema
// Executar: testWebSocketFinal() no console
export async function testWebSocketFinal() {
    console.log('🚀 [TESTE-FINAL] Iniciando validação completa do sistema...');
    console.log('==================================================');
    const checks = [];
    // 🔍 1. Verificar configurações de ambiente
    console.log('🔧 [TESTE-FINAL] 1. Verificando configurações...');
    const hostname = window.location.hostname;
    const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
    const expectedUrl = isProduction ? 'https://bkcrm.devsible.com.br' : 'http://localhost:4000';
    checks.push({
        component: 'Ambiente',
        status: 'success',
        message: `Detectado: ${isProduction ? 'PRODUÇÃO' : 'LOCAL'}`,
        details: { hostname, expectedUrl }
    });
    // 🔍 2. Verificar imports necessários
    console.log('📦 [TESTE-FINAL] 2. Verificando imports...');
    try {
        const { io } = await import('socket.io-client');
        checks.push({
            component: 'Socket.IO Client',
            status: 'success',
            message: 'Library carregada com sucesso'
        });
    }
    catch (error) {
        checks.push({
            component: 'Socket.IO Client',
            status: 'error',
            message: `Erro ao carregar library: ${error.message}`
        });
    }
    // 🔍 3. Verificar store do chat
    console.log('🗃️ [TESTE-FINAL] 3. Verificando ChatStore...');
    try {
        const { useChatStore } = await import('../stores/chatStore');
        const chatState = useChatStore.getState();
        checks.push({
            component: 'ChatStore',
            status: 'success',
            message: 'Store acessível',
            details: {
                isConnected: chatState.isConnected,
                isLoading: chatState.isLoading,
                hasSocket: !!chatState.socket
            }
        });
    }
    catch (error) {
        checks.push({
            component: 'ChatStore',
            status: 'error',
            message: `Erro ao acessar store: ${error.message}`
        });
    }
    // 🔍 4. Teste de conectividade básica
    console.log('🌐 [TESTE-FINAL] 4. Testando conectividade básica...');
    if (isProduction) {
        // Teste de produção
        try {
            const healthResponse = await fetch('https://bkcrm.devsible.com.br/webhook/health', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (healthResponse.ok) {
                checks.push({
                    component: 'Health Check Produção',
                    status: 'success',
                    message: 'Servidor WebSocket acessível'
                });
            }
            else {
                checks.push({
                    component: 'Health Check Produção',
                    status: 'warning',
                    message: `Servidor retornou ${healthResponse.status}`
                });
            }
        }
        catch (error) {
            checks.push({
                component: 'Health Check Produção',
                status: 'error',
                message: `Conexão falhou: ${error.message}`
            });
        }
    }
    else {
        // Teste local
        try {
            const healthResponse = await fetch('http://localhost:4000/webhook/health', {
                method: 'GET'
            });
            if (healthResponse.ok) {
                checks.push({
                    component: 'Health Check Local',
                    status: 'success',
                    message: 'Servidor WebSocket local ativo'
                });
            }
            else {
                checks.push({
                    component: 'Health Check Local',
                    status: 'warning',
                    message: `Servidor local retornou ${healthResponse.status}`
                });
            }
        }
        catch (error) {
            checks.push({
                component: 'Health Check Local',
                status: 'error',
                message: 'Servidor WebSocket local não está rodando na porta 4000'
            });
        }
    }
    // 🔍 5. Teste de conexão WebSocket real
    console.log('🔌 [TESTE-FINAL] 5. Testando conexão WebSocket...');
    try {
        const { io } = await import('socket.io-client');
        const testSocket = io(expectedUrl, {
            transports: ['websocket', 'polling'],
            timeout: 8000,
            autoConnect: false,
            forceNew: true
        });
        const connectionResult = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                testSocket.disconnect();
                resolve(false);
            }, 8000);
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
        if (connectionResult) {
            checks.push({
                component: 'Conexão WebSocket',
                status: 'success',
                message: 'Conexão estabelecida com sucesso'
            });
        }
        else {
            checks.push({
                component: 'Conexão WebSocket',
                status: 'error',
                message: 'Falha ao conectar com WebSocket'
            });
        }
    }
    catch (error) {
        checks.push({
            component: 'Conexão WebSocket',
            status: 'error',
            message: `Erro na conexão: ${error.message}`
        });
    }
    // 🔍 6. Verificar funções de diagnóstico disponíveis
    console.log('🛠️ [TESTE-FINAL] 6. Verificando ferramentas de diagnóstico...');
    const diagnosticFunctions = [
        'diagnoseProductionWebSocket',
        'quickWebSocketTest'
    ];
    const availableFunctions = diagnosticFunctions.filter(fn => typeof window[fn] === 'function');
    if (availableFunctions.length === diagnosticFunctions.length) {
        checks.push({
            component: 'Ferramentas Diagnóstico',
            status: 'success',
            message: `${availableFunctions.length} funções disponíveis`,
            details: availableFunctions
        });
    }
    else {
        checks.push({
            component: 'Ferramentas Diagnóstico',
            status: 'warning',
            message: `${availableFunctions.length}/${diagnosticFunctions.length} funções disponíveis`
        });
    }
    // 📊 Exibir resultados
    console.log('\n📊 [TESTE-FINAL] === RESULTADO DA VALIDAÇÃO ===');
    console.log('==================================================');
    const successCount = checks.filter(c => c.status === 'success').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const errorCount = checks.filter(c => c.status === 'error').length;
    checks.forEach(check => {
        const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${check.component}: ${check.message}`);
        if (check.details) {
            console.log(`   Details:`, check.details);
        }
    });
    console.log('==================================================');
    console.log(`📈 [TESTE-FINAL] Resumo: ${successCount} ✅ | ${warningCount} ⚠️ | ${errorCount} ❌`);
    // 🎯 Diagnóstico final
    if (errorCount === 0) {
        console.log('🎉 [TESTE-FINAL] SISTEMA TOTALMENTE FUNCIONAL!');
        console.log('✅ Pronto para usar em produção');
    }
    else if (errorCount <= 2 && successCount >= 4) {
        console.log('⚠️ [TESTE-FINAL] SISTEMA FUNCIONAL COM RESSALVAS');
        console.log('💡 Verificar problemas identificados');
    }
    else {
        console.log('🚨 [TESTE-FINAL] SISTEMA COM PROBLEMAS CRÍTICOS');
        console.log('🔧 Correções necessárias antes do uso');
    }
    // 🎯 Próximos passos baseados no ambiente
    console.log('\n🎯 [TESTE-FINAL] PRÓXIMOS PASSOS:');
    if (isProduction) {
        console.log('🌐 PRODUÇÃO:');
        console.log('1. Execute: diagnoseProductionWebSocket() para diagnóstico detalhado');
        console.log('2. Verifique se servidor WebSocket está rodando na porta 4000');
        console.log('3. Configure proxy nginx para /socket.io/');
        console.log('4. Monitore logs: sudo tail -f /var/log/nginx/bkcrm.error.log');
    }
    else {
        console.log('🏠 LOCAL:');
        console.log('1. Certifique-se que webhook está rodando: node webhook-evolution-websocket.cjs');
        console.log('2. Abra o chat e verifique indicador "Online"');
        console.log('3. Teste envio de mensagens');
        console.log('4. Use quickWebSocketTest() para teste rápido');
    }
    console.log('\n🔧 [TESTE-FINAL] Ferramentas disponíveis:');
    console.log('📊 testWebSocketFinal() - Este teste completo');
    console.log('🔍 diagnoseProductionWebSocket() - Diagnóstico produção');
    console.log('⚡ quickWebSocketTest() - Teste rápido');
}
// 🌐 Expor função globalmente
if (typeof window !== 'undefined') {
    window.testWebSocketFinal = testWebSocketFinal;
    console.log('🎯 [TESTE-FINAL] Função de teste final disponível: testWebSocketFinal()');
}
