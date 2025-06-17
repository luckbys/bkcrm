import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import TicketChatRefactored from './TicketChatRefactored';
import TicketChatMinimized from './ticket-chat/TicketChatMinimized';
import { useTicketChat } from '../../hooks/useTicketChat';
import { useMinimizedChatManager } from '../../hooks/useMinimizedChatManager';
import { TicketChatModalProps } from '../../types/chatModal';
import { cn } from '@/lib/utils';
import { ChatAnimations, ResponsiveAnimations } from './ticket-chat/chatAnimations';

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, onClose, isOpen }) => {
  // Hook do chat para funcionalidades - sempre chamar primeiro
  const chatState = useTicketChat(ticket);
  const { currentTicket } = chatState;

  // Hook do gerenciador de chats minimizados
  const { addChat, getChat } = useMinimizedChatManager();

  // Verificar se este chat está minimizado
  const chatId = ticket?.id?.toString();
  const minimizedChat = chatId ? getChat(chatId) : null;
  const isMinimized = !!minimizedChat;

  // Função para minimizar o chat
  const handleMinimize = () => {
    if (chatId) {
      const success = addChat(chatId, ticket);
      if (success) {
        onClose(); // Fechar o modal
      }
    }
  };

  // Atalho de teclado para minimizar (Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        handleMinimize();
      }
    };

    if (isOpen && !isMinimized && ticket) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMinimized, ticket]);

  // Early return APÓS os hooks - agora é seguro
  if (!ticket || !isOpen) {
    return null;
  }

  // Se está minimizado, não renderizar o modal (será renderizado pelo container)
  if (isMinimized) {
    return null;
  }

  // Modal principal com animações suaves
  return (
    <Dialog 
      open={isOpen && !isMinimized} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={cn(
        "max-w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden",
        ChatAnimations.enter.scale,
        ResponsiveAnimations.prefersReducedMotion.disable
      )}>
        <VisuallyHidden>
          <DialogTitle>
            Chat do Ticket - {currentTicket?.title || currentTicket?.subject || 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Interface de chat para comunicação. Use Ctrl+M para minimizar, Escape para fechar.
          </DialogDescription>
        </VisuallyHidden>
        
        <TicketChatRefactored 
          ticket={ticket} 
          onClose={onClose}
          onMinimize={handleMinimize}
        />
      </DialogContent>
    </Dialog>
  );
}; 