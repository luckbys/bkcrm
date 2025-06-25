import { useState, useEffect, useCallback } from 'react';
import { MinimizedChatManager, MinimizedChat, ChatSettings } from '../services/MinimizedChatManager';

export interface UseMinimizedChatManagerReturn {
  // Estado
  chats: MinimizedChat[];
  settings: ChatSettings;
  stats: {
    totalChats: number;
    visibleChats: number;
    pinnedChats: number;
    totalUnread: number;
  };
  
  // Ações de chat
  addChat: (chatId: string, ticket: any) => boolean;
  removeChat: (chatId: string) => boolean;
  expandChat: (chatId: string) => void;
  
  // Ações de configuração
  togglePin: (chatId: string) => boolean;
  toggleVisibility: (chatId: string) => boolean;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  
  // Utilitários
  clearAll: () => void;
  getChat: (chatId: string) => MinimizedChat | undefined;
  getStats: () => any;
}

export const useMinimizedChatManager = (): UseMinimizedChatManagerReturn => {
  const manager = MinimizedChatManager.getInstance();
  
  // Estados reativos
  const [chats, setChats] = useState<MinimizedChat[]>(() => manager.getChats());
  const [settings, setSettings] = useState<ChatSettings>(() => manager.getSettings());
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
  const addChat = useCallback((chatId: string, ticket: any) => {
    return manager.addChat(chatId, ticket);
  }, [manager]);

  const removeChat = useCallback((chatId: string) => {
    return manager.removeChat(chatId);
  }, [manager]);

  const expandChat = useCallback((chatId: string) => {
    manager.expandChat(chatId);
  }, [manager]);

  // Ações de configuração
  const togglePin = useCallback((chatId: string) => {
    return manager.togglePin(chatId);
  }, [manager]);

  const toggleVisibility = useCallback((chatId: string) => {
    return manager.toggleVisibility(chatId);
  }, [manager]);

  const updateSettingsCallback = useCallback((newSettings: Partial<ChatSettings>) => {
    manager.updateSettings(newSettings);
  }, [manager]);

  // Utilitários
  const clearAll = useCallback(() => {
    manager.clearAll();
  }, [manager]);

  const getChat = useCallback((chatId: string) => {
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