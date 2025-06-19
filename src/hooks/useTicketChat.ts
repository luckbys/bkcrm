import { useState, useEffect, useCallback } from 'react';
import { useTicketsDB } from './useTicketsDB';
import { useAuth } from './useAuth';
import { useWebhookResponses } from './useWebhookResponses';
import { useToast } from './use-toast';
// import { useMinimizedState } from './useMinimizedState'; // Temporariamente removido
import { supabase } from '../lib/supabase';
import { LocalMessage, QuickTemplate, UseTicketChatReturn } from '../types/ticketChat';
import { useEvolutionSender } from './useEvolutionSender';
import { useRealtimeMessages } from './useRealtimeMessages';

// FUNÇÃO APRIMORADA PARA EXTRAIR INFORMAÇÕES DO CLIENTE COM DADOS ENRIQUECIDOS
const extractClientInfo = (ticket: any) => {
  console.log('👤 [EXTRAÇÃO] Extraindo informações do cliente:', ticket?.id);
  
  if (!ticket) {
    return {
      clientName: 'Cliente Anônimo',
      clientPhone: 'Telefone não informado',
      clientPhoneFormatted: 'Telefone não informado',
      clientPhoneRaw: null,
      whatsappJid: null,
      isWhatsApp: false,
      canReply: false,
      country: null,
      phoneFormat: null
    };
  }

  const metadata = ticket.metadata || {};
  
  // DETECTAR SE É WHATSAPP COM DADOS ENRIQUECIDOS
  const isWhatsApp = Boolean(
    metadata.enhanced_processing ||
    metadata.is_whatsapp ||
    metadata.created_from_whatsapp || 
    metadata.whatsapp_phone || 
    metadata.anonymous_contact || 
    ticket.channel === 'whatsapp'
  );

  let clientName = 'Cliente Anônimo';
  let clientPhone = 'Telefone não informado';
  let clientPhoneFormatted = 'Telefone não informado';
  let clientPhoneRaw = null;
  let whatsappJid = null;
  let canReply = false;
  let country = null;
  let phoneFormat = null;

  if (isWhatsApp) {
    console.log('📱 [EXTRAÇÃO] Processando ticket WhatsApp:', {
      enhanced: metadata.enhanced_processing,
      hasPhoneInfo: !!metadata.phone_info,
      hasResponseData: !!metadata.response_data
    });

    // EXTRAIR NOME COM PRIORIDADE PARA DADOS ENRIQUECIDOS
    clientName = metadata.client_name || 
                metadata.whatsapp_name || 
                (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.name : metadata.anonymous_contact) ||
                ticket.client ||
                ticket.whatsapp_contact_name ||
                'Cliente WhatsApp';

    // EXTRAIR TELEFONES COM SISTEMA APRIMORADO
    if (metadata.enhanced_processing && metadata.phone_formatted) {
      // Dados do sistema aprimorado
      clientPhoneRaw = metadata.client_phone;
      clientPhoneFormatted = metadata.phone_formatted;
      clientPhone = clientPhoneFormatted;
      whatsappJid = metadata.whatsapp_jid;
      canReply = metadata.can_reply || metadata.response_data?.canReply || false;
      
      // Informações do país e formato
      if (metadata.phone_info) {
        country = metadata.phone_info.country;
        phoneFormat = metadata.phone_info.format;
      }
      
      console.log('✅ [EXTRAÇÃO] Dados enriquecidos encontrados:', {
        raw: clientPhoneRaw,
        formatted: clientPhoneFormatted,
        canReply,
        country,
        format: phoneFormat
      });
    } else {
      // Sistema legado - extrair e formatar
      clientPhoneRaw = metadata.client_phone || 
                      metadata.whatsapp_phone || 
                      (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.phone : null) ||
                      ticket.client_phone ||
                      ticket.customerPhone ||
                      ticket.phone ||
                      null;

      if (clientPhoneRaw && clientPhoneRaw !== 'Telefone não informado') {
        // Formatar telefone brasileiro
        const clean = clientPhoneRaw.replace(/\D/g, '');
        if (clean.length >= 12 && clean.startsWith('55')) {
          const ddd = clean.substring(2, 4);
          const number = clean.substring(4);
          if (number.length === 9) {
            clientPhoneFormatted = `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
            country = 'brazil';
            phoneFormat = 'brazil_mobile';
          } else if (number.length === 8) {
            clientPhoneFormatted = `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
            country = 'brazil';
            phoneFormat = 'brazil_landline';
          }
        } else {
          clientPhoneFormatted = clientPhoneRaw;
        }
        clientPhone = clientPhoneFormatted;
        canReply = true; // Assumir que pode responder se tem telefone
      } else {
        clientPhone = 'Telefone não informado';
        clientPhoneFormatted = 'Telefone não informado';
      }
      
      console.log('📞 [EXTRAÇÃO] Sistema legado usado:', {
        raw: clientPhoneRaw,
        formatted: clientPhoneFormatted,
        canReply
      });
    }
  } else {
    // Ticket normal (não WhatsApp)
    clientName = ticket.client || ticket.customer_name || 'Cliente';
    clientPhoneRaw = ticket.customerPhone || ticket.customer_phone;
    clientPhone = clientPhoneRaw || 'Telefone não informado';
    clientPhoneFormatted = clientPhone;
    canReply = false; // Não pode responder via WhatsApp
    
    console.log('💼 [EXTRAÇÃO] Ticket não-WhatsApp:', {
      name: clientName,
      phone: clientPhone
    });
  }

  // Garantir que os valores sejam sempre strings válidas
  const result = {
    clientName: typeof clientName === 'string' ? clientName : 'Cliente Anônimo',
    clientPhone: typeof clientPhone === 'string' ? clientPhone : 'Telefone não informado',
    clientPhoneFormatted: typeof clientPhoneFormatted === 'string' ? clientPhoneFormatted : 'Telefone não informado',
    clientPhoneRaw,
    whatsappJid,
    isWhatsApp,
    canReply,
    country,
    phoneFormat,
    // Dados para resposta
    responseData: metadata.response_data || null,
    instanceName: metadata.instance_name || null
  };

  console.log('✅ [EXTRAÇÃO] Informações extraídas:', {
    name: result.clientName,
    phoneFormatted: result.clientPhoneFormatted,
    canReply: result.canReply,
    isWhatsApp: result.isWhatsApp,
    country: result.country
  });

  return result;
};

export const useTicketChat = (ticket: any | null): UseTicketChatReturn => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage, createTicket, fetchMessages } = useTicketsDB();
  const { sendMessage: sendEvolutionMessage, validateMessageData } = useEvolutionSender();

  // Estados do ticket – inicialização mais defensiva
  const [currentTicket, setCurrentTicket] = useState(() => {
    if (!ticket) {
      console.log('⚠️ [TICKET_CHAT] Ticket é null, retornando objeto vazio');
      return {};
    }
    
    try {
      // Extrair informações do cliente e enriquecer o ticket
      const clientInfo = extractClientInfo(ticket);
      const enrichedTicket = {
        ...ticket,
        client: clientInfo.clientName,
        customerPhone: clientInfo.clientPhone,
        customerEmail: ticket.customerEmail || (clientInfo.isWhatsApp ? 'Email não informado' : ticket.email),
        isWhatsApp: clientInfo.isWhatsApp
      };
      
      console.log('✅ [TICKET_CHAT] Ticket inicializado:', {
        id: enrichedTicket.id,
        client: enrichedTicket.client,
        isWhatsApp: enrichedTicket.isWhatsApp
      });
      
      return enrichedTicket;
    } catch (error) {
      console.error('❌ [TICKET_CHAT] Erro ao inicializar ticket:', error);
      return { ...ticket, client: 'Cliente', isWhatsApp: false };
    }
  });

  // Função para recarregar dados completos do ticket incluindo cliente vinculado
  const loadFullTicketData = useCallback(async (ticketId: string) => {
    try {
      console.log('🔄 [TICKET] Carregando dados completos do ticket:', ticketId);

      const { data: fullTicket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey (
            id,
            name,
            email,
            metadata
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('❌ [TICKET] Erro ao carregar dados completos:', error);
        return null;
      }

      if (fullTicket) {
        console.log('✅ [TICKET] Dados completos carregados:', {
          ticketId: fullTicket.id,
          hasCustomer: !!fullTicket.customer_id,
          customerName: fullTicket.customer ? (fullTicket.customer as any).name : null
        });

        // Enriquecer ticket com dados do cliente se vinculado
        let enrichedTicket = { ...fullTicket };

        if (fullTicket.customer_id && fullTicket.customer) {
          const customerData = fullTicket.customer as any;
          enrichedTicket = {
            ...fullTicket,
            client: customerData.name || 'Cliente',
            customerEmail: customerData.email || 'Email não informado',
            customerPhone: customerData.metadata?.phone || 'Telefone não informado',
            // Manter dados originais do WhatsApp se existirem
            originalClient: fullTicket.metadata?.client_name || null,
            originalClientPhone: fullTicket.metadata?.client_phone || null
          };

          console.log('👤 [TICKET] Dados do cliente aplicados:', {
            client: enrichedTicket.client,
            customerEmail: enrichedTicket.customerEmail,
            customerPhone: enrichedTicket.customerPhone
          });
        } else {
          // Usar dados originais do ticket/WhatsApp
          const clientInfo = extractClientInfo(fullTicket);
          enrichedTicket = {
            ...fullTicket,
            client: clientInfo.clientName,
            customerPhone: clientInfo.clientPhone,
            customerEmail: fullTicket.customerEmail || (clientInfo.isWhatsApp ? 'Email não informado' : fullTicket.email),
            isWhatsApp: clientInfo.isWhatsApp
          };

          console.log('📱 [TICKET] Dados WhatsApp/originais aplicados:', {
            client: enrichedTicket.client,
            customerPhone: enrichedTicket.customerPhone,
            isWhatsApp: enrichedTicket.isWhatsApp
          });
        }

        // Atualizar estado local
        setCurrentTicket(enrichedTicket);
        return enrichedTicket;
      }

      return null;

    } catch (error) {
      console.error('❌ [TICKET] Erro no carregamento completo:', error);
      return null;
    }
  }, []);

  // Hook para mensagens Evolution, usando o ID do ticket (que pode mudar após migração)
  const {
    /* evolutionMessages – ainda não utilizado internamente */
    loadEvolutionMessages,
  } = useWebhookResponses(ticket?.id?.toString() || '');

  // 🚀 SISTEMA DE MENSAGENS EM TEMPO REAL PERFORMÁTICO - DEFENSIVO
  const ticketIdForRealtime = (() => {
    try {
      const rawId = currentTicket?.originalId || currentTicket?.id;
      if (!rawId) {
        console.log('⚠️ [REALTIME] Nenhum ID de ticket disponível');
        return null;
      }
      
      const ticketId = rawId.toString();
      console.log('📡 [REALTIME] Usando ticket ID:', ticketId);
      return ticketId;
    } catch (error) {
      console.error('❌ [REALTIME] Erro ao processar ticket ID:', error);
      return null;
    }
  })();

  // 🚀 SISTEMA DE MENSAGENS EM TEMPO REAL OTIMIZADO
  const {
    messages: realTimeMessages,
    isLoading: isLoadingHistory,
    isConnected: isRealtimeConnected,
    lastUpdateTime,
    unreadCount: realtimeUnreadCount,
    refreshMessages,
    markAsRead,
    addMessage,
    updateMessage,
    connectionStatus
  } = useRealtimeMessages({
    ticketId: ticketIdForRealtime,
    pollingInterval: 10000, // 10 segundos - conservador e estável
    enableRealtime: true,
    enablePolling: true,
    maxRetries: 2 // Máximo 2 tentativas para evitar loops
  });
  
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
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

  // 📥 CARREGAMENTO DE MENSAGENS AGORA DELEGADO PARA useRealtimeMessages
  // A função loadExistingMessages não é mais necessária - o hook gerencia automaticamente

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

      addMessage(localMessage);
      setLastSentMessage(Date.now());
      setMessage('');
      
      setTimeout(() => setLastSentMessage(null), 2000);

      // Enviar via Evolution API se não for mensagem interna e tiver telefone do cliente
      const clientInfo = extractClientInfo(currentTicket);
      const hasValidPhone = clientInfo.clientPhone && 
                           clientInfo.clientPhone !== 'Telefone não informado' && 
                           clientInfo.clientPhone.replace(/\D/g, '').length >= 10;
      
      console.log('🔍 DEBUG - Verificando condições de envio WhatsApp:', {
        isInternal,
        clientInfo,
        hasValidPhone,
        currentTicket: {
          id: currentTicket?.id,
          client: currentTicket?.client,
          channel: currentTicket?.channel,
          isWhatsApp: currentTicket?.isWhatsApp,
          metadata: currentTicket?.metadata
        }
      });
      
      // Corrigir validação do isWhatsApp - deve ser boolean
      const isWhatsAppTicket = Boolean(clientInfo.isWhatsApp);
      
      if (!isInternal && hasValidPhone && isWhatsAppTicket) {
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
            instance: 'atendimento-ao-cliente-suporte', // SEMPRE usar instância que existe
            options: {
              delay: 1000,
              presence: 'composing'
            }
          });

          if (evolutionResult.success) {
            console.log('✅ Mensagem enviada via WhatsApp:', evolutionResult.messageId);
            
            // Atualizar status da mensagem local
            updateMessage(localMessage.id, { status: 'delivered' as const });

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
        console.log('❌ DEBUG - Não enviando via WhatsApp. Motivos:', {
          isInternal: isInternal ? 'Mensagem é interna' : 'OK',
          hasValidPhone: hasValidPhone ? 'OK' : 'Telefone inválido ou não informado',
          isWhatsApp: clientInfo.isWhatsApp ? 'OK' : 'Ticket não é do WhatsApp',
          clientPhone: clientInfo.clientPhone,
          phoneLength: clientInfo.clientPhone?.replace(/\D/g, '').length
        });
        
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
      // FORÇA SEMPRE A INSTÂNCIA CORRETA QUE EXISTE NA EVOLUTION API
      const instanceName = 'atendimento-ao-cliente-suporte'; // Instância que realmente existe
      
      // Log para debug se estava usando instância incorreta
      const metadataInstance = currentTicket?.metadata?.instance_name;
      if (metadataInstance && metadataInstance !== instanceName) {
        console.warn('⚠️ [CORREÇÃO] Instância incorreta detectada no metadata:', {
          incorreta: metadataInstance,
          corrigida: instanceName,
          ticketId: currentTicket.id
        });
      }
      
      setWhatsappInstance(instanceName);
      setWhatsappStatus('connected'); // Para demonstração
      
      console.log('🔧 Configurando instância WhatsApp (FORÇADA CORRETA):', {
        instanceName,
        originalMetadata: metadataInstance,
        forced: true
      });
    }
  }, [currentTicket]);

  // Função para corrigir dados do ticket se necessário
  const fixTicketData = useCallback((ticket: any) => {
    if (!ticket) return ticket;

    const metadata = ticket.metadata || {};
    
    // Detectar se deveria ser WhatsApp
    const shouldBeWhatsApp = Boolean(
      metadata.whatsapp_phone ||
      metadata.is_whatsapp ||
      metadata.client_phone ||
      ticket.client_phone ||
      ticket.customerPhone ||
      ticket.channel === 'whatsapp'
    );

    // Corrigir dados se necessário
    const fixed = { ...ticket };
    
    if (shouldBeWhatsApp && ticket.channel !== 'whatsapp') {
      console.log('🔧 Corrigindo dados do ticket para WhatsApp:', ticket.id);
      
      fixed.channel = 'whatsapp';
      fixed.isWhatsApp = true;
      
      // Enriquecer metadata
      if (!fixed.metadata) fixed.metadata = {};
      
      if (!fixed.metadata.client_phone && (ticket.client_phone || ticket.customerPhone)) {
        fixed.metadata.client_phone = ticket.client_phone || ticket.customerPhone;
      }
      
      if (!fixed.metadata.client_name && ticket.client) {
        fixed.metadata.client_name = ticket.client;
      }
      
      if (!fixed.metadata.is_whatsapp) {
        fixed.metadata.is_whatsapp = true;
      }
    }

    return fixed;
  }, []);

  // Effect para reprocessar dados do ticket quando ticket prop mudar
  useEffect(() => {
    const initializeTicket = async () => {
      if (ticket) {
        console.log('🎯 [INIT] Inicializando ticket:', ticket.id);

        // Primeiro, corrigir dados do ticket se necessário
        const fixedTicket = fixTicketData(ticket);
        
        // Se temos um UUID válido, carregar dados completos do banco
        const ticketId = fixedTicket.originalId || fixedTicket.id;
        
        if (typeof ticketId === 'string' && ticketId.includes('-')) {
          console.log('🔄 [INIT] Carregando dados completos do banco...');
          const fullTicketData = await loadFullTicketData(ticketId);
          
          if (fullTicketData) {
            console.log('✅ [INIT] Ticket inicializado com dados completos');
            return; // loadFullTicketData já atualizou o currentTicket
          }
        }

        // Fallback: usar dados básicos do ticket prop
        console.log('📋 [INIT] Usando dados básicos do ticket prop');
        const clientInfo = extractClientInfo(fixedTicket);
        setCurrentTicket({
          ...fixedTicket,
          client: clientInfo.clientName,
          customerPhone: clientInfo.clientPhone,
          customerEmail: fixedTicket.customerEmail || (clientInfo.isWhatsApp ? 'Email não informado' : fixedTicket.email),
          isWhatsApp: clientInfo.isWhatsApp
        });
      }
    };

    initializeTicket();
  }, [ticket, fixTicketData, loadFullTicketData]);

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

  // 🚀 CARREGAMENTO DE MENSAGENS AUTOMATIZADO
  // O useRealtimeMessages já gerencia automaticamente o carregamento baseado no ticketId
  // Apenas sincronizar quando ticket muda
  useEffect(() => {
    if (ticket?.id) {
      console.log('🔄 [REALTIME] Ticket mudou, sincronizando mensagens:', ticket.id);
      
      // Se é um ID numérico, tentar mapear para UUID para o hook
      if (typeof ticket.id === 'number') {
        getRealTicketId(ticket.id).then(realId => {
          if (realId) {
            console.log('🎯 [REALTIME] Ticket mapeado para UUID:', realId);
            setCurrentTicket((prev: any) => ({ ...prev, id: realId, originalId: realId }));
          }
        });
      }
      
      // Marcar mensagens como lidas quando ticket é aberto
      markAsRead();
    }
  }, [ticket?.id, ticket?.originalId, getRealTicketId, markAsRead]);

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
    showCustomerModal,
    setShowCustomerModal,
    
    // Mensagens
    realTimeMessages,
    isLoadingHistory,
    
    // Sidebar
    showSidebar,
    setShowSidebar,
    
    // WhatsApp
    whatsappStatus,
    whatsappInstance,
    
    // 🚀 Realtime
    isRealtimeConnected,
    lastUpdateTime,
    connectionStatus,
    refreshMessages,
    
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