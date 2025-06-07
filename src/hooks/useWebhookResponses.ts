import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface WebhookResponse {
  id: string;
  ticketId: string;
  messageId: string;
  response: string;
  sender: 'client' | 'agent' | 'system';
  senderName: string;
  confidence?: number;
  timestamp: string;
  processed: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EvolutionMessage {
  ticketId: string;
  content: string;
  senderName: string;
  senderPhone: string;
  instanceName: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  timestamp: string;
}

export const useWebhookResponses = (ticketId?: string) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<WebhookResponse[]>([]);
  const [evolutionMessages, setEvolutionMessages] = useState<EvolutionMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);

  // Função para processar novas mensagens recebidas via webhook
  const handleNewEvolutionMessage = useCallback((message: EvolutionMessage) => {
    if (!ticketId || message.ticketId !== ticketId) return;

    console.log('📩 Nova mensagem Evolution recebida:', message);

    setEvolutionMessages(prev => {
      // Evitar duplicatas
      const exists = prev.some(m => 
        m.content === message.content && 
        m.timestamp === message.timestamp &&
        m.senderPhone === message.senderPhone
      );

      if (exists) {
        console.log('⚠️ Mensagem duplicada ignorada');
        return prev;
      }

      // Adicionar nova mensagem
      const updated = [...prev, message];
      
      // Ordenar por timestamp
      updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Manter apenas as últimas 50 mensagens
      return updated.slice(-50);
    });

    // Toast de notificação
    toast({
      title: `📱 ${message.senderName}`,
      description: message.content.length > 60 
        ? message.content.substring(0, 60) + '...' 
        : message.content,
      duration: 4000,
    });

    setLastMessageTime(message.timestamp);
  }, [ticketId, toast]);

  // Escutar mudanças na tabela de mensagens (Evolution API)
  useEffect(() => {
    if (!ticketId) return;

    console.log('🔗 Iniciando escuta de mensagens Evolution para ticket:', ticketId);
    setIsListening(true);

    // Subscription para mudanças na tabela de mensagens
    const subscription = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Processar apenas mensagens de clientes vindas do WhatsApp
          if (
            newMessage.metadata?.is_from_whatsapp && 
            !newMessage.sender_id && // Mensagens de clientes não têm sender_id
            newMessage.content
          ) {
            const evolutionMessage: EvolutionMessage = {
              ticketId: newMessage.ticket_id,
              content: newMessage.content,
              senderName: newMessage.sender_name || 'Cliente',
              senderPhone: newMessage.metadata?.sender_phone || '',
              instanceName: newMessage.metadata?.evolution_instance || '',
              messageType: newMessage.type || 'text',
              mediaUrl: newMessage.metadata?.media_url,
              timestamp: newMessage.created_at
            };

            handleNewEvolutionMessage(evolutionMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
      });

    return () => {
      console.log('🔌 Desconectando escuta de mensagens Evolution');
      subscription.unsubscribe();
      setIsListening(false);
    };
  }, [ticketId, handleNewEvolutionMessage]);

  // Buscar mensagens Evolution existentes
  const loadEvolutionMessages = useCallback(async (targetTicketId?: string) => {
    const id = targetTicketId || ticketId;
    if (!id) return;

    try {
      console.log('📥 Carregando mensagens Evolution existentes...');

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', id)
        .eq('metadata->>is_from_whatsapp', 'true')
        .is('sender_id', null) // Mensagens de clientes
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao carregar mensagens Evolution:', error);
        return;
      }

      const evolutionMsgs: EvolutionMessage[] = (messages || []).map(msg => ({
        ticketId: msg.ticket_id,
        content: msg.content,
        senderName: msg.sender_name || 'Cliente',
        senderPhone: msg.metadata?.sender_phone || '',
        instanceName: msg.metadata?.evolution_instance || '',
        messageType: msg.type || 'text',
        mediaUrl: msg.metadata?.media_url,
        timestamp: msg.created_at
      }));

      setEvolutionMessages(evolutionMsgs);
      
      if (evolutionMsgs.length > 0) {
        setLastMessageTime(evolutionMsgs[evolutionMsgs.length - 1].timestamp);
      }

      console.log(`✅ ${evolutionMsgs.length} mensagens Evolution carregadas`);

    } catch (error) {
      console.error('❌ Erro ao carregar mensagens Evolution:', error);
    }
  }, [ticketId]);

  // Marcar mensagens como processadas
  const markAsProcessed = useCallback(async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('webhook_responses')
        .update({ processed: true })
        .in('id', messageIds);

      if (error) {
        console.error('❌ Erro ao marcar como processadas:', error);
        return false;
      }

      setResponses(prev => 
        prev.map(response => 
          messageIds.includes(response.id) 
            ? { ...response, processed: true }
            : response
        )
      );

      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens:', error);
      return false;
    }
  }, []);

  // Limpar mensagens antigas
  const clearOldMessages = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    setResponses(prev => 
      prev.filter(response => response.timestamp > oneDayAgo)
    );
    
    setEvolutionMessages(prev => 
      prev.filter(message => message.timestamp > oneDayAgo)
    );
  }, []);

  // Limpar mensagens ao desmontar
  useEffect(() => {
    return () => {
      setResponses([]);
      setEvolutionMessages([]);
    };
  }, []);

  // Auto-carregar mensagens quando o ticket muda
  useEffect(() => {
    if (ticketId) {
      loadEvolutionMessages(ticketId);
    }
  }, [ticketId, loadEvolutionMessages]);

  return {
    responses,
    evolutionMessages,
    isListening,
    lastMessageTime,
    loadEvolutionMessages,
    markAsProcessed,
    clearOldMessages,
    handleNewEvolutionMessage
  };
}; 