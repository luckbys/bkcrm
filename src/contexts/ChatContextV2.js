import { jsx as _jsx } from "react/jsx-runtime";
// 🚀 CONTEXT API MODERNO PARA CHAT
import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
// 🎯 Estado inicial
const initialState = {
    isLoading: false,
    isConnected: false,
    connectionStatus: 'disconnected',
    lastActivity: null,
    unreadCount: 0,
    isTyping: false,
    typingUsers: [],
    error: null
};
// 🔄 Reducer para gerenciamento de estado
function chatReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CONNECTION_STATUS':
            return {
                ...state,
                connectionStatus: action.payload,
                isConnected: action.payload === 'connected'
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                connectionStatus: action.payload ? 'error' : state.connectionStatus
            };
        case 'SET_TYPING':
            const { userId, isTyping } = action.payload;
            const typingUsers = isTyping
                ? [...state.typingUsers.filter(id => id !== userId), userId]
                : state.typingUsers.filter(id => id !== userId);
            return {
                ...state,
                isTyping: typingUsers.length > 0,
                typingUsers
            };
        case 'MARK_AS_READ':
            return {
                ...state,
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        default:
            return state;
    }
}
// 🎭 Context criação
export const ChatContext = createContext(null);
// 🏗️ Provider Component
export const ChatProvider = ({ children, configuration }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const [messages, setMessages] = React.useState([]);
    // 📤 Envio de mensagens básico via Supabase
    const sendMessage = useCallback(async (content, isInternal = false) => {
        if (!content.trim() || !user) {
            throw new Error('Conteúdo ou usuário inválido');
        }
        try {
            // 🎯 Criar mensagem otimista
            const tempMessage = {
                id: `temp-${Date.now()}`,
                content,
                type: 'text',
                sender: 'agent',
                senderName: user.user_metadata?.name || user.email?.split('@')[0] || 'Atendente',
                senderId: user.id,
                timestamp: new Date(),
                isInternal,
                status: 'sending'
            };
            // ⚡ Atualização otimista da UI
            setMessages(prev => [...prev, tempMessage]);
            // 💾 Salvar no Supabase
            const { error: supabaseError } = await supabase
                .from('messages')
                .insert({
                ticket_id: configuration.ticketId,
                content,
                sender_id: user.id,
                sender_name: tempMessage.senderName,
                sender_email: user.email,
                sender_type: 'agent',
                type: 'text',
                message_type: 'text',
                is_internal: isInternal,
                metadata: {
                    sent_via: 'chat_context',
                    timestamp: new Date().toISOString()
                }
            });
            if (supabaseError) {
                throw supabaseError;
            }
            // ✅ Atualizar status da mensagem
            setMessages(prev => prev.map(msg => msg.id === tempMessage.id
                ? { ...msg, status: 'sent', id: `msg-${Date.now()}` }
                : msg));
            toast({
                title: "Sucesso",
                description: isInternal ? "Nota interna enviada" : "Mensagem enviada"
            });
        }
        catch (error) {
            console.error('❌ [Chat] Erro no envio:', error);
            // ❌ Atualizar mensagem com erro  
            setMessages(prev => prev.map(msg => msg.id.startsWith('temp-')
                ? { ...msg, status: 'failed' }
                : msg));
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Falha no envio da mensagem",
                variant: "destructive"
            });
            throw error;
        }
    }, [user, configuration, toast]);
    // 🔄 Atualizar mensagens
    const refreshMessages = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', configuration.ticketId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            if (data) {
                const convertedMessages = data.map(msg => ({
                    id: msg.id.toString(),
                    content: msg.content || '',
                    type: 'text',
                    sender: msg.sender_type === 'agent' ? 'agent' : 'client',
                    senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
                    senderId: msg.sender_id,
                    timestamp: new Date(msg.created_at),
                    isInternal: Boolean(msg.is_internal),
                    status: 'sent',
                    metadata: msg.metadata
                }));
                setMessages(convertedMessages);
            }
        }
        catch (error) {
            console.error('❌ [Chat] Erro ao carregar mensagens:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'Erro ao carregar mensagens'
            });
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [configuration.ticketId]);
    // 🔍 Buscar mensagens
    const searchMessages = useCallback((query) => {
        if (!query.trim())
            return messages;
        const searchTerm = query.toLowerCase();
        return messages.filter(msg => msg.content.toLowerCase().includes(searchTerm) ||
            msg.senderName.toLowerCase().includes(searchTerm));
    }, [messages]);
    // 📤 Outras ações
    const actions = useMemo(() => ({
        sendMessage,
        editMessage: async () => { },
        deleteMessage: async () => { },
        markAsRead: async (messageId) => {
            dispatch({ type: 'MARK_AS_READ', payload: messageId });
        },
        addReaction: async () => { },
        removeReaction: async () => { },
        uploadFile: async () => 'file-url',
        setTyping: (isTyping) => {
            if (user) {
                dispatch({
                    type: 'SET_TYPING',
                    payload: { userId: user.id, isTyping }
                });
            }
        },
        refreshMessages,
        searchMessages
    }), [sendMessage, refreshMessages, searchMessages, user]);
    // 🏪 Store completo
    const store = useMemo(() => ({
        messages,
        state,
        configuration,
        actions
    }), [messages, state, configuration, actions]);
    // 📡 Subscription system
    const subscribe = useCallback(() => {
        return () => { };
    }, []);
    // 🎯 Context value
    const contextValue = useMemo(() => ({
        store,
        subscribe,
        dispatch
    }), [store, subscribe]);
    // 🔄 Carregamento inicial
    useEffect(() => {
        refreshMessages();
    }, [refreshMessages]);
    return (_jsx(ChatContext.Provider, { value: contextValue, children: children }));
};
// 🎣 Hook personalizado para usar o contexto
export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat deve ser usado dentro de um ChatProvider');
    }
    return context;
};
