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

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
}

const TicketChatRefactored: React.FC<TicketChatProps> = ({ ticket, onClose, onMinimize }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatState = useTicketChat(ticket);
  
  const {
    currentTicket,
    showSidebar,
    lastSentMessage
  } = chatState;

  // Chat sempre maximizado no modal

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Success notification */}
      {lastSentMessage && (
        <div className="absolute top-4 right-4 z-60 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Mensagem enviada!</p>
              <p className="text-xs opacity-90">Entregue com sucesso</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        showSidebar 
          ? "flex-1 min-w-[400px]" 
          : "w-full"
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

      {/* Enhanced Right Sidebar */}
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