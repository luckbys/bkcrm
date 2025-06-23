const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurar Express e HTTP Server
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "https://bkcrm.devsible.com.br", "https://ws.bkcrm.devsible.com.br"],
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "https://bkcrm.devsible.com.br", "https://ws.bkcrm.devsible.com.br"],
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
  console.log(`✅ [WS] Nova conexão WebSocket: ${socket.id}`);

  // Cliente se conecta a um ticket específico
  socket.on('join-ticket', (data) => {
    const { ticketId, userId } = data;
    if (!ticketId) {
      socket.emit('error', { message: 'ticketId é obrigatório' });
      return;
    }

    wsManager.addConnection(socket.id, socket, ticketId, userId);
    socket.emit('joined-ticket', { ticketId, socketId: socket.id });
    
    // Enviar estatísticas atualizadas
    socket.emit('connection-stats', wsManager.getStats());
  });

  // Cliente solicita mensagens de um ticket
  socket.on('request-messages', async (data) => {
    const { ticketId, limit = 50 } = data;
    try {
      const messages = await loadTicketMessages(ticketId, limit);
      socket.emit('messages-loaded', { ticketId, messages });
    } catch (error) {
      socket.emit('error', { message: 'Erro ao carregar mensagens', error: error.message });
    }
  });

  // Cliente envia nova mensagem
  socket.on('send-message', async (data) => {
    try {
      const { ticketId, content, isInternal, userId, senderName } = data;
      
      console.log(`📨 [WS-SEND] Processando envio:`, {
        ticketId: ticketId,
        content: content?.substring(0, 50) + '...',
        isInternal: isInternal,
        userId: userId,
        senderName: senderName
      });
      
      // Salvar mensagem no banco
      const messageId = await saveMessageFromWebSocket({
        ticketId,
        content,
        isInternal,
        userId,
        senderName
      });

      // Broadcast para todos conectados ao ticket
      const newMessage = {
        id: messageId,
        ticket_id: ticketId,
        content,
        sender_id: userId,
        sender_name: senderName,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
        type: 'text'
      };

      wsManager.broadcastToTicket(ticketId, 'new-message', newMessage);
      
      // 🚀 INTEGRAÇÃO EVOLUTION API: Enviar para WhatsApp se não for mensagem interna
      if (!isInternal && messageId) {
        console.log(`🔗 [WS-SEND] Tentando enviar para WhatsApp via Evolution API...`);
        
        try {
          // Buscar dados do ticket para obter telefone
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select('nunmsg, metadata, channel')
            .eq('id', ticketId)
            .single();
          
          if (ticketError) {
            console.error(`❌ [WS-SEND] Erro ao buscar ticket ${ticketId}:`, ticketError);
          } else if (ticketData && (ticketData.channel === 'whatsapp' || ticketData.metadata?.is_whatsapp)) {
            // Extrair telefone do ticket
            const phone = ticketData.nunmsg || 
                         ticketData.metadata?.whatsapp_phone || 
                         ticketData.metadata?.client_phone;
            
            if (phone) {
              console.log(`📱 [WS-SEND] Enviando para WhatsApp: ${phone}`);
              
              // Chamar endpoint interno de envio
              const evolutionPayload = {
                phone: phone,
                text: content,
                instance: ticketData.metadata?.instance_name || 'atendimento-ao-cliente-suporte',
                options: {
                  delay: 1000,
                  presence: 'composing',
                  linkPreview: true
                }
              };
              
              const evolutionResponse = await fetch('http://localhost:4000/webhook/send-message', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(evolutionPayload)
              });
              
              const evolutionResult = await evolutionResponse.json();
              
              if (evolutionResponse.ok) {
                console.log(`✅ [WS-SEND] Mensagem enviada para WhatsApp:`, {
                  phone: phone,
                  messageId: evolutionResult.messageId,
                  status: evolutionResult.status
                });
                
                // Atualizar metadata da mensagem com status de envio
                await supabase
                  .from('messages')
                  .update({
                    metadata: {
                      sent_via_websocket: true,
                      is_internal: isInternal,
                      evolution_sent: true,
                      evolution_message_id: evolutionResult.messageId,
                      evolution_status: evolutionResult.status,
                      sent_to_whatsapp_at: new Date().toISOString()
                    }
                  })
                  .eq('id', messageId);
                
              } else {
                console.error(`❌ [WS-SEND] Erro ao enviar para WhatsApp:`, evolutionResult);
              }
              
            } else {
              console.log(`⚠️ [WS-SEND] Ticket ${ticketId} não tem telefone para envio WhatsApp`);
            }
          } else {
            console.log(`📧 [WS-SEND] Ticket ${ticketId} não é WhatsApp (channel: ${ticketData?.channel})`);
          }
        } catch (evolutionError) {
          console.error(`❌ [WS-SEND] Erro na integração Evolution API:`, evolutionError);
        }
      } else {
        console.log(`🔒 [WS-SEND] Mensagem interna, não enviando para WhatsApp`);
      }
      
    } catch (error) {
      console.error(`❌ [WS-SEND] Erro geral:`, error);
      socket.emit('error', { message: 'Erro ao enviar mensagem', error: error.message });
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`❌ [WS] Conexão desconectada: ${socket.id}`);
    wsManager.removeConnection(socket.id);
  });

  // Ping/Pong para manter conexão viva
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
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
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return null;
    }

    console.log(`✅ Cliente criado: ${newCustomer.name} (${newCustomer.id})`);
    return newCustomer.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateCustomer:', error);
    return null;
  }
}

// Buscar ou criar ticket
async function findOrCreateTicket(customerId, phone, instanceName) {
  try {
    console.log(`🎫 Buscando ticket existente para cliente: ${customerId}`);
    
    // Buscar ticket aberto existente
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingTickets && existingTickets.length > 0) {
      const ticket = existingTickets[0];
      console.log(`✅ Ticket existente encontrado: ${ticket.id}`);
      
      // Atualizar telefone no ticket existente
      const phoneFormatted = phone.startsWith('+') ? phone : `+${phone}`;
      const updateData = {
        nunmsg: phoneFormatted,
        metadata: {
          ...ticket.metadata,
          whatsapp_phone: phoneFormatted,
          client_phone: phoneFormatted,
          instance_name: instanceName,
          is_whatsapp: true,
          phone_updated_at: new Date().toISOString()
        },
        channel: 'whatsapp'
      };
      
      await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);
      
      return ticket.id;
    }

    // Criar novo ticket
    console.log(`➕ Criando novo ticket para cliente ${customerId}`);
    const phoneFormatted = phone.startsWith('+') ? phone : `+${phone}`;
    
    const ticketData = {
      id: crypto.randomUUID(),
      title: `Atendimento WhatsApp - ${phoneFormatted}`,
      description: `Conversa iniciada via WhatsApp na instância ${instanceName}`,
      status: 'open',
      priority: 'medium',
      customer_id: customerId,
      channel: 'whatsapp',
      nunmsg: phoneFormatted,
      metadata: {
        whatsapp_phone: phoneFormatted,
        client_phone: phoneFormatted,
        instance_name: instanceName,
        created_via: 'webhook_evolution',
        is_whatsapp: true,
        phone_captured_at: new Date().toISOString()
      }
    };

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      return null;
    }

    console.log(`✅ Ticket criado: ${newTicket.id} com telefone salvo no campo nunmsg: ${phoneFormatted}`);
    return newTicket.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateTicket:', error);
    return null;
  }
}

// Salvar mensagem no banco
async function saveMessage(ticketId, messageData, instanceName) {
  try {
    const messageId = crypto.randomUUID();
    const messageRecord = {
      id: messageId,
      ticket_id: ticketId,
      content: messageData.content,
      sender_name: messageData.senderName,
      type: messageData.type || 'text',
      metadata: {
        evolution_instance: instanceName,
        whatsapp_message_id: messageData.whatsappMessageId,
        sender_phone: messageData.senderPhone,
        is_from_whatsapp: true,
        timestamp: messageData.timestamp,
        message_type: messageData.type || 'text'
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('messages')
      .insert([messageRecord]);

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      return null;
    }

    console.log(`✅ Mensagem salva: ${messageId}`);
    
    // 🚀 BROADCAST VIA WEBSOCKET
    const broadcastMessage = {
      id: messageId,
      ticket_id: ticketId,
      content: messageData.content,
      sender_name: messageData.senderName,
      sender_id: null, // Mensagem de cliente
      is_internal: false,
      created_at: messageRecord.created_at,
      type: messageData.type || 'text',
      metadata: messageRecord.metadata
    };

    // Enviar para todos conectados ao ticket via WebSocket
    const sent = wsManager.broadcastToTicket(ticketId, 'new-message', broadcastMessage);
    
    if (sent) {
      console.log(`📡 [WS] Mensagem transmitida via WebSocket para ticket ${ticketId}`);
    } else {
      console.log(`📭 [WS] Nenhuma conexão ativa para ticket ${ticketId}`);
    }

    return messageId;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    return null;
  }
}

// Salvar mensagem enviada via WebSocket
async function saveMessageFromWebSocket({ ticketId, content, isInternal, userId, senderName }) {
  try {
    // Verificar se é um UUID válido
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
    
    if (!isValidUUID) {
      console.log(`⚠️ [WS] ID do ticket ${ticketId} não é um UUID válido, simulando salvamento`);
      const mockMessageId = `msg-${ticketId}-${Date.now()}`;
      console.log(`✅ Mensagem WebSocket simulada: ${mockMessageId}`);
      return mockMessageId;
    }

    const messageId = crypto.randomUUID();
    const messageRecord = {
      id: messageId,
      ticket_id: ticketId,
      content,
      sender_id: userId,
      sender_name: senderName,
      is_internal: isInternal,
      type: 'text',
      metadata: {
        sent_via_websocket: true,
        is_internal: isInternal
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('messages')
      .insert([messageRecord]);

    if (error) {
      console.error('❌ Erro ao salvar mensagem WebSocket:', error);
      return null;
    }

    console.log(`✅ Mensagem WebSocket salva: ${messageId}`);
    return messageId;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem WebSocket:', error);
    return null;
  }
}

// Carregar mensagens de um ticket
async function loadTicketMessages(ticketId, limit = 50) {
  try {
    console.log(`📥 [WS] Carregando mensagens para ticket: ${ticketId}`);
    
    // Verificar se é um UUID válido
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
    
    let messages = [];
    
    if (isValidUUID) {
      console.log(`🔑 [WS] Ticket UUID válido: ${ticketId}`);
      // Buscar diretamente por ticket_id UUID
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .limit(limit);
        
      if (error) {
        console.error('❌ [WS] Erro ao carregar mensagens UUID:', error);
        return [];
      }
      messages = data || [];
      
    } else {
      console.log(`🔑 [WS] Ticket ID numérico: ${ticketId}, tentando múltiplas estratégias de busca`);
      
      // ESTRATÉGIA 1: Buscar nas últimas mensagens (caso sejam recentes)
      console.log(`🔍 [WS] Buscando nas últimas 100 mensagens...`);
      const { data: recentMessages, error: recentError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (!recentError && recentMessages && recentMessages.length > 0) {
        console.log(`📊 [WS] Encontradas ${recentMessages.length} mensagens recentes`);
        // Filtrar mensagens que contenham o ticketId ou sejam relacionadas
        messages = recentMessages.filter(msg => {
          return (
            msg.content?.includes(ticketId) ||
            msg.metadata?.originalTicketId === ticketId ||
            msg.metadata?.ticketId === ticketId ||
            msg.metadata?.ticketId === String(ticketId)
          );
        });
        
        if (messages.length > 0) {
          console.log(`✅ [WS] Filtradas ${messages.length} mensagens para ticket ${ticketId}`);
        } else {
          // ESTRATÉGIA 2: Buscar por conteúdo
          console.log(`🔍 [WS] Tentando busca por conteúdo que contenha '${ticketId}'`);
          const { data: contentMessages, error: contentError } = await supabase
            .from('messages')
            .select('*')
            .ilike('content', `%${ticketId}%`)
            .order('created_at', { ascending: true })
            .limit(limit);
            
          if (!contentError && contentMessages) {
            messages = contentMessages;
            console.log(`🔍 [WS] Busca por conteúdo encontrou ${messages.length} mensagens`);
          }
        }
      }
      
      // Se ainda não encontrou, mostrar algumas mensagens de exemplo
      if (messages.length === 0) {
        console.log(`🔍 [WS] Para debug, mostrando estrutura de mensagens recentes:`);
        if (recentMessages && recentMessages.length > 0) {
          recentMessages.slice(0, 3).forEach((msg, index) => {
            console.log(`📝 [WS] Mensagem ${index + 1}:`, {
              id: msg.id,
              ticket_id: msg.ticket_id,
              content: msg.content?.substring(0, 50) + '...',
              metadata: msg.metadata
            });
          });
        }
      }
    }

    console.log(`✅ [WS] Carregadas ${messages.length} mensagens do banco para ticket ${ticketId}`);
    
    // 🔧 Se não há mensagens no banco, retornar array vazio para permitir que o usuário inicie a conversa
    if (messages.length === 0) {
      console.log(`📭 [WS] Nenhuma mensagem encontrada para ticket ${ticketId} - conversa nova`);
      return [];
    }
    
    return messages;

  } catch (error) {
    console.error('❌ [WS] Erro crítico ao carregar mensagens:', error);
    return [];
  }
}

// 📨 PROCESSAMENTO DE MENSAGENS DO WEBHOOK

// Extrair telefone do JID
function extractPhoneFromJid(jid) {
  if (!jid) return null;
  const match = jid.match(/^(\d+)/);
  return match ? match[1] : null;
}

// Extrair conteúdo da mensagem
function extractMessageContent(messageObj) {
  if (!messageObj) return null;
  
  // Mensagem de texto simples
  if (messageObj.conversation) {
    return messageObj.conversation;
  }
  
  // Mensagem de texto estendida
  if (messageObj.extendedTextMessage && messageObj.extendedTextMessage.text) {
    return messageObj.extendedTextMessage.text;
  }
  
  // Mensagem de mídia com caption
  if (messageObj.imageMessage && messageObj.imageMessage.caption) {
    return `[Imagem] ${messageObj.imageMessage.caption}`;
  }
  
  if (messageObj.videoMessage && messageObj.videoMessage.caption) {
    return `[Vídeo] ${messageObj.videoMessage.caption}`;
  }
  
  if (messageObj.documentMessage) {
    return `[Documento] ${messageObj.documentMessage.fileName || 'Arquivo'}`;
  }
  
  if (messageObj.audioMessage) {
    return '[Áudio]';
  }
  
  return '[Mensagem não suportada]';
}

// Processar mensagem recebida
async function processMessage(payload) {
  try {
    const messageData = payload.data;
    const instanceName = payload.instance;
    
    if (!messageData || !messageData.key) {
      console.warn('⚠️ Dados de mensagem inválidos');
      return { success: false, message: 'Dados inválidos' };
    }

    // Processar apenas mensagens de clientes
    if (messageData.key.fromMe) {
      console.log('📤 Mensagem enviada por nós, ignorando');
      return { success: true, message: 'Mensagem própria ignorada' };
    }

    // Extrair informações
    const clientPhone = extractPhoneFromJid(messageData.key.remoteJid);
    const messageContent = extractMessageContent(messageData.message);
    const senderName = messageData.pushName || `Cliente ${clientPhone?.slice(-4) || 'Unknown'}`;
    
    if (!clientPhone || !messageContent) {
      console.warn('⚠️ Telefone ou conteúdo da mensagem inválido');
      return { success: false, message: 'Dados da mensagem inválidos' };
    }

    console.log('📨 Processando mensagem:', {
      from: senderName,
      phone: clientPhone,
      content: messageContent.substring(0, 50) + '...',
      instance: instanceName
    });

    // Buscar ou criar cliente
    const customerId = await findOrCreateCustomer(clientPhone, instanceName, senderName);
    if (!customerId) {
      return { success: false, message: 'Erro ao processar cliente' };
    }

    // Buscar ou criar ticket
    const ticketId = await findOrCreateTicket(customerId, clientPhone, instanceName);
    if (!ticketId) {
      return { success: false, message: 'Erro ao processar ticket' };
    }

    // Salvar mensagem (e enviar via WebSocket automaticamente)
    const messageId = await saveMessage(ticketId, {
      content: messageContent,
      senderName: senderName,
      senderPhone: clientPhone,
      whatsappMessageId: messageData.key.id,
      timestamp: messageData.messageTimestamp,
      type: 'text'
    }, instanceName);

    if (!messageId) {
      return { success: false, message: 'Erro ao salvar mensagem' };
    }

    return { 
      success: true, 
      message: 'Mensagem processada com sucesso',
      ticketId,
      messageId,
      broadcast: true
    };

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// 🔗 ROTAS DO WEBHOOK

// === ENDPOINT DE ENVIO DE MENSAGENS ===
// Endpoint para enviar mensagens do TK para WhatsApp
app.post('/webhook/send-message', async (req, res) => {
  try {
    const { phone, text, instance = 'atendimento-ao-cliente-suporte', options = {} } = req.body;

    console.log('📤 [ENVIO] Recebida solicitação de envio:', {
      phone: phone,
      text: text?.substring(0, 50) + '...',
      instance: instance
    });

    // Validar dados obrigatórios
    if (!phone || !text) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e texto são obrigatórios',
        received: true
      });
    }

    // Formatação do telefone
    let formattedPhone = phone.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    // Se não começar com código do país, adicionar +55 (Brasil)
    if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`📱 [ENVIO] Enviando para ${formattedPhone} via instância ${instance}`);

    // Payload correto conforme documentação Evolution API
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

    console.log('🚀 [ENVIO] Payload:', {
      number: payload.number,
      text: payload.text.substring(0, 50) + '...',
      options: payload.options
    });

    // Fazer requisição para Evolution API
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
      console.log('✅ [ENVIO] Mensagem enviada com sucesso:', {
        messageId: responseData.key?.id,
        status: responseData.status
      });

      return res.status(200).json({
        success: true,
        messageId: responseData.key?.id,
        status: responseData.status,
        timestamp: responseData.messageTimestamp,
        data: responseData
      });
    } else {
      console.error('❌ [ENVIO] Erro da Evolution API:', {
        status: evolutionResponse.status,
        error: responseData
      });

      return res.status(evolutionResponse.status).json({
        success: false,
        error: responseData.message || 'Erro na Evolution API',
        details: responseData,
        evolutionStatus: evolutionResponse.status
      });
    }

  } catch (error) {
    console.error('❌ [ENVIO] Erro interno:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === ENDPOINT DE VERIFICAÇÃO DE INSTÂNCIA ===
app.get('/webhook/check-instance/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`🔍 [INSTÂNCIA] Verificando instância: ${instanceName}`);

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ [INSTÂNCIA] Status: ${data.state}`);
      
      return res.status(200).json({
        success: true,
        instance: instanceName,
        state: data.state,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ [INSTÂNCIA] Erro ao verificar: ${response.status}`);
      
      return res.status(response.status).json({
        success: false,
        error: 'Erro ao verificar instância',
        details: data
      });
    }

  } catch (error) {
    console.error('❌ [INSTÂNCIA] Erro interno:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === ENDPOINT DE TESTE DE ENVIO ===
app.post('/webhook/test-send', async (req, res) => {
  try {
    const { phone = '5511999999999' } = req.body;
    
    const testMessage = `🧪 Teste de envio - ${new Date().toLocaleString()}`;
    
    console.log(`🧪 [TESTE] Enviando mensagem de teste para ${phone}`);

    const testPayload = {
      phone,
      text: testMessage,
      instance: 'atendimento-ao-cliente-suporte',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: false
      }
    };

    // Reutilizar endpoint de envio
    const sendResponse = await fetch('http://localhost:4000/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await sendResponse.json();

    return res.status(sendResponse.status).json({
      test: true,
      payload: testPayload,
      result
    });

  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no teste de envio',
      details: error.message
    });
  }
});

// Endpoint principal do webhook Evolution
app.post('/webhook/evolution', async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    // Log completo para debug
    console.log(`🔔 [${timestamp}] Webhook Evolution API - DADOS COMPLETOS:`, JSON.stringify(payload, null, 2));
    
    console.log(`🔔 [${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      hasData: !!payload.data,
      keys: Object.keys(payload)
    });

    let result = { success: false, message: 'Evento não processado' };

    if (payload.event === 'MESSAGES_UPSERT') {
      result = await processMessage(payload);
    } else if (payload.event === 'CONNECTION_UPDATE') {
      console.log('🔗 Atualização de conexão:', payload.data);
      result = { success: true, message: 'Conexão atualizada' };
    } else {
      console.log('⚠️ Evento não reconhecido:', payload.event);
    }

    res.status(200).json({ 
      received: true, 
      timestamp,
      event: payload.event || 'unknown',
      instance: payload.instance,
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId,
      websocket: result.broadcast || false
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Endpoint de health check
app.get('/webhook/health', (req, res) => {
  const stats = wsManager.getStats();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Webhook Evolution API com WebSocket',
    websocket: {
      enabled: true,
      connections: stats.totalConnections,
      activeTickets: stats.activeTickets
    },
    endpoints: [
      '/webhook/evolution',
      '/webhook/health',
      '/webhook/ws-stats'
    ]
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor Webhook Evolution + WebSocket rodando na porta ${PORT}`);
  console.log('📋 Funcionalidades:');
  console.log('   📥 Webhook Evolution API: POST /webhook/evolution');
  console.log('   🔗 WebSocket Server: ws://localhost:4000');
  console.log('   📊 Estatísticas: GET /webhook/ws-stats');
  console.log('   🏥 Health Check: GET /webhook/health');
  console.log('');
  console.log('🔗 WebSocket Events:');
  console.log('   📝 join-ticket - Conectar a um ticket');
  console.log('   📨 send-message - Enviar nova mensagem');
  console.log('   📥 new-message - Receber nova mensagem');
  console.log('   📋 request-messages - Solicitar mensagens');
  console.log('   📊 connection-stats - Estatísticas de conexão');
  console.log('');
  console.log('✅ Sistema WebSocket ativo - Atualizações em tempo real!');
}); 