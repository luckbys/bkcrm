import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Carregar configurações
dotenv.config({ path: './webhook.env' });

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;
const BASE_URL = process.env.BASE_URL || 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Endpoint principal para webhook Evolution API
app.post('/webhook/evolution', async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      dataKeys: Object.keys(payload.data || {})
    });

    let result = { success: false, message: 'Evento não processado' };

    // Processar diferentes tipos de eventos
    if (payload.event) {
      switch (payload.event) {
        case 'MESSAGES_UPSERT':
          result = await processNewMessage(payload);
          break;
        
        case 'QRCODE_UPDATED':
          result = await processQRCodeUpdate(payload);
          break;
        
        case 'CONNECTION_UPDATE':
          result = await processConnectionUpdate(payload);
          break;
        
        case 'SEND_MESSAGE':
          result = await processSentMessage(payload);
          break;
        
        default:
          console.log(`📋 Evento não processado: ${payload.event}`);
          result = { success: true, message: `Evento ${payload.event} recebido` };
      }
    }

    // Resposta de sucesso
    res.status(200).json({ 
      received: true, 
      timestamp,
      event: payload.event || 'unknown',
      instance: payload.instance,
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId
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

// Função para processar mensagens recebidas
async function processNewMessage(payload) {
  try {
    const messageData = payload.data;
    const instanceName = payload.instance;
    
    // Verificar se é uma mensagem válida
    if (!messageData || !messageData.key) {
      console.warn('⚠️ Dados de mensagem inválidos');
      return { success: false, message: 'Dados inválidos' };
    }

    // Processar apenas mensagens de clientes (não enviadas por nós)
    if (messageData.key.fromMe) {
      console.log('📤 Mensagem enviada por nós, ignorando');
      return { success: true, message: 'Mensagem própria ignorada' };
    }

    // Extrair informações da mensagem
    const clientPhone = extractPhoneFromJid(messageData.key.remoteJid);
    const messageContent = extractMessageContent(messageData.message);
    const senderName = messageData.pushName || `Cliente ${clientPhone.slice(-4)}`;
    
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

    // Buscar instância Evolution no banco
    const { data: evolutionInstance, error: instanceError } = await supabase
      .from('evolution_instances')
      .select('id, department_id, instance_name')
      .eq('instance_name', instanceName)
      .eq('status', 'active')
      .single();

    if (instanceError || !evolutionInstance) {
      console.error('❌ Instância Evolution não encontrada:', instanceName);
      return { success: false, message: 'Instância não encontrada' };
    }

    // Buscar ticket existente ou criar novo
    let ticketId = await findExistingTicket(clientPhone, evolutionInstance.department_id);
    
    if (!ticketId) {
      ticketId = await createTicketAutomatically({
        clientName: senderName,
        clientPhone: clientPhone,
        instanceName: instanceName,
        departmentId: evolutionInstance.department_id,
        firstMessage: messageContent
      });
    }

    if (!ticketId) {
      console.error('❌ Não foi possível criar ou encontrar ticket');
      return { success: false, message: 'Erro ao criar ticket' };
    }

    // Salvar mensagem no banco
    const saveResult = await saveMessageToDatabase({
      ticketId,
      content: messageContent,
      senderName,
      senderPhone: clientPhone,
      instanceName,
      messageId: messageData.key.id,
      timestamp: new Date(messageData.messageTimestamp * 1000).toISOString()
    });

    if (saveResult.success) {
      console.log('✅ Mensagem processada com sucesso');
      return {
        success: true,
        message: 'Mensagem processada e ticket atualizado',
        ticketId
      };
    } else {
      return { success: false, message: 'Erro ao salvar mensagem' };
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// Função para buscar ticket existente
async function findExistingTicket(clientPhone, departmentId) {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('metadata->>client_phone', clientPhone)
      .eq('department_id', departmentId)
      .in('status', ['pendente', 'atendimento'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar ticket:', error);
      return null;
    }

    return tickets?.[0]?.id || null;
  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    return null;
  }
}

// Função para criar ticket automaticamente
async function createTicketAutomatically(data) {
  try {
    console.log('🎫 Criando ticket automaticamente:', {
      client: data.clientName,
      phone: data.clientPhone,
      department: data.departmentId
    });

    const ticketData = {
      title: `WhatsApp - ${data.clientName}`,
      subject: `Conversa via WhatsApp - ${data.clientPhone}`,
      description: `Ticket criado automaticamente a partir de mensagem recebida no WhatsApp.\n\nPrimeira mensagem: "${data.firstMessage}"`,
      status: 'pendente',
      priority: 'normal',
      channel: 'chat',
      department_id: data.departmentId,
      metadata: {
        client_name: data.clientName,
        client_phone: data.clientPhone,
        evolution_instance_name: data.instanceName,
        auto_created: true,
        created_from_whatsapp: true,
        anonymous_contact: data.clientName
      },
      unread: true,
      tags: ['whatsapp', 'auto-created'],
      is_internal: false,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      return null;
    }

    console.log('✅ Ticket criado automaticamente:', ticket.id);
    return ticket.id;

  } catch (error) {
    console.error('❌ Erro ao criar ticket:', error);
    return null;
  }
}

// Função para salvar mensagem no banco
async function saveMessageToDatabase(data) {
  try {
    const messageData = {
      ticket_id: data.ticketId,
      content: data.content,
      sender_name: data.senderName,
      type: 'text',
      is_internal: false,
      is_read: false,
      metadata: {
        evolution_instance: data.instanceName,
        evolution_message_id: data.messageId,
        sender_phone: data.senderPhone,
        is_from_whatsapp: true
      },
      created_at: data.timestamp
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert([messageData]);

    if (messageError) {
      console.error('❌ Erro ao salvar mensagem:', messageError);
      return { success: false, error: messageError };
    }

    // Atualizar timestamp do ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ 
        last_message_at: data.timestamp,
        unread: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.ticketId);

    if (updateError) {
      console.error('❌ Erro ao atualizar ticket:', updateError);
    }

    console.log('✅ Mensagem salva no banco de dados');
    return { success: true };

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    return { success: false, error };
  }
}

// Função para processar QR Code atualizado
async function processQRCodeUpdate(payload) {
  try {
    console.log(`📱 QR Code atualizado - Instância: ${payload.instance}`);
    
    // Atualizar status da instância no banco
    const { error } = await supabase
      .from('evolution_instances')
      .update({ 
        qr_code: payload.data.qrcode,
        status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', payload.instance);

    if (error) {
      console.error('❌ Erro ao atualizar QR Code:', error);
    }

    return {
      success: true,
      message: 'QR Code atualizado',
      qrcode: payload.data.qrcode
    };

  } catch (error) {
    console.error('❌ Erro ao processar QR Code:', error);
    return { success: false, message: error.message };
  }
}

// Função para processar atualizações de conexão
async function processConnectionUpdate(payload) {
  try {
    const connectionState = payload.data.state;
    console.log(`🔗 Status de conexão: ${payload.instance} -> ${connectionState}`);
    
    // Mapear estado para status do banco
    let status = 'disconnected';
    if (connectionState === 'open') status = 'connected';
    else if (connectionState === 'connecting') status = 'connecting';
    else if (connectionState === 'close') status = 'disconnected';

    // Atualizar status da instância no banco
    const { error } = await supabase
      .from('evolution_instances')
      .update({ 
        status: status,
        connection_state: connectionState,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', payload.instance);

    if (error) {
      console.error('❌ Erro ao atualizar status de conexão:', error);
    }

    return {
      success: true,
      message: `Status atualizado para ${status}`,
      state: connectionState
    };

  } catch (error) {
    console.error('❌ Erro ao processar conexão:', error);
    return { success: false, message: error.message };
  }
}

// Função para processar mensagens enviadas
async function processSentMessage(payload) {
  try {
    console.log('📤 Mensagem enviada confirmada:', {
      instance: payload.instance,
      to: payload.data.key?.remoteJid
    });

    return {
      success: true,
      message: 'Mensagem enviada processada'
    };

  } catch (error) {
    console.error('❌ Erro ao processar mensagem enviada:', error);
    return { success: false, message: error.message };
  }
}

// Funções auxiliares
function extractPhoneFromJid(jid) {
  if (!jid) return null;
  
  // Remover sufixos do WhatsApp
  const cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  
  // Verificar se é um número válido
  if (!/^\d+$/.test(cleanJid)) return null;
  
  return cleanJid;
}

function extractMessageContent(message) {
  if (!message) return null;
  
  // Tentar diferentes tipos de mensagem
  if (message.conversation) {
    return message.conversation;
  }
  
  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }
  
  if (message.imageMessage?.caption) {
    return message.imageMessage.caption || '[Imagem]';
  }
  
  if (message.videoMessage?.caption) {
    return message.videoMessage.caption || '[Vídeo]';
  }
  
  if (message.documentMessage?.caption) {
    return message.documentMessage.caption || '[Documento]';
  }
  
  if (message.audioMessage) {
    return '[Áudio]';
  }
  
  if (message.stickerMessage) {
    return '[Sticker]';
  }
  
  if (message.locationMessage) {
    return '[Localização]';
  }
  
  return null;
}

// Endpoints auxiliares
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Evolution Webhook Integration',
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: `${BASE_URL}/webhook/evolution`,
      health: `${BASE_URL}/health`,
      test: `${BASE_URL}/test`
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Evolution Webhook Integration',
    supabase: supabaseUrl,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de teste
app.post('/test', async (req, res) => {
  console.log('🧪 Teste de webhook:', req.body);
  
  // Simular processamento de mensagem
  if (req.body.simulate) {
    try {
      const result = await processNewMessage({
        event: 'MESSAGES_UPSERT',
        instance: req.body.instance || 'test-instance',
        data: {
          key: {
            remoteJid: `${req.body.phone || '5511999999999'}@s.whatsapp.net`,
            fromMe: false,
            id: `test_${Date.now()}`
          },
          message: {
            conversation: req.body.message || 'Mensagem de teste'
          },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: req.body.name || 'Cliente Teste'
        }
      });
      
      res.json({ 
        message: 'Teste executado com sucesso!',
        result
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erro no teste',
        details: error.message
      });
    }
  } else {
    res.json({ 
      message: 'Teste recebido com sucesso!',
      timestamp: new Date().toISOString(),
      body: req.body
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Evolution Webhook Integration rodando na porta ${PORT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📡 Webhook URL: ${BASE_URL}/webhook/evolution`);
  console.log(`🗄️ Supabase: ${supabaseUrl}`);
  console.log(`🏥 Health check: ${BASE_URL}/health`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
}); 