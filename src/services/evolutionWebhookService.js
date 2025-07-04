import axios from 'axios';
// Configurações do cliente API
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evochat.devsible.com.br';
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const apiClient = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});
/**
 * Verificar se a instância existe
 */
export const checkInstanceExists = async (instanceName) => {
    try {
        console.log(`🔍 Verificando se a instância ${instanceName} existe...`);
        // Usar endpoint correto para verificar estado da conexão
        const response = await apiClient.get(`instance/connectionState/${instanceName}`);
        if (response.data) {
            console.log(`✅ Instância ${instanceName} encontrada:`, response.data);
            return { exists: true };
        }
        return { exists: false, error: 'Instância não encontrada' };
    }
    catch (error) {
        console.warn(`⚠️ Instância ${instanceName} não encontrada:`, error.response?.status);
        return {
            exists: false,
            error: error.response?.status === 404 ? `Instância "${instanceName}" não existe na Evolution API` : 'Erro ao verificar instância'
        };
    }
};
/**
 * Configurar webhook para uma instância
 */
export const setInstanceWebhook = async (instanceName, webhookData) => {
    try {
        console.log(`🔗 Configurando webhook para instância: ${instanceName}`);
        console.log('📡 Dados do webhook:', webhookData);
        // Verificar se a instância existe primeiro (opcional)
        try {
            const instanceCheck = await checkInstanceExists(instanceName);
            if (!instanceCheck.exists) {
                console.warn(`⚠️ Instância ${instanceName} pode não existir, mas tentando configurar webhook mesmo assim`);
            }
            else {
                console.log(`✅ Instância ${instanceName} confirmada como existente`);
            }
        }
        catch (error) {
            console.warn(`⚠️ Não foi possível verificar a instância ${instanceName}, mas continuando com a configuração do webhook`);
        }
        // Validar eventos antes de enviar - usar apenas eventos essenciais por padrão
        const eventsToSend = webhookData.events && webhookData.events.length > 0
            ? webhookData.events
            : getRecommendedEvents();
        const eventValidation = validateEvents(eventsToSend);
        if (!eventValidation.valid) {
            console.error('❌ Eventos inválidos detectados:', eventValidation.invalidEvents);
            return {
                success: false,
                error: `Eventos inválidos: ${eventValidation.invalidEvents.join(', ')}. Use apenas eventos válidos da Evolution API.`
            };
        }
        // Payload seguindo a documentação oficial da Evolution API
        const payload = {
            url: webhookData.url,
            enabled: webhookData.enabled !== undefined ? webhookData.enabled : true,
            webhook_by_events: true,
            webhook_base64: true,
            events: eventsToSend
        };
        // Validar se a URL não está vazia
        if (!payload.url || !payload.url.trim()) {
            return {
                success: false,
                error: 'URL do webhook é obrigatória'
            };
        }
        console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));
        console.log('🌐 URL da requisição:', `${EVOLUTION_API_URL}/webhook/set/${instanceName}`);
        // Usar POST conforme documentação (não PUT)
        // Correção: remover barra inicial para evitar URL dupla
        const response = await apiClient.post(`webhook/set/${instanceName}`, payload);
        if (response.data) {
            console.log('✅ Webhook configurado com sucesso:', response.data);
            return {
                success: true,
                message: 'Webhook configurado com sucesso'
            };
        }
        return {
            success: false,
            error: 'Resposta inesperada da API'
        };
    }
    catch (error) {
        console.error('❌ Erro ao configurar webhook:', error);
        console.error('📋 Detalhes do erro:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            headers: error.config?.headers
        });
        let errorMessage = 'Erro desconhecido ao configurar webhook';
        if (error.response?.status === 400) {
            const details = error.response?.data;
            console.error('🔍 Erro 400 - Detalhes da validação:', details);
            if (details?.message) {
                errorMessage = `Erro de validação: ${details.message}`;
            }
            else if (details?.error) {
                errorMessage = `Erro de validação: ${details.error}`;
            }
            else if (typeof details === 'string') {
                errorMessage = `Erro de validação: ${details}`;
            }
            else {
                errorMessage = 'Erro de validação nos dados do webhook. Verifique a URL e os eventos selecionados.';
            }
        }
        else if (error.response?.status === 404) {
            errorMessage = `Instância "${instanceName}" não encontrada. Verifique se a instância existe e está ativa.`;
        }
        else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        return {
            success: false,
            error: errorMessage
        };
    }
};
/**
 * Obter configuração atual do webhook
 */
export const getInstanceWebhook = async (instanceName) => {
    try {
        console.log(`📡 Obtendo configuração de webhook: ${instanceName}`);
        const response = await apiClient.get(`webhook/find/${instanceName}`);
        if (response.data) {
            console.log('✅ Webhook obtido:', response.data);
            return {
                success: true,
                webhook: {
                    url: response.data.url || '',
                    enabled: response.data.enabled ?? false,
                    events: response.data.events || []
                }
            };
        }
        return {
            success: false,
            error: 'Webhook não configurado'
        };
    }
    catch (error) {
        console.error('❌ Erro ao obter webhook:', error);
        // Se for 404, significa que não tem webhook configurado
        if (error.response?.status === 404) {
            return {
                success: true,
                webhook: {
                    url: '',
                    enabled: false,
                    events: []
                }
            };
        }
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Erro ao obter webhook'
        };
    }
};
/**
 * Remover webhook da instância
 */
export const removeInstanceWebhook = async (instanceName) => {
    try {
        console.log(`🗑️ Removendo webhook da instância: ${instanceName}`);
        const response = await apiClient.delete(`webhook/remove/${instanceName}`);
        console.log('✅ Webhook removido com sucesso');
        return {
            success: true,
            message: 'Webhook removido com sucesso'
        };
    }
    catch (error) {
        console.error('❌ Erro ao remover webhook:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Erro ao remover webhook'
        };
    }
};
/**
 * Testar webhook (verificar se está configurado e ativo)
 */
export const testInstanceWebhook = async (instanceName) => {
    try {
        console.log(`🧪 Testando webhook da instância: ${instanceName}`);
        // Verificar se o webhook está configurado
        const webhookInfo = await getInstanceWebhook(instanceName);
        if (webhookInfo.success && webhookInfo.webhook?.enabled && webhookInfo.webhook?.url) {
            console.log('✅ Webhook configurado e ativo');
            return {
                success: true,
                message: `Webhook ativo: ${webhookInfo.webhook.url}`
            };
        }
        else {
            return {
                success: false,
                error: 'Webhook não está configurado ou não está ativo'
            };
        }
    }
    catch (error) {
        console.error('❌ Erro ao testar webhook:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Erro ao testar webhook'
        };
    }
};
/**
 * Validar URL de webhook
 */
export const validateWebhookUrl = (url) => {
    try {
        const urlObj = new URL(url);
        // Verificar se é HTTPS (recomendado para produção)
        if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
            return {
                valid: false,
                error: 'URL deve usar protocolo HTTP ou HTTPS'
            };
        }
        // Verificar se não é localhost em produção
        if (process.env.NODE_ENV === 'production' &&
            (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
            return {
                valid: false,
                error: 'URLs localhost não funcionam em produção'
            };
        }
        // Verificar se tem um path válido
        if (!urlObj.pathname || urlObj.pathname === '/') {
            return {
                valid: false,
                error: 'URL deve ter um caminho específico (ex: /api/webhooks/evolution)'
            };
        }
        return { valid: true };
    }
    catch (error) {
        return {
            valid: false,
            error: 'URL inválida'
        };
    }
};
/**
 * Gerar URL de webhook sugerida baseada no domínio atual
 */
export const generateSuggestedWebhookUrl = () => {
    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;
        const portSuffix = port && port !== '80' && port !== '443' ? `:${port}` : '';
        return `${protocol}//${hostname}${portSuffix}/api/webhooks/evolution`;
    }
    // Fallback para ambiente de desenvolvimento
    return 'https://seu-dominio.com/api/webhooks/evolution';
};
/**
 * Lista completa de eventos válidos na Evolution API
 * Baseado na documentação oficial v2
 */
export const getValidEvolutionEvents = () => {
    return [
        // Eventos de sistema
        'APPLICATION_STARTUP',
        'QRCODE_UPDATED',
        'CONNECTION_UPDATE',
        // Eventos de mensagens
        'MESSAGES_SET',
        'MESSAGES_UPSERT',
        'MESSAGES_EDITED',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        // Eventos de contatos
        'CONTACTS_SET',
        'CONTACTS_UPSERT',
        'CONTACTS_UPDATE',
        // Eventos de presença
        'PRESENCE_UPDATE',
        // Eventos de chats
        'CHATS_SET',
        'CHATS_UPSERT',
        'CHATS_UPDATE',
        'CHATS_DELETE',
        // Eventos de grupos
        'GROUPS_UPSERT',
        'GROUPS_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
        // Eventos de labels
        'LABELS_EDIT',
        'LABELS_ASSOCIATION',
        // Eventos de chamadas
        'CALL',
        // Eventos de typebot
        'TYPEBOT_START',
        'TYPEBOT_CHANGE_STATUS',
        // Eventos de instância
        'NEW_TOKEN', // Adicionado conforme documentação
        'REMOVE_INSTANCE',
        'LOGOUT_INSTANCE'
    ];
};
/**
 * Validar se os eventos são válidos na Evolution API
 */
export const validateEvents = (events) => {
    const validEvents = getValidEvolutionEvents();
    const invalidEvents = events.filter(event => !validEvents.includes(event));
    return {
        valid: invalidEvents.length === 0,
        invalidEvents
    };
};
/**
 * Eventos padrão recomendados para o sistema de tickets
 * APENAS eventos essenciais e válidos confirmados pela Evolution API
 */
export const getRecommendedEvents = () => {
    return [
        'MESSAGES_UPSERT', // Mensagens recebidas/enviadas (OBRIGATÓRIO)
        'CONNECTION_UPDATE', // Status de conexão WhatsApp (OBRIGATÓRIO)
        'QRCODE_UPDATED' // QR Code atualizado (RECOMENDADO)
    ];
};
/**
 * Debug - Testar conexão com Evolution API
 */
export const testEvolutionApiConnection = async () => {
    try {
        console.log('🧪 Testando conexão com Evolution API...');
        console.log('🌐 URL Base:', EVOLUTION_API_URL);
        console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Não configurada');
        // Tentar obter informações básicas da API
        const response = await apiClient.get('');
        console.log('✅ Conexão com Evolution API estabelecida:', response.data);
        return {
            success: true,
            message: 'Conexão com Evolution API funcionando'
        };
    }
    catch (error) {
        console.error('❌ Erro na conexão com Evolution API:', error);
        return {
            success: false,
            error: `Erro de conexão: ${error.message}`
        };
    }
};
/**
 * Obter descrição de um evento de webhook
 * Baseado na lista oficial de eventos da Evolution API
 */
export const getEventDescription = (event) => {
    const descriptions = {
        // Eventos de mensagens
        'MESSAGES_UPSERT': 'Mensagens recebidas e enviadas',
        'MESSAGES_UPDATE': 'Atualizações de status de mensagens',
        'MESSAGES_EDITED': 'Mensagens editadas',
        'MESSAGES_DELETE': 'Mensagens deletadas',
        'MESSAGES_SET': 'Conjunto de mensagens',
        'SEND_MESSAGE': 'Confirmação de envio de mensagens',
        // Eventos de conexão
        'CONNECTION_UPDATE': 'Mudanças no status de conexão',
        'QRCODE_UPDATED': 'QR Code atualizado',
        'APPLICATION_STARTUP': 'Inicialização da aplicação',
        // Eventos de contatos
        'CONTACTS_SET': 'Conjunto de contatos',
        'CONTACTS_UPSERT': 'Contatos criados/atualizados',
        'CONTACTS_UPDATE': 'Atualização de contatos',
        // Eventos de chats
        'CHATS_SET': 'Conjunto de conversas',
        'CHATS_UPSERT': 'Conversas criadas/atualizadas',
        'CHATS_UPDATE': 'Atualização de conversas',
        'CHATS_DELETE': 'Conversas deletadas',
        // Eventos de grupos
        'GROUPS_UPSERT': 'Grupos criados/atualizados',
        'GROUPS_UPDATE': 'Atualização de grupos',
        'GROUP_PARTICIPANTS_UPDATE': 'Participantes do grupo atualizados',
        // Eventos de presença e status
        'PRESENCE_UPDATE': 'Atualização de presença (online/offline)',
        // Eventos de labels
        'LABELS_EDIT': 'Edição de labels',
        'LABELS_ASSOCIATION': 'Associação de labels',
        // Eventos de chamadas
        'CALL': 'Chamadas de voz/vídeo',
        // Eventos de typebot
        'TYPEBOT_START': 'Início do typebot',
        'TYPEBOT_CHANGE_STATUS': 'Mudança de status do typebot',
        // Eventos de instância
        'REMOVE_INSTANCE': 'Remoção de instância',
        'LOGOUT_INSTANCE': 'Logout da instância'
    };
    return descriptions[event] || 'Evento não documentado';
};
/**
 * Função de debug avançado para testar configuração de webhook
 */
export const debugWebhookConfiguration = async (instanceName, url) => {
    try {
        console.log(`🔧 [DEBUG] Testando configuração completa para ${instanceName}`);
        // 1. Verificar se a instância existe
        console.log('1️⃣ Verificando instância...');
        const instanceCheck = await checkInstanceExists(instanceName);
        console.log('📋 Resultado da verificação:', instanceCheck);
        // 2. Verificar webhook atual
        console.log('2️⃣ Verificando webhook atual...');
        const currentWebhook = await getInstanceWebhook(instanceName);
        console.log('📋 Webhook atual:', currentWebhook);
        // 3. Testar URL fornecida
        console.log('3️⃣ Validando nova URL...');
        const urlValidation = validateWebhookUrl(url);
        console.log('📋 Validação da URL:', urlValidation);
        // 4. Tentar configurar webhook com logs detalhados
        console.log('4️⃣ Tentando configurar webhook...');
        const setResult = await setInstanceWebhook(instanceName, {
            url: url,
            enabled: true,
            events: getRecommendedEvents()
        });
        console.log('📋 Resultado da configuração:', setResult);
        // 5. Verificar webhook após configuração
        console.log('5️⃣ Verificando webhook após configuração...');
        const newWebhook = await getInstanceWebhook(instanceName);
        console.log('📋 Webhook depois da configuração:', newWebhook);
        return {
            success: setResult.success,
            details: {
                instanceExists: instanceCheck.exists,
                currentWebhook: currentWebhook.webhook,
                urlValid: urlValidation.valid,
                configurationResult: setResult,
                newWebhookConfig: newWebhook.webhook
            },
            error: setResult.error
        };
    }
    catch (error) {
        console.error('❌ [DEBUG] Erro no teste completo:', error);
        return {
            success: false,
            details: {},
            error: error.message || 'Erro no debug'
        };
    }
};
// Export do serviço
export const evolutionWebhookService = {
    setInstanceWebhook,
    getInstanceWebhook,
    removeInstanceWebhook,
    testInstanceWebhook,
    validateWebhookUrl,
    generateSuggestedWebhookUrl,
    getRecommendedEvents,
    getEventDescription,
    debugWebhookConfiguration,
    checkInstanceExists,
    getValidEvolutionEvents,
    validateEvents
};
export default evolutionWebhookService;
/**
 * Comando para teste rápido de webhook via console
 * Para usar no DevTools: testWebhookFix()
 */
window.testWebhookFix = async () => {
    try {
        console.log('🧪 Iniciando teste de correção de webhook...');
        const testInstance = 'atendimento-ao-cliente-suporte-n1';
        const testUrl = 'https://press-n8n.jhkbgs.easypanel.host/webhook/res';
        console.log('📋 Instância de teste:', testInstance);
        console.log('📋 URL de teste:', testUrl);
        const result = await debugWebhookConfiguration(testInstance, testUrl);
        if (result.success) {
            console.log('✅ Teste de webhook bem-sucedido!');
            console.log('📊 Detalhes:', result.details);
        }
        else {
            console.error('❌ Teste de webhook falhou:', result.error);
            console.log('📊 Detalhes:', result.details);
        }
        return result;
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
        return { success: false, error: 'Erro no teste de webhook' };
    }
};
