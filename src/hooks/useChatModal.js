// 🎯 HOOK SIMPLIFICADO PARA MODAL DE CHAT
import { useState, useCallback } from 'react';
export const useChatModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [ticketId, setTicketId] = useState(null);
    const openChat = useCallback((id) => {
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
