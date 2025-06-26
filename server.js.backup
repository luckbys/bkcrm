// 🚀 EXEMPLO DE CONFIGURAÇÃO DO BACKEND NODE.JS/EXPRESS COM WEBSOCKET
// 📂 server.js ou app.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 🔧 Configuração do Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // URL do seu React
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// 📊 Armazenar conexões ativas
const activeConnections = new Map();
const typingUsers = new Map(); // ticketId -> Set de users digitando

// 🔗 Middleware de autenticação WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  const userName = socket.handshake.auth.userName;
  
  // Validar token aqui
  if (!token || !userId) {
    return next(new Error('Unauthorized'));
  }
  
  socket.userId = userId;
  socket.userName = userName;
  next();
});

// 🎯 Configuração das conexões WebSocket
io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.userName} (${socket.userId})`);
  
  // Armazenar conexão
  activeConnections.set(socket.userId, {
    socket,
    userName: socket.userName,
    connectedAt: new Date()
  });

  // 📥 ENTRAR EM UM TICKET
  socket.on('join_ticket', async (ticketId) => {
    try {
      socket.join(`ticket_${ticketId}`);
      socket.currentTicket = ticketId;
      
      console.log(`📨 ${socket.userName} joined ticket ${ticketId}`);
      
      // Notificar outros usuários no ticket
      socket.to(`ticket_${ticketId}`).emit('user_joined', {
        userId: socket.userId,
        userName: socket.userName
      });
      
      // Enviar histórico de mensagens
      const messages = await getTicketMessages(ticketId);
      socket.emit('message_history', {
        ticketId,
        messages
      });
      
      socket.emit('join_success', { ticketId });
    } catch (error) {
      console.error('Erro ao entrar no ticket:', error);
      socket.emit('error', { message: 'Erro ao entrar no ticket' });
    }
  });

  // 📤 SAIR DE UM TICKET
  socket.on('leave_ticket', (ticketId) => {
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
      socket.to(`ticket_${ticketId}`).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName
      });
      console.log(`📤 ${socket.userName} left ticket ${ticketId}`);
    }
    socket.currentTicket = null;
  });

  // 💬 ENVIAR MENSAGEM
  socket.on('send_message', async (data) => {
    try {
      const { ticketId, content, isInternal } = data;
      
      // Salvar mensagem no banco de dados
      const savedMessage = await saveMessage({
        ticketId,
        content,
        senderId: socket.userId,
        senderName: socket.userName,
        senderType: 'agent',
        isInternal,
        timestamp: new Date()
      });

      // 📡 Broadcast para todos no ticket
      io.to(`ticket_${ticketId}`).emit('new_message', {
        ...savedMessage,
        // Incluir metadados adicionais se necessário
        metadata: {
          whatsapp: isInternal ? null : {
            messageId: `msg_${Date.now()}`,
            instanceName: 'default',
            fromPhone: '+5511999999999'
          }
        }
      });

      // 🔄 Se não for nota interna, enviar via Evolution API
      if (!isInternal) {
        await sendToWhatsApp(ticketId, content);
      }

      console.log(`💬 Message sent by ${socket.userName} to ticket ${ticketId}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('message_error', { 
        error: error.message,
        tempId: data.tempId 
      });
    }
  });

  // ⌨️ INDICADOR DE DIGITAÇÃO
  socket.on('typing_start', (ticketId) => {
    if (!typingUsers.has(ticketId)) {
      typingUsers.set(ticketId, new Set());
    }
    
    typingUsers.get(ticketId).add({
      userId: socket.userId,
      userName: socket.userName
    });

    socket.to(`ticket_${ticketId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping: true
    });
  });

  socket.on('typing_stop', (ticketId) => {
    if (typingUsers.has(ticketId)) {
      const ticketTypingUsers = typingUsers.get(ticketId);
      ticketTypingUsers.delete({
        userId: socket.userId,
        userName: socket.userName
      });
      
      if (ticketTypingUsers.size === 0) {
        typingUsers.delete(ticketId);
      }
    }

    socket.to(`ticket_${ticketId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping: false
    });
  });

  // 🔌 DESCONEXÃO
  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.userName}`);
    
    // Remover das conexões ativas
    activeConnections.delete(socket.userId);
    
    // Notificar outros usuários no ticket atual
    if (socket.currentTicket) {
      socket.to(`ticket_${socket.currentTicket}`).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName
      });
      
      // Limpar indicador de digitação
      if (typingUsers.has(socket.currentTicket)) {
        const ticketTypingUsers = typingUsers.get(socket.currentTicket);
        ticketTypingUsers.delete({
          userId: socket.userId,
          userName: socket.userName
        });
      }
    }
  });
});

// 📨 INTEGRAÇÃO COM EVOLUTION API
const sendToWhatsApp = async (ticketId, message) => {
  try {
    // Buscar dados do ticket para obter número do WhatsApp
    const ticket = await getTicketById(ticketId);
    
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${ticket.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: ticket.whatsappNumber,
        text: message
      })
    });

    const result = await response.json();
    console.log('✅ Message sent to WhatsApp:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending to WhatsApp:', error);
    throw error;
  }
};

// 📥 WEBHOOK PARA RECEBER MENSAGENS DA EVOLUTION API
app.post('/webhook/evolution', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    switch (event) {
      case 'messages.upsert':
        await handleIncomingMessage(data);
        break;
        
      case 'messages.update':
        await handleMessageStatusUpdate(data);
        break;
        
      default:
        console.log('🔄 Unhandled webhook event:', event);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📨 Processar mensagem recebida do WhatsApp
const handleIncomingMessage = async (messageData) => {
  try {
    const message = messageData.messages[0];
    
    if (message.key.fromMe) return; // Ignorar mensagens enviadas pelo bot
    
    // Encontrar ticket pelo número do WhatsApp
    const ticketId = await findTicketByWhatsAppNumber(message.key.remoteJid);
    
    if (!ticketId) {
      console.log('🔍 No ticket found for WhatsApp number:', message.key.remoteJid);
      return;
    }
    
    // Salvar mensagem no banco
    const savedMessage = await saveMessage({
      ticketId,
      content: message.message?.conversation || message.message?.extendedTextMessage?.text || '[Mídia]',
      senderId: message.key.remoteJid,
      senderName: message.pushName || 'Cliente',
      senderType: 'client',
      isInternal: false,
      timestamp: new Date(message.messageTimestamp * 1000),
      whatsappMessageId: message.key.id
    });
    
    // 📡 Broadcast para todos os agentes conectados ao ticket
    io.to(`ticket_${ticketId}`).emit('new_message', savedMessage);
    
    console.log('📨 New WhatsApp message processed for ticket:', ticketId);
  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
  }
};

// 📊 Atualizar status da mensagem (entregue/lido)
const handleMessageStatusUpdate = async (statusData) => {
  try {
    const updates = statusData.messages;
    
    for (const update of updates) {
      const messageId = update.key.id;
      const status = update.status; // 'DELIVERED', 'READ', etc.
      
      // Atualizar no banco de dados
      await updateMessageStatus(messageId, status);
      
      // Encontrar ticket e notificar via WebSocket
      const ticket = await findTicketByWhatsAppMessageId(messageId);
      if (ticket) {
        io.to(`ticket_${ticket.id}`).emit('message_status_update', {
          messageId,
          status: status.toLowerCase()
        });
      }
    }
  } catch (error) {
    console.error('❌ Error updating message status:', error);
  }
};

// 🗃️ FUNÇÕES DO BANCO DE DADOS (implementar conforme sua estrutura)
const saveMessage = async (messageData) => {
  // Implementar salvamento no seu banco de dados
  // Retornar a mensagem salva com ID
};

const getTicketMessages = async (ticketId) => {
  // Implementar busca de mensagens do ticket
  // Retornar array de mensagens ordenadas por timestamp
};

const getTicketById = async (ticketId) => {
  // Implementar busca do ticket
};

const findTicketByWhatsAppNumber = async (whatsappNumber) => {
  // Implementar busca de ticket pelo número do WhatsApp
};

const updateMessageStatus = async (messageId, status) => {
  // Implementar atualização do status da mensagem
};

// 🚀 INICIALIZAR SERVIDOR
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

// 📋 EXEMPLO DE RESPOSTAS RÁPIDAS
app.get('/api/canned-responses', (req, res) => {
  res.json([
    {
      id: '1',
      title: 'Saudação Inicial',
      content: 'Olá! Como posso ajudá-lo hoje?',
      category: 'Saudações'
    },
    {
      id: '2',
      title: 'Aguardar Retorno',
      content: 'Obrigado pelo contato. Vou verificar sua solicitação e retorno em breve.',
      category: 'Padrões'
    },
    {
      id: '3',
      title: 'Finalizar Atendimento',
      content: 'Foi um prazer ajudá-lo! Se precisar de mais alguma coisa, estarei aqui.',
      category: 'Finalização'
    }
  ]);
});

module.exports = { app, server, io }; 