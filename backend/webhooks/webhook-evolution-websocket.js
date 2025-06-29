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
const EVOLUTION_API_URL = 'https://evochat.devsible.com.br';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const BASE_URL = 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
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

// === FUNÇÕES DE PROCESSAMENTO DE WEBHOOK EVOLUTION API ===

// Extrair telefone do JID do WhatsApp
function extractPhoneFromJid(jid) {
  try {
    if (!jid) return null;
    
    // Remover sufixos do WhatsApp
    let phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    
    // Remover caracteres não numéricos
    phone = phone.replace(/[^0-9]/g, '');
    
    // Validar se tem pelo menos 10 dígitos
    if (phone.length < 10) return null;
    
    return phone;
  } catch (error) {
    console.error('❌ Erro ao extrair telefone do JID:', error);
    return null;
  }
}

// Extrair conteúdo da mensagem
function extractMessageContent(messageObj) {
  try {
    if (!messageObj) return null;
    
    // Priorizar diferentes tipos de mensagem
    if (messageObj.conversation) {
      return messageObj.conversation;
    }
    
    if (messageObj.extendedTextMessage?.text) {
      return messageObj.extendedTextMessage.text;
    }
    
    if (messageObj.imageMessage?.caption) {
      return `[Imagem] ${messageObj.imageMessage.caption}`;
    }
    
    if (messageObj.videoMessage?.caption) {
      return `[Vídeo] ${messageObj.videoMessage.caption}`;
    }
    
    if (messageObj.documentMessage?.caption) {
      return `[Documento] ${messageObj.documentMessage.caption}`;
    }
    
    if (messageObj.audioMessage) {
      return '[Áudio]';
    }
    
    if (messageObj.stickerMessage) {
      return '[Sticker]';
    }
    
    if (messageObj.locationMessage) {
      return '[Localização]';
    }
    
    if (messageObj.contactMessage) {
      return '[Contato]';
    }
    
    // Se nenhum tipo conhecido, tentar extrair qualquer texto
    const textContent = JSON.stringify(messageObj).match(/\"text\":\\s*\"([^\"]+)\"/)?.[1];
    if (textContent) {
      return textContent;
    }
    
    return '[Mensagem não suportada]';
  } catch (error) {
    console.error('❌ Erro ao extrair conteúdo da mensagem:', error);
    return null;
  }
}

// Função aprimorada para buscar ou criar cliente
async function findOrCreateCustomerEnhanced(phone, instanceName, pushName = null) {
  try {
    const phoneFormatted = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneClean = phone.replace(/[^0-9]/g, '');
    
    console.log(`👤 Processando cliente:`, {
      phone: phoneClean,
      phoneFormatted: phoneFormatted,
      name: pushName,
      instance: instanceName
    });
    
    // Tentar encontrar cliente existente por telefone ou metadados
    let { data: existingCustomer, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .or(`phone.eq.${phoneClean},phone.eq.${phoneFormatted},metadata->>phone.eq.${phoneClean},metadata->>whatsapp_phone.eq.${phoneClean},email.eq.whatsapp-${phoneClean}@auto-generated.com`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.warn('⚠️ Erro ao buscar cliente:', searchError);
    }
    
    if (existingCustomer) {
      console.log(`✅ Cliente existente encontrado: ${existingCustomer.id} (${existingCustomer.full_name || existingCustomer.email})`);
      
      // Atualizar informações se necessário
      const updates = {};
      if (pushName && !existingCustomer.full_name) {
        updates.full_name = pushName;
      }
      if (!existingCustomer.phone) {
        updates.phone = phoneClean;
      }
      
      // Atualizar metadados
      const currentMetadata = existingCustomer.metadata || {};
      updates.metadata = {
        ...currentMetadata,
        whatsapp_phone: phoneClean,
        phone_formatted: phoneFormatted,
        last_instance: instanceName,
        last_contact_name: pushName,
        updated_at: new Date().toISOString()
      };
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', existingCustomer.id);
        
        console.log(`📝 Cliente atualizado com:`, Object.keys(updates));
      }
      
      return existingCustomer.id;
    }

    // Criar novo cliente
    console.log(`➕ Criando novo cliente para ${phoneFormatted}`);
    
    const clientData = {
      id: crypto.randomUUID(),
      email: `whatsapp-${phoneClean}@auto-generated.com`,
      full_name: pushName || `Cliente ${phoneClean.slice(-4)}`,
      phone: phoneClean,
      role: 'customer',
      metadata: {
        source: 'whatsapp_webhook',
        whatsapp_phone: phoneClean,
        phone_formatted: phoneFormatted,
        instance_name: instanceName,
        contact_name: pushName,
        auto_created: true,
        created_via: 'evolution_api',
        first_contact_at: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newCustomer, error: createError } = await supabase
      .from('profiles')
      .insert([clientData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar cliente:', createError);
      return null;
    }

    console.log(`✅ Cliente criado: ${newCustomer.id} (${newCustomer.full_name})`);
    return newCustomer.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateCustomerEnhanced:', error);
    return null;
  }
}

// Função aprimorada para buscar ou criar ticket
async function findOrCreateTicketEnhanced(customerId, phone, instanceName, firstMessage = null) {
  try {
    const phoneFormatted = phone.startsWith('+') ? phone : `+${phone}`;
    
    console.log(`🎫 Gerenciando ticket para cliente: ${customerId}`);
    
    // Buscar tickets abertos existentes que NÃO estão finalizados
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['open', 'in_progress', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingTickets && existingTickets.length > 0) {
      const ticket = existingTickets[0];
      console.log(`✅ Ticket existente encontrado: ${ticket.id}`);
      
      // Atualizar última atividade e telefone
      const updateData = {
        nunmsg: phoneFormatted,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...ticket.metadata,
          whatsapp_phone: phoneFormatted,
          client_phone: phoneFormatted,
          instance_name: instanceName,
          is_whatsapp: true,
          phone_updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
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
    
    // Buscar dados do cliente para o título
    const { data: customerData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', customerId)
      .single();
    
    const customerName = customerData?.full_name || `Cliente ${phone.slice(-4)}`;
    
    const ticketData = {
      id: crypto.randomUUID(),
      title: `WhatsApp: ${customerName}`,
      description: firstMessage || `Conversa iniciada via WhatsApp (${instanceName})`,
      status: 'open',
      priority: 'medium',
      customer_id: customerId,
      channel: 'whatsapp',
      nunmsg: phoneFormatted,
      metadata: {
        whatsapp_phone: phoneFormatted,
        client_phone: phoneFormatted,
        instance_name: instanceName,
        created_via: 'webhook_evolution_enhanced',
        is_whatsapp: true,
        can_reply: true,
        first_message: firstMessage,
        phone_captured_at: new Date().toISOString(),
        enhanced_processing: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
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

    console.log(`✅ Ticket criado: ${newTicket.id} com telefone ${phoneFormatted}`);
    return newTicket.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateTicketEnhanced:', error);
    return null;
  }
}

// Função aprimorada para salvar mensagem
async function saveMessageEnhanced(ticketId, messageData, senderName, senderPhone, instanceName) {
  try {
    const messagePayload = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      content: messageData.content,
      sender_id: null, // Cliente não tem sender_id
      sender_name: senderName,
      sender_email: null,
      sender_type: 'client',
      type: 'text',
      message_type: 'text',
      is_internal: false,
      metadata: {
        whatsapp_message_id: messageData.whatsappMessageId,
        whatsapp_phone: senderPhone,
        instance_name: instanceName,
        timestamp: messageData.timestamp,
        jid: messageData.jid,
        is_from_whatsapp: true,
        sender_phone: senderPhone,
        enhanced_processing: true,
        processed_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    const { data: savedMessage, error } = await supabase
      .from('messages')
      .insert([messagePayload])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      return null;
    }

    console.log(`💬 Mensagem salva: ${savedMessage.id} no ticket ${ticketId}`);
    
    // Broadcast via WebSocket para todos conectados ao ticket
    const broadcastMessage = {
      id: savedMessage.id,
      ticket_id: ticketId,
      content: messageData.content,
      sender: 'client',
      senderName: senderName,
      senderPhone: senderPhone,
      created_at: savedMessage.created_at,
      is_internal: false,
      type: 'text',
      metadata: savedMessage.metadata
    };
    
    const broadcastSent = wsManager.broadcastToTicket(ticketId, 'new-message', broadcastMessage);
    console.log(`📡 Broadcast enviado: ${broadcastSent}`);
    
    return savedMessage.id;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    return null;
  }
}

// FUNÇÃO PRINCIPAL DE PROCESSAMENTO COMPLETO
async function processCompleteMessage(payload) {
  try {
    console.log(`🔄 [WEBHOOK] Processamento completo iniciado - Evento: ${payload.event}`);
    
    const messageData = payload.data;
    const instanceName = payload.instance;
    
    if (!messageData || !messageData.key) {
      console.warn('⚠️ Dados de mensagem inválidos');
      return { success: false, message: 'Dados inválidos' };
    }

    // Ignorar mensagens enviadas por nós
    if (messageData.key.fromMe) {
      console.log('📤 Mensagem enviada por nós, ignorando');
      return { success: true, message: 'Mensagem própria ignorada' };
    }

    // Extrair informações da mensagem
    const clientPhone = extractPhoneFromJid(messageData.key.remoteJid);
    const messageContent = extractMessageContent(messageData.message);
    const senderName = messageData.pushName || `Cliente ${clientPhone?.slice(-4) || 'Desconhecido'}`;
    
    if (!clientPhone || !messageContent) {
      console.warn('⚠️ Telefone ou conteúdo da mensagem inválido');
      return { success: false, message: 'Dados da mensagem inválidos' };
    }

    console.log('📨 Processando mensagem completa:', {
      from: senderName,
      phone: clientPhone,
      content: messageContent.substring(0, 50) + '...',
      instance: instanceName
    });

    // 1. Buscar ou criar cliente
    const customerId = await findOrCreateCustomerEnhanced(clientPhone, instanceName, senderName);
    if (!customerId) {
      return { success: false, message: 'Erro ao processar cliente' };
    }

    // 2. Buscar ou criar ticket
    const ticketId = await findOrCreateTicketEnhanced(customerId, clientPhone, instanceName, messageContent);
    if (!ticketId) {
      return { success: false, message: 'Erro ao processar ticket' };
    }

    // 3. Salvar mensagem (com broadcast automático)
    const messageId = await saveMessageEnhanced(ticketId, {
      content: messageContent,
      whatsappMessageId: messageData.key.id,
      timestamp: messageData.messageTimestamp,
      jid: messageData.key.remoteJid
    }, senderName, clientPhone, instanceName);
    
    if (!messageId) {
      return { success: false, message: 'Erro ao salvar mensagem' };
    }
    
    console.log('✅ [WEBHOOK] Processamento completo finalizado com sucesso');
      
      return { 
        success: true, 
        message: 'Mensagem processada com sucesso',
      data: {
        customerId,
        ticketId,
        messageId,
        clientPhone,
        senderName,
        instanceName,
        processed: true,
        enhanced: true
      }
    };

  } catch (error) {
    console.error('❌ Erro no processamento completo:', error);
    return { success: false, message: error.message };
  }
}

// === ENDPOINTS APRIMORADOS ===

// Endpoint principal Evolution API com processamento completo
app.post('/webhook/evolution', async (req, res) => {
  try {
    console.log('📥 [WEBHOOK] Recebido:', {
      event: req.body.event,
      instance: req.body.instance,
      timestamp: new Date().toISOString()
    });
    
    const payload = req.body;
    
    // Processar diferentes tipos de eventos
    if (payload.event === 'messages.upsert' || payload.event === 'MESSAGES_UPSERT') {
      const result = await processCompleteMessage(payload);
      
      if (result.success) {
        res.status(200).json({
        success: true,
          message: 'Webhook processado com sucesso',
          ...result.data
      });
    } else {
        res.status(400).json({
        success: false,
          message: result.message
        });
      }
    } else if (payload.event === 'connection.update') {
      console.log('🔗 [WEBHOOK] Status de conexão:', payload.data);
      res.status(200).json({ success: true, message: 'Status de conexão recebido' });
    } else {
      console.log('ℹ️ [WEBHOOK] Evento não processado:', payload.event);
      res.status(200).json({ success: true, message: 'Evento recebido mas não processado' });
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro no endpoint principal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Endpoint específico para connection updates (que estava dando 404)
app.post('/webhook/evolution/connection-update', async (req, res) => {
  try {
    console.log('🔗 [CONNECTION] Update recebido:', req.body);
    res.status(200).json({ 
        success: true,
      message: 'Connection update processado',
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ [CONNECTION] Erro:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint para compatibilidade (Evolution pode usar /connection-update direto)
app.post('/connection-update', async (req, res) => {
  try {
    console.log('🔗 [CONNECTION-DIRECT] Update recebido:', req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Connection update processado (endpoint direto)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [CONNECTION-DIRECT] Erro:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  const stats = wsManager.getStats();
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    websocket: {
      connected: stats.totalConnections,
      active_tickets: stats.activeTickets,
      connections_by_ticket: stats.connectionsByTicket
    },
    server: {
      port: PORT,
      node_version: process.version,
      memory: process.memoryUsage()
    }
  });
});

// Estatísticas WebSocket
app.get('/webhook/ws-stats', (req, res) => {
  res.status(200).json(wsManager.getStats());
});

// Endpoint de teste simples
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Servidor Webhook Evolution + WebSocket ativo',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /webhook/evolution - Webhook principal',
      'POST /webhook/evolution/connection-update - Updates de conexão',
      'POST /connection-update - Updates diretos',
      'GET /webhook/health - Health check',
      'GET /webhook/ws-stats - Estatísticas WebSocket'
    ]
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor Webhook Evolution + WebSocket rodando na porta ${PORT}`);
  console.log('📋 Funcionalidades:');
  console.log('   📥 Webhook Evolution API: POST /webhook/evolution');
  console.log('   🔗 Connection Updates: POST /webhook/evolution/connection-update');
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