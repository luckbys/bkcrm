import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { TicketChatModalProps } from '../../types/chatModal';
import { X } from 'lucide-react';

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, onClose, isOpen }) => {
  // Early return se não tem ticket ou não está aberto
  if (!ticket || !isOpen) {
    return null;
  }

  console.log('🎯 [MODAL] Abrindo ticket modal para:', ticket?.id, ticket?.client);

  // Modal extremamente simplificado apenas para testar
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[95vw] h-[90vh] p-6 gap-4 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>
            Chat do Ticket - {ticket?.title || ticket?.subject || 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Interface de chat para comunicação.
          </DialogDescription>
        </VisuallyHidden>
        
        {/* Header simples */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Ticket #{ticket?.id}
            </h2>
            <p className="text-sm text-gray-600">
              Cliente: {ticket?.client || 'Cliente'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Conteúdo simples */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-medium">Modal está funcionando!</h3>
            <p className="text-gray-600">
              O sistema não está mais travando. <br />
              Esta é uma versão simplificada para teste.
            </p>
            <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg">
              <p><strong>ID:</strong> {ticket?.id}</p>
              <p><strong>Cliente:</strong> {ticket?.client || 'N/A'}</p>
              <p><strong>Status:</strong> {ticket?.status || 'N/A'}</p>
              <p><strong>Prioridade:</strong> {ticket?.priority || 'N/A'}</p>
              <p><strong>Canal:</strong> {ticket?.channel || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Footer simples */}
        <div className="border-t pt-4">
          <Button onClick={onClose} className="w-full">
            Fechar Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 