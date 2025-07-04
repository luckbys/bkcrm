// 🛠️ Script de Diagnóstico: Loading Infinito no Chat
// Executar no console: debugLoadingFix()
export const debugLoadingFix = () => {
    console.log('🔍 [DEBUG] Iniciando diagnóstico do loading infinito...');
    const results = {
        ticket: null,
        currentTicket: null,
        ticketIdForRealtime: null,
        isValid: false,
        loadingState: 'unknown',
        realTimeConfig: null
    };
    try {
        // 1. Simular ticket mock comum
        const mockTicket = {
            id: 123,
            title: 'Teste Loading',
            client: 'Lucas Borges',
            status: 'atendimento',
            channel: 'chat'
        };
        results.ticket = mockTicket;
        console.log('✅ [DEBUG] Mock ticket criado:', mockTicket);
        // 2. Simular currentTicket vazio (problema comum)
        const currentTicketEmpty = {};
        results.currentTicket = currentTicketEmpty;
        console.log('⚠️ [DEBUG] currentTicket vazio (cenário problemático):', currentTicketEmpty);
        // 3. Simular cálculo do ticketIdForRealtime
        const ticketIdForRealtime = (() => {
            try {
                const rawId = currentTicketEmpty?.originalId || currentTicketEmpty?.id;
                if (!rawId) {
                    console.log('⚠️ [DEBUG] Nenhum ID de ticket disponível (currentTicket vazio)');
                    return null;
                }
                const ticketId = rawId.toString();
                console.log('📡 [DEBUG] Usando ticket ID:', ticketId);
                return ticketId;
            }
            catch (error) {
                console.error('❌ [DEBUG] Erro ao processar ticket ID:', error);
                return null;
            }
        })();
        results.ticketIdForRealtime = ticketIdForRealtime;
        console.log('🎯 [DEBUG] ticketIdForRealtime calculado:', ticketIdForRealtime);
        // 4. Validar se seria considerado válido
        const isValidTicketId = (id) => {
            if (!id || typeof id !== 'string')
                return false;
            const trimmedId = id.trim();
            if (trimmedId.length === 0)
                return false;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);
            const isNumeric = /^\d+$/.test(trimmedId);
            return isUUID || isNumeric;
        };
        results.isValid = isValidTicketId(ticketIdForRealtime);
        console.log('🔍 [DEBUG] ID é válido?', results.isValid);
        // 5. Simular configuração do useRealtimeMessages
        const realtimeConfig = {
            ticketId: ticketIdForRealtime,
            pollingInterval: 15000,
            maxRetries: 3,
            enabled: Boolean(mockTicket && ticketIdForRealtime)
        };
        results.realTimeConfig = realtimeConfig;
        console.log('⚙️ [DEBUG] Configuração realtime:', realtimeConfig);
        // 6. Determinar estado de loading esperado
        if (!realtimeConfig.enabled || !results.isValid) {
            results.loadingState = 'should_be_false';
            console.log('✅ [DEBUG] Loading deveria ser FALSE (configuração inválida)');
        }
        else {
            results.loadingState = 'should_handle_properly';
            console.log('🔄 [DEBUG] Loading deveria ser tratado adequadamente');
        }
        // 7. PROBLEMA IDENTIFICADO
        console.log('\n🚨 [PROBLEMA IDENTIFICADO]:');
        console.log('  1. currentTicket está vazio (common issue)');
        console.log('  2. ticketIdForRealtime = null');
        console.log('  3. enabled = false');
        console.log('  4. isValid = false');
        console.log('  5. Loading deveria ser FALSE mas pode estar travado em TRUE');
        // 8. CORREÇÃO IMPLEMENTADA
        console.log('\n✅ [CORREÇÃO IMPLEMENTADA]:');
        console.log('  1. useEffect adicional para garantir isLoading=false quando inválido');
        console.log('  2. setIsLoading(false) em múltiplos pontos de saída');
        console.log('  3. Validação no início do loadMessages()');
        console.log('  4. Validação no useEffect de polling');
        console.log('\n📊 [RESULTADO]:', results);
        return results;
    }
    catch (error) {
        console.error('❌ [DEBUG] Erro durante diagnóstico:', error);
        return { error: error.message, results };
    }
};
// Tornar disponível globalmente para teste
window.debugLoadingFix = debugLoadingFix;
export default debugLoadingFix;
