// 🎯 HOOK SIMPLIFICADO PARA MODAL DE CHAT
import { useState, useCallback } from 'react';

export interface UseChatModalReturn {
  isOpen: boolean;
  ticketId: string | null;
  openChat: (ticketId: string) => void;
  closeChat: () => void;
}

export const useChatModal = (): UseChatModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const openChat = useCallback((id: string) => {
    setTicketId(id);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setTicketId(null);
  }, []);

  return {
    isOpen,
    ticketId,
    openChat,
    closeChat
  };
}; 