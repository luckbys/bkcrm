import React, { useRef, useState, useEffect } from 'react';
import { MessageSquare, Maximize2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';

interface TicketChatMinimizedProps {
  currentTicket: any;
  chatState: UseTicketChatReturn;
}

const TicketChatMinimized: React.FC<TicketChatMinimizedProps> = ({ 
  currentTicket, 
  chatState 
}) => {
  const {
    unreadCount,
    whatsappStatus,
    realTimeMessages,
    toggleMinimize
  } = chatState;

  const lastMessage = realTimeMessages[realTimeMessages.length - 1];
  const hasNewMessages = unreadCount > 0;

  // ====== DRAG N DROP ======
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Define posição inicial no canto inferior direito, após descobrir tamanho do elemento
  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      const { width, height } = node.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - width - 16, // 16 = bottom/right margin (4)
        y: window.innerHeight - height - 16,
      });
    }
  }, []);

  // Handlers de mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    setDragging(true);

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!dragging) return;
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      setPosition(prev => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;

        // Limita dentro da tela
        const boundedX = Math.max(0, Math.min(newX, window.innerWidth - (containerRef.current?.offsetWidth || 300)));
        const boundedY = Math.max(0, Math.min(newY, window.innerHeight - (containerRef.current?.offsetHeight || 200)));

        return { x: boundedX, y: boundedY };
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ left: position.x, top: position.y }}
      className="fixed z-[9999] cursor-grab active:cursor-grabbing animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className={cn(
        "bg-white border border-gray-200 rounded-lg shadow-xl max-w-sm transition-all duration-200 hover:shadow-2xl cursor-pointer",
        hasNewMessages && "ring-2 ring-blue-500 ring-opacity-50"
      )}
      onClick={toggleMinimize}
      >
        {/* Header minimizado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative">
              <Avatar className="w-8 h-8 ring-2 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold">
                  {currentTicket?.client?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              {/* Indicador de status WhatsApp */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3">
                {whatsappStatus === 'connected' ? (
                  <Wifi className="w-3 h-3 text-green-500 bg-white rounded-full" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500 bg-white rounded-full" />
                )}
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {currentTicket?.client || 'Cliente'}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                Chat #{currentTicket?.id || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Badge de mensagens não lidas */}
            {hasNewMessages && (
              <Badge variant="destructive" className="text-xs px-2 py-1 animate-pulse">
                {unreadCount}
              </Badge>
            )}
            
            {/* Botão maximizar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              className="w-6 h-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview da última mensagem */}
        {lastMessage && (
          <div className="p-4">
            <div className={cn(
              "text-sm text-gray-600 line-clamp-2",
              hasNewMessages && "font-medium text-gray-900"
            )}>
              <span className="font-medium text-gray-800">
                {lastMessage.senderName}:
              </span>{' '}
              {lastMessage.content}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {lastMessage.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {lastMessage.isInternal && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200">
                  Interna
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Estado sem mensagens */}
        {!lastMessage && (
          <div className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Nenhuma mensagem ainda</p>
            <p className="text-xs text-blue-600 mt-1">Clique para abrir o chat</p>
          </div>
        )}

        {/* Footer com status */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                whatsappStatus === 'connected' 
                  ? "bg-green-500 animate-pulse" 
                  : "bg-red-500"
              )} />
              <span className="text-xs text-gray-600">
                {whatsappStatus === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <span className="text-xs text-blue-600 font-medium">
              Expandir Chat
            </span>
          </div>
        </div>

        {/* Indicador de pulsação para novas mensagens */}
        {hasNewMessages && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
        )}
      </div>
    </div>
  );
};

export default TicketChatMinimized; 