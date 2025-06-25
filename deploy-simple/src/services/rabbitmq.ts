import * as amqp from 'amqplib';

type Connection = amqp.Connection;
type Channel = amqp.Channel;
type Message = amqp.Message;

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

class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  
  // Filas
  private readonly QUEUES = {
    TICKET_MESSAGES: 'ticket.messages',
    TICKET_EVENTS: 'ticket.events', 
    TYPING_INDICATORS: 'ticket.typing',
    NOTIFICATIONS: 'ticket.notifications',
    AGENT_BROADCAST: 'agent.broadcast',
    CLIENT_NOTIFICATIONS: 'client.notifications'
  };

  // Exchanges
  private readonly EXCHANGES = {
    TICKET_EXCHANGE: 'ticket.exchange',
    NOTIFICATION_EXCHANGE: 'notification.exchange'
  };

  constructor(private rabbitmqUrl: string = 'amqp://localhost:5672') {}

  async connect(): Promise<void> {
    try {
      console.log('🐰 Conectando ao RabbitMQ...');
      
      const connection = await amqp.connect(this.rabbitmqUrl);
      this.connection = connection as amqp.Connection;
      this.channel = await this.connection.createChannel();
      
      // Configurar exchanges
      await this.setupExchanges();
      
      // Configurar filas
      await this.setupQueues();
      
      // Configurar handlers de erro
      this.setupErrorHandlers();
      
      console.log('✅ RabbitMQ conectado com sucesso!');
      this.reconnectAttempts = 0;
      
    } catch (error) {
      console.error('❌ Erro ao conectar com RabbitMQ:', error);
      await this.handleReconnect();
    }
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) throw new Error('Canal não disponível');

    // Exchange para tickets (fanout para broadcast)
    await this.channel.assertExchange(this.EXCHANGES.TICKET_EXCHANGE, 'topic', {
      durable: true
    });

    // Exchange para notificações
    await this.channel.assertExchange(this.EXCHANGES.NOTIFICATION_EXCHANGE, 'direct', {
      durable: true
    });
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) throw new Error('Canal não disponível');

    // Fila para mensagens dos tickets
    await this.channel.assertQueue(this.QUEUES.TICKET_MESSAGES, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000 // 24 horas
      }
    });

    // Fila para eventos dos tickets
    await this.channel.assertQueue(this.QUEUES.TICKET_EVENTS, {
      durable: true
    });

    // Fila para indicadores de digitação (TTL curto)
    await this.channel.assertQueue(this.QUEUES.TYPING_INDICATORS, {
      durable: false,
      arguments: {
        'x-message-ttl': 10000 // 10 segundos
      }
    });

    // Fila para notificações
    await this.channel.assertQueue(this.QUEUES.NOTIFICATIONS, {
      durable: true
    });

    // Fila para broadcast para agentes
    await this.channel.assertQueue(this.QUEUES.AGENT_BROADCAST, {
      durable: true
    });

    // Fila para notificações de clientes
    await this.channel.assertQueue(this.QUEUES.CLIENT_NOTIFICATIONS, {
      durable: true
    });

    // Bind filas aos exchanges
    await this.channel.bindQueue(
      this.QUEUES.TICKET_MESSAGES, 
      this.EXCHANGES.TICKET_EXCHANGE, 
      'ticket.message.*'
    );

    await this.channel.bindQueue(
      this.QUEUES.TICKET_EVENTS, 
      this.EXCHANGES.TICKET_EXCHANGE, 
      'ticket.event.*'
    );

    await this.channel.bindQueue(
      this.QUEUES.NOTIFICATIONS, 
      this.EXCHANGES.NOTIFICATION_EXCHANGE, 
      'notification'
    );
  }

  private setupErrorHandlers(): void {
    if (!this.connection || !this.channel) return;

    this.connection.on('error', (error) => {
      console.error('❌ Erro na conexão RabbitMQ:', error);
    });

    this.connection.on('close', () => {
      console.warn('⚠️ Conexão RabbitMQ fechada');
      this.handleReconnect();
    });

    this.channel.on('error', (error) => {
      console.error('❌ Erro no canal RabbitMQ:', error);
    });
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  // Publicar mensagem de ticket
  async publishTicketMessage(message: TicketMessage): Promise<void> {
    if (!this.channel) {
      console.error('❌ Canal RabbitMQ não disponível');
      return;
    }

    try {
      const routingKey = `ticket.message.${message.ticketId}`;
      
      await this.channel.publish(
        this.EXCHANGES.TICKET_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: message.messageId,
          correlationId: message.ticketId
        }
      );

      console.log(`📤 Mensagem enviada: Ticket ${message.ticketId}`);
      
    } catch (error) {
      console.error('❌ Erro ao publicar mensagem:', error);
    }
  }

  // Publicar evento de ticket
  async publishTicketEvent(event: TicketEvent): Promise<void> {
    if (!this.channel) {
      console.error('❌ Canal RabbitMQ não disponível');
      return;
    }

    try {
      const routingKey = `ticket.event.${event.eventType}`;
      
      await this.channel.publish(
        this.EXCHANGES.TICKET_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          timestamp: Date.now(),
          correlationId: event.ticketId
        }
      );

      console.log(`📤 Evento enviado: ${event.eventType} - Ticket ${event.ticketId}`);
      
    } catch (error) {
      console.error('❌ Erro ao publicar evento:', error);
    }
  }

  // Publicar indicador de digitação
  async publishTypingIndicator(typing: TypingIndicator): Promise<void> {
    if (!this.channel) return;

    try {
      await this.channel.sendToQueue(
        this.QUEUES.TYPING_INDICATORS,
        Buffer.from(JSON.stringify(typing)),
        {
          expiration: '10000', // 10 segundos
          headers: {
            ticketId: typing.ticketId,
            userType: typing.userType
          }
        }
      );

      console.log(`⌨️ Indicador de digitação: ${typing.isTyping ? 'iniciado' : 'parado'} - Ticket ${typing.ticketId}`);
      
    } catch (error) {
      console.error('❌ Erro ao publicar indicador de digitação:', error);
    }
  }

  // Consumir mensagens de tickets
  async consumeTicketMessages(callback: (message: TicketMessage) => void): Promise<void> {
    if (!this.channel) {
      console.error('❌ Canal RabbitMQ não disponível');
      return;
    }

    try {
      await this.channel.consume(
        this.QUEUES.TICKET_MESSAGES,
        (msg: Message | null) => {
          if (msg) {
            try {
              const message: TicketMessage = JSON.parse(msg.content.toString());
              callback(message);
              this.channel?.ack(msg);
              
              console.log(`📥 Mensagem recebida: Ticket ${message.ticketId}`);
              
            } catch (error) {
              console.error('❌ Erro ao processar mensagem:', error);
              this.channel?.nack(msg, false, false); // Descartar mensagem inválida
            }
          }
        },
        {
          noAck: false
        }
      );

      console.log('👂 Consumindo mensagens de tickets...');
      
    } catch (error) {
      console.error('❌ Erro ao consumir mensagens:', error);
    }
  }

  // Consumir eventos de tickets
  async consumeTicketEvents(callback: (event: TicketEvent) => void): Promise<void> {
    if (!this.channel) return;

    try {
      await this.channel.consume(
        this.QUEUES.TICKET_EVENTS,
        (msg: Message | null) => {
          if (msg) {
            try {
              const event: TicketEvent = JSON.parse(msg.content.toString());
              callback(event);
              this.channel?.ack(msg);
              
              console.log(`📥 Evento recebido: ${event.eventType} - Ticket ${event.ticketId}`);
              
            } catch (error) {
              console.error('❌ Erro ao processar evento:', error);
              this.channel?.nack(msg, false, false);
            }
          }
        },
        {
          noAck: false
        }
      );

      console.log('👂 Consumindo eventos de tickets...');
      
    } catch (error) {
      console.error('❌ Erro ao consumir eventos:', error);
    }
  }

  // Consumir indicadores de digitação
  async consumeTypingIndicators(callback: (typing: TypingIndicator) => void): Promise<void> {
    if (!this.channel) return;

    try {
      await this.channel.consume(
        this.QUEUES.TYPING_INDICATORS,
        (msg: Message | null) => {
          if (msg) {
            try {
              const typing: TypingIndicator = JSON.parse(msg.content.toString());
              callback(typing);
              this.channel?.ack(msg);
              
            } catch (error) {
              console.error('❌ Erro ao processar indicador de digitação:', error);
              this.channel?.nack(msg, false, false);
            }
          }
        },
        {
          noAck: false
        }
      );

      console.log('👂 Consumindo indicadores de digitação...');
      
    } catch (error) {
      console.error('❌ Erro ao consumir indicadores de digitação:', error);
    }
  }

  // Enviar notificação
  async sendNotification(
    userId: string, 
    userType: 'client' | 'agent', 
    notification: any
  ): Promise<void> {
    if (!this.channel) return;

    try {
      const queueName = userType === 'agent' 
        ? this.QUEUES.AGENT_BROADCAST 
        : this.QUEUES.CLIENT_NOTIFICATIONS;

      await this.channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify({
          userId,
          userType,
          ...notification,
          timestamp: new Date()
        })),
        {
          persistent: true,
          headers: {
            userId,
            userType,
            notificationType: notification.type
          }
        }
      );

      console.log(`🔔 Notificação enviada para ${userType}: ${userId}`);
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }

  // Obter estatísticas das filas
  async getQueueStats(): Promise<any> {
    if (!this.channel) return null;

    try {
      const stats = {};
      
      for (const [name, queue] of Object.entries(this.QUEUES)) {
        const info = await this.channel.checkQueue(queue);
        stats[name] = {
          queue: queue,
          messageCount: info.messageCount,
          consumerCount: info.consumerCount
        };
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }

  // Fechar conexão
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      console.log('✅ RabbitMQ desconectado');
      
    } catch (error) {
      console.error('❌ Erro ao desconectar RabbitMQ:', error);
    }
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

// Instância singleton
export const rabbitmqService = new RabbitMQService(
  process.env.RABBITMQ_URL || 'amqp://localhost:5672'
);

export default rabbitmqService; 