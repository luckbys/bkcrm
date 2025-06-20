import { useState, useEffect, useCallback } from 'react';
import { useTicketsDB } from './useTicketsDB';
import { useAuth } from './useAuth';
// import { useWebhookResponses } from './useWebhookResponses'; // Desabilitado
import { useToast } from './use-toast';
// import { useMinimizedState } from './useMinimizedState'; // Temporariamente removido
import { supabase } from '../lib/supabase';
import { LocalMessage, QuickTemplate, UseTicketChatReturn } from '../types/ticketChat';
import { useEvolutionSender } from './useEvolutionSender';
import { useWebSocketMessages } from './useWebSocketMessages';

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
    ticket.channel === 'whatsapp' ||
    ticket.nunmsg // 📱 NOVO: Detectar por campo nunmsg
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
      hasResponseData: !!metadata.response_data,
      hasNunmsg: !!ticket.nunmsg // 📱 NOVO: Verificar campo nunmsg
    });

    // EXTRAIR NOME COM PRIORIDADE PARA DADOS ENRIQUECIDOS
    clientName = metadata.client_name || 
                metadata.whatsapp_name || 
                (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.name : metadata.anonymous_contact) ||
                ticket.client ||
                ticket.whatsapp_contact_name ||
                'Cliente WhatsApp';

    // 📱 PRIORIZAR CAMPO NUNMSG PARA EXTRAÇÃO DE TELEFONE
    if (ticket.nunmsg) {
      // Usar campo nunmsg como fonte principal
      clientPhoneRaw = ticket.nunmsg;
      clientPhoneFormatted = ticket.nunmsg;
      clientPhone = ticket.nunmsg;
      canReply = true; // Se tem nunmsg, pode responder
      
      console.log('✅ [EXTRAÇÃO] Telefone extraído do campo nunmsg:', {
        nunmsg: ticket.nunmsg,
        canReply: true
      });
      
    } else if (metadata.enhanced_processing && metadata.phone_formatted) {
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

// 🔧 FUNÇÃO PARA CORRIGIR DADOS DO TICKET SE NECESSÁRIO (FORA DO HOOK)
const fixTicketData = (ticket: any) => {
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
};

export const useTicketChat = (ticket: any | null): UseTicketChatReturn => {
  // 🚀 TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER EARLY RETURN
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage, createTicket, fetchMessages } = useTicketsDB();
  const { sendMessage: sendEvolutionMessage, validateMessageData, extractPhoneFromTicket } = useEvolutionSender();

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
  const [messageFilter, setMessageFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [favoriteMessages, setFavoriteMessages] = useState(new Set<number>());
  const [quickReplyVisible, setQuickReplyVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  
  // Estados modais
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Estados para modal de validação de telefone
  const [showPhoneValidationModal, setShowPhoneValidationModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [pendingIsInternal, setPendingIsInternal] = useState(false);
  
  // Estados de sidebar
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Estados WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [whatsappInstance, setWhatsappInstance] = useState<string | null>(null);

  // Função para carregar dados completos do ticket do banco
  const loadFullTicketData = useCallback(async (ticketId: string) => {
    try {
      console.log('📋 [BANCO] Carregando dados completos do ticket:', ticketId);
      
      const { data: fullTicket, error } = await supabase
        .from('tickets')
        .select('*, customer:profiles!tickets_customer_id_fkey(id, name, email, metadata)')
        .eq('id', ticketId)
        .single();

      if (error || !fullTicket) {
        console.log('⚠️ [BANCO] Ticket não encontrado ou erro:', error?.message);
        return null;
      }

      console.log('✅ [BANCO] Dados completos carregados:', {
        id: fullTicket.id,
        hasCustomer: !!fullTicket.customer,
        title: fullTicket.title
      });

      // Enriquecer ticket com dados do cliente se disponível
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

        console.log('👤 [BANCO] Dados do cliente aplicados:', {
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

        console.log('📱 [BANCO] Dados WhatsApp/originais aplicados:', {
          client: enrichedTicket.client,
          customerPhone: enrichedTicket.customerPhone,
          isWhatsApp: enrichedTicket.isWhatsApp
        });
      }

      // Atualizar estado local apenas uma vez
      setCurrentTicket(enrichedTicket);
      return enrichedTicket;

    } catch (error) {
      console.error('❌ [BANCO] Erro no carregamento completo:', error);
      return null;
    }
  }, []); // 🚀 CORREÇÃO: Sem dependências para evitar loops

  // 🚀 SISTEMA DE MENSAGENS EM TEMPO REAL OTIMIZADO - CALCULAR ID PRIMEIRO
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

  // Hook para mensagens Evolution, usando o ID do ticket (que pode mudar após migração)
  // TEMPORARIAMENTE DESABILITADO PARA DEBUG
  /*
  const {
    loadEvolutionMessages,
  } = useWebhookResponses(ticket?.id?.toString() || '');
  */
  const loadEvolutionMessages = () => Promise.resolve(); // Placeholder

  // 🔗 SISTEMA WEBSOCKET MESSAGES (Substitui realtime do Supabase)
  const {
    messages: realTimeMessages,
    isLoading: isLoadingHistory,
    isConnected: isRealtimeConnected,
    lastUpdateTime,
    refreshMessages,
    sendMessage: sendWebSocketMessage,
    connectionStatus,
    connectionStats
  } = useWebSocketMessages({
    ticketId: ticketIdForRealtime,
    userId: user?.id,
    enabled: Boolean(ticket && ticketIdForRealtime) // Só ativar se tiver ticket válido
  });

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
      if (!user) {
        console.log('❌ Usuário não autenticado, não é possível consultar ticket real');
        return null;
      }

      console.log('🔍 Buscando ticket no banco com ID compatibilidade:', ticketCompatibilityId);
      
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id')
        .or(`metadata->>compatibility_id.eq.${ticketCompatibilityId},id.eq.${ticketCompatibilityId}`)
        .limit(1);

      if (error) {
        console.error('❌ Erro ao buscar ticket real:', error.message);
        return null;
      }

      if (tickets && tickets.length > 0) {
        console.log('✅ Ticket real encontrado:', tickets[0].id);
        return tickets[0].id;
      }

      console.log('⚠️ Ticket real não encontrado para:', ticketCompatibilityId);
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter ticket ID real:', error);
      return null;
    }
  }, [ticket?.originalId, user]);

  // Funções de utilidade
  const generateUniqueId = useCallback((messageId: string): number => {
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
  }, []);

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

  // Funções de ação
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Se é mensagem para WhatsApp (não interna) e ticket tem telefone, validar antes
      if (!isInternal && currentTicket?.channel?.toLowerCase() === 'whatsapp') {
        const extractedPhone = extractPhoneFromTicket(currentTicket);
        
        if (!extractedPhone || extractedPhone === 'Telefone não informado') {
          console.log('📞 [VALIDAÇÃO] Telefone não encontrado, solicitando validação');
          setPendingMessage(message);
          setPendingIsInternal(isInternal);
          setShowPhoneValidationModal(true);
          setIsSending(false);
          return;
        }
      }

      // Continuar com envio normal
      await _sendMessageInternal(message, isInternal);
    } catch (error) {
      console.error('❌ [ENVIO] Erro no envio:', error);
      toast({
        title: "❌ Erro ao enviar mensagem",
        description: "Tente novamente em alguns segundos",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [message, isInternal, isSending, currentTicket, extractPhoneFromTicket, toast]);

  // Função interna para envio de mensagem
  const _sendMessageInternal = useCallback(async (messageText: string, internal: boolean) => {
    if (!messageText.trim()) return;

    const isWhatsAppTicket = currentTicket?.channel?.toLowerCase() === 'whatsapp';
    const ticketId = currentTicket?.originalId || currentTicket?.id;

    console.log('📨 [ENVIO] Preparando mensagem:', {
      text: messageText.substring(0, 50) + '...',
      isInternal: internal,
      isWhatsApp: isWhatsAppTicket,
      ticketId
    });

    // Criar objeto da mensagem
    const newMessage = {
      content: messageText,
      sender: 'agent' as const,
      senderName: user?.name || 'Agente',
      sender_id: user?.id,
      isInternal: internal,
      timestamp: new Date(),
      messageType: 'text' as const,
      status: 'sending' as const
    };

    try {
      // Enviar mensagem via WebSocket (que já salva no banco automaticamente)
      const success = await sendWebSocketMessage(messageText, internal);
      
              if (!success) {
          throw new Error('Falha ao enviar via WebSocket');
        }
        
        console.log('✅ [WEBSOCKET] Mensagem enviada via WebSocket');
        
        // Se não é nota interna e é ticket WhatsApp, tentar enviar via Evolution API
        if (!internal && isWhatsAppTicket) {
          try {
            // Garantir que temos dados WhatsApp válidos
            const fixedTicket = fixTicketData(currentTicket);
            const phoneNumber = extractPhoneFromTicket(fixedTicket);
            
            if (phoneNumber && phoneNumber !== 'Telefone não informado') {
              console.log('📤 [WHATSAPP] Enviando via Evolution API...');
              
              // Preparar dados para Evolution API
              const evolutionData = {
                phone: phoneNumber,
                text: messageText,
                instance: fixedTicket?.metadata?.evolution_instance || 'atendimento-ao-cliente-suporte',
                options: {
                  delay: 1000,
                  presence: 'composing' as const,
                  linkPreview: true
                }
              };
              
              console.log('📞 [WHATSAPP] Dados para Evolution API:', {
                phone: evolutionData.phone,
                text: evolutionData.text.substring(0, 50) + '...',
                instance: evolutionData.instance
              });
              
              const evolutionResponse = await sendEvolutionMessage(evolutionData);
              
              if (evolutionResponse?.success) {
                console.log('✅ [WHATSAPP] Enviado via Evolution API');
                toast({
                  title: "✅ Mensagem enviada",
                  description: `Enviada via WhatsApp para ${phoneNumber}`
                });
              } else {
                console.error('❌ [WHATSAPP] Falha Evolution API:', evolutionResponse?.error);
                toast({
                  title: "⚠️ Mensagem salva localmente",
                  description: "Erro ao enviar via WhatsApp, mas mensagem foi salva",
                  variant: "destructive"
                });
              }
            } else {
              console.log('⚠️ [WHATSAPP] Telefone não disponível, apenas salvo no CRM');
              toast({
                title: "💾 Mensagem salva",
                description: "Telefone indisponível para WhatsApp"
              });
            }
          } catch (evolutionError) {
            console.error('❌ [WHATSAPP] Erro Evolution API:', evolutionError);
            toast({
              title: "⚠️ Enviado parcialmente",
              description: "Salvo no CRM, erro no WhatsApp",
              variant: "destructive"
            });
          }
        } else {
          // Mensagem interna ou canal diferente de WhatsApp
          toast({
            title: internal ? "📝 Nota interna salva" : "✅ Mensagem enviada",
            description: internal ? "Apenas a equipe pode ver" : "Mensagem salva com sucesso"
          });
        }
        
        // Atualizar estado local
        setLastSentMessage(Date.now());
      
    } catch (error) {
      console.error('❌ [ENVIO] Erro completo:', error);
      toast({
        title: "❌ Erro ao enviar mensagem",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      // Limpar input
      setMessage('');
      setIsTyping(false);
    }
  }, [currentTicket, user, sendMessage, sendEvolutionMessage, extractPhoneFromTicket, fixTicketData, toast]);

  const handleContinueSendAfterValidation = useCallback(async (validatedPhone: string, phoneFormatted: string) => {
    try {
      console.log('✅ [VALIDAÇÃO] Telefone validado, continuando envio:', {
        phone: validatedPhone,
        formatted: phoneFormatted,
        pendingMessage: pendingMessage.substring(0, 50) + '...'
      });

      // Atualizar ticket com telefone validado
      const updatedTicket = {
        ...currentTicket,
        metadata: {
          ...currentTicket.metadata,
          whatsapp_phone: validatedPhone,
          client_phone: validatedPhone,
          phone_validated: true,
          phone_formatted: phoneFormatted
        },
        customerPhone: phoneFormatted,
        // Garantir que é identificado como WhatsApp
        channel: 'whatsapp',
        isWhatsApp: true
      };
      
      setCurrentTicket(updatedTicket);

      // Tentar salvar telefone no ticket do banco
      try {
        const ticketId = currentTicket?.originalId || currentTicket?.id;
        if (ticketId) {
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
              metadata: updatedTicket.metadata,
              nunmsg: validatedPhone // Campo dedicado para número WhatsApp
            })
            .eq('id', ticketId);

          if (!updateError) {
            console.log('✅ [BANCO] Telefone salvo no ticket');
          } else {
            console.warn('⚠️ [BANCO] Erro ao salvar telefone:', updateError.message);
          }
        }
      } catch (updateError) {
        console.warn('⚠️ [BANCO] Falha ao atualizar telefone no banco:', updateError);
      }

      // Enviar mensagem pendente
      await _sendMessageInternal(pendingMessage, pendingIsInternal);
      
      // Limpar estados pendentes
      setPendingMessage('');
      setPendingIsInternal(false);
      setShowPhoneValidationModal(false);
      
      toast({
        title: "✅ Telefone validado e mensagem enviada",
        description: `Enviada para ${phoneFormatted}`
      });

    } catch (error) {
      console.error('❌ [VALIDAÇÃO] Erro ao continuar envio:', error);
      toast({
        title: "❌ Erro após validação",
        description: "Tente enviar novamente",
        variant: "destructive"
      });
    }
  }, [pendingMessage, pendingIsInternal, currentTicket, _sendMessageInternal, toast]);

  const handleTemplateSelect = useCallback((template: QuickTemplate) => {
    setMessage(template.content);
    setQuickReplyVisible(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleMessageFavorite = useCallback((messageId: number) => {
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
  }, [toast]);

  // Função para toggle sidebar
  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // Effect para busca em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMessages(messageSearchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [messageSearchTerm, searchMessages]);

  // Effect para reprocessar dados do ticket quando ticket prop mudar
  useEffect(() => {
    const initializeTicket = async () => {
      if (!ticket) {
        console.log('⚠️ [INIT] Ticket é null, limpando estado');
        setCurrentTicket({});
        return;
      }

      // Usar ID do ticket como chave para evitar re-inicializações desnecessárias
      const ticketKey = ticket.originalId || ticket.id;
      
      console.log('🎯 [INIT] Inicializando ticket:', ticketKey);

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
    };

    initializeTicket();
  }, [ticket?.id, ticket?.originalId, loadFullTicketData]); // 🚀 CORREÇÃO: Dependências específicas para evitar loops

  // Effect para carregar dados do WhatsApp quando ticket muda
  useEffect(() => {
    if (currentTicket?.id || currentTicket?.originalId) {
      // FORÇA SEMPRE A INSTÂNCIA CORRETA QUE EXISTE NA EVOLUTION API
      const instanceName = 'atendimento-ao-cliente-suporte'; // Instância que realmente existe
      
      // Log para debug se estava usando instância incorreta
      const metadataInstance = currentTicket?.metadata?.instance_name;
      if (metadataInstance && metadataInstance !== instanceName) {
        console.warn('⚠️ [CORREÇÃO] Instância incorreta detectada no metadata:', {
          incorreta: metadataInstance,
          corrigida: instanceName,
          ticketId: currentTicket.id || currentTicket.originalId
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
  }, [currentTicket?.id, currentTicket?.originalId]); // 🚀 CORREÇÃO: Dependências específicas

  // Effect para sincronizar mensagens quando ticket real muda
  useEffect(() => {
    if (ticket?.id && realTimeMessages.length > 0) {
      console.log('🔄 [REALTIME] Ticket mudou, sincronizando mensagens:', ticket.id);
      
      // Mapear para UUID se necessário para realtime
      const ticketId = ticket.originalId || ticket.id;
      if (typeof ticketId === 'string' && ticketId.includes('-')) {
        console.log('🎯 [REALTIME] Ticket mapeado para UUID:', ticketId);
      }
    }
  }, [ticket?.id, realTimeMessages.length]); // 🚀 CORREÇÃO: Dependências específicas para evitar loops

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

  // 🚀 RETURN FINAL DO HOOK - SEMPRE EXECUTADO
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
    
    showPhoneValidationModal,
    setShowPhoneValidationModal,
    pendingMessage,
    setPendingMessage,
    pendingIsInternal,
    setPendingIsInternal,
    
    // Mensagens
    realTimeMessages,
    isLoadingHistory,
    
    // Sidebar
    showSidebar,
    setShowSidebar,
    
    // WhatsApp
    whatsappStatus,
    whatsappInstance,
    
    // Realtime
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
    getRealTicketId,
    handleContinueSendAfterValidation,
    extractClientInfo: () => ticket ? extractClientInfo(ticket) : {}
  };
}; 