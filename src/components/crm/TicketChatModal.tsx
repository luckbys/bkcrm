import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import TicketChatRefactored from './TicketChatRefactored';
import { useTicketChat } from '../../hooks/useTicketChat';
import { TicketChatModalProps } from '../../types/chatModal';

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, onClose, isOpen }) => {
  // Early return se não tem ticket ou não está aberto
  if (!ticket || !isOpen) {
    return null;
  }

  // Hook do chat apenas se ticket for válido
  const chatState = useTicketChat(ticket);
  const { currentTicket } = chatState;

  // Modal principal simplificado
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>
            Chat do Ticket - {currentTicket?.title || currentTicket?.subject || 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Interface de chat para comunicação.
          </DialogDescription>
        </VisuallyHidden>
        
        <TicketChatRefactored 
          ticket={ticket} 
          onClose={onClose}
          onMinimize={() => {}}
        />
      </DialogContent>
    </Dialog>
  );
}; 