import { useState, useEffect, useCallback } from 'react';
import { useTicketsDB } from './useTicketsDB';
import { useAuth } from './useAuth';
import { useWebhookResponses } from './useWebhookResponses';
import { useToast } from './use-toast';
// import { useMinimizedState } from './useMinimizedState'; // Temporariamente removido
import { supabase } from '../lib/supabase';
import { LocalMessage, QuickTemplate, UseTicketChatReturn } from '../types/ticketChat';
import { useEvolutionSender } from './useEvolutionSender';

// Função helper para extrair informações do cliente do ticket
const extractClientInfo = (ticket: any) => {
  if (!ticket) {
    return {
      clientName: 'Cliente Anônimo',
      clientPhone: 'Telefone não informado',
      isWhatsApp: false
    };
  }

  // Verificar se é ticket do WhatsApp via metadata
  const metadata = ticket.metadata || {};
  const isWhatsApp = metadata.created_from_whatsapp || 
                    metadata.whatsapp_phone || 
                    metadata.anonymous_contact || 
                    ticket.channel === 'whatsapp';

  let clientName = 'Cliente Anônimo';
  let clientPhone = 'Telefone não informado';

  if (isWhatsApp) {
    // Extrair nome do WhatsApp
    clientName = metadata.client_name || 
                metadata.whatsapp_name || 
                (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.name : metadata.anonymous_contact) ||
                ticket.client ||
                ticket.whatsapp_contact_name ||
                'Cliente WhatsApp';

    // Extrair telefone do WhatsApp com múltiplas fontes
    clientPhone = metadata.client_phone || 
                 metadata.whatsapp_phone || 
                 (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.phone : null) ||
                 ticket.client_phone ||
                 ticket.customerPhone ||
                 ticket.phone ||
                 // Tentar extrair do próprio nome se contiver números
                 (clientName && clientName.match(/\d{10,}/)?.[0]) ||
                 'Telefone não informado';

    // Formatar telefone brasileiro se necessário
    if (clientPhone && clientPhone !== 'Telefone não informado' && !clientPhone.includes('+')) {
      if (clientPhone.length >= 10) {
        // Formatar como +55 (11) 99999-9999
        const clean = clientPhone.replace(/\D/g, '');
        if (clean.length === 13 && clean.startsWith('55')) {
          const formatted = `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
          clientPhone = formatted;
        }
      }
    }
  } else {
    // Ticket normal (não WhatsApp)
    clientName = ticket.client || ticket.customer_name || 'Cliente';
    clientPhone = ticket.customerPhone || ticket.customer_phone || 'Telefone não informado';
  }

  // Garantir que os valores sejam sempre strings válidas
  const validClientName = typeof clientName === 'string' ? clientName : 'Cliente Anônimo';
  const validClientPhone = typeof clientPhone === 'string' ? clientPhone : 'Telefone não informado';

  return {
    clientName: validClientName,
    clientPhone: validClientPhone,
    isWhatsApp
  };
};

export const useTicketChat = (ticket: any | null): UseTicketChatReturn => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage, createTicket, fetchMessages } = useTicketsDB();
  const { sendMessage: sendEvolutionMessage, validateMessageData } = useEvolutionSender();

  // Estados do ticket – precisa vir antes do hook de mensagens Evolution
  const [currentTicket, setCurrentTicket] = useState(() => {
    if (!ticket) return {};
    
    // Extrair informações do cliente e enriquecer o ticket
    const clientInfo = extractClientInfo(ticket);
    return {
      ...ticket,
      client: clientInfo.clientName,
      customerPhone: clientInfo.clientPhone,
      customerEmail: ticket.customerEmail || (clientInfo.isWhatsApp ? 'Email não informado' : ticket.email),
      isWhatsApp: clientInfo.isWhatsApp
    };
  });

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

  // Função para carregar mensagens existentes do banco
  const loadExistingMessages = useCallback(async (ticketId: string) => {
    try {
      console.log('📥 Carregando mensagens existentes do banco para ticket:', ticketId);
      setIsLoadingHistory(true);

      const messages = await fetchMessages(ticketId);
      
      if (messages && messages.length > 0) {
        const localMessages: LocalMessage[] = messages.map((msg: any) => ({
          id: generateUniqueId(msg.id),
          content: msg.content,
          sender: msg.sender_id ? 'agent' : 'client',
          senderName: msg.sender_name || msg.sender?.name || (msg.sender_id ? 'Agente' : 'Cliente'),
          timestamp: new Date(msg.created_at),
          type: msg.type || 'text',
          status: 'sent' as const,
          isInternal: msg.is_internal || false,
          attachments: msg.file_url ? [{
            id: generateUniqueId(msg.id + '_file').toString(),
            name: msg.file_name || 'Arquivo',
            url: msg.file_url,
            type: msg.file_type || 'file',
            size: (msg.file_size || 0).toString()
          }] : []
        }));

        setRealTimeMessages(localMessages);
        console.log(`✅ ${localMessages.length} mensagens carregadas do banco`);
        
        toast({
          title: "📥 Mensagens carregadas",
          description: `${localMessages.length} mensagens encontradas no histórico`,
        });
      } else {
        console.log('📭 Nenhuma mensagem encontrada no banco para este ticket');
        setRealTimeMessages([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens do banco:', error);
      toast({
        title: "❌ Erro ao carregar histórico",
        description: "Não foi possível carregar as mensagens anteriores",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetchMessages, toast]);

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

      // Enviar via Evolution API se não for mensagem interna e tiver telefone do cliente
      const clientInfo = extractClientInfo(currentTicket);
      const hasValidPhone = clientInfo.clientPhone && 
                           clientInfo.clientPhone !== 'Telefone não informado' && 
                           clientInfo.clientPhone.replace(/\D/g, '').length >= 10;
      
      if (!isInternal && hasValidPhone && clientInfo.isWhatsApp) {
        try {
          console.log('📱 Enviando mensagem via WhatsApp:', {
            phone: clientInfo.clientPhone,
            message: message.substring(0, 50) + '...',
            instance: whatsappInstance,
            isWhatsApp: clientInfo.isWhatsApp
          });

          const evolutionResult = await sendEvolutionMessage({
            phone: clientInfo.clientPhone,
            text: message,
            instance: whatsappInstance || 'atendimento-ao-cliente-sac1',
            options: {
              delay: 1000,
              presence: 'composing'
            }
          });

          if (evolutionResult.success) {
            console.log('✅ Mensagem enviada via WhatsApp:', evolutionResult.messageId);
            
            // Atualizar status da mensagem local
            setRealTimeMessages(prev => 
              prev.map(msg => 
                msg.id === localMessage.id 
                  ? { ...msg, status: 'delivered' as const }
                  : msg
              )
            );

            toast({
              title: "📱 Enviado via WhatsApp!",
              description: "Mensagem entregue ao cliente via WhatsApp",
            });
          } else {
            console.warn('⚠️ Falha no envio via WhatsApp:', evolutionResult.error);
            toast({
              title: "⚠️ Salvo localmente",
              description: "Mensagem salva mas não foi possível enviar via WhatsApp",
              variant: "default"
            });
          }
        } catch (evolutionError) {
          console.error('❌ Erro no envio via Evolution API:', evolutionError);
          // Não interrompe o fluxo principal - mensagem já foi salva
        }
      } else {
        toast({
          title: "✅ Mensagem enviada",
          description: isInternal ? "Nota interna salva" : "Mensagem salva no histórico",
        });
      }
      
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
      // Usar instância específica baseada no metadata ou padrão
      const instanceName = currentTicket?.metadata?.instance_name || 
                          currentTicket?.department || 
                          'atendimento-ao-cliente-sac1';
      setWhatsappInstance(instanceName);
      setWhatsappStatus('connected'); // Para demonstração
      
      console.log('🔧 Configurando instância WhatsApp:', {
        instanceName,
        department: currentTicket?.department,
        metadataInstance: currentTicket?.metadata?.instance_name
      });
    }
  }, [currentTicket]);

  // Effect para reprocessar dados do ticket quando ticket prop mudar
  useEffect(() => {
    if (ticket) {
      const clientInfo = extractClientInfo(ticket);
      setCurrentTicket({
        ...ticket,
        client: clientInfo.clientName,
        customerPhone: clientInfo.clientPhone,
        customerEmail: ticket.customerEmail || (clientInfo.isWhatsApp ? 'Email não informado' : ticket.email),
        isWhatsApp: clientInfo.isWhatsApp
      });
    }
  }, [ticket]);

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

  // Carregar mensagens quando ticket é aberto
  useEffect(() => {
    const loadTicketMessages = async () => {
      if (!ticket?.id) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        // Se o ticket tem originalId (UUID do banco), usar diretamente
        if (ticket.originalId) {
          console.log('🎯 Carregando mensagens para ticket UUID:', ticket.originalId);
          await loadExistingMessages(ticket.originalId);
          return;
        }

        // Se é um ID numérico, tentar mapear para UUID
        if (typeof ticket.id === 'number') {
          const realId = await getRealTicketId(ticket.id);
          if (realId) {
            console.log('🎯 Ticket mapeado para UUID:', realId);
            setCurrentTicket((prev: any) => ({ ...prev, id: realId, originalId: realId }));
            await loadExistingMessages(realId);
            loadEvolutionMessages(realId);
          } else {
            console.log('📭 Ticket não encontrado no banco (dados mock)');
            setIsLoadingHistory(false);
          }
        } else if (typeof ticket.id === 'string' && ticket.id.includes('-')) {
          // É um UUID direto
          console.log('🎯 Carregando mensagens para UUID direto:', ticket.id);
          await loadExistingMessages(ticket.id);
        } else {
          console.log('📭 Formato de ID não reconhecido:', ticket.id);
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar mensagens do ticket:', error);
        setIsLoadingHistory(false);
      }
    };

    loadTicketMessages();
  }, [ticket?.id, ticket?.originalId, getRealTicketId, loadExistingMessages, loadEvolutionMessages]);

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