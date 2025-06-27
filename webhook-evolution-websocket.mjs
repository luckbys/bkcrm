import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configurar Express e HTTP Server
const app = express();
const server = createServer(app);

// Configurar Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "https://bkcrm.devsible.com.br", "https://websocket.bkcrm.devsible.com.br"],
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "https://bkcrm.devsible.com.br", "https://websocket.bkcrm.devsible.com.br"],
  credentials: true
}));

// Configurações
const PORT = 4000;
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const BASE_URL = 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔗 WEBSOCKET CONNECTIONS MANAGER
class WebSocketManager {
  constructor() {
    this.connections = new Map(); // ticketId -> Set of socketIds
    this.sockets = new Map(); // socketId -> socket
    this.userTickets = new Map(); // userId -> Set of ticketIds
  }

  // Adicionar conexão para um ticket
  addConnection(socketId, socket, ticketId, userId = null) {
    // Armazenar socket
    this.sockets.set(socketId, socket);
    
    // Adicionar à lista de conexões do ticket
    if (!this.connections.has(ticketId)) {
      this.connections.set(ticketId, new Set());
    }
    this.connections.get(ticketId).add(socketId);
    
    // Rastrear tickets do usuário
    if (userId) {
      if (!this.userTickets.has(userId)) {
        this.userTickets.set(userId, new Set());
      }
      this.userTickets.get(userId).add(ticketId);
    }
    
    console.log(`🔗 [WS] Cliente conectado ao ticket ${ticketId} (socket: ${socketId})`);
    console.log(`📊 [WS] Total conexões do ticket ${ticketId}: ${this.connections.get(ticketId).size}`);
  }

  // Remover conexão
  removeConnection(socketId) {
    const socket = this.sockets.get(socketId);
    if (!socket) return;

    // Remover de todos os tickets
    for (const [ticketId, sockets] of this.connections.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        console.log(`🔌 [WS] Cliente desconectado do ticket ${ticketId} (socket: ${socketId})`);
        
        // Limpar tickets vazios
        if (sockets.size === 0) {
          this.connections.delete(ticketId);
          console.log(`📭 [WS] Ticket ${ticketId} sem conexões ativas`);
        }
      }
    }

    // Remover socket
    this.sockets.delete(socketId);
  }

  // Enviar mensagem para todos clientes conectados a um ticket
  broadcastToTicket(ticketId, event, data) {
    const connections = this.connections.get(ticketId);
    if (!connections || connections.size === 0) {
      console.log(`📭 [WS] Nenhuma conexão ativa para ticket ${ticketId}`);
      return false;
    }

    let sentCount = 0;
    connections.forEach(socketId => {
      const socket = this.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit(event, data);
        sentCount++;
      } else {
        // Socket desconectado, remover
        connections.delete(socketId);
        this.sockets.delete(socketId);
      }
    });

    console.log(`📡 [WS] Mensagem enviada para ${sentCount} clientes do ticket ${ticketId}`);
    return sentCount > 0;
  }

  // Obter estatísticas
  getStats() {
    return {
      totalConnections: this.sockets.size,
      activeTickets: this.connections.size,
      connectionsByTicket: Object.fromEntries(
        Array.from(this.connections.entries()).map(([ticketId, sockets]) => [ticketId, sockets.size])
      )
    };
  }
}

// Instância global do WebSocket Manager
const wsManager = new WebSocketManager();

// 🔗 WEBSOCKET EVENT HANDLERS
io.on('connection', (socket) => {
  console.log('🔌 [WS] Nova conexão WebSocket estabelecida');

  // Entrar na sala do ticket
  socket.on('join-ticket', (ticketId) => {
    console.log(`👥 [WS] Cliente entrou na sala do ticket: ${ticketId}`);
    socket.join(`ticket:${ticketId}`);
  });

  // Sair da sala do ticket
  socket.on('leave-ticket', (ticketId) => {
    console.log(`👋 [WS] Cliente saiu da sala do ticket: ${ticketId}`);
    socket.leave(`ticket:${ticketId}`);
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('🔌 [WS] Cliente WebSocket desconectado');
  });
});

// 📊 Endpoint para estatísticas WebSocket
app.get('/webhook/ws-stats', (req, res) => {
  res.json(wsManager.getStats());
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 💾 FUNÇÕES DE BANCO DE DADOS

// Buscar ou criar cliente
async function findOrCreateCustomer(phone, instanceName, pushName = null) {
  try {
    console.log(`🔍 Buscando cliente para telefone: ${phone}`);
    
    // Buscar cliente existente
    const { data: existingCustomer } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .or(`metadata->>phone.eq.${phone},email.eq.whatsapp-${phone}@auto-generated.com`)
      .single();

    if (existingCustomer) {
      console.log(`✅ Cliente encontrado: ${existingCustomer.name} (${existingCustomer.id})`);
      return existingCustomer.id;
    }

    // Criar novo cliente
    console.log(`➕ Criando novo cliente para ${phone}`);
    const customerData = {
      id: crypto.randomUUID(),
      name: pushName || `Cliente WhatsApp ${phone.slice(-4)}`,
      email: `whatsapp-${phone}@auto-generated.com`,
      role: 'customer',
      metadata: {
        phone: phone,
        whatsapp_instance: instanceName,
        created_via: 'webhook_evolution',
        created_at: new Date().toISOString()
      }
    };

    const { data: newCustomer, error } = await supabase
      .from('profiles')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }

    console.log(`✅ Novo cliente criado: ${newCustomer.name} (${newCustomer.id})`);
    return newCustomer.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateCustomer:', error);
    throw error;
  }
}

// Buscar ou criar ticket
async function findOrCreateTicket(customerId, phone, instance) {
  try {
    console.log(`🎫 Buscando ticket existente para cliente: ${customerId}`);
    
    // Buscar ticket aberto existente
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingTicket) {
      console.log(`✅ Ticket existente encontrado: ${existingTicket.id}`);
      return existingTicket.id;
    }

    // Criar novo ticket
    console.log(`➕ Criando novo ticket para cliente: ${customerId}`);
    const ticketData = {
      id: crypto.randomUUID(),
      title: `WhatsApp - ${phone}`,
      description: `Ticket criado automaticamente via WhatsApp`,
      status: 'open',
      priority: 'medium',
      customer_id: customerId,
      channel: 'whatsapp',
      metadata: {
        whatsapp_phone: phone,
        whatsapp_instance: instance,
        created_via: 'webhook_evolution',
        created_at: new Date().toISOString()
      }
    };

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }

    console.log(`✅ Novo ticket criado: ${newTicket.id}`);
    return newTicket.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateTicket:', error);
    throw error;
  }
}

// Health check
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Evolution API Webhook + WebSocket',
    port: PORT,
    connections: wsManager.getStats()
  });
});

// Webhook Evolution API
app.post('/webhook/evolution', async (req, res) => {
  try {
    console.log('📥 [WEBHOOK] Recebido webhook Evolution API');
    console.log('📊 [WEBHOOK] Dados:', JSON.stringify(req.body, null, 2));

    const { event, instance, data } = req.body;

    if (event === 'messages.upsert') {
      await processMessage(data, instance);
    }

    res.status(200).json({ status: 'success', message: 'Webhook processado' });
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Processar mensagem
async function processMessage(data, instance) {
  try {
    if (!data.messages || data.messages.length === 0) {
      console.log('📭 [WEBHOOK] Nenhuma mensagem para processar');
      return;
    }

    for (const message of data.messages) {
      const phone = message.key.remoteJid.replace('@s.whatsapp.net', '');
      const content = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text ||
                     '[Mídia não suportada]';

      console.log(`📨 [WEBHOOK] Processando mensagem de ${phone}: ${content}`);

      // Buscar ou criar cliente
      const customerId = await findOrCreateCustomer(phone, instance, message.pushName);

      // Buscar ou criar ticket
      const ticketId = await findOrCreateTicket(customerId, phone, instance);

      // Salvar mensagem
      const savedMessage = {
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        content: content,
        sender_id: customerId,
        sender_name: message.pushName || `Cliente ${phone.slice(-4)}`,
        sender_type: 'customer',
        type: 'text',
        metadata: {
          whatsapp_message_id: message.key.id,
          whatsapp_phone: phone,
          whatsapp_instance: instance,
          timestamp: new Date(message.messageTimestamp * 1000).toISOString()
        },
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .insert(savedMessage);

      if (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        continue;
      }

      console.log(`✅ Mensagem salva no banco: ${savedMessage.id}`);

      // Broadcast via WebSocket
      const broadcastData = {
        id: savedMessage.id,
        ticketId: ticketId,
        content: content,
        sender: 'client',
        senderName: savedMessage.sender_name,
        timestamp: savedMessage.created_at,
        metadata: savedMessage.metadata
      };

      io.to(`ticket:${ticketId}`).emit('new-message', broadcastData);
      console.log(`📡 [WS] Mensagem enviada via WebSocket para ticket ${ticketId}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    throw error;
  }
}

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor webhook + WebSocket rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/webhook/health`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🎯 Webhook URL: http://localhost:${PORT}/webhook/evolution`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⛔ Recebido SIGTERM, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⛔ Recebido SIGINT, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
}); 