import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '../stores/chatStore';
import { 
  X, 
  Send,
  Wifi,
  WifiOff,
  MessageSquare,
  User,
  Clock
} from 'lucide-react';

interface SimpleChatModalProps {
  ticket: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SimpleChatModal: React.FC<SimpleChatModalProps> = ({ ticket, isOpen, onOpenChange }) => {
  const [messageText, setMessageText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  
  const {
    isConnected,
    isLoading,
    isSending,
    error,
    messages,
    init,
    disconnect,
    join,
    send,
    load
  } = useChatStore();

  const ticketId = ticket?.originalId || ticket?.id ? String(ticket.originalId || ticket.id) : null;
  const displayId = ticket?.id;
  const ticketMessages = ticketId ? messages[ticketId] || [] : [];

  console.log('🎫 [SIMPLE-CHAT] Ticket:', { 
    displayId: displayId,
    ticketId: ticketId,
    title: ticket?.title || ticket?.subject,
    messagesCount: ticketMessages.length,
    hasOriginalId: !!ticket?.originalId
  });

  // Inicializar quando abrir o modal
  useEffect(() => {
    if (isOpen && !isConnected) {
      console.log('🔄 [SIMPLE-CHAT] Inicializando socket...');
      init();
    }
  }, [isOpen, isConnected, init]);

  // Entrar no ticket quando conectar
  useEffect(() => {
    if (isOpen && ticketId && isConnected) {
      console.log(`🔗 [SIMPLE-CHAT] Entrando no ticket ${ticketId}`);
      join(ticketId);
      
      // Carregar mensagens se não existirem
      if (ticketMessages.length === 0) {
        console.log(`📥 [SIMPLE-CHAT] Carregando mensagens...`);
        load(ticketId);
      }
    }
  }, [isOpen, ticketId, isConnected, join, load, ticketMessages.length]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!ticketId || !messageText.trim()) return;
    
    try {
      await send(ticketId, messageText, isInternal);
      setMessageText('');
    } catch (error) {
      console.error('❌ [SIMPLE-CHAT] Erro ao enviar:', error);
    }
  };

  // Formatação de timestamp
  const formatTime = (date: Date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!ticket) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="p-4 text-center">
            <h3 className="text-lg font-semibold text-red-600">Erro</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Nenhum ticket foi selecionado.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogTitle className="sr-only">
          Chat - Ticket #{ticketId}
        </DialogTitle>
        
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {ticket.client?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div>
              <h3 className="font-semibold">{ticket.title || ticket.subject || `Ticket #${ticketId}`}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  {ticket.client || 'Cliente'}
                </Badge>
                <Badge variant={ticket.channel === 'whatsapp' ? 'default' : 'secondary'} className="text-xs">
                  {ticket.channel === 'whatsapp' ? '📱 WhatsApp' : ticket.channel || 'Chat'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status de Conexão */}
            <div className="flex items-center gap-1 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 border-b text-sm text-red-600">
            ❌ {error}
          </div>
        )}

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Carregando mensagens...</p>
              </div>
            ) : ticketMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                <p className="text-sm">Comece a conversa enviando uma mensagem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender === 'agent' ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl p-4 shadow-sm ${
                        message.isInternal 
                          ? 'bg-amber-50 border border-amber-200' 
                          : message.sender === 'agent' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border border-gray-200'
                      }`}>
                        {message.isInternal && (
                          <div className="text-amber-700 text-xs font-medium mb-2">
                            🔒 NOTA INTERNA
                          </div>
                        )}
                        
                        <div className="break-words">
                          {message.content}
                        </div>
                        
                        <div className={`mt-2 text-xs flex justify-between items-center ${
                          message.sender === 'agent' && !message.isInternal ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="font-medium">{message.senderName}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Área de Input */}
          <div className="p-4 border-t bg-white">
            {/* Toggle para nota interna */}
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  {isInternal ? '🔒 Nota Interna' : '💬 Resposta ao Cliente'}
                </span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder={isInternal ? "Digite uma nota interna..." : "Digite sua mensagem..."}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || isSending}
                size="sm"
                className="px-4"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{messageText.length}/2000 caracteres</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="text-green-600">WebSocket Online</span>
                ) : (
                  <span className="text-orange-500">Modo Offline</span>
                )}
                {isSending && <span className="text-blue-500">Enviando...</span>}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleChatModal; 