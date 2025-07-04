import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
export const useRealtimeMessages = (options) => {
    const { toast } = useToast();
    const { ticketId, pollingInterval = 10000, // Aumentado para 10 segundos para reduzir carga
    maxRetries = 3, enabled = true } = options;
    // Estados principais
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [retryCount, setRetryCount] = useState(0);
    // Refs para controle crítico
    const pollingIntervalRef = useRef(null);
    const mountedRef = useRef(true);
    const lastMessageCountRef = useRef(0);
    const lastTicketIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const retryTimeoutRef = useRef(null);
    const lastSuccessfulFetchRef = useRef(null);
    // ✅ CORREÇÃO 1: Validação rigorosa de ticket ID
    const isValidTicketId = useCallback((id) => {
        if (!id || typeof id !== 'string')
            return false;
        const trimmedId = id.trim();
        if (trimmedId.length === 0)
            return false;
        // Aceitar apenas UUIDs válidos ou IDs numéricos
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);
        const isNumeric = /^\d+$/.test(trimmedId);
        return isUUID || isNumeric;
    }, []);
    // 🚀 CORREÇÃO: Garantir que loading seja false quando ticket/enabled é inválido
    useEffect(() => {
        if (!enabled || !isValidTicketId(ticketId)) {
            setIsLoading(false);
            setConnectionStatus('disconnected');
        }
    }, [enabled, ticketId, isValidTicketId]);
    // ✅ CORREÇÃO 2: Geração de ID mais robusta
    const generateUniqueId = useCallback((messageId) => {
        try {
            // Cache para evitar recálculos
            const cacheKey = `id_${messageId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const cachedId = parseInt(cached);
                if (!isNaN(cachedId))
                    return cachedId;
            }
            // Tentar extrair número do ID
            const numMatch = messageId.match(/\d+/);
            if (numMatch) {
                const num = parseInt(numMatch[0]);
                if (!isNaN(num) && num > 0) {
                    sessionStorage.setItem(cacheKey, num.toString());
                    return num;
                }
            }
            // Fallback: hash determinístico
            let hash = 0;
            for (let i = 0; i < messageId.length; i++) {
                hash = ((hash << 5) - hash) + messageId.charCodeAt(i);
                hash = hash & hash;
            }
            const result = Math.abs(hash) || Date.now();
            sessionStorage.setItem(cacheKey, result.toString());
            return result;
        }
        catch (error) {
            console.error('❌ [ID_GEN] Erro ao gerar ID:', error);
            return Date.now();
        }
    }, []);
    // ✅ CORREÇÃO 3: Conversão de mensagem com tratamento de erro robusto
    const convertToLocalMessage = useCallback((msg) => {
        try {
            if (!msg || !msg.id || !msg.content) {
                console.warn('⚠️ [CONVERT] Mensagem inválida ignorada:', msg);
                return null;
            }
            return {
                id: generateUniqueId(msg.id),
                content: msg.content.trim(),
                sender: msg.sender_id ? 'agent' : 'client',
                senderName: msg.sender_name?.trim() || (msg.sender_id ? 'Agente' : 'Cliente'),
                timestamp: new Date(msg.created_at),
                type: msg.type || 'text',
                status: 'sent',
                isInternal: Boolean(msg.is_internal),
                attachments: msg.file_url ? [{
                        id: `${generateUniqueId(msg.id)}_file`,
                        name: msg.file_name || 'Arquivo',
                        url: msg.file_url,
                        type: msg.file_type || 'file',
                        size: (msg.file_size || 0).toString()
                    }] : []
            };
        }
        catch (error) {
            console.error('❌ [CONVERT] Erro ao converter mensagem:', error, msg);
            return null;
        }
    }, [generateUniqueId]);
    // ✅ CORREÇÃO 4: Sistema anti-loop com debounce e limite de frequência
    const loadMessages = useCallback(async (silent = false) => {
        // Proteções contra loops
        if (!mountedRef.current || !enabled)
            return;
        if (isLoadingRef.current) {
            console.log('🚫 [POLLING] Já carregando, ignorando requisição duplicada');
            return;
        }
        if (!isValidTicketId(ticketId)) {
            console.log('⚠️ [POLLING] Ticket ID inválido:', ticketId);
            if (!silent) {
                setMessages([]);
                setConnectionStatus('disconnected');
                setIsLoading(false); // 🚀 CORREÇÃO: Sempre definir loading como false para tickets inválidos
            }
            return;
        }
        // Limite de frequência: mínimo 5 segundos entre requests
        const now = new Date();
        if (lastSuccessfulFetchRef.current) {
            const timeSinceLastFetch = now.getTime() - lastSuccessfulFetchRef.current.getTime();
            if (timeSinceLastFetch < 5000 && silent) {
                console.log('🚫 [POLLING] Request muito frequente, ignorando');
                return;
            }
        }
        isLoadingRef.current = true;
        if (!silent) {
            setIsLoading(true);
            setConnectionStatus('connecting');
        }
        try {
            console.log('🔄 [POLLING] Carregando mensagens para ticket:', ticketId);
            const { data: messagesData, error } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })
                .limit(100);
            if (error) {
                console.error('❌ [POLLING] Erro ao carregar mensagens:', error);
                setConnectionStatus('error');
                setRetryCount(prev => prev + 1);
                if (!silent && retryCount < maxRetries) {
                    toast({
                        title: "Erro ao carregar mensagens",
                        description: `Tentativa ${retryCount + 1}/${maxRetries}`,
                        variant: "destructive",
                    });
                }
                return;
            }
            if (!mountedRef.current)
                return;
            // Filtrar e converter mensagens válidas
            const validMessages = (messagesData || [])
                .map(convertToLocalMessage)
                .filter(Boolean);
            // ✅ CORREÇÃO 5: Verificação inteligente de mudanças
            const currentCount = validMessages.length;
            const hasNewMessages = currentCount !== lastMessageCountRef.current;
            if (hasNewMessages || !silent) {
                console.log(`✅ [POLLING] ${currentCount} mensagens carregadas (anterior: ${lastMessageCountRef.current})`);
                setMessages(validMessages);
                lastMessageCountRef.current = currentCount;
                setLastUpdateTime(now);
                lastSuccessfulFetchRef.current = now;
            }
            setConnectionStatus('connected');
            setRetryCount(0); // Reset retry count on success
        }
        catch (error) {
            console.error('❌ [POLLING] Erro inesperado:', error);
            setConnectionStatus('error');
            setRetryCount(prev => prev + 1);
        }
        finally {
            isLoadingRef.current = false;
            if (!silent && mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [ticketId, isValidTicketId, convertToLocalMessage, toast, enabled, retryCount, maxRetries]);
    // ✅ CORREÇÃO 6: Adicionar mensagem com verificação de duplicatas aprimorada
    const addMessage = useCallback((message) => {
        if (!mountedRef.current || !message || !message.content)
            return;
        console.log('➕ [POLLING] Adicionando mensagem local:', message.content.substring(0, 50));
        setMessages(prev => {
            // Verificação de duplicata mais rigorosa
            const exists = prev.some(m => m.id === message.id ||
                (m.content === message.content &&
                    Math.abs(m.timestamp.getTime() - message.timestamp.getTime()) < 1000));
            if (exists) {
                console.log('🚫 [POLLING] Mensagem duplicada ignorada');
                return prev;
            }
            const newMessages = [...prev, message];
            lastMessageCountRef.current = newMessages.length;
            return newMessages;
        });
        setLastUpdateTime(new Date());
    }, []);
    // ✅ CORREÇÃO 7: Controle de polling com limpeza rigorosa
    useEffect(() => {
        // Cleanup anterior antes de iniciar novo
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        if (!enabled || !isValidTicketId(ticketId)) {
            console.log('⚠️ [POLLING] Polling desabilitado ou ticket inválido');
            setMessages([]);
            setConnectionStatus('disconnected');
            setIsLoading(false); // 🚀 CORREÇÃO: Garantir que loading seja false
            lastTicketIdRef.current = null;
            return;
        }
        // Verificar se o ticket mudou
        const ticketChanged = lastTicketIdRef.current !== ticketId;
        if (ticketChanged) {
            console.log('🚀 [POLLING] Iniciando polling para novo ticket:', ticketId);
            lastTicketIdRef.current = ticketId;
            lastMessageCountRef.current = 0;
            setRetryCount(0);
            // Carregamento inicial
            loadMessages(false);
        }
        // Configurar polling com intervalo aumentado
        pollingIntervalRef.current = setInterval(() => {
            if (mountedRef.current && enabled) {
                loadMessages(true);
            }
        }, pollingInterval);
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [ticketId, pollingInterval, loadMessages, isValidTicketId, enabled]);
    // ✅ CORREÇÃO 8: Cleanup rigoroso no unmount
    useEffect(() => {
        return () => {
            console.log('🧹 [POLLING] Limpeza completa do hook');
            mountedRef.current = false;
            isLoadingRef.current = false;
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, []);
    // ✅ CORREÇÃO 9: Refresh otimizado
    const refreshMessages = useCallback(async () => {
        if (!enabled)
            return;
        console.log('🔄 [REFRESH] Refresh manual solicitado');
        setRetryCount(0);
        await loadMessages(false);
    }, [loadMessages, enabled]);
    return {
        messages,
        isLoading,
        isConnected: connectionStatus === 'connected',
        lastUpdateTime,
        refreshMessages,
        addMessage,
        connectionStatus,
        retryCount
    };
};
