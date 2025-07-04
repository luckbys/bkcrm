import { useState, useEffect, useCallback } from 'react';
import { MinimizedChatManager } from '../services/MinimizedChatManager';
export const useMinimizedChatManager = () => {
    const manager = MinimizedChatManager.getInstance();
    // Estados reativos
    const [chats, setChats] = useState(() => manager.getChats());
    const [settings, setSettings] = useState(() => manager.getSettings());
    const [stats, setStats] = useState(() => manager.getStats());
    // Função para atualizar todos os estados
    const updateStates = useCallback(() => {
        setChats(manager.getChats());
        setSettings(manager.getSettings());
        setStats(manager.getStats());
    }, [manager]);
    // Subscrever às mudanças do gerenciador
    useEffect(() => {
        const unsubscribe = manager.subscribe(updateStates);
        // Atualização inicial
        updateStates();
        return unsubscribe;
    }, [manager, updateStates]);
    // Ações de chat (memoizadas para performance)
    const addChat = useCallback((chatId, ticket) => {
        return manager.addChat(chatId, ticket);
    }, [manager]);
    const removeChat = useCallback((chatId) => {
        return manager.removeChat(chatId);
    }, [manager]);
    const expandChat = useCallback((chatId) => {
        manager.expandChat(chatId);
    }, [manager]);
    // Ações de configuração
    const togglePin = useCallback((chatId) => {
        return manager.togglePin(chatId);
    }, [manager]);
    const toggleVisibility = useCallback((chatId) => {
        return manager.toggleVisibility(chatId);
    }, [manager]);
    const updateSettingsCallback = useCallback((newSettings) => {
        manager.updateSettings(newSettings);
    }, [manager]);
    // Utilitários
    const clearAll = useCallback(() => {
        manager.clearAll();
    }, [manager]);
    const getChat = useCallback((chatId) => {
        return manager.getChat(chatId);
    }, [manager]);
    const getStats = useCallback(() => {
        return manager.getStats();
    }, [manager]);
    return {
        // Estado
        chats,
        settings,
        stats,
        // Ações de chat
        addChat,
        removeChat,
        expandChat,
        // Ações de configuração
        togglePin,
        toggleVisibility,
        updateSettings: updateSettingsCallback,
        // Utilitários
        clearAll,
        getChat,
        getStats,
    };
};
