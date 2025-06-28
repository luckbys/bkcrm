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
async function findOrCreateTicket(customerId, phone, instance) {
  try {
    console.log('🎫 [TICKET] Buscando/criando ticket:', { customerId, phone, instance });
    
    // Primeiro tenta encontrar um ticket existente
    const { data: existingTickets, error: searchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'open')
      .eq('channel', 'whatsapp')
      .or(`nunmsg.eq.${phone},metadata->>whatsapp_phone.eq.${phone},metadata->>client_phone.eq.${phone}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      console.error('❌ [TICKET] Erro ao buscar tickets existentes:', searchError);
    }

    if (existingTickets && existingTickets.length > 0) {
      const ticket = existingTickets[0];
      console.log('✅ [TICKET] Ticket existente encontrado:', {
        id: ticket.id,
        customer_id: ticket.customer_id,
        nunmsg: ticket.nunmsg,
        metadata: ticket.metadata
      });
      return ticket;
    }

    // Se não encontrar, cria um novo ticket
    const newTicket = await supabase
      .from('tickets')
      .insert([{
      id: crypto.randomUUID(),
        title: `Atendimento WhatsApp - ${phone}`,
        description: `Conversa iniciada via WhatsApp na instância ${instance}`,
      status: 'open',
      priority: 'medium',
      customer_id: customerId,
      channel: 'whatsapp',
        nunmsg: phone,
      metadata: {
          whatsapp_phone: phone,
          client_phone: phone,
          instance_name: instance,
        created_via: 'webhook_evolution',
        is_whatsapp: true,
        phone_captured_at: new Date().toISOString()
      }
      }])
      .select()
      .single();

    console.log('✅ [TICKET] Novo ticket criado:', newTicket);
    return newTicket;

  } catch (error) {
    console.error('❌ [TICKET] Erro ao buscar/criar ticket:', error);
    throw new Error(`Erro ao processar ticket: ${error.message}`);
  }
}

// Salvar mensagem no banco
async function saveMessage(ticketId, messageData, instanceName) {
  try {
    console.log('💾 [DB] Salvando mensagem no banco:', {
      ticketId,
      instance: instanceName,
      messageType: messageData.type || 'text'
    });

    const result = await supabase
      .from('messages')
      .insert([{
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        created_at: new Date().toISOString(),
        content: messageData.content,
        type: messageData.type || 'text',
        is_internal: messageData.is_internal || false,
        sender_name: messageData.sender_name,
        metadata: {
          ...messageData.metadata,
          evolution_instance: instanceName,
          whatsapp_message_id: messageData.whatsapp_message_id,
          sender: messageData.sender,
          message_type: messageData.message_type || 'text'
        }
      }])
      .select()
      .single();

    console.log('✅ [DB] Mensagem salva com sucesso:', result);
    return result;

  } catch (error) {
    console.error('❌ [DB] Erro ao salvar mensagem:', error);
    throw new Error(`Erro ao salvar mensagem: ${error.message}`);
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
  
  // 🎵 MENSAGEM DE ÁUDIO - Extrair URL e metadados
  if (messageObj.audioMessage) {
    const audioData = messageObj.audioMessage;
    const duration = audioData.seconds || 0;
    const mimetype = audioData.mimetype || 'audio/ogg; codecs=opus';
    
    // Construir URL do áudio (baseado na Evolution API)
    const audioUrl = `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${audioData.key.remoteJid}/${audioData.key.id}?apikey=${EVOLUTION_API_KEY}`;
    
    console.log('🎵 [AUDIO] Dados extraídos:', {
      duration: duration,
      mimetype: mimetype,
      audioUrl: audioUrl,
      messageId: audioData.key.id
    });
    
    return '[Áudio]';
  }
  
  return '[Mensagem não suportada]';
}

// 🎵 Função para extrair metadados de áudio
function extractAudioMetadata(messageObj) {
  if (!messageObj || !messageObj.audioMessage) return null;
  
  const audioData = messageObj.audioMessage;
  const duration = audioData.seconds || 0;
  const mimetype = audioData.mimetype || 'audio/ogg; codecs=opus';
  
  // Construir URL do áudio com API key
  const audioUrl = `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${audioData.key.remoteJid}/${audioData.key.id}?apikey=${EVOLUTION_API_KEY}`;
  
  return {
    fileUrl: audioUrl,
    duration: duration,
    mimetype: mimetype,
    messageId: audioData.key.id,
    isAudio: true
  };
}

// Processar mensagem recebida
async function processMessage(payload) {
  try {
    const { data } = payload;
    const messageKey = data.key;
    const messageContent = data.message;
    
    console.log('📨 [MESSAGE] Iniciando processamento:', {
      instance: payload.instance,
      messageId: messageKey?.id,
      fromMe: messageKey?.fromMe,
      isTest: data.isTestMessage
    });

    // Verificar se é mensagem do sistema
    if (messageKey.fromMe && !data.isTestMessage) {
      console.log('📤 Mensagem enviada pelo sistema, ignorando');
      return { success: true, message: 'Mensagem do sistema ignorada' };
    }

    const phone = messageKey.remoteJid.split('@')[0];
    const textContent = messageContent.conversation || messageContent.extendedTextMessage?.text;
    
    if (!textContent) {
      console.log('ℹ️ [MESSAGE] Mensagem sem texto - ignorada');
      return { success: true, message: 'Mensagem sem texto - ignorada' };
    }

    // Processar cliente
    console.log('👤 [CUSTOMER] Processando cliente:', { phone, instance: payload.instance });
    const customer = await findOrCreateCustomer(phone, payload.instance, data.pushName);
    
    console.log('🔍 [CUSTOMER] Resultado da busca/criação:', customer);
    
    // Corrigir validação - o customer pode ser um ID string ou um objeto
    const customerId = typeof customer === 'string' ? customer : customer?.id;
    
    if (!customerId) {
      throw new Error('Falha ao criar/encontrar cliente - ID não disponível');
    }

    // Processar ticket
    console.log('🎫 [TICKET] Processando ticket para cliente:', { customerId });
    const ticketResponse = await findOrCreateTicket(customerId, phone, payload.instance);
    
    console.log('🔍 [TICKET] Resultado da busca/criação:', ticketResponse);
    
    // Extrair o ID do ticket considerando a estrutura de resposta do Supabase
    let ticketId;
    if (typeof ticketResponse === 'string') {
      ticketId = ticketResponse;
    } else if (ticketResponse?.data?.id) {
      ticketId = ticketResponse.data.id;
    } else if (ticketResponse?.data?.data?.id) {
      ticketId = ticketResponse.data.data.id;
    } else if (ticketResponse?.id) {
      ticketId = ticketResponse.id;
    }
    
    console.log('🎫 [TICKET] ID extraído:', ticketId);
    
    if (!ticketId) {
      console.error('❌ [TICKET] Falha ao extrair ID do ticket da resposta:', ticketResponse);
      throw new Error('Falha ao criar/encontrar ticket - ID não disponível');
    }

    // Preparar dados da mensagem
    const messageData = {
      ticket_id: ticketId,
      content: textContent,
      sender: 'client',
      sender_name: data.pushName || 'Cliente',
      whatsapp_message_id: messageKey.id,
      timestamp: data.messageTimestamp,
      phone: phone,
      metadata: {
        is_from_client: true,
        is_test_message: data.isTestMessage || false,
        message_type: 'text',
        timestamp: data.messageTimestamp
      }
    };

    // Salvar mensagem
    console.log('💾 [MESSAGE] Salvando mensagem:', {
      ticketId,
      content: textContent.substring(0, 50) + '...'
    });
    
    const savedMessage = await saveMessage(ticketId, messageData, payload.instance);
    
    console.log('✅ [MESSAGE] Mensagem processada com sucesso:', {
      messageId: savedMessage.id,
      ticketId
    });

    // Preparar mensagem para broadcast
    const broadcastMessage = {
      id: savedMessage.id,
      ticket_id: ticketId,
      content: textContent,
      sender: 'client',
      sender_name: data.pushName || 'Cliente',
      timestamp: new Date().toISOString(),
      metadata: messageData.metadata,
      type: 'text'
    };

    // Broadcast via WebSocket
    console.log('📡 [WS] Enviando mensagem via WebSocket:', {
      event: 'new-message',
      ticketId,
      messageId: savedMessage.id
    });

    // Enviar para todos os clientes conectados ao ticket
    io.to(`ticket:${ticketId}`).emit('new-message', broadcastMessage);

    return {
      success: true,
      customerId,
      ticketId,
      messageId: savedMessage.id,
      broadcast: true
    };

  } catch (error) {
    console.error('❌ [MESSAGE] Erro ao processar mensagem:', error);
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

    // 🔧 CORREÇÃO: Processar MESSAGES_UPSERT corretamente (ambos formatos)
    if ((payload.event === 'MESSAGES_UPSERT' || payload.event === 'messages.upsert') && payload.data) {
      console.log(`📨 [PRODUÇÃO] Processando ${payload.event} (formato ${payload.event === 'MESSAGES_UPSERT' ? 'simulado' : 'real'})...`);
      
      try {
        // Verificar se é mensagem de cliente (não nossa)
        if (payload.data.key && !payload.data.key.fromMe) {
          console.log('✅ [PRODUÇÃO] Mensagem de cliente detectada');
          
          // Extrair dados básicos
          const clientPhone = extractPhoneFromJid(payload.data.key.remoteJid);
          const messageContent = extractMessageContent(payload.data.message);
          const senderName = payload.data.pushName || `Cliente ${clientPhone?.slice(-4) || 'Unknown'}`;
          const instanceName = payload.instance || 'atendimento-ao-cliente-suporte';
          
          console.log('📱 [PRODUÇÃO] Dados extraídos:', {
            phone: clientPhone,
            content: messageContent?.substring(0, 50) + '...',
            sender: senderName,
            instance: instanceName
          });
          
          if (clientPhone && messageContent) {
            // Buscar ou criar cliente
            const customerId = await findOrCreateCustomer(clientPhone, instanceName, senderName);
            
            if (customerId) {
              // Buscar ou criar ticket
              const ticketId = await findOrCreateTicket(customerId, clientPhone, instanceName);
              
              if (ticketId) {
                // Salvar mensagem
                const messageId = await saveMessage(ticketId, {
                  content: messageContent,
                  senderName: senderName,
                  senderPhone: clientPhone,
                  whatsappMessageId: payload.data.key.id,
                  timestamp: payload.data.messageTimestamp,
                  type: 'text'
                }, instanceName);
                
                if (messageId) {
                  console.log('✅ [PRODUÇÃO] Mensagem processada com sucesso:', {
                    ticketId,
                    messageId,
                    broadcast: true
                  });
                  
                  // 🚀 BROADCAST VIA WEBSOCKET PARA TODOS OS CLIENTES
                  const newMessage = {
                    id: messageId,
                    ticket_id: ticketId,
                    content: messageContent,
                    sender_id: null, // Cliente não tem sender_id
                    sender_name: senderName,
                    is_internal: false,
                    created_at: new Date().toISOString(),
                    type: 'text'
                  };

                  // Enviar para todos conectados ao ticket
                  const broadcastResult = wsManager.broadcastToTicket(ticketId, 'new-message', newMessage);
                  
                  if (broadcastResult) {
                    console.log('📡 [PRODUÇÃO] Mensagem enviada via WebSocket para clientes');
                  } else {
                    console.log('📭 [PRODUÇÃO] Nenhum cliente conectado ao ticket');
                  }
                  
                  result = { 
                    success: true, 
                    message: 'Mensagem processada com sucesso',
                    ticketId,
                    messageId,
                    broadcast: true
                  };
                } else {
                  console.log('❌ [PRODUÇÃO] Erro ao salvar mensagem');
                  result = { success: false, message: 'Erro ao salvar mensagem' };
                }
              } else {
                console.log('❌ [PRODUÇÃO] Erro ao criar/buscar ticket');
                result = { success: false, message: 'Erro ao processar ticket' };
              }
            } else {
              console.log('❌ [PRODUÇÃO] Erro ao criar/buscar cliente');
              result = { success: false, message: 'Erro ao processar cliente' };
            }
          } else {
            console.log('❌ [PRODUÇÃO] Dados da mensagem inválidos');
            result = { success: false, message: 'Dados da mensagem inválidos' };
          }
        } else {
          console.log('📤 [PRODUÇÃO] Mensagem própria, ignorando');
          result = { success: true, message: 'Mensagem própria ignorada' };
        }
      } catch (error) {
        console.error('❌ [PRODUÇÃO] Erro ao processar mensagem:', error);
        result = { success: false, message: error.message };
      }
    } else if (payload.event === 'CONNECTION_UPDATE' || payload.event === 'connection.update') {
      console.log('🔗 [PRODUÇÃO] Atualização de conexão:', payload.data);
      result = { success: true, message: 'Conexão atualizada' };
    } else {
      console.log('⚠️ [PRODUÇÃO] Evento não reconhecido:', payload.event);
      console.log('🔍 [PRODUÇÃO] Dados do evento:', JSON.stringify(payload, null, 2));
      result = { success: false, message: `Evento ${payload.event} não requer processamento` };
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
    console.error('❌ [PRODUÇÃO] Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// 🔧 ENDPOINTS ADICIONAIS DA EVOLUTION API
// Endpoint para connection.update (Evolution API adiciona automaticamente)
app.post('/webhook/evolution/connection-update', async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`🔗 [${timestamp}] Connection Update Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      state: payload.data?.state,
      profileName: payload.data?.profileName
    });

    // Processar atualização de conexão
    if (payload.event === 'connection.update' && payload.data) {
      console.log(`📱 [CONNECTION] Status: ${payload.data.state} para instância ${payload.instance}`);
      
      if (payload.data.state === 'open') {
        console.log(`✅ [CONNECTION] WhatsApp conectado - ${payload.data.profileName || 'Sem nome'}`);
      } else if (payload.data.state === 'close') {
        console.log(`❌ [CONNECTION] WhatsApp desconectado`);
      }
    }

    res.status(200).json({ 
      received: true, 
      timestamp,
      event: payload.event || 'connection.update',
      instance: payload.instance,
      processed: true,
      message: 'Connection update processado'
    });

  } catch (error) {
    console.error('❌ [CONNECTION] Erro ao processar connection update:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Endpoint para messages.upsert (Evolution API pode usar formato específico)
app.post('/webhook/evolution/messages-upsert', async (req, res) => {
  try {
    console.log('🔄 [GENERIC] Endpoint Evolution API: /webhook/evolution/messages-upsert');
    console.log('📦 [GENERIC] Event: messages.upsert');
    
    const payload = {
      event: 'messages.upsert',
      instance: req.body.instance || 'unknown',
      data: {
        ...req.body.data,
        isTestMessage: true // Marcar como mensagem de teste
      }
    };

    const result = await processMessage(payload);
    console.log('✅ [MESSAGES-UPSERT] Resultado:', result);

    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      processed: result.success,
      message: result.message,
      endpoint: 'messages-upsert'
    });
    
  } catch (error) {
    console.error('❌ [MESSAGES] Erro ao processar messages.upsert:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Endpoint genérico para capturar outros eventos da Evolution API
app.post('/webhook/evolution/:event', (req, res) => {
  const endpoint = req.params.event;
  const payload = req.body;
  
  console.log(`🔄 [GENERIC] Endpoint Evolution API: /webhook/evolution/${endpoint}`);
  console.log(`📦 [GENERIC] Event: ${payload.event || 'unknown'}`);
  
  res.status(200).json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    endpoint: `/webhook/evolution/${endpoint}`,
    event: payload.event || 'unknown',
    processed: true,
    message: 'Evento genérico processado'
  });
});


// === ROTA COMPATIBILIDADE - /messages-upsert ===
// Rota para capturar mensagens enviadas diretamente para /messages-upsert
app.post('/messages-upsert', async (req, res) => {
  try {
    console.log('📥 [COMPAT] /messages-upsert recebido - processando como MESSAGES_UPSERT');
    
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || 'atendimento-ao-cliente-suporte',
      data: req.body.data || req.body
    };

    console.log('🔄 [COMPAT] Payload estruturado:', {
      event: payload.event,
      instance: payload.instance,
      hasData: !!payload.data
    });

    const result = await processMessage(payload);
    
    console.log('✅ [COMPAT] Resultado processamento:', {
      success: result.success,
      ticketId: result.ticketId,
      messageId: result.messageId
    });

    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      processed: result.success,
      message: result.message || 'Mensagem processada',
      ticketId: result.ticketId,
      endpoint: '/messages-upsert (compatibilidade)'
    });
    
  } catch (error) {
    console.error('❌ [COMPAT] Erro ao processar /messages-upsert:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message,
      endpoint: '/messages-upsert'
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
      '/webhook/evolution/connection-update',
      '/webhook/evolution/messages-upsert',
      '/webhook/evolution/:event',
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