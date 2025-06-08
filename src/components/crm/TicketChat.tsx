import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useTicketsDB, DatabaseTicket } from '@/hooks/useTicketsDB';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Smile,
  Loader2,
  Check,
  CheckCheck,
  Minimize2,
  CheckCircle2,
  Eye,
  UserCheck,
  Settings,
  Star,
  StarOff,
  Copy,
  Forward,
  Reply,
  FileText,
  Zap,
  MessageCircle,
  Bot,
  Moon,
  Sun,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { evolutionApiService } from '@/services/evolutionApiService';
import { useWebhookResponses } from '@/hooks/useWebhookResponses';


interface TicketChatProps {
  ticket: any;
  onClose: () => void;
}

interface LocalMessage {
  id: number;
  content: string;
  sender: 'client' | 'agent';
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'internal' | 'system';
  status: 'sent' | 'delivered' | 'read';
  isInternal?: boolean;
  attachments: {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
  }[];
}

export const TicketChat = ({ ticket, onClose }: TicketChatProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchMessages, sendMessage, createTicket } = useTicketsDB();
  const { evolutionMessages } = useWebhookResponses(ticket?.id?.toString());
  
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem(`chat-minimized-${ticket.id}`) === 'true';
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSentMessage, setLastSentMessage] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<LocalMessage | null>(null);
  const [realTimeMessages, setRealTimeMessages] = useState<LocalMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Estados para os modais das ações rápidas
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // Estados para os dados do ticket (que podem ser alterados)
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isUpdating] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<number>>(new Set());
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  
  // Estados para integração WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [whatsappInstance, setWhatsappInstance] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  
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
      content: "Vou encaminhar seu caso para nossa equipe especializada. Retornaremos em breve.",
      category: "encaminhamento"
    }
  ];

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Função para obter o ticket ID real (UUID do banco de dados)
  const getRealTicketId = useCallback(async (ticketCompatibilityId: number | string): Promise<string | null> => {
    try {
      // Se já é uma string UUID, usar diretamente
      if (typeof ticketCompatibilityId === 'string' && ticketCompatibilityId.includes('-')) {
        return ticketCompatibilityId;
      }

      // Buscar por tickets existentes para encontrar correspondência
      const { data: existingTickets, error } = await supabase
        .from('tickets')
        .select('id, title, subject, metadata')
        .limit(100);

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        return null;
      }

      // Tentar encontrar correspondência baseada no subject/title
      const matchingTicket = existingTickets?.find(t => 
        t.title === currentTicket.subject || 
        t.subject === currentTicket.subject ||
        t.metadata?.client_name === currentTicket.client
      );

      if (matchingTicket) {
        console.log('🎯 Ticket encontrado no banco:', matchingTicket.id);
        return matchingTicket.id;
      }

      // Se não encontrou, pode ser um ticket mock - retornar null para criar
      console.log('⚠️ Ticket não encontrado no banco (dados mock)');
      return null;
    } catch (error) {
      console.error('Erro ao obter ticket ID real:', error);
      return null;
    }
  }, [currentTicket]);




  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;

      try {
        // Carregar perfil do usuário atual
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError);
        } else {
          setCurrentUserProfile(profile);
        }

        // Carregar agentes disponíveis
        const { data: agents, error: agentsError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            department
          `)
          .in('role', ['agent', 'admin'])
          .eq('is_active', true);

        if (agentsError) {
          console.error('Erro ao carregar agentes:', agentsError);
        } else {
          setAvailableAgents(agents || []);
        }

        // Verificar instância WhatsApp do ticket
        if (currentTicket?.metadata?.evolution_instance_name) {
          setWhatsappInstance(currentTicket.metadata.evolution_instance_name);
          await checkWhatsAppStatus(currentTicket.metadata.evolution_instance_name);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };

    loadInitialData();
  }, [user, currentTicket]);

  // Verificar status da instância WhatsApp
  const checkWhatsAppStatus = async (instanceName: string) => {
    try {
      const status = await evolutionApiService.getInstanceStatus(instanceName);
      setWhatsappStatus(status.instance.state === 'open' ? 'connected' : 'disconnected');
      console.log('📱 Status WhatsApp:', status.instance.state);
    } catch (error) {
      console.error('❌ Erro ao verificar status WhatsApp:', error);
      setWhatsappStatus('disconnected');
    }
  };

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

  // Função helper para formatar tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para minimizar/maximizar chat
  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    // Salvar estado no localStorage
    localStorage.setItem(`chat-minimized-${ticket.id}`, newMinimizedState.toString());
    
    if (newMinimizedState) {
      // Quando minimizar, marcar como lido
      setUnreadCount(0);
      toast({
        title: "💬 Chat minimizado",
        description: "A conversa continua ativa na aba lateral",
      });
    } else {
      // Quando maximizar, limpar não lidas e focar no input
      setUnreadCount(0);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      toast({
        title: "🔄 Chat restaurado",
        description: "Conversa expandida novamente",
      });
    }
  };

  // Carregar mensagens reais do banco de dados
  useEffect(() => {
    const loadTicketMessages = async () => {
      if (!ticket?.id) return;

      try {
        setIsLoadingHistory(true);
        console.log('🔄 Carregando mensagens do ticket:', ticket.id, 'Subject:', ticket.subject);

        // Obter o ticket ID real do banco
        const realTicketId = await getRealTicketId(ticket.id);
        
        if (!realTicketId) {
          console.log('⚠️ Ticket não existe no banco (dados mock). Criando histórico vazio.');
          setRealTimeMessages([]);
          setIsLoadingHistory(false);
          return;
        }
        
        console.log('📋 Buscando mensagens para ticket ID:', realTicketId);
        const messages = await fetchMessages(realTicketId);
        console.log('📨 Mensagens carregadas:', messages.length, 'mensagens');

        // Converter mensagens do banco para formato do componente
        const convertedMessages: LocalMessage[] = messages.map((msg) => ({
          id: generateUniqueId(msg.id),
          content: msg.content,
          sender: msg.sender_id === currentTicket.customer_id ? 'client' as const : 'agent' as const,
          senderName: msg.sender_name || 
                     (msg as any).sender?.name || 
                     (msg.sender_id === currentTicket.customer_id ? currentTicket.client : 'Agente'),
          timestamp: new Date(msg.created_at),
          type: msg.type,
          status: msg.is_read ? 'read' as const : 'sent' as const,
          isInternal: msg.is_internal,
          attachments: msg.file_url ? [{
            id: msg.id,
            name: msg.file_name || 'Arquivo',
            type: msg.file_type || 'file',
            size: msg.file_size ? formatFileSize(msg.file_size) : '',
            url: msg.file_url
          }] : []
        }));

        setRealTimeMessages(convertedMessages);
        setIsLoadingHistory(false);
        
        toast({
          title: "💬 Conversa carregada",
          description: `${convertedMessages.length} mensagem(s) encontrada(s)`,
        });

      } catch (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        setIsLoadingHistory(false);
        setRealTimeMessages([]); // Definir array vazio em caso de erro
        toast({
          title: "⚠️ Erro ao carregar conversa",
          description: "Não foi possível carregar o histórico. Iniciando nova conversa.",
          variant: "destructive"
        });
      }
    };

    loadTicketMessages();
  }, [ticket?.id, fetchMessages, currentTicket, toast, getRealTicketId]);

  // Auto scroll quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [realTimeMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !user || !ticket?.id) return;
    
    setIsSending(true);
    
    try {
      console.log('📤 Enviando mensagem:', { 
        content: message, 
        isInternal, 
        ticketId: ticket.id,
        senderId: user.id 
      });

      // Obter o ticket ID real do banco
      let realTicketId = await getRealTicketId(ticket.id);
      
            // Se não encontrou ticket no banco, criar um novo
      if (!realTicketId) {
        console.log('🆕 Criando novo ticket no banco para persistir conversa...');
        console.log('📋 Dados do ticket mock:', currentTicket);
        
        try {
          // Preparar dados do ticket conforme schema do banco
          const newTicketData: Partial<DatabaseTicket> = {
            title: currentTicket.subject || `Conversa ${currentTicket.client}`,
            subject: currentTicket.subject,
            description: `Ticket migrado de dados mock para o banco - Cliente: ${currentTicket.client}`,
            // Normalizar status para valores aceitos pelo constraint
            status: (['pendente', 'atendimento', 'finalizado', 'cancelado'].includes(currentTicket.status) 
              ? currentTicket.status 
              : 'pendente') as 'pendente' | 'atendimento' | 'finalizado' | 'cancelado',
            // Normalizar prioridade para valores aceitos pelo constraint  
            priority: (currentTicket.priority === 'alta' ? 'alta' : 
                      currentTicket.priority === 'baixa' ? 'baixa' : 
                      'normal') as 'baixa' | 'normal' | 'alta' | 'urgente',
            // Normalizar canal para valores aceitos pelo constraint
            channel: (['email', 'telefone', 'chat', 'site', 'indicacao'].includes(currentTicket.channel) 
              ? currentTicket.channel 
              : 'chat') as 'email' | 'telefone' | 'chat' | 'site' | 'indicacao',
            // Atender constraint valid_customer_or_anonymous - deixar undefined para não passar no insert
            metadata: {
              client_name: currentTicket.client,
              anonymous_contact: currentTicket.client_email || currentTicket.client || 'Cliente Anônimo',
              client_phone: currentTicket.client_phone || '(11) 99999-9999',
              original_id: ticket.id,
              migrated_from_mock: true,
              migration_timestamp: new Date().toISOString()
            },
            unread: currentTicket.unread !== undefined ? currentTicket.unread : true,
            tags: Array.isArray(currentTicket.tags) ? currentTicket.tags : [],
            is_internal: false,
            last_message_at: new Date().toISOString()
          };

          console.log('📤 Enviando dados para createTicket:', newTicketData);
          
          const createdTicket = await createTicket(newTicketData);
          if (createdTicket?.id) {
            realTicketId = createdTicket.id;
            console.log('✅ Novo ticket criado com ID:', realTicketId);
          } else {
            console.error('❌ Ticket criado mas ID não retornado:', createdTicket);
            throw new Error('Ticket criado mas ID não retornado');
          }
        
        toast({
            title: "💾 Ticket salvo no banco",
            description: `Ticket "${currentTicket.subject}" migrado com sucesso`,
          });
        } catch (createError: any) {
          console.error('❌ Erro detalhado ao criar ticket:', createError);
          console.error('❌ Stack trace:', createError?.stack);
          
          // Log detalhado do erro para debug
          if (createError?.message?.includes('constraint')) {
            console.error('❌ Violação de constraint do banco. Verifique:');
            console.error('- valid_customer_or_anonymous: customer_id OU metadata.anonymous_contact');
            console.error('- status deve ser: pendente, atendimento, finalizado, cancelado');
            console.error('- priority deve ser: baixa, normal, alta, urgente');
            console.error('- channel deve ser: whatsapp, email, telefone, chat, site, indicacao');
          }
          
          throw new Error(`Não foi possível criar ticket no banco de dados: ${createError?.message || 'Erro desconhecido'}`);
        }
      }
      
      // Verificar se realTicketId é válido
      if (!realTicketId) {
        throw new Error('Não foi possível obter ID válido do ticket');
      }
      
      // --- INTEGRAÇÃO COM EVOLUTION API (WHATSAPP) ---
      if (!isInternal && whatsappInstance && whatsappStatus === 'connected') {
        const clientPhone = currentTicket.metadata?.client_phone;
        
        if (clientPhone && evolutionApiService.isValidWhatsAppNumber(clientPhone)) {
          setIsSendingWhatsApp(true);
          
          try {
            console.log(`🚀 Enviando via WhatsApp [Instância: ${whatsappInstance}]`);
            
            const messageToSend = replyToMessage 
              ? `↩️ *Respondendo:* "${replyToMessage.content}"\n\n${message}` 
              : message;
            
            await evolutionApiService.sendTextMessage(whatsappInstance, {
              number: clientPhone,
              textMessage: {
                text: messageToSend
              },
              options: {
                delay: 1200,
                presence: 'composing',
                linkPreview: false
              }
            });

            console.log(`✅ Mensagem enviada para ${clientPhone} via WhatsApp`);
            
            toast({
              title: "📱 Enviado via WhatsApp",
              description: `Mensagem entregue para ${currentTicket.client}`,
            });
            
          } catch (whatsappError: any) {
            console.error('❌ Erro ao enviar via WhatsApp:', whatsappError);
            toast({
              title: "⚠️ Erro no WhatsApp",
              description: "Mensagem salva no sistema, mas não foi enviada via WhatsApp",
              variant: "destructive"
            });
          } finally {
            setIsSendingWhatsApp(false);
          }
        } else {
          console.warn('⚠️ Telefone do cliente inválido ou não configurado');
          toast({
            title: "📞 Telefone não configurado",
            description: "Configure o telefone do cliente para enviar via WhatsApp",
            variant: "destructive"
          });
        }
      } else if (!isInternal && !whatsappInstance) {
        console.warn('⚠️ Instância WhatsApp não configurada para este ticket');
      } else if (!isInternal && whatsappStatus !== 'connected') {
        console.warn('⚠️ WhatsApp desconectado');
        toast({
          title: "📱 WhatsApp desconectado",
          description: "Mensagem salva apenas no sistema",
          variant: "destructive"
        });
      }

      // Criar mensagem no banco de dados
      const messageData = {
        ticket_id: realTicketId,
        sender_id: user.id,
        content: replyToMessage ? `↩️ Respondendo: "${replyToMessage.content}"\n\n${message}` : message,
        type: 'text' as const,
        is_internal: isInternal,
        sender_name: currentUserProfile?.name || user.email?.split('@')[0] || 'Usuário',
        sender_email: user.email,
        metadata: {
          ...(replyToMessage ? {
            reply_to: replyToMessage.id,
            reply_to_content: replyToMessage.content,
            reply_to_sender: replyToMessage.senderName
          } : {}),
          ...(whatsappInstance ? {
            whatsapp_instance: whatsappInstance,
            sent_via_whatsapp: !isInternal && whatsappStatus === 'connected'
          } : {})
        }
      };

      const newMessage = await sendMessage(messageData);
      console.log('✅ Mensagem salva no banco:', newMessage);



      // Adicionar mensagem localmente para feedback imediato
      const localMessage: LocalMessage = {
        id: generateUniqueId(newMessage.id),
        content: message,
        sender: 'agent' as const,
        senderName: currentUserProfile?.name || user.email?.split('@')[0] || 'Agente',
        timestamp: new Date(),
        type: 'text' as const,
        status: 'sent' as const,
        isInternal,
        attachments: []
      };

      setRealTimeMessages(prev => [...prev, localMessage]);
      setLastSentMessage(Date.now());
      setMessage('');
      setReplyToMessage(null); // Limpar resposta
      
      setTimeout(() => setLastSentMessage(null), 2000);
      
      toast({
        title: "✅ Mensagem persistida",
        description: isInternal ? "Nota interna salva no banco" : "Mensagem salva no histórico do ticket",
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao persistir",
        description: "Não foi possível salvar a mensagem. Tente novamente.",
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

  // Função para selecionar/deselecionar mensagens
  const toggleMessageSelection = (messageId: number) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Função para encaminhar mensagens selecionadas
  const forwardSelectedMessages = () => {
    const selectedMsgs = realTimeMessages.filter(msg => selectedMessages.has(msg.id));
    if (selectedMsgs.length > 0) {
      const content = selectedMsgs.map(msg => `📤 ${msg.senderName}: ${msg.content}`).join('\n\n');
      setMessage(content);
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      textareaRef.current?.focus();
      
      toast({
        title: "📤 Mensagens encaminhadas",
        description: `${selectedMsgs.length} mensagem(s) adicionada(s) ao campo de texto`,
      });
    }
  };

  // Função para favoritar mensagem
  const toggleFavoriteMessage = (messageId: number) => {
    setFavoriteMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        toast({
          title: "⭐ Removido dos favoritos",
          description: "Mensagem removida dos favoritos",
        });
      } else {
        newSet.add(messageId);
        toast({
          title: "⭐ Adicionado aos favoritos",
          description: "Mensagem adicionada aos favoritos",
        });
      }
      return newSet;
    });
  };

  // Função para responder mensagem
  const replyToMsg = (msg: LocalMessage) => {
    setReplyToMessage(msg);
    textareaRef.current?.focus();
  };

  // Drag & Drop handlers
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Simular upload
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      toast({
        title: "📎 Arquivo enviado",
        description: `${file.name} foi enviado com sucesso`,
      });
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  // Emoji picker com emojis populares
  const popularEmojis = ['😊', '😂', '👍', '❤️', '🙏', '👏', '🔥', '💯', '😍', '🤔', '😅', '👌', '💪', '🎉', '✨', '⚡'];
  
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M para minimizar/maximizar
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleMinimize();
      }
      
      // Apenas executar outras ações se não estiver minimizado
      if (!isMinimized) {
        // Ctrl/Cmd + Enter para enviar
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSendMessage();
        }
        
        // Esc para cancelar seleção ou minimizar
        if (e.key === 'Escape') {
          if (isSelectionMode || replyToMessage || showEmojiPicker) {
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
            setReplyToMessage(null);
            setShowEmojiPicker(false);
          } else {
            toggleMinimize();
          }
        }
        
        // Ctrl/Cmd + A em modo seleção
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isSelectionMode) {
          e.preventDefault();
          const allIds = new Set(realTimeMessages.map(msg => msg.id));
          setSelectedMessages(allIds);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isSelectionMode, realTimeMessages, isMinimized, toggleMinimize, replyToMessage, showEmojiPicker]);

  // Detecção de digitação em tempo real
  useEffect(() => {
    if (message.trim()) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'atendimento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finalizado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baixa': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Controlar mensagens não lidas quando minimizado
  useEffect(() => {
    if (isMinimized && realTimeMessages.length > 0) {
      // Incrementar contador quando novas mensagens chegam e chat está minimizado
      const lastMessage = realTimeMessages[realTimeMessages.length - 1];
      if (lastMessage.sender === 'client') {
        setUnreadCount(prev => prev + 1);
        
        // Notificação visual quando minimizado
        toast({
          title: `💬 Nova mensagem de ${currentTicket.client}`,
          description: lastMessage.content.substring(0, 80) + (lastMessage.content.length > 80 ? '...' : ''),
          action: (
            <Button 
              size="sm" 
              onClick={toggleMinimize}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Abrir Chat
            </Button>
          ),
        });
        
        // Efeito visual na página (piscar título)
        if (document.title) {
          const originalTitle = document.title;
          let blinkCount = 0;
          const blinkInterval = setInterval(() => {
            document.title = blinkCount % 2 === 0 ? '💬 Nova Mensagem!' : originalTitle;
            blinkCount++;
            if (blinkCount >= 6) {
              clearInterval(blinkInterval);
              document.title = originalTitle;
            }
          }, 500);
        }
      }
    }
  }, [realTimeMessages, isMinimized, currentTicket.client, toast, toggleMinimize]);

  // Se está minimizado, renderizar apenas a aba flutuante
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="group relative">
          {/* Preview das últimas mensagens - aparece no hover */}
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <div className="p-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Últimas mensagens
              </h4>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {realTimeMessages.slice(-3).map((msg, index) => (
                <div key={msg.id} className="p-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      msg.sender === 'client' ? "bg-green-500" : "bg-blue-500"
                    )}></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {msg.sender === 'client' ? '👤 Cliente' : '🧑‍💼 Agente'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {realTimeMessages.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhuma mensagem ainda
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 rounded-b-lg flex gap-2">
              <Button 
                size="sm" 
                onClick={toggleMinimize}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Abrir Chat
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Aba principal minimizada */}
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-xl border border-blue-200 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            onClick={toggleMinimize}
          >
            <div className="flex items-center gap-3 p-4 pr-6 text-white">
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-white/30">
                  <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                    {currentTicket.client.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white truncate">{currentTicket.client}</h3>
                <p className="text-xs text-blue-100 truncate max-w-[200px]">
                  {realTimeMessages.length > 0 
                    ? `${realTimeMessages[realTimeMessages.length - 1].sender === 'client' ? '👤' : '🧑‍💼'} ${realTimeMessages[realTimeMessages.length - 1].content}`
                    : '💬 Clique para abrir conversa'
                  }
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-xs px-2 py-0.5 bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {currentTicket.status}
                  </Badge>
                  <span className="text-xs text-blue-100">
                    {realTimeMessages.length} mensagem(s)
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-blue-100 font-medium">Chat</span>
              </div>
            </div>
            
            {/* Indicadores de estado */}
            {isTyping && (
              <div className="absolute -top-2 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-bounce">
                ✍️ Digitando...
              </div>
            )}
            
            {isSending && (
              <div className="absolute -top-2 right-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                📤 Enviando...
              </div>
            )}
          </div>
          
          {/* Tooltip informativo */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Clique para restaurar • Passe o mouse para preview
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
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
      
      <div className="flex h-[95vh] w-full max-w-7xl mx-auto rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-200 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                      {currentTicket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{currentTicket.client}</h2>
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-mono">#{currentTicket.id}</span>
                    <span>•</span>
                    <span className="truncate">{currentTicket.subject}</span>
                  </div>
                </div>
              </div>
                            <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <Badge className={cn("text-xs px-3 py-1.5 font-bold border shadow-sm", getStatusColor(currentTicket.status))}>
                    <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
                  {currentTicket.status}
                </Badge>
                  <Badge className={cn("text-xs px-3 py-1.5 font-bold border shadow-sm", getPriorityColor(currentTicket.priority))}>
                  {currentTicket.priority}
                </Badge>
              </div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={toggleMinimize}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Minimize2 className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Minimizar chat</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Messages Area with Drag & Drop */}
          <div 
            className={cn(
              "flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white relative transition-all duration-300",
              dragOver && "bg-blue-50 border-2 border-dashed border-blue-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Overlay */}
            {dragOver && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50/90 backdrop-blur-sm">
                <div className="text-center p-8 rounded-2xl bg-white shadow-2xl border-2 border-dashed border-blue-400">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Paperclip className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-700 mb-2">Solte seus arquivos aqui</h3>
                  <p className="text-blue-600">Imagens, documentos e outros arquivos são suportados</p>
                </div>
              </div>
            )}

            {/* Selection Mode Header */}
            {isSelectionMode && (
              <div className="sticky top-0 z-20 bg-blue-100 border border-blue-200 rounded-lg p-3 mb-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{selectedMessages.size}</span>
                    </div>
                    <span className="font-semibold text-blue-800">
                      {selectedMessages.size} mensagem(s) selecionada(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={forwardSelectedMessages}
                      className="text-blue-700 hover:bg-blue-200"
                    >
                      <Forward className="w-4 h-4 mr-2" />
                      Encaminhar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedMessages(new Set());
                      }}
                      className="text-blue-700 hover:bg-blue-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="sticky top-0 z-20 bg-green-100 border border-green-200 rounded-lg p-3 mb-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-medium text-green-800 mb-1">
                      <span>Enviando arquivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full animate-ping"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700">Carregando conversas...</p>
                  <p className="text-sm text-gray-500 mt-1">Preparando histórico de mensagens</p>
                </div>
              </div>
            ) : realTimeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-gray-500">Inicie a conversa enviando uma mensagem</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {realTimeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex animate-in slide-in-from-bottom-2 duration-300 group",
                      msg.sender === 'agent' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <div className="flex items-start pt-2 mr-3">
                        <input
                          type="checkbox"
                          checked={selectedMessages.has(msg.id)}
                          onChange={() => toggleMessageSelection(msg.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className={cn(
                      "group/message max-w-[75%] rounded-2xl p-4 shadow-sm border text-sm relative transition-all hover:shadow-lg cursor-pointer",
                      msg.sender === 'agent'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 hover:from-blue-600 hover:to-blue-700'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300',
                      msg.isInternal && "bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200 text-orange-900 hover:from-orange-200 hover:to-orange-100",
                      selectedMessages.has(msg.id) && "ring-2 ring-blue-400 shadow-lg",
                      favoriteMessages.has(msg.id) && "ring-2 ring-yellow-400"
                    )}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleMessageSelection(msg.id);
                        }
                      }}
                    >
                      {/* Message Actions (Hover) */}
                      <div className={cn(
                        "absolute -top-3 right-3 opacity-0 group-hover/message:opacity-100 transition-all duration-200 flex gap-1",
                        msg.sender === 'client' ? "right-3" : "left-3"
                      )}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  replyToMsg(msg);
                                }}
                              >
                                <Reply className="w-3 h-3 text-gray-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Responder</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteMessage(msg.id);
                                }}
                              >
                                {favoriteMessages.has(msg.id) ? (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                ) : (
                                  <StarOff className="w-3 h-3 text-gray-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Favoritar</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(msg.content);
                                  toast({
                                    title: "📋 Copiado!",
                                    description: "Mensagem copiada para a área de transferência",
                                  });
                                }}
                              >
                                <Copy className="w-3 h-3 text-gray-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copiar</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Reply Context */}
                      {replyToMessage && msg.id === (realTimeMessages.length > 0 ? realTimeMessages[realTimeMessages.length - 1].id : 0) && (
                        <div className="bg-gray-100 rounded-lg p-2 mb-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-600">↩️ Respondendo a {replyToMessage.senderName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => setReplyToMessage(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-gray-600 truncate">{replyToMessage.content}</p>
                        </div>
                      )}

                      {msg.isInternal && (
                        <div className="flex items-center gap-2 text-xs font-bold mb-3 text-orange-700 bg-orange-200/50 px-2 py-1 rounded-lg">
                          <Eye className="w-3 h-3" />
                          <span>Nota interna</span>
                        </div>
                      )}
                      
                      <p className="mb-3 whitespace-pre-line leading-relaxed">{msg.content}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn(
                          "font-medium px-2 py-1 rounded-full",
                          msg.sender === 'agent' ? "bg-white/20 text-white/90" : "bg-gray-100 text-gray-600"
                        )}>
                          {msg.senderName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full",
                            msg.sender === 'agent' ? "bg-white/20 text-white/80" : "bg-gray-100 text-gray-500"
                          )}>
                            {formatRelativeTime(msg.timestamp)}
                          </span>
                          {msg.sender === 'agent' && (
                            <div className="flex items-center">
                              {msg.status === 'sent' && <Check className="w-3 h-3 text-white/70" />}
                              {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-white/70" />}
                              {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-green-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Enhanced Typing indicator */}
            {isTyping && (
              <div className="flex justify-start mt-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">digitando...</span>
                </div>
              </div>
            )}

            {/* Waiting for webhook response indicator */}
            {isWaitingResponse && (
              <div className="flex justify-start mt-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl px-4 py-3 shadow-sm flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-700 font-medium">Aguardando resposta automática...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            {/* Reply Context */}
            {replyToMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-700">↩️ Respondendo a {replyToMessage.senderName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                    onClick={() => setReplyToMessage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-blue-600 truncate">{replyToMessage.content}</p>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <label htmlFor="internal" className="text-sm text-gray-700 cursor-pointer select-none font-medium">
                    Nota interna
                  </label>
                </div>
                {isInternal && (
                  <Badge variant="outline" className="text-xs font-bold text-orange-700 border-orange-400 bg-orange-50 px-3 py-1 animate-in slide-in-from-left-2 duration-300">
                    <Eye className="w-3 h-3 mr-1.5 inline" />
                    Não visível para o cliente
                  </Badge>
                )}
              </div>
              
              {/* Enhanced Quick Actions */}
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Anexar arquivo (ou arraste aqui)</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" side="top" align="end">
                    <div className="grid grid-cols-8 gap-2">
                      {popularEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {!isSelectionMode ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
                          onClick={() => setIsSelectionMode(true)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Selecionar mensagens</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-purple-600 hover:text-gray-600 hover:bg-gray-50 transition-all"
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedMessages(new Set());
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Cancelar seleção</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}



                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Alternar tema</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Message input */}
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isInternal ? "✏️ Escreva uma nota interna..." : "💬 Digite sua mensagem..."}
                  className={cn(
                    "min-h-[60px] max-h-[120px] resize-none border-2 rounded-xl px-4 py-3 text-sm transition-all duration-200 shadow-sm",
                    "focus:ring-2 focus:ring-offset-0 bg-gray-50 hover:bg-white",
                    isInternal 
                      ? "border-orange-300 focus:border-orange-500 focus:ring-orange-200" 
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  )}
                  disabled={isSending}
                />
                {message.length > 0 && (
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
                    {message.length}/1000
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm"
                    >
                      <Zap className="w-5 h-5 text-gray-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" side="top" align="end">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-purple-600" />
                        Templates de Resposta
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Clique em um template para usar</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {quickTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto p-4 hover:bg-purple-50 border-0 rounded-none"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="w-full">
                            <div className="font-medium text-gray-900 mb-1">{template.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">{template.content}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className={cn(
                    "h-12 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm",
                    !isInternal && whatsappStatus === 'connected' 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transform hover:scale-105 active:scale-95"
                  )}
                >
                  {isSending || isSendingWhatsApp ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : !isInternal && whatsappStatus === 'connected' ? (
                    <Smartphone className="w-5 h-5 mr-2" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {isSending ? 'Enviando...' : 
                   isSendingWhatsApp ? 'Enviando WhatsApp...' :
                   !isInternal && whatsappStatus === 'connected' ? 'Enviar WhatsApp' : 'Enviar'}
                </Button>
              </div>
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleFileUpload(files);
                }
              }}
            />

                        {/* Enhanced Keyboard shortcut hints */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <div className="flex flex-wrap gap-3">
                <span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Enter</kbd> enviar
              </span>
                <span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Shift+Enter</kbd> nova linha
                </span>
                <span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Ctrl+Enter</kbd> enviar rápido
                </span>
                <span>
                  <kbd className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">Ctrl+M</kbd> minimizar
                </span>
                {isSelectionMode ? (
                  <span>
                    <kbd className="bg-purple-100 px-2 py-1 rounded text-xs font-mono">Esc</kbd> cancelar seleção
                  </span>
                ) : (
                  <span>
                    <kbd className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">Esc</kbd> minimizar
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {message.trim() && (
                  <span className="text-blue-500 animate-pulse flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Digitando...
                  </span>
                )}
                {replyToMessage && (
                  <span className="text-purple-500 flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    Respondendo
                  </span>
                )}
                {selectedMessages.size > 0 && (
                  <span className="text-purple-600 font-medium">
                    {selectedMessages.size} selecionada(s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Right Sidebar */}
        <div className="w-80 lg:w-96 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Detalhes do Ticket
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Client Info Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{currentTicket.client}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">{currentTicket.customer_email || 'Não informado'}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">(11) 99999-9999</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Details Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  Detalhes do Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Canal</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{currentTicket.channel}</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Depto</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{currentTicket.department || 'Geral'}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Criado em</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(currentTicket.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Status Card */}
            {whatsappInstance && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                    <Smartphone className="w-4 h-4 mr-2 text-green-600" />
                    Status WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {whatsappStatus === 'connected' ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Instância:</span>
                    </div>
                    <span className="text-sm text-gray-600">{whatsappInstance}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge 
                      className={cn(
                        "text-xs",
                        whatsappStatus === 'connected' 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  
                  {currentTicket.metadata?.client_phone && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">WhatsApp:</span>
                      <span className="text-sm text-gray-600">
                        {evolutionApiService.formatPhoneNumber(currentTicket.metadata.client_phone)}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => whatsappInstance && checkWhatsAppStatus(whatsappInstance)}
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-600" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{realTimeMessages.length}</div>
                    <div className="text-xs text-blue-600 font-medium">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{realTimeMessages.filter(m => !m.isInternal).length}</div>
                    <div className="text-xs text-green-600 font-medium">Públicas</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{realTimeMessages.filter(m => m.isInternal).length}</div>
                    <div className="text-xs text-orange-600 font-medium">Internas</div>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Quick Actions Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-blue-600" />
                    Ações Rápidas
                  </div>
                  {selectedMessages.size > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {selectedMessages.size} selecionada(s)
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-300 transition-all"
                  onClick={() => setShowStatusModal(true)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Alterar Status
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 hover:bg-green-50 hover:border-green-300 transition-all"
                  onClick={() => setShowAssignModal(true)}
                >
                  <UserCheck className="w-4 h-4 mr-3" />
                  Atribuir Agente
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 hover:bg-purple-50 hover:border-purple-300 transition-all"
                  onClick={() => setShowTagModal(true)}
                >
                  <Tag className="w-4 h-4 mr-3" />
                  Adicionar Tag
                </Button>
                
                {selectedMessages.size > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 hover:bg-amber-50 hover:border-amber-300 transition-all border-amber-200 text-amber-700"
                    onClick={forwardSelectedMessages}
                  >
                    <Forward className="w-4 h-4 mr-3" />
                    Encaminhar {selectedMessages.size} mensagem(s)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Alterar Status do Ticket
              </DialogTitle>
              <DialogDescription>
                Escolha o novo status para este ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label htmlFor="status">Status atual: <span className="font-semibold">{currentTicket.status}</span></Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="atendimento">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Em Atendimento
                      </div>
                    </SelectItem>
                    <SelectItem value="finalizado">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                        Finalizado
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelado">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Cancelado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </Button>
              <Button 
                                  onClick={() => {
                    if (newStatus && newStatus !== currentTicket.status) {
                      setCurrentTicket((prev: any) => ({ ...prev, status: newStatus }));
                      toast({
                        title: "✅ Status atualizado",
                        description: `Status alterado para "${newStatus}"`,
                      });
                    }
                    setShowStatusModal(false);
                    setNewStatus('');
                  }}
                disabled={!newStatus || newStatus === currentTicket.status || isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Alterar Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                Atribuir Agente
              </DialogTitle>
              <DialogDescription>
                Escolha um agente para responsabilizar-se por este ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label htmlFor="assignee">Agente responsável atual: <span className="font-semibold">{currentTicket.assignee || 'Não atribuído'}</span></Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium">Remover atribuição</div>
                          <div className="text-xs text-gray-500">Ticket ficará sem responsável</div>
                        </div>
                      </div>
                    </SelectItem>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.name}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-xs text-gray-500">{agent.email}</div>
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
              <Button 
                onClick={() => {
                  const assigneeValue = newAssignee === 'unassigned' ? null : newAssignee;
                  setCurrentTicket((prev: any) => ({ ...prev, assignee: assigneeValue }));
                  toast({
                    title: "✅ Agente atribuído",
                    description: newAssignee === 'unassigned'
                      ? "Atribuição removida do ticket"
                      : `Ticket atribuído para ${newAssignee}`,
                  });
                  setShowAssignModal(false);
                  setNewAssignee('');
                }}
                disabled={(newAssignee === currentTicket.assignee || (newAssignee === 'unassigned' && !currentTicket.assignee) || !newAssignee) || isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                Atribuir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Tag Modal */}
      {showTagModal && (
        <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2 text-purple-600" />
                Adicionar Tag
              </DialogTitle>
              <DialogDescription>
                Adicione uma tag para categorizar este ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label htmlFor="tag">Nova tag</Label>
                <Input
                  id="tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ex: urgente, bug, feature, suporte..."
                  className="w-full"
                />
                
                {/* Current tags */}
                {currentTicket.tags && currentTicket.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Tags atuais:</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentTicket.tags.map((tag: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-purple-200"
                            onClick={() => {
                              const updatedTags = currentTicket.tags.filter((_: string, i: number) => i !== index);
                              setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                              toast({
                                title: "🗑️ Tag removida",
                                description: `Tag "${tag}" foi removida`,
                              });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick tag suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Sugestões populares:</Label>
                  <div className="flex flex-wrap gap-2">
                    {['urgente', 'bug', 'feature', 'suporte', 'dúvida', 'comercial'].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3 hover:bg-purple-50 hover:border-purple-300"
                        onClick={() => setNewTag(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTagModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (newTag.trim()) {
                    const currentTags = currentTicket.tags || [];
                    if (!currentTags.includes(newTag.trim())) {
                      const updatedTags = [...currentTags, newTag.trim()];
                      setCurrentTicket((prev: any) => ({ ...prev, tags: updatedTags }));
                      toast({
                        title: "🏷️ Tag adicionada",
                        description: `Tag "${newTag.trim()}" foi adicionada ao ticket`,
                      });
                    } else {
                      toast({
                        title: "⚠️ Tag já existe",
                        description: "Esta tag já foi adicionada ao ticket",
                        variant: "destructive",
                      });
                    }
                  }
                  setShowTagModal(false);
                  setNewTag('');
                }}
                disabled={!newTag.trim() || isUpdating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Tag className="w-4 h-4 mr-2" />
                )}
                Adicionar Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 