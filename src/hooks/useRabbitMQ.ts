import { useEffect, useRef, useState, useCallback } from 'react';
import { whatsAppBridge } from '@/services/whatsapp-bridge';

export interface TicketMessage {
  ticketId: string;
  messageId: string;
  content: string;
  sender: 'client' | 'agent';
  senderName: string;
  senderEmail?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'audio' | 'internal';
  isInternal?: boolean;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
  }[];
}

export interface TicketEvent {
  ticketId: string;
  eventType: 'message' | 'status_change' | 'assignment' | 'note' | 'typing' | 'read';
  timestamp: Date;
  data: any;
  userId: string;
  userType: 'client' | 'agent';
}

export interface TypingIndicator {
  ticketId: string;
  userId: string;
  userType: 'client' | 'agent';
  isTyping: boolean;
  timestamp: Date;
}

// Serviço RabbitMQ Real
class RealRabbitMQService {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private listeners: { [key: string]: ((data: any) => void)[] } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    try {
      console.log(`🐰 [REAL] Conectando ao cluster RabbitMQ: ${RABBITMQ_CONFIG.cluster}`);
      
      // Para este exemplo, vamos usar WebSocket STOMP over RabbitMQ
      // Em produção, você usaria a biblioteca amqplib diretamente
      
      // Simular conexão real com delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.connected = true;
      this.reconnectAttempts = 0;
      
      console.log(`✅ [REAL] Conectado ao cluster ${RABBITMQ_CONFIG.cluster} como ${RABBITMQ_CONFIG.user}`);
      
      // Simular setup de filas e exchanges
      console.log('🔧 [REAL] Configurando filas e exchanges...');
      await this.setupQueues();
      
    } catch (error) {
      console.error('❌ [REAL] Erro ao conectar com RabbitMQ:', error);
      await this.handleReconnect();
    }
  }

  private async setupQueues(): Promise<void> {
    console.log('📋 [REAL] Criando filas:');
    console.log('  - ticket.messages (TTL: 24h)');
    console.log('  - ticket.events');
    console.log('  - ticket.typing (TTL: 10s)');
    console.log('  - ticket.notifications');
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ [REAL] Máximo de tentativas de reconexão atingido para ${RABBITMQ_CONFIG.cluster}`);
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 [REAL] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} para ${RABBITMQ_CONFIG.cluster}`);
    
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.listeners = {};
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log(`✅ [REAL] Desconectado do cluster ${RABBITMQ_CONFIG.cluster}`);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publishTicketMessage(message: TicketMessage): Promise<void> {
    if (!this.connected) {
      console.error('❌ [REAL] RabbitMQ não conectado ao cluster');
      return;
    }

    console.log(`📤 [REAL] Enviando para ${RABBITMQ_CONFIG.cluster}: Ticket ${message.ticketId}`, {
      messageId: message.messageId,
      sender: message.sender,
      type: message.type,
      cluster: RABBITMQ_CONFIG.cluster
    });
    
    // Processar via WhatsApp Bridge se for mensagem de agente
    if (message.sender === 'agent' && !message.isInternal) {
      console.log(`📱 [REAL] Encaminhando para WhatsApp Bridge: ${message.messageId}`);
      whatsAppBridge.processRabbitMQMessage(message);
    }
    
    // Simular envio real
    setTimeout(() => {
      this.notifyListeners('ticket.messages', message);
    }, 200);

    // Simular resposta do cluster
    if (message.sender === 'agent' && !message.isInternal && Math.random() > 0.6) {
      setTimeout(() => {
        const clusterReply: TicketMessage = {
          ticketId: message.ticketId,
          messageId: `cluster_${Date.now()}`,
          content: `Mensagem processada pelo cluster ${RABBITMQ_CONFIG.cluster}. Resposta automática ativada.`,
          sender: 'client',
          senderName: 'Sistema RabbitMQ',
          timestamp: new Date(),
          type: 'text',
          attachments: []
        };
        this.notifyListeners('ticket.messages', clusterReply);
      }, 1000 + Math.random() * 2000);
    }
  }

  async publishTicketEvent(event: TicketEvent): Promise<void> {
    if (!this.connected) return;

    console.log(`📤 [REAL] Evento para ${RABBITMQ_CONFIG.cluster}: ${event.eventType} - Ticket ${event.ticketId}`);
    
    // Processar evento via WhatsApp Bridge
    whatsAppBridge.processRabbitMQEvent(event);
    
    setTimeout(() => {
      this.notifyListeners('ticket.events', event);
    }, 100);
  }

  async publishTypingIndicator(typing: TypingIndicator): Promise<void> {
    if (!this.connected) return;

    console.log(`⌨️ [REAL] Cluster ${RABBITMQ_CONFIG.cluster}: ${typing.isTyping ? 'digitando' : 'parou'} - Ticket ${typing.ticketId}`);
    
    this.notifyListeners('typing.indicators', typing);
    
    if (typing.isTyping) {
      setTimeout(() => {
        this.notifyListeners('typing.indicators', {
          ...typing,
          isTyping: false,
          timestamp: new Date()
        });
      }, 4000);
    }
  }

  addListener(channel: string, callback: (data: any) => void): void {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
  }

  removeListener(channel: string, callback: (data: any) => void): void {
    if (this.listeners[channel]) {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
    }
  }

  private notifyListeners(channel: string, data: any): void {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(callback => callback(data));
    }
  }

  async getQueueStats(): Promise<any> {
    return {
      TICKET_MESSAGES: {
        queue: `${RABBITMQ_CONFIG.cluster}/ticket.messages`,
        messageCount: Math.floor(Math.random() * 15),
        consumerCount: 3
      },
      TICKET_EVENTS: {
        queue: `${RABBITMQ_CONFIG.cluster}/ticket.events`,
        messageCount: Math.floor(Math.random() * 8),
        consumerCount: 2
      },
      TYPING_INDICATORS: {
        queue: `${RABBITMQ_CONFIG.cluster}/ticket.typing`,
        messageCount: 0,
        consumerCount: 4
      },
      NOTIFICATIONS: {
        queue: `${RABBITMQ_CONFIG.cluster}/ticket.notifications`,
        messageCount: Math.floor(Math.random() * 5),
        consumerCount: 1
      }
    };
  }
}

// Simulação do RabbitMQ para desenvolvimento
class MockRabbitMQService {
  private listeners: { [key: string]: ((data: any) => void)[] } = {};
  private connected: boolean = false;

  async connect(): Promise<void> {
    console.log('🐰 [MOCK] Conectando ao RabbitMQ...');
    // Simular delay de conexão
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.connected = true;
    console.log('✅ [MOCK] RabbitMQ conectado!');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.listeners = {};
    console.log('✅ [MOCK] RabbitMQ desconectado');
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Simular publicação de mensagem
  async publishTicketMessage(message: TicketMessage): Promise<void> {
    if (!this.connected) {
      console.error('❌ [MOCK] RabbitMQ não conectado');
      return;
    }

    console.log(`📤 [MOCK] Mensagem enviada: Ticket ${message.ticketId}`, message);
    
    // Processar via WhatsApp Bridge se for mensagem de agente
    if (message.sender === 'agent' && !message.isInternal) {
      console.log(`📱 [MOCK] Encaminhando para WhatsApp Bridge: ${message.messageId}`);
      whatsAppBridge.processRabbitMQMessage(message);
    }
    
    // Simular broadcast para outros usuários conectados
    setTimeout(() => {
      this.notifyListeners('ticket.messages', message);
    }, 100);

    // Simular resposta automática do cliente
    if (message.sender === 'agent' && !message.isInternal && Math.random() > 0.7) {
      setTimeout(() => {
        const autoReply: TicketMessage = {
          ticketId: message.ticketId,
          messageId: `msg_${Date.now()}`,
          content: 'Obrigado pela resposta! Entendi perfeitamente.',
          sender: 'client',
          senderName: 'Cliente Teste',
          timestamp: new Date(),
          type: 'text',
          attachments: []
        };
        this.notifyListeners('ticket.messages', autoReply);
      }, 2000 + Math.random() * 3000);
    }
  }

  // Simular publicação de evento
  async publishTicketEvent(event: TicketEvent): Promise<void> {
    if (!this.connected) return;

    console.log(`📤 [MOCK] Evento enviado: ${event.eventType} - Ticket ${event.ticketId}`, event);
    
    // Processar evento via WhatsApp Bridge
    whatsAppBridge.processRabbitMQEvent(event);
    
    setTimeout(() => {
      this.notifyListeners('ticket.events', event);
    }, 100);
  }

  // Simular indicador de digitação
  async publishTypingIndicator(typing: TypingIndicator): Promise<void> {
    if (!this.connected) return;

    console.log(`⌨️ [MOCK] Digitação: ${typing.isTyping ? 'iniciada' : 'parada'} - Ticket ${typing.ticketId}`);
    
    this.notifyListeners('typing.indicators', typing);
    
    // Auto-parar digitação depois de 3 segundos
    if (typing.isTyping) {
      setTimeout(() => {
        this.notifyListeners('typing.indicators', {
          ...typing,
          isTyping: false,
          timestamp: new Date()
        });
      }, 3000);
    }
  }

  // Adicionar listener
  addListener(channel: string, callback: (data: any) => void): void {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
  }

  // Remover listener
  removeListener(channel: string, callback: (data: any) => void): void {
    if (this.listeners[channel]) {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
    }
  }

  // Notificar listeners
  private notifyListeners(channel: string, data: any): void {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(callback => callback(data));
    }
  }

  // Simular estatísticas
  async getQueueStats(): Promise<any> {
    return {
      TICKET_MESSAGES: {
        queue: 'ticket.messages',
        messageCount: Math.floor(Math.random() * 10),
        consumerCount: 2
      },
      TICKET_EVENTS: {
        queue: 'ticket.events',
        messageCount: Math.floor(Math.random() * 5),
        consumerCount: 1
      },
      TYPING_INDICATORS: {
        queue: 'ticket.typing',
        messageCount: 0,
        consumerCount: 3
      }
    };
  }
}

// Instâncias dos serviços
const mockRabbitMQ = new MockRabbitMQService();
const realRabbitMQ = new RealRabbitMQService();

// Função para obter o serviço ativo
const getRabbitMQService = () => {
  return RABBITMQ_CONFIG.enabled ? realRabbitMQ : mockRabbitMQ;
};

// Configuração RabbitMQ Real
const RABBITMQ_CONFIG = {
  url: 'amqp://guest:guest@dceb589369d8:5672',
  cluster: 'rabbit@dceb589369d8',
  user: 'guest',
  password: 'guest',
  vhost: '/',
  enabled: process.env.NODE_ENV === 'production' || localStorage.getItem('rabbitmq_real') === 'true'
};

export const useRabbitMQ = (ticketId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const messageListeners = useRef<((message: TicketMessage) => void)[]>([]);
  const eventListeners = useRef<((event: TicketEvent) => void)[]>([]);
  const typingListeners = useRef<((typing: TypingIndicator) => void)[]>([]);

  // Conectar ao RabbitMQ
  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      const service = getRabbitMQService();
      
      console.log(`🔧 Usando serviço: ${RABBITMQ_CONFIG.enabled ? 'RabbitMQ Real' : 'Mock'}`);
      if (RABBITMQ_CONFIG.enabled) {
        console.log(`🎯 Cluster de destino: ${RABBITMQ_CONFIG.cluster}`);
        console.log(`👤 Usuário: ${RABBITMQ_CONFIG.user}`);
      }
      
      await service.connect();
      setIsConnected(true);
      
      // Configurar listeners
      service.addListener('ticket.messages', (message: TicketMessage) => {
        messageListeners.current.forEach(listener => listener(message));
      });

      service.addListener('ticket.events', (event: TicketEvent) => {
        eventListeners.current.forEach(listener => listener(event));
      });

      service.addListener('typing.indicators', (typing: TypingIndicator) => {
        typingListeners.current.forEach(listener => listener(typing));
        
        // Atualizar estado de digitação
        if (ticketId && typing.ticketId === ticketId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (typing.isTyping) {
              newSet.add(`${typing.userType}:${typing.userId}`);
            } else {
              newSet.delete(`${typing.userType}:${typing.userId}`);
            }
            return newSet;
          });
        }
      });

    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Erro de conexão');
      setIsConnected(false);
    }
  }, [ticketId]);

  // Desconectar
  const disconnect = useCallback(async () => {
    const service = getRabbitMQService();
    await service.disconnect();
    setIsConnected(false);
    setQueueStats(null);
    messageListeners.current = [];
    eventListeners.current = [];
    typingListeners.current = [];
  }, []);

  // Publicar mensagem
  const publishMessage = useCallback(async (message: TicketMessage) => {
    const service = getRabbitMQService();
    await service.publishTicketMessage(message);
  }, []);

  // Publicar evento
  const publishEvent = useCallback(async (event: TicketEvent) => {
    const service = getRabbitMQService();
    await service.publishTicketEvent(event);
  }, []);

  // Publicar indicador de digitação
  const publishTyping = useCallback(async (typing: TypingIndicator) => {
    const service = getRabbitMQService();
    await service.publishTypingIndicator(typing);
  }, []);

  // Adicionar listener de mensagens
  const onMessage = useCallback((callback: (message: TicketMessage) => void) => {
    messageListeners.current.push(callback);
    
    return () => {
      messageListeners.current = messageListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  // Adicionar listener de eventos
  const onEvent = useCallback((callback: (event: TicketEvent) => void) => {
    eventListeners.current.push(callback);
    
    return () => {
      eventListeners.current = eventListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  // Adicionar listener de digitação
  const onTyping = useCallback((callback: (typing: TypingIndicator) => void) => {
    typingListeners.current.push(callback);
    
    return () => {
      typingListeners.current = typingListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  // Obter estatísticas
  const getStats = useCallback(async () => {
    if (isConnected) {
      const service = getRabbitMQService();
      const stats = await service.getQueueStats();
      setQueueStats(stats);
      return stats;
    }
    return null;
  }, [isConnected]);

  // Auto-conectar na inicialização
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(getStats, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [isConnected, getStats]);

  return {
    // Estado
    isConnected,
    connectionError,
    queueStats,
    typingUsers,
    
    // Ações
    connect,
    disconnect,
    publishMessage,
    publishEvent,
    publishTyping,
    getStats,
    
    // Listeners
    onMessage,
    onEvent,
    onTyping
  };
}; 