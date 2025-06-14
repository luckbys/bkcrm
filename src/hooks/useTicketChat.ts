import { useState, useEffect, useCallback } from 'react';
import { useTicketsDB } from './useTicketsDB';
import { useAuth } from './useAuth';
import { useWebhookResponses } from './useWebhookResponses';
import { useToast } from './use-toast';
// import { useMinimizedState } from './useMinimizedState'; // Temporariamente removido
import { supabase } from '../lib/supabase';
import { LocalMessage, QuickTemplate, UseTicketChatReturn } from '../types/ticketChat';

export const useTicketChat = (ticket: any | null): UseTicketChatReturn => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage, createTicket } = useTicketsDB();

  // Estados do ticket – precisa vir antes do hook de mensagens Evolution
  const [currentTicket, setCurrentTicket] = useState(ticket || {});

  // Hook para mensagens Evolution, usando o ID do ticket (que pode mudar após migração)
  const {
    /* evolutionMessages – ainda não utilizado internamente */
    loadEvolutionMessages,
  } = useWebhookResponses(ticket?.id?.toString() || '');
  
  // Estados principais
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // Hook de minimização temporariamente desabilitado
  const minimizedState = {
    isMinimized: false,
    setMinimized: () => {},
    toggleMinimize: () => {},
  };
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSentMessage, setLastSentMessage] = useState<number | null>(null);
  
  // Estados UX
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<LocalMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<'all' | 'internal' | 'public'>('all');
  const [favoriteMessages, setFavoriteMessages] = useState<Set<number>>(new Set());
  const [quickReplyVisible, setQuickReplyVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  
  // Estados modais
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // Mensagens
  const [realTimeMessages, setRealTimeMessages] = useState<LocalMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Sidebar
  const [showSidebar, setShowSidebar] = useState(true);
  
  // WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [whatsappInstance, setWhatsappInstance] = useState<string | null>(null);

  // Função helper para gerar ID único e válido
  const generateUniqueId = (messageId: string): number => {
    const numericPart = messageId.match(/\d+/);
    if (numericPart) {
      const id = parseInt(numericPart[0]);
      if (!isNaN(id)) {
        return id;
      }
    }
    
    let hash = 0;
    for (let i = 0; i < messageId.length; i++) {
      const char = messageId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const result = Math.abs(hash);
    
    if (isNaN(result)) {
      console.warn('🚨 ID inválido gerado:', { messageId, result });
      return Date.now();
    }
    
    return result;
  };

  // Função para obter o ticket ID real (UUID do banco de dados)
  const getRealTicketId = useCallback(async (ticketCompatibilityId: number | string): Promise<string | null> => {
    try {
      if (typeof ticketCompatibilityId === 'string' && ticketCompatibilityId.includes('-')) {
        return ticketCompatibilityId;
      }

      if (ticket?.originalId) {
        console.log('🎯 Usando originalId do ticket:', ticket.originalId);
        return ticket.originalId;
      }

      // Só tenta consulta se houver sessão e role apropriado (evita erros RLS 400)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Sem sessão, impossível consultar tickets
        return null;
      }

      const { data: existingTickets, error } = await supabase
        .from('tickets')
        .select('id, title, description, metadata')
        .limit(100);

      if (error) {
        // Erros de RLS ou schema são ignorados silenciosamente para evitar poluição de log
        if (error.code && error.code.toString().startsWith('40')) {
          // 400/403/404 etc.
          return null;
        }
        console.error('Erro ao buscar tickets:', error);
        return null;
      }

      const matchingTicket = existingTickets?.find(t => 
        t.title === currentTicket.subject || 
        t.title === currentTicket.title ||
        t.description === currentTicket.subject ||
        t.metadata?.client_name === currentTicket.client
      );

      if (matchingTicket) {
        console.log('🎯 Ticket encontrado no banco:', matchingTicket.id);
        return matchingTicket.id;
      }

      console.log('⚠️ Ticket não encontrado no banco (dados mock)');
      return null;
    } catch (error) {
      console.error('Erro ao obter ticket ID real:', error);
      return null;
    }
  }, [currentTicket, ticket]);



  // Função principal para enviar mensagens
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

      let realTicketId = await getRealTicketId(ticket.id);
      
      if (!realTicketId) {
        console.log('🆕 Criando novo ticket no banco...');
        
        try {
          const newTicketData = {
            title: currentTicket.subject || currentTicket.title || `Conversa ${currentTicket.client}`,
            description: currentTicket.subject || `Ticket migrado - Cliente: ${currentTicket.client}`,
            status: (['pendente', 'atendimento', 'finalizado', 'cancelado'].includes(currentTicket.status) 
              ? currentTicket.status 
              : 'pendente') as 'pendente' | 'atendimento' | 'finalizado' | 'cancelado',
            priority: (currentTicket.priority === 'alta' ? 'alta' : 
                      currentTicket.priority === 'baixa' ? 'baixa' : 
                      'normal') as 'baixa' | 'normal' | 'alta' | 'urgente',
            channel: (['email', 'telefone', 'chat', 'site', 'indicacao'].includes(currentTicket.channel) 
              ? currentTicket.channel 
              : 'chat') as 'email' | 'telefone' | 'chat' | 'site' | 'indicacao',
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

            // Atualiza ticket local com o UUID criado
            setCurrentTicket((prev: any) => ({ ...prev, id: realTicketId }));
            loadEvolutionMessages(realTicketId as string);
          } else {
            throw new Error('Ticket criado mas ID não retornado');
          }
        
          toast({
            title: "💾 Ticket salvo no banco",
            description: `Ticket "${currentTicket.subject}" migrado com sucesso`,
          });
        } catch (createError: any) {
          console.error('❌ Erro ao criar ticket:', createError);
          throw new Error(`Não foi possível criar ticket: ${createError?.message || 'Erro desconhecido'}`);
        }
      }
      
      if (!realTicketId) {
        throw new Error('Não foi possível obter ID válido do ticket');
      }

      // Criar mensagem no banco de dados
      const messageData = {
        ticket_id: realTicketId,
        sender_id: user.id,
        content: message,
        type: 'text' as const,
        is_internal: isInternal,
        sender_name: currentUserProfile?.name || user.email?.split('@')[0] || 'Usuário',
        sender_email: user.email,
        metadata: {}
      };

      const newMessage = await sendMessage(messageData);
      console.log('✅ Mensagem salva no banco:', newMessage);

      // Adicionar mensagem localmente
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
      
      setTimeout(() => setLastSentMessage(null), 2000);
      
      toast({
        title: "✅ Mensagem enviada",
        description: isInternal ? "Nota interna salva" : "Mensagem salva no histórico",
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Função para aplicar template
  const handleTemplateSelect = (template: QuickTemplate) => {
    setMessage(template.content);
    
    toast({
      title: "📝 Template aplicado",
      description: `Template "${template.title}" foi adicionado`,
    });
  };

  // Função de atalhos de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Função para toggle favorito
  const toggleMessageFavorite = (messageId: number) => {
    setFavoriteMessages(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(messageId)) {
        newFavorites.delete(messageId);
        toast({ title: "⭐ Removido dos favoritos" });
      } else {
        newFavorites.add(messageId);
        toast({ title: "⭐ Adicionado aos favoritos" });
      }
      return newFavorites;
    });
  };

  // Função para toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Função para busca em tempo real
  const searchMessages = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredMessages([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = realTimeMessages.filter(msg =>
      msg.content.toLowerCase().includes(term.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredMessages(filtered);
    setShowSearchResults(true);
  }, [realTimeMessages]);

  // Effect para busca em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMessages(messageSearchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [messageSearchTerm, searchMessages]);

  // Effect para carregar dados do WhatsApp quando componente monta
  useEffect(() => {
    if (currentTicket) {
      const instanceName = currentTicket?.department || 'default';
      setWhatsappInstance(instanceName);
      setWhatsappStatus('connected'); // Para demonstração
    }
  }, [currentTicket]);

  // Effect para responsividade da sidebar
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Auto-ocultar sidebar em telas menores que 768px
      if (width < 768 && showSidebar) {
        setShowSidebar(false);
        toast({
          title: "📱 Sidebar ocultada automaticamente",
          description: "Modo mobile: sidebar oculta para melhor experiência",
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Verificação inicial

    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar, toast]);

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingHistory(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mapeia automaticamente o ID real do ticket (caso seja numérico) logo após montar
  useEffect(() => {
    const initRealIdMapping = async () => {
      if (ticket && typeof ticket.id === 'number') {
        const realId = await getRealTicketId(ticket.id);
        if (realId) {
          setCurrentTicket((prev: any) => ({ ...prev, id: realId }));
          loadEvolutionMessages(realId as string);
        }
      }
    };

    initRealIdMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Estados principais
    message,
    setMessage,
    isInternal,
    setIsInternal,
    isSending,
    isTyping,
    isMinimized: minimizedState.isMinimized,
    setIsMinimized: minimizedState.setMinimized,
    unreadCount,
    lastSentMessage,
    
    // Estados UX
    messageSearchTerm,
    setMessageSearchTerm,
    showSearchResults,
    filteredMessages,
    messageFilter,
    setMessageFilter,
    favoriteMessages,
    quickReplyVisible,
    setQuickReplyVisible,
    soundEnabled,
    setSoundEnabled,
    autoScrollEnabled,
    setAutoScrollEnabled,
    compactMode,
    setCompactMode,
    
    // Estados do ticket
    currentTicket,
    setCurrentTicket,
    
    // Estados modais
    showAssignModal,
    setShowAssignModal,
    showStatusModal,
    setShowStatusModal,
    showTagModal,
    setShowTagModal,
    
    // Mensagens
    realTimeMessages,
    isLoadingHistory,
    
    // Sidebar
    showSidebar,
    setShowSidebar,
    
    // WhatsApp
    whatsappStatus,
    whatsappInstance,
    
    // Funções
    handleSendMessage,
    toggleMinimize: minimizedState.toggleMinimize,
    toggleMessageFavorite,
    toggleSidebar,
    handleTemplateSelect,
    handleKeyDown,
    getRealTicketId
  };
}; 