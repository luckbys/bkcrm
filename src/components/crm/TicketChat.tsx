import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Send, 
  Paperclip, 
  Phone, 
  Mail, 
  MessageSquare,
  Clock,
  User,
  Building,
  Tag,
  MoreVertical,
  Smile,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Plus,
  Eye,
  UserCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
}

export const TicketChat = ({ ticket, onClose }: TicketChatProps) => {
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<number | null>(null);
  const [isFinishingTicket, setIsFinishingTicket] = useState(false);
  
  // Estados para os modais das ações rápidas
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // Estados para os dados do ticket (que podem ser alterados)
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock data para responsáveis disponíveis
  const availableAgents = [
    { id: '1', name: 'João Silva', email: 'joao@empresa.com', department: 'Suporte Técnico' },
    { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', department: 'Vendas' },
    { id: '3', name: 'Pedro Costa', email: 'pedro@empresa.com', department: 'Suporte Técnico' },
    { id: '4', name: 'Ana Oliveira', email: 'ana@empresa.com', department: 'Atendimento' },
    { id: '5', name: 'Carlos Lima', email: 'carlos@empresa.com', department: 'Técnico' },
  ];

  // Status disponíveis
  const availableStatuses = [
    { value: 'pendente', label: 'Pendente', color: 'amber' },
    { value: 'atendimento', label: 'Em Atendimento', color: 'blue' },
    { value: 'aguardando', label: 'Aguardando Cliente', color: 'orange' },
    { value: 'resolvido', label: 'Resolvido', color: 'green' },
    { value: 'finalizado', label: 'Finalizado', color: 'emerald' },
    { value: 'cancelado', label: 'Cancelado', color: 'red' },
  ];

  // Tags disponíveis
  const availableTags = [
    'Bug', 'Feature Request', 'Urgente', 'Cliente VIP', 'Primeira Ocorrência',
    'Recorrente', 'Treinamento', 'Configuração', 'Integração', 'Performance'
  ];

  const mockMessages = [
    {
      id: 1,
      content: 'Olá, estou com problema no sistema. Não consigo acessar minha conta.',
      sender: 'client',
      senderName: currentTicket.client,
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 min atrás
      type: 'text',
      status: 'read'
    },
    {
      id: 2,
      content: 'Olá! Vou verificar sua conta agora. Pode me informar seu e-mail de cadastro?',
      sender: 'agent',
      senderName: 'João Silva',
      timestamp: new Date(Date.now() - 23 * 60 * 1000), // 23 min atrás
      type: 'text',
      status: 'read'
    },
    {
      id: 3,
      content: 'Meu e-mail é cliente@exemplo.com',
      sender: 'client',
      senderName: currentTicket.client,
      timestamp: new Date(Date.now() - 22 * 60 * 1000), // 22 min atrás
      type: 'text',
      status: 'read'
    },
    {
      id: 4,
      content: 'Cliente verificado. Identificado problema na conta. Realizando correção.',
      sender: 'agent',
      senderName: 'João Silva',
      timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 min atrás
      type: 'internal',
      isInternal: true,
      status: 'read'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Auto-focus no textarea quando o chat abre
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Simular digitação do cliente
    const typingTimer = Math.random() > 0.7 ? setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 2000) : null;

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Simular envio da mensagem
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('Enviando mensagem:', {
        content: message,
        isInternal,
        ticketId: currentTicket.id
      });

      setLastSentMessage(Date.now());
      setMessage('');
      
      // Simular confirmação de entrega
      setTimeout(() => setLastSentMessage(null), 2000);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleFinishTicket = async () => {
    if (!confirm('Tem certeza que deseja finalizar este ticket?')) return;
    
    setIsFinishingTicket(true);
    
    try {
      // Simular API call para finalizar ticket
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Finalizando ticket:', currentTicket.id);
      
      // Atualizar o status do ticket localmente
      setCurrentTicket({
        ...currentTicket,
        status: 'finalizado'
      });
      
      toast({
        title: 'Ticket finalizado',
        description: 'Ticket finalizado com sucesso!',
      });
      onClose(); // Fechar o chat após finalizar
      
    } catch (error) {
      console.error('Erro ao finalizar ticket:', error);
      toast({
        title: 'Erro ao finalizar ticket',
        description: 'Erro ao finalizar ticket. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsFinishingTicket(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
      'atendimento': 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
      'finalizado': 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
      'cancelado': 'bg-red-50 text-red-700 border-red-200 shadow-sm'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200 shadow-sm';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'text-red-600 bg-red-50 border-red-200',
      'normal': 'text-blue-600 bg-blue-50 border-blue-200',
      'baixa': 'text-emerald-600 bg-emerald-50 border-emerald-200'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Função para alterar responsável
  const handleAssignTicket = async () => {
    if (!newAssignee) {
      toast({
        title: 'Erro',
        description: 'Selecione um responsável',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedAgent = availableAgents.find(agent => agent.id === newAssignee);
      
      console.log('Alterando responsável do ticket:', {
        ticketId: currentTicket.id,
        newAssignee: selectedAgent?.name,
        agentId: newAssignee
      });

      // Atualizar o ticket localmente
      setCurrentTicket({
        ...currentTicket,
        assignedTo: selectedAgent?.name || 'Não atribuído'
      });

      toast({
        title: 'Responsável alterado',
        description: `Ticket atribuído para ${selectedAgent?.name}`,
      });

      setShowAssignModal(false);
      setNewAssignee('');
      
    } catch (error) {
      console.error('Erro ao alterar responsável:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar responsável. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para alterar status
  const handleChangeStatus = async () => {
    if (!newStatus) {
      toast({
        title: 'Erro',
        description: 'Selecione um status',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedStatus = availableStatuses.find(status => status.value === newStatus);
      
      console.log('Alterando status do ticket:', {
        ticketId: currentTicket.id,
        oldStatus: currentTicket.status,
        newStatus: newStatus
      });

      // Atualizar o ticket localmente
      setCurrentTicket({
        ...currentTicket,
        status: newStatus
      });

      toast({
        title: 'Status alterado',
        description: `Status alterado para "${selectedStatus?.label}"`,
      });

      setShowStatusModal(false);
      setNewStatus('');
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para adicionar etiqueta
  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma etiqueta',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('Adicionando etiqueta ao ticket:', {
        ticketId: currentTicket.id,
        tag: newTag
      });

      // Atualizar o ticket localmente (assumindo que existe um array de tags)
      const currentTags = currentTicket.tags || [];
      if (!currentTags.includes(newTag)) {
        setCurrentTicket({
          ...currentTicket,
          tags: [...currentTags, newTag]
        });
      }

      toast({
        title: 'Etiqueta adicionada',
        description: `Etiqueta "${newTag}" adicionada ao ticket`,
      });

      setShowTagModal(false);
      setNewTag('');
      
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar etiqueta. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para ver detalhes do cliente
  const handleViewClient = () => {
    console.log('Visualizando cliente:', currentTicket.client);
    
    // Aqui você pode implementar navegação para uma página de detalhes do cliente
    // ou abrir um modal com as informações completas
    toast({
      title: 'Abrindo perfil do cliente',
      description: `Carregando informações de ${currentTicket.client}`,
    });
    
    setShowClientModal(true);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Card className="w-80 shadow-xl border-0">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Ticket #{currentTicket.id}</span>
                <Badge className="bg-white/20 text-white border-white/30">
                  {currentTicket.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsMinimized(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw !important',
        height: '100vh !important',
        zIndex: '999999 !important',
        margin: '0 !important',
        padding: '1rem'
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden border-0 animate-in fade-in-0 zoom-in-95 duration-300 relative z-10">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-tl-xl">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">Ticket #{currentTicket.id}</h2>
                  <p className="text-blue-100 text-sm truncate">{currentTicket.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={cn("text-xs font-medium px-3 py-1", getStatusColor(currentTicket.status))}>
                  {currentTicket.status}
                </Badge>
                <Badge className={cn("text-xs font-medium px-3 py-1 border", getPriorityColor(currentTicket.priority))}>
                  {currentTicket.priority}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="text-white hover:bg-white/20">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <MoreVertical className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {mockMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  "flex animate-in slide-in-from-bottom-2 duration-300",
                  msg.sender === 'client' ? 'justify-start' : 'justify-end'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-end space-x-2 max-w-[70%]">
                  {msg.sender === 'client' && (
                    <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
                        {currentTicket.client.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
                      msg.sender === 'client'
                        ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        : msg.isInternal
                        ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-br-sm'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm',
                      "relative group"
                    )}
                  >
                    {msg.isInternal && (
                      <div className="text-xs font-medium mb-2 flex items-center text-amber-700">
                        <Tag className="w-3 h-3 mr-1" />
                        Nota Interna
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={cn(
                      "flex items-center justify-between mt-2 text-xs",
                      msg.sender === 'client' ? 'text-gray-500' : msg.isInternal ? 'text-amber-600' : 'text-blue-100'
                    )}>
                      <span className="font-medium">{msg.senderName}</span>
                      <div className="flex items-center space-x-1">
                        <span>{formatRelativeTime(msg.timestamp)}</span>
                        {msg.sender === 'agent' && !msg.isInternal && (
                          <CheckCheck className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>

                  {msg.sender === 'agent' && !msg.isInternal && (
                    <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-xs">
                        JS
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-2">
                  <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
                      {currentTicket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Confirmação de envio */}
            {lastSentMessage && (
              <div className="flex justify-center">
                <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs text-green-700 flex items-center space-x-1 animate-in fade-in duration-300">
                  <Check className="w-3 h-3" />
                  <span>Mensagem enviada</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-4 h-4 rounded border-2 transition-all duration-200",
                    isInternal 
                      ? "bg-amber-500 border-amber-500" 
                      : "border-gray-300 group-hover:border-amber-400"
                  )}>
                    {isInternal && <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                  </div>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-amber-600 transition-colors">
                  Nota interna
                </span>
              </label>
              
              {isInternal && (
                <div className="flex items-center text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Visível apenas para agentes
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="hover:bg-gray-50">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-gray-50">
                <Smile className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isInternal ? "Digite uma nota interna..." : "Digite sua mensagem..."}
                  className={cn(
                    "min-h-[48px] max-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors",
                    isInternal && "border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
                {isSending && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isSending}
                className={cn(
                  "transition-all duration-200",
                  isInternal 
                    ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" 
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                )}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>Enter para enviar, Shift+Enter para nova linha</span>
              <span>Esc para fechar</span>
            </div>
          </div>
        </div>

        {/* Ticket Info Sidebar */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col rounded-tr-xl overflow-hidden">
          <div className="p-6 border-b bg-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Informações do Ticket
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <div className="flex items-center space-x-3 mt-2">
                  <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                      {currentTicket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{currentTicket.client}</p>
                    <p className="text-sm text-gray-500 truncate">cliente@exemplo.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Assunto</label>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">{currentTicket.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Canal</label>
                  <Badge variant="outline" className="mt-1 w-full justify-center">
                    {currentTicket.channel}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Responsável</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {currentTicket.assignedTo || 'Não atribuído'}
                  </p>
                </div>
              </div>

              {/* Exibir tags se existirem */}
              {currentTicket.tags && currentTicket.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Etiquetas</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Última Atividade</label>
                <p className="mt-1 text-sm text-gray-500">{currentTicket.lastMessage}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  onClick={() => setShowAssignModal(true)}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Alterar Responsável
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-green-50 hover:border-green-300 transition-colors"
                  onClick={() => setShowStatusModal(true)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Alterar Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  onClick={handleViewClient}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Cliente
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "w-full justify-start transition-colors",
                    currentTicket.status === 'finalizado' 
                      ? "bg-green-50 border-green-300 text-green-700 cursor-not-allowed"
                      : "hover:bg-green-50 hover:border-green-300"
                  )}
                  onClick={handleFinishTicket}
                  disabled={isFinishingTicket || currentTicket.status === 'finalizado'}
                >
                  {currentTicket.status === 'finalizado' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Ticket Finalizado
                    </>
                  ) : isFinishingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar Ticket
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  onClick={() => setShowTagModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Etiqueta
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-green-600" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '14:25', action: 'Ticket criado', icon: MessageSquare, color: 'text-blue-600' },
                    { time: '14:30', action: 'Atribuído para João Silva', icon: User, color: 'text-green-600' },
                    { time: '14:32', action: 'Status alterado para "Em Atendimento"', icon: Clock, color: 'text-amber-600' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={cn("p-1 rounded-full bg-gray-100", item.color)}>
                        <item.icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900">{item.time}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal para Alterar Responsável */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
              Alterar Responsável
            </DialogTitle>
            <DialogDescription>
              Selecione o novo responsável para este ticket.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Responsável</Label>
              <Select value={newAssignee} onValueChange={setNewAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                            {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-gray-500">{agent.department}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignTicket} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Responsável'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Alterar Status */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Alterar Status
            </DialogTitle>
            <DialogDescription>
              Selecione o novo status para este ticket.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-3 h-3 rounded-full", {
                          'bg-amber-400': status.color === 'amber',
                          'bg-blue-400': status.color === 'blue',
                          'bg-orange-400': status.color === 'orange',
                          'bg-green-400': status.color === 'green',
                          'bg-emerald-400': status.color === 'emerald',
                          'bg-red-400': status.color === 'red',
                        })} />
                        <span>{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Etiqueta */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="w-5 h-5 mr-2 text-amber-600" />
              Adicionar Etiqueta
            </DialogTitle>
            <DialogDescription>
              Adicione uma etiqueta para categorizar este ticket.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag">Etiqueta</Label>
              <Select value={newTag} onValueChange={setNewTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou digite uma etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span>{tag}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="custom-tag">Ou digite uma etiqueta personalizada</Label>
              <Input
                id="custom-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Digite uma nova etiqueta..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTag} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Etiqueta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Ver Cliente */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2 text-purple-600" />
              Detalhes do Cliente
            </DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 ring-4 ring-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl">
                      {currentTicket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{currentTicket.client}</h3>
                    <p className="text-gray-600">Cliente Premium</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-500">Online agora</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">E-mail</Label>
                  <p className="text-sm">cliente@exemplo.com</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                  <p className="text-sm">(11) 99999-9999</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Empresa</Label>
                  <p className="text-sm">Empresa Exemplo Ltda</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Tickets Totais</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-sm text-gray-600">Resolvidos</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">4.5</p>
                  <p className="text-sm text-gray-600">Avaliação Média</p>
                </div>
              </Card>
            </div>

            {/* Histórico recente */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Histórico Recente</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[
                  { date: '2024-01-15', action: 'Ticket #12345 resolvido', type: 'success' },
                  { date: '2024-01-10', action: 'Ticket #12344 criado', type: 'info' },
                  { date: '2024-01-05', action: 'Avaliação 5 estrelas', type: 'success' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={cn("w-2 h-2 rounded-full", {
                      'bg-green-400': item.type === 'success',
                      'bg-blue-400': item.type === 'info',
                    })} />
                    <div className="flex-1">
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientModal(false)}>
              Fechar
            </Button>
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              Enviar E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
