import { useState, useCallback, useRef } from 'react';
import { evolutionApi, SendMessageRequest, SendMessageResponse } from '../services/evolutionApi';
import { useRealtimeNotifications } from './useRealtimeNotifications';

// Interfaces baseadas na documentação Evolution API v2
interface EvolutionTextMessage {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quoted?: {
    key: {
      id: string;
    };
    message: {
      conversation: string;
    };
  };
}

interface EvolutionMediaMessage {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  media: string; // Base64 ou URL
  caption?: string;
  fileName?: string;
  delay?: number;
  quoted?: {
    key: { id: string };
    message: { conversation: string };
  };
}

interface EvolutionLocationMessage {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  url?: string;
}

interface EvolutionContactMessage {
  number: string;
  contact: {
    fullName: string;
    wuid: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
    url?: string;
  };
}

interface EvolutionStickerMessage {
  number: string;
  sticker: string; // Base64 ou URL
}

interface EvolutionReactionMessage {
  number: string;
  reaction: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    reaction: string; // Emoji
  };
}

interface EvolutionPollMessage {
  number: string;
  poll: {
    name: string;
    selectableCount: number;
    values: string[];
  };
}

interface EvolutionListMessage {
  number: string;
  list: {
    title: string;
    description: string;
    buttonText: string;
    footerText?: string;
    sections: Array<{
      title: string;
      rows: Array<{
        title: string;
        description?: string;
        rowId: string;
      }>;
    }>;
  };
}

interface EvolutionButtonMessage {
  number: string;
  button: {
    text: string;
    buttons: Array<{
      type: 'replyButton' | 'urlButton' | 'callButton';
      title: string;
      payload?: string;
      url?: string;
      phoneNumber?: string;
    }>;
    footerText?: string;
  };
}

interface SendOptions {
  instance?: string;
  delay?: number;
  presence?: 'composing' | 'recording';
  quoted?: {
    key: { id: string };
    message: { conversation: string };
  };
}

interface UseEvolutionSenderReturn {
  // Estados
  isSending: boolean;
  lastSentMessage: any;
  sendingQueue: number;
  error: string | null;
  
  // Métodos de envio
  sendText: (message: EvolutionTextMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendMedia: (message: EvolutionMediaMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendLocation: (message: EvolutionLocationMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendContact: (message: EvolutionContactMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendSticker: (message: EvolutionStickerMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendReaction: (message: EvolutionReactionMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendPoll: (message: EvolutionPollMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendList: (message: EvolutionListMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  sendButton: (message: EvolutionButtonMessage, options?: SendOptions) => Promise<SendMessageResponse>;
  
  // Métodos auxiliares
  sendStatus: (number: string, text: string, options?: SendOptions) => Promise<SendMessageResponse>;
  markAsRead: (messageKey: string, options?: SendOptions) => Promise<boolean>;
  markAsUnread: (messageKey: string, options?: SendOptions) => Promise<boolean>;
  sendPresence: (number: string, presence: 'available' | 'composing' | 'recording' | 'paused', options?: SendOptions) => Promise<boolean>;
  
  // Utilitários
  formatPhoneNumber: (phone: string) => string;
  validateWhatsAppNumber: (phone: string) => Promise<boolean>;
  getInstanceStatus: (instance?: string) => Promise<any>;
  
  // Controle de fila
  clearQueue: () => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
}

export const useEvolutionSender = (): UseEvolutionSenderReturn => {
  const [isSending, setIsSending] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<any>(null);
  const [sendingQueue, setSendingQueue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const queueRef = useRef<Array<() => Promise<any>>>([]);
  const isProcessingRef = useRef(false);
  const isPausedRef = useRef(false);
  
  const { addNotification } = useRealtimeNotifications();

  // Configurações padrão
  const DEFAULT_INSTANCE = 'atendimento-ao-cliente-suporte';
  const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
  const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

  // Processar fila de envio
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || isPausedRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    
    while (queueRef.current.length > 0 && !isPausedRef.current) {
      const task = queueRef.current.shift();
      if (task) {
        try {
          await task();
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          console.error('❌ [Evolution] Erro na fila de envio:', error);
        }
      }
      setSendingQueue(queueRef.current.length);
    }
    
    isProcessingRef.current = false;
  }, []);

  // Adicionar à fila
  const addToQueue = useCallback((task: () => Promise<any>) => {
    queueRef.current.push(task);
    setSendingQueue(queueRef.current.length);
    processQueue();
  }, [processQueue]);

  // Função base para envio
  const sendMessage = useCallback(async (
    endpoint: string, 
    payload: any, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    const instance = options.instance || DEFAULT_INSTANCE;
    
    return new Promise((resolve, reject) => {
      addToQueue(async () => {
        setIsSending(true);
        setError(null);
        
        try {
          console.log(`📤 [Evolution] Enviando via ${endpoint}:`, payload);
          
          const response = await fetch(`${EVOLUTION_API_URL}/message/${endpoint}/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': API_KEY
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
          }

          const result = await response.json();
          
          console.log('✅ [Evolution] Mensagem enviada:', result);
          
          setLastSentMessage(result);
          
          addNotification({
            title: '📤 Mensagem Enviada',
            message: 'Mensagem enviada via WhatsApp com sucesso',
            type: 'success'
          });
          
          resolve(result);
        } catch (error: any) {
          console.error('❌ [Evolution] Erro ao enviar mensagem:', error);
          setError(error.message);
          
          addNotification({
            title: '❌ Erro no Envio',
            message: `Falha ao enviar mensagem: ${error.message}`,
            type: 'error'
          });
          
          reject(error);
        } finally {
          setIsSending(false);
        }
      });
    });
  }, [addToQueue, addNotification]);

  // Enviar mensagem de texto
  const sendText = useCallback(async (
    message: EvolutionTextMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendText', message, options);
  }, [sendMessage]);

  // Enviar mídia
  const sendMedia = useCallback(async (
    message: EvolutionMediaMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendMedia', message, options);
  }, [sendMessage]);

  // Enviar localização
  const sendLocation = useCallback(async (
    message: EvolutionLocationMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendLocation', message, options);
  }, [sendMessage]);

  // Enviar contato
  const sendContact = useCallback(async (
    message: EvolutionContactMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendContact', message, options);
  }, [sendMessage]);

  // Enviar sticker
  const sendSticker = useCallback(async (
    message: EvolutionStickerMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendSticker', message, options);
  }, [sendMessage]);

  // Enviar reação
  const sendReaction = useCallback(async (
    message: EvolutionReactionMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendReaction', message, options);
  }, [sendMessage]);

  // Enviar poll
  const sendPoll = useCallback(async (
    message: EvolutionPollMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendPoll', message, options);
  }, [sendMessage]);

  // Enviar lista
  const sendList = useCallback(async (
    message: EvolutionListMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendList', message, options);
  }, [sendMessage]);

  // Enviar botões
  const sendButton = useCallback(async (
    message: EvolutionButtonMessage, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendButtons', message, options);
  }, [sendMessage]);

  // Enviar status
  const sendStatus = useCallback(async (
    number: string, 
    text: string, 
    options: SendOptions = {}
  ): Promise<SendMessageResponse> => {
    return sendMessage('sendStatus', { number, text }, options);
  }, [sendMessage]);

  // Marcar como lido
  const markAsRead = useCallback(async (
    messageKey: string, 
    options: SendOptions = {}
  ): Promise<boolean> => {
    const instance = options.instance || DEFAULT_INSTANCE;
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({ messageKeys: [messageKey] })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ [Evolution] Erro ao marcar como lido:', error);
      return false;
    }
  }, []);

  // Marcar como não lido
  const markAsUnread = useCallback(async (
    messageKey: string, 
    options: SendOptions = {}
  ): Promise<boolean> => {
    const instance = options.instance || DEFAULT_INSTANCE;
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsUnread/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({ messageKeys: [messageKey] })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ [Evolution] Erro ao marcar como não lido:', error);
      return false;
    }
  }, []);

  // Enviar presença
  const sendPresence = useCallback(async (
    number: string, 
    presence: 'available' | 'composing' | 'recording' | 'paused', 
    options: SendOptions = {}
  ): Promise<boolean> => {
    const instance = options.instance || DEFAULT_INSTANCE;
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({ number, presence })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ [Evolution] Erro ao enviar presença:', error);
      return false;
    }
  }, []);

  // Formatar número de telefone
  const formatPhoneNumber = useCallback((phone: string): string => {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não tem código do país, adiciona o brasileiro
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '5511' + cleaned;
    }
    
    // Adiciona sufixo WhatsApp se não tiver
    if (!cleaned.includes('@')) {
      cleaned += '@s.whatsapp.net';
    }
    
    return cleaned;
  }, []);

  // Validar número WhatsApp
  const validateWhatsAppNumber = useCallback(async (phone: string): Promise<boolean> => {
    const instance = DEFAULT_INSTANCE;
    const formattedPhone = formatPhoneNumber(phone);
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/chat/checkIsWhatsapp/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({ numbers: [formattedPhone] })
      });

      if (response.ok) {
        const result = await response.json();
        return result[0]?.exists || false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Evolution] Erro ao validar número:', error);
      return false;
    }
  }, [formatPhoneNumber]);

  // Obter status da instância
  const getInstanceStatus = useCallback(async (instance?: string): Promise<any> => {
    const instanceName = instance || DEFAULT_INSTANCE;
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': API_KEY
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('❌ [Evolution] Erro ao obter status da instância:', error);
      throw error;
    }
  }, []);

  // Limpar fila
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setSendingQueue(0);
  }, []);

  // Pausar fila
  const pauseQueue = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // Retomar fila
  const resumeQueue = useCallback(() => {
    isPausedRef.current = false;
    processQueue();
  }, [processQueue]);

  return {
    // Estados
    isSending,
    lastSentMessage,
    sendingQueue,
    error,
    
    // Métodos de envio
    sendText,
    sendMedia,
    sendLocation,
    sendContact,
    sendSticker,
    sendReaction,
    sendPoll,
    sendList,
    sendButton,
    
    // Métodos auxiliares
    sendStatus,
    markAsRead,
    markAsUnread,
    sendPresence,
    
    // Utilitários
    formatPhoneNumber,
    validateWhatsAppNumber,
    getInstanceStatus,
    
    // Controle de fila
    clearQueue,
    pauseQueue,
    resumeQueue
  };
}; 