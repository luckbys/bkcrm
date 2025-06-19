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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  MoreHorizontal,
  Minimize2,
  Maximize2,
  Copy,
  Reply,
  Heart,
  Smile,
  Plus,
  Search,
  Filter,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  StarOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Pin,
  Archive
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import './ticket-chat/chat-animations.css';

interface SimpleMessage {
  id: number;
  content: string;
  sender: 'agent' | 'client';
  senderName: string;
  timestamp: Date;
  isInternal?: boolean;
  isFavorite?: boolean;
  reactions?: Array<{ emoji: string; count: number }>;
  isEdited?: boolean;
}

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticket, onClose, isOpen }) => {
  // TODOS OS HOOKS DEVEM ESTAR NO TOPO - SEMPRE CHAMADOS NA MESMA ORDEM
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados locais aprimorados
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<number>>(new Set());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Função para obter o UUID correto do ticket
  const getTicketUUID = React.useCallback(() => {
    if (!ticket) return null;
    
    // Verificar se já é UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // 1. Tentar originalId primeiro (UUID real do banco)
    const originalId = (ticket as any)?.originalId;
    if (originalId && uuidPattern.test(originalId)) {
      return originalId;
    }
    
    // 2. Verificar se o próprio id é UUID
    const ticketId = String(ticket.id);
    if (uuidPattern.test(ticketId)) {
      return ticketId;
    }
    
    // 3. Se nenhum UUID válido foi encontrado
    console.warn('⚠️ Nenhum UUID válido encontrado para o ticket:', { 
      id: ticket.id, 
      originalId,
      ticketObject: ticket 
    });
    return null;
  }, [ticket]);

  // Função para criar ticket no banco se necessário (dados mock)
  const ensureTicketInDatabase = React.useCallback(async () => {
    const ticketUUID = getTicketUUID();
    
    // Se já tem UUID válido, não precisa criar
    if (ticketUUID) {
      return ticketUUID;
    }
    
    console.log('🔄 Ticket sem UUID detectado, tentando criar no banco...');
    
    try {
      // Verificar se já existe um ticket no banco com dados similares
      const { data: existingTickets, error: searchError } = await supabase
        .from('tickets')
        .select('id')
        .eq('title', ticket.subject || `Ticket #${ticket.id}`)
        .limit(1);
      
      if (searchError) {
        console.warn('⚠️ Erro ao buscar tickets existentes:', searchError);
      }
      
      if (existingTickets && existingTickets.length > 0) {
        console.log('✅ Ticket encontrado no banco:', existingTickets[0].id);
        return existingTickets[0].id;
      }
      
      // Criar novo ticket no banco
      const newTicketData = {
        title: ticket.subject || `Ticket #${ticket.id}`,
        description: `Ticket migrado do sistema legacy`,
        status: ticket.status || 'pendente',
        priority: ticket.priority || 'normal',
        channel: ticket.channel || 'chat',
        metadata: {
          legacy_id: ticket.id,
          client_name: ticket.client,
          migrated: true,
          created_from: 'chat_modal'
        },
        tags: ticket.tags || [],
        unread: ticket.unread || false,
        is_internal: false,
        last_message_at: new Date().toISOString()
      };
      
      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert([newTicketData])
        .select('id')
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar ticket no banco:', createError);
        return null;
      }
      
      console.log('✅ Novo ticket criado no banco:', newTicket.id);
      return newTicket.id;
      
    } catch (error) {
      console.error('❌ Erro ao garantir ticket no banco:', error);
      return null;
    }
  }, [ticket, getTicketUUID]);

  // Função para carregar mensagens do banco
  const loadMessages = React.useCallback(async () => {
    let ticketUUID = getTicketUUID();
    
    // Se não tem UUID, tentar criar/encontrar ticket no banco
    if (!ticketUUID) {
      console.log('🔄 Tentando garantir ticket no banco...');
      ticketUUID = await ensureTicketInDatabase();
    }
    
    if (!ticketUUID) {
      console.warn('❌ Não foi possível obter UUID do ticket');
      toast({
        title: "⚠️ Aviso",
        description: "Não foi possível carregar mensagens - ticket não encontrado no banco",
        variant: "destructive"
      });
      return;
    }
    
    console.log('📨 Carregando mensagens para ticket UUID:', ticketUUID);
    
    setIsLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketUUID)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        setMessages([]);
        return;
      }

      console.log('✅ Mensagens carregadas:', messagesData?.length || 0);

      const formattedMessages: SimpleMessage[] = (messagesData || []).map((msg, index) => {
        // Lógica aprimorada para identificar sender
        const isFromAgent = Boolean(msg.sender_id); // Se tem sender_id = agente
        const isFromWebhook = msg.metadata?.sent_from === 'webhook' || msg.metadata?.from_whatsapp;
        
        return {
          id: index + 1,
          content: msg.content || '',
          sender: isFromAgent ? 'agent' : 'client',
          senderName: msg.sender_name || (isFromAgent ? 'Agente' : (ticket?.client || 'Cliente')),
          timestamp: new Date(msg.created_at),
          isInternal: Boolean(msg.is_internal)
        };
      });

      console.log('📋 Mensagens formatadas:', formattedMessages.map(m => ({
        content: m.content.substring(0, 30) + '...',
        sender: m.sender,
        senderName: m.senderName,
        isInternal: m.isInternal
      })));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      setMessages([]);
          } finally {
        setIsLoading(false);
      }
    }, [getTicketUUID, ensureTicketInDatabase, toast]);

  // Função para enviar mensagem
  const handleSendMessage = React.useCallback(async () => {
    if (!newMessage.trim()) return;

    let ticketUUID = getTicketUUID();
    
    // Se não tem UUID, tentar criar/encontrar ticket no banco
    if (!ticketUUID) {
      console.log('🔄 Tentando garantir ticket no banco antes do envio...');
      ticketUUID = await ensureTicketInDatabase();
    }
    
    if (!ticketUUID) {
      console.warn('❌ Não foi possível obter UUID do ticket para envio');
      toast({
        title: "❌ Erro",
        description: "Não foi possível enviar mensagem - ticket não encontrado no banco",
        variant: "destructive"
      });
      return;
    }

    console.log('📤 Enviando mensagem para ticket UUID:', ticketUUID);

    try {
      // CORREÇÃO: O agente sempre envia mensagens (user?.id sempre deve estar presente)
      // isInternal apenas determina se a mensagem é visível para o cliente ou não
      const messageData = {
        ticket_id: ticketUUID,
        content: newMessage.trim(),
        sender_id: user?.id || null, // Sempre usar ID do usuário logado (agente)
        sender_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agente',
        type: 'text',
        is_internal: isInternal, // Nota interna = apenas equipe vê, pública = cliente também vê
        metadata: {
          sent_from: 'chat_interface',
          sent_by_agent: true, // Flag adicional para clarificar
          timestamp: new Date().toISOString(),
          message_type: isInternal ? 'internal_note' : 'public_response'
        }
      };

      console.log('📋 Dados da mensagem (AGENTE):', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem do AGENTE salva no banco:', data);

      // Adicionar mensagem localmente
      const newMsg: SimpleMessage = {
        id: Date.now(),
        content: newMessage.trim(),
        sender: 'agent', // SEMPRE agent quando enviado pelo sistema
        senderName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agente',
        timestamp: new Date(),
        isInternal
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      toast({
        title: `✅ ${isInternal ? 'Nota interna' : 'Resposta'} enviada`,
        description: isInternal 
          ? 'Nota interna salva - visível apenas para a equipe' 
          : 'Resposta enviada ao cliente com sucesso',
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: `Não foi possível enviar a mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
              });
      }
    }, [newMessage, getTicketUUID, ensureTicketInDatabase, isInternal, user, toast]);

  // Função para formatar data
  const formatTime = React.useCallback((date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // Carregar mensagens ao abrir - useEffect sempre executado
  useEffect(() => {
    if (isOpen && ticket) {
      loadMessages();
    }
  }, [isOpen, ticket, loadMessages]);

  // Early return APÓS todos os hooks serem definidos
  if (!ticket || !isOpen) {
    return null;
  }

  // Debug: verificar estrutura do ticket
  console.log('🎫 Ticket recebido no modal:', {
    id: ticket.id,
    originalId: (ticket as any)?.originalId,
    client: ticket.client,
    status: ticket.status
  });

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent 
        className="max-w-[98vw] w-full h-[95vh] p-0 gap-0 overflow-hidden"
        style={{ maxHeight: '95vh' }}
      >
        <VisuallyHidden>
          <DialogTitle>
            Chat do Ticket - {ticket?.title || ticket?.subject || 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Interface de chat para comunicação com o cliente.
          </DialogDescription>
        </VisuallyHidden>
        
        {/* Container principal com flexbox otimizado */}
        <div className="chat-main-layout">
          {/* Área principal do chat */}
          <div className="chat-content-area">
            {/* Header Aprimorado */}
            <div className="chat-header">
              {/* Linha principal do header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {ticket?.client ? ticket.client.charAt(0).toUpperCase() : 'C'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {ticket?.client || 'Cliente'}
                        </h2>
                        {ticket?.channel === 'whatsapp' && (
                          <Badge className="bg-green-100 text-green-700 border-green-300 px-2 py-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            WhatsApp
                          </Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Online agora</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">Ticket #{ticket?.id}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Último acesso há 2 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Status e Prioridade */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "status-badge font-medium px-3 py-1",
                        ticket?.status === 'finalizado' && 'bg-green-50 text-green-700 border-green-300',
                        ticket?.status === 'atendimento' && 'bg-blue-50 text-blue-700 border-blue-300',
                        ticket?.status === 'pendente' && 'bg-yellow-50 text-yellow-700 border-yellow-300'
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        ticket?.status === 'finalizado' && 'bg-green-500',
                        ticket?.status === 'atendimento' && 'bg-blue-500',
                        ticket?.status === 'pendente' && 'bg-yellow-500'
                      )}></div>
                      {ticket?.status || 'Pendente'}
                    </Badge>
                    
                    <Badge 
                      variant="outline"
                      className={cn(
                        "status-badge font-medium px-3 py-1",
                        ticket?.priority === 'alta' && 'bg-red-50 text-red-700 border-red-300',
                        ticket?.priority === 'média' && 'bg-orange-50 text-orange-700 border-orange-300',
                        ticket?.priority === 'baixa' && 'bg-gray-50 text-gray-700 border-gray-300'
                      )}
                    >
                      {ticket?.priority === 'alta' && <Zap className="w-3 h-3 mr-1" />}
                      {ticket?.priority || 'Normal'}
                    </Badge>
                  </div>
                  
                  {/* Controles de ação */}
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={cn(
                              "h-8 w-8 p-0",
                              soundEnabled ? "text-blue-600" : "text-gray-400"
                            )}
                          >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{soundEnabled ? 'Desativar som' : 'Ativar som'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCompactMode(!isCompactMode)}
                            className={cn(
                              "h-8 w-8 p-0",
                              isCompactMode ? "text-blue-600" : "text-gray-400"
                            )}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isCompactMode ? 'Modo normal' : 'Modo compacto'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <Minimize2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimizar chat</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          >
                            {showSidebar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{showSidebar ? 'Ocultar painel' : 'Mostrar painel'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fechar chat</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              {/* Barra de pesquisa e filtros */}
              <div className="px-4 pb-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar mensagens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-100"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={messageFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMessageFilter('all')}
                      className="h-9 px-3"
                    >
                      Todas
                    </Button>
                    <Button
                      variant={messageFilter === 'public' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMessageFilter('public')}
                      className="h-9 px-3"
                    >
                      Públicas
                    </Button>
                    <Button
                      variant={messageFilter === 'internal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMessageFilter('internal')}
                      className="h-9 px-3"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Internas
                    </Button>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMessages}
                          className="h-9 px-3"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atualizar mensagens</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {searchTerm && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Search className="w-4 h-4 inline mr-2" />
                    Buscando por: <span className="font-medium">"{searchTerm}"</span>
                    <span className="ml-2 text-blue-600">
                      {messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())).length} resultado(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensagens aprimorada */}
            <div className="chat-messages-area">
              <ScrollArea className="chat-scroll-container p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="relative w-8 h-8 mx-auto mb-3">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse loading-skeleton"></div>
                        <div className="absolute inset-1 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Carregando mensagens...</p>
                      <p className="text-xs text-gray-500 mt-1">Aguarde um momento</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma mensagem ainda</h3>
                      <p className="text-sm text-gray-600 mb-4">Inicie a conversa enviando sua primeira mensagem para este cliente.</p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Cliente online e pronto para conversar</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages
                      .filter(message => {
                        if (messageFilter === 'public') return !message.isInternal;
                        if (messageFilter === 'internal') return message.isInternal;
                        return true;
                      })
                      .filter(message => 
                        searchTerm === '' || 
                        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((message, index) => (
                        <div
                          key={message.id}
                          className={cn(
                            "group relative transition-all duration-200 message-bubble",
                            message.sender === 'agent' ? 'flex justify-end' : 'flex justify-start'
                          )}
                        >
                          {/* Avatar do remetente */}
                          {message.sender === 'client' && (
                            <Avatar className="w-8 h-8 mr-3 mt-auto ring-2 ring-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold">
                                {message.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "relative max-w-[75%] transition-all duration-200 group-hover:scale-[1.02]",
                            isCompactMode && "max-w-[85%]"
                          )}>
                            {/* Balão da mensagem */}
                            <div className={cn(
                              "relative rounded-2xl p-4 shadow-sm",
                              message.isInternal 
                                ? 'message-internal' 
                                : message.sender === 'agent'
                                  ? 'message-agent'
                                  : 'message-client',
                              isCompactMode && "p-3 rounded-xl"
                            )}>
                              {/* Header da mensagem */}
                              {message.isInternal && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-200">
                                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Eye className="w-3 h-3 text-orange-600" />
                                  </div>
                                  <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                                    Nota Interna - Privada
                                  </span>
                                  <Badge variant="outline" className="text-xs px-2 py-0 border-orange-300 text-orange-600">
                                    Confidencial
                                  </Badge>
                                </div>
                              )}
                              
                              {/* Conteúdo da mensagem */}
                              <div className="space-y-2">
                                <p className={cn(
                                  "text-sm leading-relaxed",
                                  message.isInternal ? 'text-orange-900' :
                                  message.sender === 'agent' ? 'text-white' : 'text-gray-900',
                                  isCompactMode && "text-xs leading-normal"
                                )}>
                                  {searchTerm && message.content.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: message.content.replace(
                                        new RegExp(`(${searchTerm})`, 'gi'),
                                        '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    message.content
                                  )}
                                </p>
                                
                                {message.isEdited && (
                                  <div className="flex items-center gap-1 text-xs opacity-60">
                                    <span className="italic">editada</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Footer da mensagem */}
                              <div className={cn(
                                "flex items-center justify-between mt-3 pt-2",
                                !isCompactMode && "border-t",
                                message.isInternal ? 'border-orange-200' :
                                message.sender === 'agent' ? 'border-blue-400/30' : 'border-gray-200'
                              )}>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-xs font-medium",
                                    message.isInternal ? 'text-orange-700' :
                                    message.sender === 'agent' ? 'text-blue-100' : 'text-gray-600'
                                  )}>
                                    {message.senderName}
                                  </span>
                                  
                                  {message.reactions && message.reactions.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {message.reactions.map((reaction, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                                          <span className="text-xs">{reaction.emoji}</span>
                                          <span className="text-xs font-medium">{reaction.count}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {favoriteMessages.has(message.id) && (
                                    <Star className={cn(
                                      "w-3 h-3",
                                      message.sender === 'agent' ? 'text-yellow-200' : 'text-yellow-500'
                                    )} />
                                  )}
                                  
                                  <span className={cn(
                                    "text-xs",
                                    message.isInternal ? 'text-orange-600' :
                                    message.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'
                                  )}>
                                    {formatTime(message.timestamp)}
                                  </span>
                                  
                                  {message.sender === 'agent' && (
                                    <CheckCircle2 className="w-3 h-3 text-green-300" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Ações hover */}
                              <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newFavorites = new Set(favoriteMessages);
                                          if (favoriteMessages.has(message.id)) {
                                            newFavorites.delete(message.id);
                                          } else {
                                            newFavorites.add(message.id);
                                          }
                                          setFavoriteMessages(newFavorites);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-yellow-50"
                                      >
                                        {favoriteMessages.has(message.id) ? 
                                          <Star className="w-3 h-3 text-yellow-500 fill-current" /> : 
                                          <StarOff className="w-3 h-3 text-gray-400" />
                                        }
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{favoriteMessages.has(message.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(message.content);
                                          toast({
                                            title: "📋 Copiado!",
                                            description: "Mensagem copiada para área de transferência",
                                          });
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-blue-50"
                                      >
                                        <Copy className="w-3 h-3 text-gray-400" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copiar mensagem</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setNewMessage(`@${message.senderName}: "${message.content}"\n\n`);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-green-50"
                                      >
                                        <Reply className="w-3 h-3 text-gray-400" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Responder</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          
                          {/* Avatar do agente */}
                          {message.sender === 'agent' && (
                            <Avatar className="w-8 h-8 ml-3 mt-auto ring-2 ring-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                {message.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    
                    {/* Indicador de digitação */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold">
                              {ticket?.client?.charAt(0).toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">digitando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              {/* Botão de scroll para baixo */}
              {showScrollDown && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Scroll para baixo (será implementado)
                      setShowScrollDown(false);
                    }}
                    className="h-10 w-10 rounded-full shadow-lg bg-white border-gray-200 hover:bg-gray-50"
                  >
                    <ArrowDown className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Área de input aprimorada */}
            <div className="chat-input-section">
              {/* Controles e opções */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer",
                          isInternal 
                            ? "bg-orange-500 border-orange-500" 
                            : "bg-gray-200 border-gray-300"
                        )}>
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all duration-200 transform",
                            isInternal ? "translate-x-4" : "translate-x-0"
                          )}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className={cn(
                          "w-4 h-4 transition-colors",
                          isInternal ? "text-orange-600" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "transition-colors font-medium",
                          isInternal ? "text-orange-700" : "text-gray-600"
                        )}>
                          {isInternal ? 'Nota Interna (Privada)' : 'Resposta ao Cliente'}
                        </span>
                      </div>
                    </label>
                    
                    {isInternal && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300 animate-fadeIn">
                        <Eye className="w-3 h-3 mr-1" />
                        Nota Interna - Cliente não verá
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          >
                            <Smile className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adicionar emoji</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-purple-600"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Respostas rápidas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              {/* Campo de entrada principal */}
              <div className="px-4 pb-4">
                <div className="relative">
                  <div className={cn(
                    "relative rounded-2xl border-2 transition-all duration-200 bg-white",
                    isInternal 
                      ? "border-orange-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100"
                      : "border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
                  )}>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        // Simular digitação
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 2000);
                      }}
                      placeholder={
                        isInternal 
                          ? "💭 Digite uma nota interna (visível apenas para a equipe)..." 
                          : "💬 Digite sua resposta para o cliente..."
                      }
                      className={cn(
                        "border-0 focus:ring-0 rounded-2xl pr-20 py-4 text-sm leading-relaxed resize-none",
                        "placeholder:text-gray-400 bg-transparent min-h-[48px] max-h-[120px]"
                      )}
                      rows={Math.min(Math.max(newMessage.split('\n').length, 2), 3)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault();
                          // Auto-completar ou sugestões
                        }
                      }}
                    />
                    
                    {/* Controles do input */}
                    <div className="absolute right-2 top-2 flex items-start gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                              title="Anexar arquivo"
                            >
                              <Paperclip className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Anexar arquivo (máx 10MB)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-full transition-all duration-200",
                          !newMessage.trim() 
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : isInternal
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl"
                              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        )}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Contador de caracteres */}
                  {newMessage.length > 0 && (
                    <div className="flex items-center justify-between mt-2 px-2">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>Caracteres: </span>
                          <span className={cn(
                            "font-medium",
                            newMessage.length > 1000 ? "text-red-600" : 
                            newMessage.length > 800 ? "text-orange-600" : "text-gray-600"
                          )}>
                            {newMessage.length}
                          </span>
                          {newMessage.length > 800 && (
                            <span className="text-gray-400">/ 1200</span>
                          )}
                        </div>
                        
                        <Separator orientation="vertical" className="h-3" />
                        
                        <span>
                          Linhas: {newMessage.split('\n').length}
                        </span>
                        
                        {newMessage.split(' ').filter(word => word.length > 0).length > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                              Palavras: {newMessage.split(' ').filter(word => word.length > 0).length}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {isInternal && (
                          <Badge variant="outline" className="text-xs px-2 py-0 border-orange-300 text-orange-600">
                            Nota Privada
                          </Badge>
                        )}
                        <span>Enter para enviar</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Atalhos e dicas */}
                <div className="flex items-center justify-between mt-3 px-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
                      <span>Enviar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
                      <span>Nova linha</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Tab</kbd>
                      <span>Sugestões</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {ticket?.channel === 'whatsapp' && (
                      <Badge variant="outline" className="text-xs px-2 py-1 border-green-300 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        WhatsApp Ativo
                      </Badge>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Wifi className="w-3 h-3 text-green-500" />
                            <span>Online</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Conexão estável - Mensagens serão entregues</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="w-80 border-l bg-gray-50/50 flex-shrink-0 overflow-y-auto">
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
                      className="w-full justify-start action-button"
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
                      className="w-full justify-start action-button"
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