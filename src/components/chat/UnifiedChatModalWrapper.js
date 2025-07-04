import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useCallback } from 'react';
import { UnifiedChatModal } from './UnifiedChatModal';
import { useChatStore } from '../../stores/chatStore';
// 🎨 Wrapper que adapta o UnifiedChatModal para funcionar com a interface do SimpleChatModal
const UnifiedChatModalWrapper = ({ ticket, isOpen, onOpenChange }) => {
    const { init, isConnected } = useChatStore();
    // Extrair informações do ticket
    const ticketId = ticket?.originalId || ticket?.id ? String(ticket.originalId || ticket.id) : '';
    const clientName = ticket?.client || ticket?.title || 'Cliente';
    const clientPhone = ticket?.phone || ticket?.whatsapp_phone;
    // 🚀 Garantir inicialização do WebSocket quando wrapper é montado
    useEffect(() => {
        if (!isConnected) {
            console.log('🔄 [WRAPPER] Inicializando WebSocket do wrapper...');
            init();
        }
    }, [init, isConnected]);
    // Função para fechar o modal
    const handleClose = useCallback(() => {
        console.log('🔒 [WRAPPER] Fechando modal para ticket:', ticketId);
        onOpenChange(false);
    }, [onOpenChange, ticketId]);
    // Função para minimizar (opcional - pode ser implementada depois)
    const handleMinimize = useCallback(() => {
        console.log('📱 [WRAPPER] Minimizando modal para ticket:', ticketId);
        // Por enquanto apenas fecha
        onOpenChange(false);
    }, [onOpenChange, ticketId]);
    // Debug do ticket
    useEffect(() => {
        if (ticket && isOpen) {
            console.log('🎫 [WRAPPER] Ticket aberto:', {
                ticketId,
                clientName,
                clientPhone,
                originalTicket: ticket
            });
        }
    }, [ticket, isOpen, ticketId, clientName, clientPhone]);
    // Se não há ticket, não renderiza nada
    if (!ticket || !ticketId) {
        console.log('⚠️ [WRAPPER] Ticket inválido ou ausente:', { ticket, ticketId });
        return null;
    }
    return (_jsx(UnifiedChatModal, { isOpen: isOpen, onClose: handleClose, onMinimize: handleMinimize, ticketId: ticketId, clientName: clientName, clientPhone: clientPhone }));
};
export default UnifiedChatModalWrapper;
