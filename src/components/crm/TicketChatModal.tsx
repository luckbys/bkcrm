import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TicketChatModalProps } from '../../types/chatModal';
import { 
  X, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  Tag, 
  MessageSquare,
  Eye,
  EyeOff,
  Settings,
  UserCheck,
  Wifi,
  WifiOff,
  Paperclip,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SimpleMessage {
  id: number;
  content: string;
  sender: 'agent' | 'client';
  senderName: string;
  timestamp: Date;
  isInternal?: boolean;
}

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, onClose, isOpen }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados locais simples
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Early return se não tem ticket ou não está aberto
  if (!ticket || !isOpen) {
    return null;
  }

  // Função para carregar mensagens do banco
  const loadMessages = async () => {
    if (!ticket?.id) return;
    
    setIsLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      const formattedMessages: SimpleMessage[] = (messagesData || []).map((msg, index) => ({
        id: index + 1,
        content: msg.content || '',
        sender: msg.sender_id ? 'agent' : 'client',
        senderName: msg.sender_name || (msg.sender_id ? 'Agente' : 'Cliente'),
        timestamp: new Date(msg.created_at),
        isInternal: Boolean(msg.is_internal)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket?.id) return;

    try {
             const messageData = {
         ticket_id: ticket.id,
         content: newMessage.trim(),
         sender_id: isInternal ? user?.id : null,
         sender_name: isInternal ? (user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agente') : (ticket.client || 'Cliente'),
        type: 'text',
        is_internal: isInternal,
        metadata: {
          sent_from: 'chat_interface',
          timestamp: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Adicionar mensagem localmente
             const newMsg: SimpleMessage = {
         id: Date.now(),
         content: newMessage.trim(),
         sender: isInternal ? 'agent' : 'client',
         senderName: isInternal ? (user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agente') : (ticket.client || 'Cliente'),
        timestamp: new Date(),
        isInternal
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      toast({
        title: "✅ Mensagem enviada",
        description: `Mensagem ${isInternal ? 'interna' : 'pública'} enviada com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    }
  };

  // Carregar mensagens ao abrir
  useEffect(() => {
    if (isOpen && ticket?.id) {
      loadMessages();
    }
  }, [isOpen, ticket?.id]);

  // Função para formatar data
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
            Chat do Ticket - {ticket?.title || ticket?.subject || 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Interface de chat para comunicação com o cliente.
          </DialogDescription>
        </VisuallyHidden>
        
        <div className="flex h-full">
          {/* Área principal do chat */}
          <div className="flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Ticket #{ticket?.id}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{ticket?.client || 'Cliente'}</span>
                    {ticket?.channel === 'whatsapp' && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        📱 WhatsApp
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    ticket?.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                    ticket?.status === 'atendimento' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {ticket?.status || 'Pendente'}
                  </Badge>
                  
                  <Badge variant="outline">
                    {ticket?.priority || 'Normal'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  title={showSidebar ? 'Ocultar sidebar' : 'Mostrar sidebar'}
                >
                  {showSidebar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Área de mensagens */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando mensagens...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-500">Inicie a conversa enviando uma mensagem</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        message.isInternal 
                          ? 'bg-orange-100 border border-orange-200' 
                          : message.sender === 'agent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 border'
                      } rounded-lg p-3`}>
                        {message.isInternal && (
                          <div className="flex items-center gap-1 mb-1">
                            <Eye className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-600">NOTA INTERNA</span>
                          </div>
                        )}
                        
                        <p className={`text-sm ${
                          message.isInternal ? 'text-orange-800' :
                          message.sender === 'agent' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {message.content}
                        </p>
                        
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          message.isInternal ? 'text-orange-600' :
                          message.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{message.senderName}</span>
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Área de input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <Eye className="w-4 h-4" />
                  Nota interna
                </label>
                
                {isInternal && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Apenas para equipe
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isInternal ? "Digite uma nota interna..." : "Digite sua mensagem..."}
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Enter para enviar • Shift+Enter para nova linha
              </p>
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="w-80 border-l bg-gray-50">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{ticket?.client || 'Cliente'}</span>
                    </div>
                    
                    {ticket?.customerEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{ticket.customerEmail}</span>
                      </div>
                    )}
                    
                    {ticket?.customerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{ticket.customerPhone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Detalhes do Ticket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="outline">{ticket?.status || 'Pendente'}</Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prioridade:</span>
                      <Badge variant="outline">{ticket?.priority || 'Normal'}</Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Canal:</span>
                      <Badge variant="outline">{ticket?.channel || 'Email'}</Badge>
                    </div>
                    
                    {ticket?.assignee && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Responsável:</span>
                        <span className="font-medium">{ticket.assignee}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const newStatus = ticket?.status === 'finalizado' ? 'atendimento' : 'finalizado';
                        toast({
                          title: "✅ Status atualizado",
                          description: `Status alterado para "${newStatus}"`,
                        });
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {ticket?.status === 'finalizado' ? 'Reabrir Ticket' : 'Finalizar Ticket'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        toast({
                          title: "👤 Atribuir Agente",
                          description: "Função será implementada em breve",
                        });
                      }}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Atribuir Agente
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        toast({
                          title: "🏷️ Adicionar Tag",
                          description: "Função será implementada em breve",
                        });
                      }}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Adicionar Tag
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        toast({
                          title: "👥 Atribuir Cliente",
                          description: "Função será implementada em breve",
                        });
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Atribuir Cliente
                    </Button>
                  </CardContent>
                </Card>

                {/* Tags do Ticket */}
                {ticket?.tags && ticket.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={loadMessages}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Atualizar Mensagens
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "⚙️ Configurações",
                        description: "Painel de configurações será implementado",
                      });
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 