import React, { useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTicketChat } from '../../hooks/useTicketChat';
import { TicketChatHeader } from './ticket-chat/TicketChatHeader';
import { TicketChatMessages } from './ticket-chat/TicketChatMessages';
import { TicketChatInput } from './ticket-chat/TicketChatInput';
import { TicketChatSidebar } from './ticket-chat/TicketChatSidebar';
import { TicketChatModals } from './ticket-chat/TicketChatModals';
import TicketChatMinimized from './ticket-chat/TicketChatMinimized';
import { ChatAnimations, ResponsiveAnimations } from './ticket-chat/chatAnimations';

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
  onMinimize?: () => void;
}

const TicketChatRefactored: React.FC<TicketChatProps> = ({ ticket, onClose, onMinimize }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatState = useTicketChat(ticket);
  
  const {
    currentTicket,
    showSidebar,
    lastSentMessage
  } = chatState;

  return (
    <div className={cn(
      "flex h-full w-full overflow-hidden bg-white",
      ResponsiveAnimations.prefersReducedMotion.disable
    )}>
      {/* Success notification - Animação mais suave e minimalista */}
      {lastSentMessage && (
        <div className={cn(
          "absolute top-4 right-4 z-50",
          ChatAnimations.enter.slideRight,
          ResponsiveAnimations.prefersReducedMotion.minimal
        )}>
          <div className={cn(
            "bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3",
            ChatAnimations.transition.smooth,
            ChatAnimations.interactive.card
          )}>
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Mensagem enviada</p>
              <p className="text-xs opacity-90">Entregue com sucesso</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area - Transições mais fluidas */}
      <div className={cn(
        "flex flex-col",
        ChatAnimations.chat.sidebarToggle,
        showSidebar 
          ? "flex-1 min-w-[400px]" 
          : "w-full",
        ResponsiveAnimations.prefersReducedMotion.disable
      )}>
        {/* Enhanced Header */}
        <TicketChatHeader
          currentTicket={currentTicket}
          userTyping={false}
          showSidebar={showSidebar}
          onClose={onClose}
          onMinimize={onMinimize}
          chatState={chatState}
        />

        {/* Messages Area */}
        <TicketChatMessages
          chatState={chatState}
          textareaRef={textareaRef}
        />

        {/* Input Area */}
        <TicketChatInput
          chatState={chatState}
          textareaRef={textareaRef}
        />
      </div>

      {/* Enhanced Right Sidebar - Entrada suave */}
      <TicketChatSidebar
        showSidebar={showSidebar}
        chatState={chatState}
      />

      {/* Modals */}
      <TicketChatModals chatState={chatState} />
    </div>
  );
};

export default TicketChatRefactored; 