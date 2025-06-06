import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRabbitMQ, type TicketMessage as RabbitMQMessage, type TicketEvent, type TypingIndicator } from '@/hooks/useRabbitMQ';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  Settings,
  Search,
  Star,
  StarOff,
  Copy,
  Forward,
  Reply,
  Download,
  FileText,
  Image,
  Video,
  Mic,
  VideoIcon,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  MessageCircle,
  Languages,
  Bot,
  Headphones,
  ScreenShare,
  Moon,
  Sun,
  Maximize,
  Archive,
  Flag,
  Heart,
  ThumbsUp,
  ThumbsDown
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [realTimeMessages, setRealTimeMessages] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // RabbitMQ Integration
  const {
    isConnected: mqConnected,
    connectionError: mqError,
    publishMessage,
    publishEvent,
    publishTyping,
    onMessage,
    onEvent,
    onTyping,
    typingUsers
  } = useRabbitMQ(ticket.id);
  
  // Estados para os modais das ações rápidas
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Estados para os dados do ticket (que podem ser alterados)
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<number>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Templates de resposta rápida
  const quickTemplates = [
    {
      id: 1,
      title: "Saudação",
      content: "Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?",
      category: "saudacao"
    },
    {
      id: 2,
      title: "Aguardando informações",
      content: "Obrigado pela informação. Vou analisar e retorno em breve com uma solução.",
      category: "processo"
    },
    {
      id: 3,
      title: "Problema resolvido",
      content: "Ótimo! O problema foi resolvido. Há mais alguma coisa em que posso ajudar?",
      category: "resolucao"
    },
    {
      id: 4,
      title: "Solicitar mais detalhes",
      content: "Para melhor atendê-lo, poderia fornecer mais detalhes sobre o problema?",
      category: "informacao"
    },
    {
      id: 5,
      title: "Encaminhar para especialista",
      content: "Vou encaminhar seu caso para nosso especialista. Você receberá retorno em até 24h.",
      category: "escalonamento"
    },
    {
      id: 6,
      title: "Agradecimento",
      content: "Muito obrigado por escolher nossos serviços! Sua opinião é muito importante para nós.",
      category: "finalizacao"
    }
  ];

  // Emojis populares
  const popularEmojis = ['😊', '👍', '👎', '❤️', '😢', '😮', '😄', '🎉', '🔥', '💯', '✅', '❌', '⚠️', '🚀', '💡', '📞', '📧', '📋', '⏰', '🔧'];

  // Mock data para responsáveis disponíveis
  const availableAgents = [
    { id: '1', name: 'João Silva', email: 'joao@empresa.com', department: 'Suporte Técnico', online: true },
    { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', department: 'Vendas', online: true },
    { id: '3', name: 'Pedro Costa', email: 'pedro@empresa.com', department: 'Suporte Técnico', online: false },
    { id: '4', name: 'Ana Oliveira', email: 'ana@empresa.com', department: 'Atendimento', online: true },
    { id: '5', name: 'Carlos Lima', email: 'carlos@empresa.com', department: 'Técnico', online: false },
  ];

  // Status disponíveis
  const availableStatuses = [
    { value: 'pendente', label: 'Pendente', color: 'amber', icon: Clock },
    { value: 'atendimento', label: 'Em Atendimento', color: 'blue', icon: MessageCircle },
    { value: 'aguardando', label: 'Aguardando Cliente', color: 'orange', icon: User },
    { value: 'resolvido', label: 'Resolvido', color: 'green', icon: CheckCircle2 },
    { value: 'finalizado', label: 'Finalizado', color: 'emerald', icon: Check },
    { value: 'cancelado', label: 'Cancelado', color: 'red', icon: X },
  ];

  // Tags disponíveis
  const availableTags = [
    'Bug', 'Feature Request', 'Urgente', 'Cliente VIP', 'Primeira Ocorrência',
    'Recorrente', 'Treinamento', 'Configuração', 'Integração', 'Performance'
  ];



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (textareaRef.current && !isMinimized) {
      textareaRef.current.focus();
    }
  }, [isMinimized, realTimeMessages]);

  // Função helper para gerar ID único e válido
  const generateUniqueId = (messageId: string): number => {
    // Extrair número do messageId ou gerar um baseado no timestamp
    const numericPart = messageId.match(/\d+/);
    if (numericPart) {
      const id = parseInt(numericPart[0]);
      if (!isNaN(id)) {
        return id;
      }
    }
    
    // Se não encontrar número válido, usar timestamp + hash simples
    let hash = 0;
    for (let i = 0; i < messageId.length; i++) {
      const char = messageId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const result = Math.abs(hash);
    
    // Debug para verificar se ainda há problemas
    if (isNaN(result)) {
      console.warn('🚨 ID inválido gerado:', { messageId, result });
      return Date.now(); // Fallback para timestamp atual
    }
    
    return result;
  };

  // Carregar mensagens iniciais via RabbitMQ
  useEffect(() => {
    // Simular carregamento de mensagens iniciais do histórico
    const loadInitialMessages = async () => {
      const baseTime = Date.now();
      const initialMessages: RabbitMQMessage[] = [
        {
          ticketId: currentTicket.id,
          messageId: `initial_${baseTime - 25 * 60 * 1000}`,
          content: 'Olá, estou com problema no sistema. Não consigo acessar minha conta.',
          sender: 'client',
          senderName: currentTicket.client,
          timestamp: new Date(baseTime - 25 * 60 * 1000),
          type: 'text',
          attachments: []
        },
        {
          ticketId: currentTicket.id,
          messageId: `initial_${baseTime - 23 * 60 * 1000}`,
          content: 'Olá! Vou verificar sua conta agora. Pode me informar seu e-mail de cadastro?',
          sender: 'agent',
          senderName: 'João Silva',
          timestamp: new Date(baseTime - 23 * 60 * 1000),
          type: 'text',
          attachments: []
        },
        {
          ticketId: currentTicket.id,
          messageId: `initial_${baseTime - 22 * 60 * 1000}`,
          content: 'Meu e-mail é cliente@exemplo.com',
          sender: 'client',
          senderName: currentTicket.client,
          timestamp: new Date(baseTime - 22 * 60 * 1000),
          type: 'text',
          attachments: []
        },
        {
          ticketId: currentTicket.id,
          messageId: `initial_${baseTime - 20 * 60 * 1000}`,
          content: 'Cliente verificado. Identificado problema na conta. Realizando correção.',
          sender: 'agent',
          senderName: 'João Silva',
          timestamp: new Date(baseTime - 20 * 60 * 1000),
          type: 'text',
          isInternal: true,
          attachments: []
        }
      ];

      // Carregar mensagens iniciais com delay para simular carregamento
      setTimeout(() => {
        initialMessages.forEach((msg, index) => {
          setTimeout(() => {
            const newMessage = {
              id: generateUniqueId(msg.messageId),
              content: msg.content,
              sender: msg.sender,
              senderName: msg.senderName,
              timestamp: new Date(msg.timestamp),
              type: msg.type,
              status: 'read',
              isInternal: msg.isInternal,
              attachments: msg.attachments || []
            };

            setRealTimeMessages(prev => {
              // Garantir ID único para mensagens iniciais
              let uniqueId = newMessage.id;
              while (prev.find(m => m.id === uniqueId)) {
                uniqueId = uniqueId + 1;
              }
              
              const messageWithUniqueId = { ...newMessage, id: uniqueId };
              return [...prev, messageWithUniqueId];
            });

            // Marcar como carregado quando a última mensagem for adicionada
            if (index === initialMessages.length - 1) {
              setTimeout(() => setIsLoadingHistory(false), 200);
            }
          }, index * 300);
        });
      }, 500);
    };

    loadInitialMessages();
  }, [currentTicket.id]);

  // RabbitMQ Message Listeners
  useEffect(() => {
    const unsubscribeMessage = onMessage((rabbitMessage: RabbitMQMessage) => {
      // Converter mensagem do RabbitMQ para formato local
      const newMessage = {
        id: generateUniqueId(rabbitMessage.messageId),
        content: rabbitMessage.content,
        sender: rabbitMessage.sender,
        senderName: rabbitMessage.senderName,
        timestamp: new Date(rabbitMessage.timestamp),
        type: rabbitMessage.type,
        status: 'read',
        isInternal: rabbitMessage.isInternal,
        attachments: rabbitMessage.attachments || []
      };

      setRealTimeMessages(prev => {
        // Evitar duplicatas e garantir ID único
        let uniqueId = newMessage.id;
        while (prev.find(msg => msg.id === uniqueId)) {
          uniqueId = uniqueId + 1;
        }
        
        const messageWithUniqueId = { ...newMessage, id: uniqueId };
        return [...prev, messageWithUniqueId];
      });

      // Toast para novas mensagens (apenas se não for do usuário atual)
      if (rabbitMessage.sender === 'client' && !rabbitMessage.isInternal) {
        toast({
          title: "💬 Nova mensagem",
          description: `${rabbitMessage.senderName}: ${rabbitMessage.content.substring(0, 50)}${rabbitMessage.content.length > 50 ? '...' : ''}`,
        });
      }
    });

    const unsubscribeEvent = onEvent((event: TicketEvent) => {
      console.log('📨 Evento recebido:', event);
      
      // Toast para eventos importantes
      if (event.eventType === 'status_change') {
        toast({
          title: "📋 Status alterado",
          description: `Ticket alterado para: ${event.data.newStatus}`,
        });
      } else if (event.eventType === 'assignment') {
        toast({
          title: "👤 Responsável alterado",
          description: `Ticket atribuído para: ${event.data.assignedTo}`,
        });
      }
    });

    const unsubscribeTyping = onTyping((typing: TypingIndicator) => {
      // Atualizar indicador de digitação
      if (typing.ticketId === ticket.id && typing.userType === 'client') {
        setIsTyping(typing.isTyping);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeEvent();
      unsubscribeTyping();
    };
  }, [onMessage, onEvent, onTyping, ticket.id, toast]);

  // Indicador de status do RabbitMQ
  useEffect(() => {
    if (mqError) {
      toast({
        title: "⚠️ Erro de Conexão",
        description: "Problema na comunicação em tempo real. Tentando reconectar...",
        variant: "destructive"
      });
    }
  }, [mqError, toast]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Criar mensagem para RabbitMQ
      const rabbitMessage: RabbitMQMessage = {
        ticketId: currentTicket.id,
        messageId: `msg_${Date.now()}`,
        content: message,
        sender: 'agent',
        senderName: 'João Silva', // TODO: pegar do contexto do usuário
        timestamp: new Date(),
        type: 'text',
        isInternal,
        attachments: []
      };

      // Enviar via RabbitMQ
      await publishMessage(rabbitMessage);

      // Publicar evento de nova mensagem
      await publishEvent({
        ticketId: currentTicket.id,
        eventType: 'message',
        timestamp: new Date(),
        data: {
          messageId: rabbitMessage.messageId,
          isInternal,
          messageType: 'text'
        },
        userId: 'agent_1', // TODO: pegar do contexto
        userType: 'agent'
      });

      setLastSentMessage(Date.now());
      setMessage('');
      
      setTimeout(() => setLastSentMessage(null), 2000);
      
      toast({
        title: "✅ Mensagem enviada",
        description: isInternal ? "Nota interna adicionada" : "Mensagem enviada para o cliente",
      });
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleTemplateSelect = (template: any) => {
    setMessage(template.content);
    setShowTemplatesModal(false);
    textareaRef.current?.focus();
    
    toast({
      title: "📝 Template aplicado",
      description: `Template "${template.title}" foi adicionado à mensagem`,
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Fazendo upload do arquivo:', file.name);
        
        // Simular progresso de upload
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      toast({
        title: "📎 Arquivo enviado",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
      });
      
    } catch (error) {
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        title: "🎤 Gravação finalizada",
        description: "Áudio gravado com sucesso",
      });
    } else {
      setIsRecording(true);
      toast({
        title: "🎤 Gravando áudio...",
        description: "Clique novamente para parar",
      });
    }
  };

  const toggleFavoriteMessage = (messageId: number) => {
    setFavoriteMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        toast({ title: "⭐ Removido dos favoritos" });
      } else {
        newSet.add(messageId);
        toast({ title: "⭐ Adicionado aos favoritos" });
      }
      return newSet;
    });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "📋 Copiado",
      description: "Mensagem copiada para a área de transferência",
    });
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

  const handleFinishTicket = async () => {
    if (!confirm('Tem certeza que deseja finalizar este ticket?')) return;
    
    setIsFinishingTicket(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentTicket({ ...currentTicket, status: 'finalizado' });
      
      toast({
        title: '🎉 Ticket finalizado',
        description: 'Ticket finalizado com sucesso!',
      });
      onClose();
      
    } catch (error) {
      toast({
        title: 'Erro ao finalizar ticket',
        description: 'Erro ao finalizar ticket. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsFinishingTicket(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
    // Ctrl/Cmd + F para buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(!showSearch);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedAgent = availableAgents.find(agent => agent.id === newAssignee);
      
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedStatus = availableStatuses.find(status => status.value === newStatus);
      
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden border-0 animate-in fade-in-0 zoom-in-95 duration-300 relative z-10 mt-8">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className={cn(
            "px-6 py-5 flex items-center justify-between rounded-tl-xl transition-colors duration-200",
            isDarkMode 
              ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white" 
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          )}>
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">Ticket #{currentTicket.id}</h2>
                  <p className="text-blue-100 text-sm truncate">{currentTicket.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={cn("text-xs font-medium px-3 py-1 backdrop-blur-sm", getStatusColor(currentTicket.status))}>
                  {currentTicket.status}
                </Badge>
                <Badge className={cn("text-xs font-medium px-3 py-1 border backdrop-blur-sm", getPriorityColor(currentTicket.priority))}>
                  {currentTicket.priority}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Indicador de status do cliente */}
              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/90">Cliente online</span>
              </div>

              {/* Indicador de status do RabbitMQ */}
              <div className={cn(
                "flex items-center space-x-2 px-3 py-1 rounded-full",
                mqConnected 
                  ? "bg-green-500/20 text-green-100" 
                  : "bg-red-500/20 text-red-100"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  mqConnected 
                    ? "bg-green-400 animate-pulse" 
                    : "bg-red-400"
                )}></div>
                <span className="text-xs">
                  {mqConnected ? "Tempo real ativo" : "Reconectando..."}
                </span>
              </div>

              {/* Actions */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Iniciar chamada</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Videochamada</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <ScreenShare className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartilhar tela</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Bot className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>IA Assistant</TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-white/20 mx-1"></div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsMinimized(true)} 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Minimizar</TooltipContent>
                </Tooltip>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Flag className="w-4 h-4 mr-2" />
                        Marcar importante
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Forward className="w-4 h-4 mr-2" />
                        Encaminhar
                      </Button>
                      <Separator />
                      <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
                        <X className="w-4 h-4 mr-2" />
                        Fechar ticket
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClose} 
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fechar chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className={cn(
              "flex-1 overflow-y-auto p-6 space-y-4 relative",
              isDarkMode 
                ? "bg-gradient-to-b from-gray-900 to-gray-800" 
                : "bg-gradient-to-b from-gray-50 to-white",
              dragOver && "bg-blue-50 border-2 border-dashed border-blue-300"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Search Bar */}
            {showSearch && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm mb-4 animate-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar nas mensagens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(false)}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Drag & Drop Overlay */}
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 backdrop-blur-sm z-20 border-2 border-dashed border-blue-400 rounded-lg">
                <div className="text-center">
                  <Paperclip className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                  <p className="text-lg font-semibold text-blue-700">Solte os arquivos aqui</p>
                  <p className="text-sm text-blue-600">Suporte para imagens, documentos e vídeos</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm mb-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enviando arquivo...</p>
                    <Progress value={uploadProgress} className="h-2 mt-1" />
                  </div>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Indicador de carregamento das mensagens */}
            {isLoadingHistory && (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando histórico de mensagens via RabbitMQ...</span>
                </div>
              </div>
            )}

            {/* Mensagens em tempo real via RabbitMQ */}
            {!isLoadingHistory && realTimeMessages.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Todas as mensagens aparecerão aqui via RabbitMQ</p>
                </div>
              </div>
            )}
            
            {realTimeMessages
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  "flex animate-in slide-in-from-bottom-2 duration-300 group",
                  msg.sender === 'client' ? 'justify-start' : 'justify-end',
                  searchQuery && !msg.content.toLowerCase().includes(searchQuery.toLowerCase()) && "opacity-30"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-end space-x-2 max-w-[75%] relative">
                  {msg.sender === 'client' && (
                    <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
                        {currentTicket.client.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="relative">
                    {/* Message Actions - aparecem no hover */}
                    <div className={cn(
                      "absolute -top-8 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
                      msg.sender === 'client' ? "left-0" : "right-0"
                    )}>
                      <TooltipProvider>
                        <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleFavoriteMessage(msg.id)}
                              >
                                {favoriteMessages.has(msg.id) ? (
                                  <Star className="w-3 h-3 text-amber-500 fill-current" />
                                ) : (
                                  <StarOff className="w-3 h-3 text-gray-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Favoritar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyMessage(msg.content)}
                              >
                                <Copy className="w-3 h-3 text-gray-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copiar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setMessage(`> ${msg.content}\n\n`)}
                              >
                                <Reply className="w-3 h-3 text-gray-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Responder</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>

                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md relative",
                        msg.sender === 'client'
                          ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                          : msg.isInternal
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-br-sm'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm',
                        favoriteMessages.has(msg.id) && "ring-2 ring-amber-300"
                      )}
                    >
                      {/* Favorite indicator */}
                      {favoriteMessages.has(msg.id) && (
                        <Star className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-current" />
                      )}

                      {msg.isInternal && (
                        <div className="text-xs font-medium mb-2 flex items-center text-amber-700">
                          <Tag className="w-3 h-3 mr-1" />
                          Nota Interna
                        </div>
                      )}
                      
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.attachments.map((attachment: any) => (
                            <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-black/5 rounded-lg">
                              <div className="flex-shrink-0">
                                {attachment.type === 'image' ? (
                                  <Image className="w-4 h-4 text-blue-600" />
                                ) : attachment.type === 'video' ? (
                                  <Video className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                <p className="text-xs opacity-75">{attachment.size}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
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

            {/* Typing Indicator - RabbitMQ Real-time */}
            {(isTyping || typingUsers.size > 0) && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-2">
                  <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
                      {currentTicket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      {mqConnected && (
                        <span className="text-xs text-gray-500 ml-2">digitando...</span>
                      )}
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

            {/* Painel de Feedback - aparece quando ticket está resolvido */}
            {currentTicket.status === 'resolvido' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mx-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Problema resolvido!</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Esperamos ter ajudado com sua solicitação. Que tal avaliar nosso atendimento?
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        onClick={() => {
                          toast({
                            title: "⭐ Obrigado pela avaliação!",
                            description: `Você avaliou nosso atendimento com ${star} estrela${star > 1 ? 's' : ''}`,
                          });
                        }}
                      >
                        <Star className="w-5 h-5 text-amber-400 hover:fill-current transition-colors" />
                      </Button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-center space-x-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Excelente
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Deixar comentário
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className={cn(
            "border-t p-4 transition-colors duration-200",
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
          )}>
            {/* Top Bar com controles */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
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

              {/* Quick Actions */}
              <div className="flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSearch(!showSearch)}
                        className="h-8 w-8 p-0"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Buscar mensagens (Ctrl+F)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="h-8 w-8 p-0"
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Alternar tema</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Main Input Area */}
            <div className="flex space-x-3">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Arquivo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current?.setAttribute('accept', 'image/*');
                      }}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Imagem
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current?.setAttribute('accept', 'video/*');
                      }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Vídeo
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div>
                    <h3 className="font-medium mb-3">Emojis Populares</h3>
                    <div className="grid grid-cols-10 gap-1">
                      {popularEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Templates */}
              <Popover open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    <Zap className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4">
                  <div>
                    <h3 className="font-medium mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                      Templates de Resposta
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {quickTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Voice Recording */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        isRecording && "bg-red-50 border-red-300 text-red-600"
                      )}
                      onClick={handleVoiceRecording}
                    >
                      {isRecording ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Parar gravação" : "Gravar áudio"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Text Area */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    
                    // Publicar indicador de digitação
                    if (e.target.value.length > 0) {
                      publishTyping({
                        ticketId: currentTicket.id,
                        userId: 'agent_1',
                        userType: 'agent',
                        isTyping: true,
                        timestamp: new Date()
                      });
                    }
                  }}
                  placeholder={isInternal ? "Digite uma nota interna..." : "Digite sua mensagem... (Ctrl+Enter para enviar)"}
                  className={cn(
                    "min-h-[48px] max-h-[120px] resize-none transition-colors",
                    isInternal 
                      ? "border-amber-300 focus:border-amber-500 focus:ring-amber-500" 
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                    isDarkMode && "bg-gray-700 border-gray-600 text-white"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
                
                {/* Character counter */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {message.length}/1000
                </div>
              </div>
              
              {/* Send Button */}
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isSending || message.length > 1000}
                className={cn(
                  "transition-all duration-200 relative overflow-hidden",
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
            
            {/* Bottom hints */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Ctrl+Enter: enviar</span>
                <span>Shift+Enter: nova linha</span>
                <span>Ctrl+F: buscar</span>
              </div>
              <div className="flex items-center space-x-2">
                {isRecording && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span>Gravando...</span>
                  </div>
                )}
                <span>Esc: fechar</span>
              </div>
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
                  onClick={() => setShowClientModal(true)}
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
