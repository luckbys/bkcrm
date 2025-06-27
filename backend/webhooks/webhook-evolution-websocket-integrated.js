// 🚀 WEBHOOK EVOLUTION + WEBSOCKET BKCRM + CLIENTE WEBSOCKET EVOLUTION API
// Sistema integrado completo para WhatsApp via Evolution API

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const fetch = require('node-fetch');
const { io: ioClient } = require('socket.io-client');

// 📋 CONFIGURAÇÕES
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurações das APIs
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evochat.devsible.com.br';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_WS_URL = EVOLUTION_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

console.log('🔗 SISTEMA INTEGRADO EVOLUTION + BKCRM');
console.log(`📡 Evolution API: ${EVOLUTION_API_URL}`);
console.log(`🔌 Evolution WebSocket: ${EVOLUTION_WS_URL}`);
console.log(`📱 Instância: ${INSTANCE_NAME}`);

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ixqcgkqzlxjhfwuzsuvv.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU'
);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 🔗 GERENCIADOR DE WEBSOCKET BKCRM
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.ticketConnections = new Map();
  }

  addConnection(socketId, socket, ticketId, userId = null) {
    this.connections.set(socketId, {
      socket,
      ticketId,
      userId,
      connectedAt: new Date()
    });

    if (!this.ticketConnections.has(ticketId)) {
      this.ticketConnections.set(ticketId, new Set());
    }
    this.ticketConnections.get(ticketId).add(socketId);

    console.log(`🔗 [WS] Cliente conectado ao ticket ${ticketId} (socket: ${socketId})`);
    console.log(`📊 [WS] Total conexões do ticket ${ticketId}: ${this.ticketConnections.get(ticketId).size}`);
  }

  removeConnection(socketId) {
    const connection = this.connections.get(socketId);
    if (connection) {
      const { ticketId } = connection;
      
      this.connections.delete(socketId);
      
      if (this.ticketConnections.has(ticketId)) {
        this.ticketConnections.get(ticketId).delete(socketId);
        
        if (this.ticketConnections.get(ticketId).size === 0) {
          this.ticketConnections.delete(ticketId);
          console.log(`📭 [WS] Ticket ${ticketId} sem conexões ativas`);
        }
      }
      
      console.log(`🔌 [WS] Cliente desconectado do ticket ${ticketId} (socket: ${socketId})`);
    }
  }

  broadcastToTicket(ticketId, event, data) {
    const connections = this.ticketConnections.get(ticketId);
    if (!connections || connections.size === 0) {
      console.log(`📭 [WS] Nenhuma conexão ativa para o ticket ${ticketId}`);
      return 0;
    }

    let sentCount = 0;
    connections.forEach(socketId => {
      const connection = this.connections.get(socketId);
      if (connection && connection.socket.connected) {
        connection.socket.emit(event, data);
        sentCount++;
      }
    });

    console.log(`📡 [WS] Mensagem enviada para ${sentCount} clientes do ticket ${ticketId}`);
    return sentCount;
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      activeTickets: this.ticketConnections.size,
      connectionsPerTicket: Array.from(this.ticketConnections.entries()).map(([ticketId, connections]) => ({
        ticketId,
        connections: connections.size
      }))
    };
  }
}

// 🔗 CLIENTE WEBSOCKET EVOLUTION API
class EvolutionWebSocketClient {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.evolutionSocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    
    this.init();
  }

  async init() {
    console.log('🚀 Inicializando cliente WebSocket Evolution API...');
    
    try {
      await this.checkInstanceConnection();
      await this.connectToEvolution();
    } catch (error) {
      console.error('❌ Erro na inicialização Evolution WS:', error);
      this.scheduleReconnect();
    }
  }

  async checkInstanceConnection() {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Instância Evolution ${INSTANCE_NAME}: ${data.state}`);
        return data.state === 'open';
      }
    } catch (error) {
      console.error('❌ Erro ao verificar instância Evolution:', error.message);
    }
    return false;
  }

  async connectToEvolution() {
    const wsUrl = `${EVOLUTION_WS_URL}/${INSTANCE_NAME}`;
    console.log(`📡 Conectando Evolution WebSocket: ${wsUrl}`);
    
    this.evolutionSocket = ioClient(wsUrl, {
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000,
      extraHeaders: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    this.evolutionSocket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket da Evolution API');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.evolutionSocket.on('disconnect', (reason) => {
      console.log(`❌ Desconectado da Evolution API: ${reason}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    // Eventos de mensagens
    this.evolutionSocket.on('messages.upsert', (data) => {
      console.log('📨 Nova mensagem recebida da Evolution API');
      this.handleIncomingMessage(data);
    });

    this.evolutionSocket.onAny((eventName, data) => {
      console.log(`📡 Evento Evolution API: ${eventName}`);
    });
  }

  async handleIncomingMessage(data) {
    try {
      const messageInfo = this.extractMessageInfo(data);
      
      if (!messageInfo || messageInfo.isFromMe) {
        return;
      }

      console.log('📥 Processando mensagem WhatsApp:', {
        from: messageInfo.fromPhone,
        content: messageInfo.content.substring(0, 50) + '...'
      });

      // Processar via webhook interno
      const result = await processMessage({
        event: 'messages.upsert',
        instance: INSTANCE_NAME,
        data: {
          key: {
            id: messageInfo.id,
            remoteJid: messageInfo.from,
            fromMe: false
          },
          message: {
            conversation: messageInfo.content
          },
          messageTimestamp: messageInfo.timestamp,
          pushName: messageInfo.pushName || 'Cliente WhatsApp'
        }
      });

      if (result.success && result.broadcast) {
        // Enviar via WebSocket BKCRM
        this.wsManager.broadcastToTicket(result.ticketId, 'new-message', {
          id: result.messageId,
          ticketId: result.ticketId,
          content: messageInfo.content,
          sender: 'client',
          senderName: messageInfo.pushName || 'Cliente WhatsApp',
          timestamp: new Date(messageInfo.timestamp),
          isInternal: false
        });
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem Evolution:', error);
    }
  }

  extractMessageInfo(data) {
    try {
      const messages = data.messages || [data];
      const message = messages[0];
      
      if (!message) return null;

      const messageKey = message.key || {};
      const messageInfo = message.message || {};
      
      const textContent = messageInfo.conversation || 
                         messageInfo.extendedTextMessage?.text || 
                         null;

      if (!textContent) return null;

      return {
        id: messageKey.id,
        from: messageKey.remoteJid,
        fromPhone: messageKey.remoteJid?.split('@')[0],
        content: textContent,
        isFromMe: messageKey.fromMe || false,
        timestamp: message.messageTimestamp || Date.now(),
        pushName: message.pushName
      };

    } catch (error) {
      console.error('❌ Erro ao extrair info da mensagem:', error);
      return null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas Evolution WS atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Reconectando Evolution WS em ${delay/1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => this.init(), delay);
  }
}

// Inicializar gerenciadores
const wsManager = new WebSocketManager();
const evolutionClient = new EvolutionWebSocketClient(wsManager);

// 🔗 WEBSOCKET BKCRM
io.on('connection', (socket) => {
  console.log(`✅ [WS] Nova conexão WebSocket: ${socket.id}`);

  socket.on('join-ticket', async (data) => {
    const { ticketId, userId } = data;
    wsManager.addConnection(socket.id, socket, ticketId, userId);
    
    // Carregar mensagens do ticket
    try {
      const messages = await loadTicketMessages(ticketId);
      socket.emit('messages-loaded', messages);
      console.log(`✅ Carregadas ${messages.length} mensagens do ticket ${ticketId}`);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const result = await saveMessageFromWebSocket(data);
      if (result.success) {
        wsManager.broadcastToTicket(data.ticketId, 'new-message', {
          id: result.messageId,
          ticketId: data.ticketId,
          content: data.content,
          sender: 'agent',
          senderName: data.senderName,
          timestamp: new Date(),
          isInternal: data.isInternal || false
        });
        console.log(`✅ Mensagem WebSocket salva: ${result.messageId}`);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem WebSocket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ [WS] Conexão desconectada: ${socket.id}`);
    wsManager.removeConnection(socket.id);
  });
});

// 🔗 FUNÇÕES DE BANCO DE DADOS (mantidas do arquivo original)
async function findOrCreateCustomer(phone, instanceName, pushName = null) {
  try {
    const formattedPhone = phone.replace(/\D/g, '');
    
    let { data: existingCustomer, error: searchError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .eq('phone', formattedPhone)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingCustomer) {
      return existingCustomer;
    }

    const customerName = pushName || `Cliente ${formattedPhone.slice(-4)}`;
    
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: customerName,
        phone: formattedPhone,
        email: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`✅ Cliente criado: ${customerName} (${formattedPhone})`);
    return newCustomer;

  } catch (error) {
    console.error('❌ Erro ao encontrar/criar cliente:', error);
    throw error;
  }
}

async function findOrCreateTicket(customerId, phone, instanceName) {
  try {
    let { data: existingTicket, error: searchError } = await supabase
      .from('tickets')
      .select('id, customer_id, status, subject, channel, created_at')
      .eq('customer_id', customerId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingTicket) {
      return existingTicket;
    }

    const { data: newTicket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        customer_id: customerId,
        subject: `Atendimento WhatsApp - ${phone}`,
        status: 'open',
        priority: 'medium',
        channel: 'whatsapp',
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`✅ Ticket criado: #${newTicket.id} para cliente ${customerId}`);
    return newTicket;

  } catch (error) {
    console.error('❌ Erro ao encontrar/criar ticket:', error);
    throw error;
  }
}

async function saveMessage(ticketId, messageData, instanceName) {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        content: messageData.content,
        sender: messageData.sender || 'client',
        sender_name: messageData.senderName || 'Cliente',
        message_type: 'text',
        is_internal: false,
        metadata: {
          whatsapp_message_id: messageData.whatsappMessageId,
          instance: instanceName,
          timestamp: messageData.timestamp,
          phone: messageData.phone
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Mensagem salva: ${message.id} no ticket ${ticketId}`);
    return message;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    throw error;
  }
}

async function saveMessageFromWebSocket({ ticketId, content, isInternal, userId, senderName }) {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        content: content,
        sender: 'agent',
        sender_name: senderName || 'Atendente',
        message_type: 'text',
        is_internal: isInternal || false,
        metadata: {
          user_id: userId,
          sent_via: 'websocket'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, messageId: message.id };

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem WebSocket:', error);
    return { success: false, error: error.message };
  }
}

async function loadTicketMessages(ticketId, limit = 50) {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return messages.map(msg => ({
      id: msg.id,
      ticketId: msg.ticket_id,
      content: msg.content,
      sender: msg.sender,
      senderName: msg.sender_name,
      timestamp: msg.created_at,
      isInternal: msg.is_internal || false,
      messageType: msg.message_type
    }));

  } catch (error) {
    console.error('❌ Erro ao carregar mensagens:', error);
    return [];
  }
}

// Função principal de processamento
async function processMessage(payload) {
  try {
    const { data } = payload;
    const messageKey = data.key;
    const messageContent = data.message;
    
    if (messageKey.fromMe) {
      return { success: true, message: 'Mensagem enviada por nós - ignorada' };
    }

    const phone = messageKey.remoteJid.split('@')[0];
    const textContent = messageContent.conversation || messageContent.extendedTextMessage?.text;
    
    if (!textContent) {
      return { success: true, message: 'Mensagem sem texto - ignorada' };
    }

    const customer = await findOrCreateCustomer(phone, payload.instance, data.pushName);
    const ticket = await findOrCreateTicket(customer.id, phone, payload.instance);
    
    const messageData = {
      content: textContent,
      sender: 'client',
      senderName: data.pushName || customer.name,
      whatsappMessageId: messageKey.id,
      timestamp: data.messageTimestamp,
      phone: phone
    };

    const savedMessage = await saveMessage(ticket.id, messageData, payload.instance);
    
    return {
      success: true,
      customerId: customer.id,
      ticketId: ticket.id,
      messageId: savedMessage.id,
      broadcast: true
    };

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// 🔗 ROTAS HTTP
app.post('/webhook/evolution', async (req, res) => {
  try {
    console.log('📥 Webhook recebido:', req.body.event);
    
    const result = await processMessage(req.body);
    
    if (result.success && result.broadcast) {
      wsManager.broadcastToTicket(result.ticketId, 'new-message', {
        id: result.messageId,
        ticketId: result.ticketId,
        content: req.body.data.message.conversation,
        sender: 'client',
        senderName: req.body.data.pushName || 'Cliente',
        timestamp: new Date(),
        isInternal: false
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoints de envio (mantidos)
app.post('/webhook/send-message', async (req, res) => {
  try {
    const { phone, text, instance = INSTANCE_NAME, options = {} } = req.body;

    if (!phone || !text) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e texto são obrigatórios'
      });
    }

    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) {
      formattedPhone = '55' + formattedPhone;
    }

    const payload = {
      number: formattedPhone,
      text: text,
      options: {
        delay: options.delay || 1000,
        presence: options.presence || 'composing',
        linkPreview: options.linkPreview !== false,
        ...options
      }
    };

    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const responseData = await evolutionResponse.json();

    if (evolutionResponse.ok) {
      return res.status(200).json({
        success: true,
        messageId: responseData.key?.id,
        status: responseData.status,
        data: responseData
      });
    } else {
      return res.status(evolutionResponse.status).json({
        success: false,
        error: responseData.message || 'Erro na Evolution API',
        details: responseData
      });
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.get('/webhook/health', (req, res) => {
  const stats = wsManager.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Webhook Evolution + WebSocket Integrado',
    websocket: {
      enabled: true,
      connections: stats.totalConnections,
      activeTickets: stats.activeTickets
    },
    evolution: {
      connected: evolutionClient.isConnected,
      instance: INSTANCE_NAME,
      url: EVOLUTION_WS_URL
    },
    endpoints: [
      '/webhook/evolution',
      '/webhook/send-message',
      '/webhook/health'
    ]
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('🚀 Servidor Webhook Evolution + WebSocket Integrado rodando na porta', PORT);
  console.log('📋 Funcionalidades:');
  console.log('   📥 Webhook Evolution API: POST /webhook/evolution');
  console.log('   📤 Envio de mensagens: POST /webhook/send-message');
  console.log('   🔗 WebSocket BKCRM: ws://localhost:' + PORT);
  console.log('   📡 Cliente WebSocket Evolution API: Conectado');
  console.log('   🏥 Health Check: GET /webhook/health');
  console.log('✅ Sistema totalmente integrado - WhatsApp em tempo real!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor integrado...');
  if (evolutionClient.evolutionSocket) {
    evolutionClient.evolutionSocket.disconnect();
  }
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
}); 