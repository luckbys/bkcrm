import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseMinimizedStateOptions {
  ticketId?: string;
  onMinimize?: () => void;
  onExpand?: () => void;
}

export const useMinimizedState = (options: UseMinimizedStateOptions = {}) => {
  const { ticketId, onMinimize, onExpand } = options;
  const { toast } = useToast();

  // Estado inicial baseado no localStorage
  const [isMinimized, setIsMinimized] = useState(() => {
    if (!ticketId) {
      console.log('🎯 useMinimizedState: sem ticketId, retornando false');
      return false;
    }
    const saved = localStorage.getItem(`chat-minimized-${ticketId}`);
    const result = saved === 'true';
    console.log('🎯 useMinimizedState inicial:', { ticketId, saved, result });
    return result;
  });

  // Função para alternar estado de minimização
  const toggleMinimize = useCallback(() => {
    const newState = !isMinimized;
    
    setIsMinimized(newState);
    
    // Persistir no localStorage
    if (ticketId) {
      localStorage.setItem(`chat-minimized-${ticketId}`, newState.toString());
    }
    
    // Executar callbacks
    if (newState && onMinimize) {
      onMinimize();
    } else if (!newState && onExpand) {
      onExpand();
    }
    
    // Feedback visual
    toast({
      title: newState ? "💬 Chat minimizado" : "🔄 Chat expandido",
      description: newState 
        ? "O chat foi minimizado e aparecerá no canto da tela"
        : "O chat foi restaurado para tela cheia",
      duration: 2000,
    });
  }, [isMinimized, ticketId, onMinimize, onExpand, toast]);

  // Função para definir estado diretamente
  const setMinimized = useCallback((minimized: boolean) => {
    if (minimized === isMinimized) return;
    
    setIsMinimized(minimized);
    
    // Persistir no localStorage
    if (ticketId) {
      localStorage.setItem(`chat-minimized-${ticketId}`, minimized.toString());
    }
    
    // Executar callbacks
    if (minimized && onMinimize) {
      onMinimize();
    } else if (!minimized && onExpand) {
      onExpand();
    }
  }, [isMinimized, ticketId, onMinimize, onExpand]);

  // Limpar localStorage quando ticket muda
  useEffect(() => {
    if (!ticketId) {
      setIsMinimized(false);
    }
  }, [ticketId]);

  // Debug: Limpar localStorage de chats minimizados (temporário)
  useEffect(() => {
    if (ticketId) {
      // Temporariamente forçar estado não minimizado para debug
      const saved = localStorage.getItem(`chat-minimized-${ticketId}`);
      if (saved === 'true') {
        console.log('🎯 REMOVENDO estado minimizado do localStorage para debug');
        localStorage.removeItem(`chat-minimized-${ticketId}`);
        setIsMinimized(false);
      }
    }
  }, [ticketId]);

  return {
    isMinimized,
    toggleMinimize,
    setMinimized,
    minimize: () => setMinimized(true),
    expand: () => setMinimized(false),
  };
}; 