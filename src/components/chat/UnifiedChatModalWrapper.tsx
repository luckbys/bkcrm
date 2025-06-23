import React from 'react';
import { UnifiedChatModal } from './UnifiedChatModal';

interface UnifiedChatModalWrapperProps {
  ticket: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// 🎨 Wrapper que adapta o UnifiedChatModal para funcionar com a interface do SimpleChatModal
const UnifiedChatModalWrapper: React.FC<UnifiedChatModalWrapperProps> = ({ 
  ticket, 
  isOpen, 
  onOpenChange 
}) => {
  // Extrair informações do ticket
  const ticketId = ticket?.originalId || ticket?.id ? String(ticket.originalId || ticket.id) : '';
  const clientName = ticket?.client || ticket?.title || 'Cliente';
  const clientPhone = ticket?.phone || ticket?.whatsapp_phone;

  // Função para fechar o modal
  const handleClose = () => {
    onOpenChange(false);
  };

  // Função para minimizar (opcional - pode ser implementada depois)
  const handleMinimize = () => {
    // Por enquanto apenas fecha
    onOpenChange(false);
  };

  // Se não há ticket, não renderiza nada
  if (!ticket || !ticketId) {
    return null;
  }

  return (
    <UnifiedChatModal
      isOpen={isOpen}
      onClose={handleClose}
      onMinimize={handleMinimize}
      ticketId={ticketId}
      clientName={clientName}
      clientPhone={clientPhone}
    />
  );
};

export default UnifiedChatModalWrapper; 