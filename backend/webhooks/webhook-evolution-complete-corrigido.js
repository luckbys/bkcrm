const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurar Express
const app = express();
const router = express.Router();
app.use(express.json());
app.use(cors());

// Configurações
const PORT = 4000;
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const BASE_URL = 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Função para buscar ou criar cliente
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
      console.log(`✅ Cliente encontrado: ${existingCustomer.full_name} (${existingCustomer.id})`);
      return existingCustomer.id;
    }

    // Criar novo cliente
    console.log(`➕ Criando novo cliente para ${phone}`);
    const customerData = {
      id: crypto.randomUUID(),
      full_name: pushName || `Cliente WhatsApp ${phone.slice(-4)}`,
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

    console.log(`✅ Cliente criado: ${newCustomer.full_name} (${newCustomer.id})`);
    return newCustomer.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateCustomer:', error);
    return null;
  }
}

// Função para buscar ou criar ticket
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
      return ticket.id;
    }

    // Criar novo ticket
    console.log(`➕ Criando novo ticket para cliente ${customerId}`);
    const ticketData = {
      id: crypto.randomUUID(),
      title: `Atendimento WhatsApp - ${phone}`,
      description: `Conversa iniciada via WhatsApp na instância ${instanceName}`,
      status: 'open',
      priority: 'medium',
      customer_id: customerId,
      channel: 'whatsapp',
      metadata: {
        whatsapp_phone: phone,
        instance_name: instanceName,
        created_via: 'webhook_evolution',
        is_whatsapp: true
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

    console.log(`✅ Ticket criado: ${newTicket.id}`);
    return newTicket.id;

  } catch (error) {
    console.error('❌ Erro em findOrCreateTicket:', error);
    return null;
  }
}

// Função para salvar mensagem
async function saveMessage(ticketId, messageData, instanceName) {
  try {
    console.log(`💬 Salvando mensagem para ticket: ${ticketId}`);
    
    const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || 'unknown';
    const isFromMe = messageData.key?.fromMe || false;
    
    // Extrair conteúdo da mensagem
    let content = '[Mensagem não suportada]';
    let messageType = 'text';
    
    if (messageData.message?.conversation) {
      content = messageData.message.conversation;
      messageType = 'text';
    } else if (messageData.message?.extendedTextMessage?.text) {
      content = messageData.message.extendedTextMessage.text;
      messageType = 'text';
    } else if (messageData.message?.imageMessage) {
      content = messageData.message.imageMessage.caption || '[Imagem]';
      messageType = 'image';
    } else if (messageData.message?.videoMessage) {
      content = messageData.message.videoMessage.caption || '[Vídeo]';
      messageType = 'video';
    } else if (messageData.message?.audioMessage) {
      content = '[Áudio]';
      messageType = 'audio';
    } else if (messageData.message?.documentMessage) {
      content = `[Documento: ${messageData.message.documentMessage.fileName || 'Arquivo'}]`;
      messageType = 'document';
    }

    const messageRecord = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      content: content,
      sender_type: isFromMe ? 'agent' : 'customer',
      message_type: messageType,
      metadata: {
        whatsapp_message_id: messageData.key?.id,
        whatsapp_phone: phone,
        instance_name: instanceName,
        push_name: messageData.pushName,
        message_timestamp: messageData.messageTimestamp,
        from_me: isFromMe,
        status: messageData.status,
        original_data: messageData
      }
    };

    const { data: savedMessage, error } = await supabase
      .from('messages')
      .insert([messageRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      return null;
    }

    console.log(`✅ Mensagem salva: ${savedMessage.id} - "${content.substring(0, 50)}..."`);
    return savedMessage.id;

  } catch (error) {
    console.error('❌ Erro em saveMessage:', error);
    return null;
  }
}

// Função principal para processar mensagem
async function processMessage(payload) {
  try {
    console.log(`🔄 Processando mensagem do evento: ${payload.event}`);
    
    const messageData = payload.data;
    const instanceName = payload.instance;
    const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const pushName = messageData.pushName;
    
    if (!phone) {
      console.log('⚠️ Telefone não encontrado, ignorando mensagem');
      return null;
    }

    console.log(`📱 Processando mensagem de: ${phone} (${pushName || 'Sem nome'})`);

    // Passo 1: Buscar/criar cliente
    const customerId = await findOrCreateCustomer(phone, instanceName, pushName);
    if (!customerId) {
      throw new Error('Falha ao criar/encontrar cliente');
    }

    // Passo 2: Buscar/criar ticket
    const ticketId = await findOrCreateTicket(customerId, phone, instanceName);
    if (!ticketId) {
      throw new Error('Falha ao criar/encontrar ticket');
    }

    // Passo 3: Salvar mensagem
    const messageId = await saveMessage(ticketId, messageData, instanceName);
    if (!messageId) {
      throw new Error('Falha ao salvar mensagem');
    }

    console.log(`✅ Mensagem processada com sucesso! Cliente: ${customerId}, Ticket: ${ticketId}, Mensagem: ${messageId}`);
    
    return {
      customerId,
      ticketId,
      messageId,
      processed: true
    };

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    throw error;
  }
}

// Rotas do webhook
router.post('/evolution/messages-upsert', async (req, res) => {
  try {
    console.log('🔔 Webhook messages-upsert recebido');
    
    const payload = {
      event: 'messages.upsert',
      instance: req.body.instance || 'unknown',
      data: req.body.data || req.body
    };

    const result = await processMessage(payload);

    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      processed: true,
      result
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook messages-upsert:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.post('/evolution', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook evolution recebido - Evento: ${payload.event}`);

    if (payload.event === 'messages.upsert') {
      const result = await processMessage(payload);
      res.status(200).json({
        received: true,
        processed: true,
        result
      });
    } else {
      console.log(`ℹ️ Evento ${payload.event} recebido mas não processado`);
      res.status(200).json({
        received: true,
        processed: false,
        message: `Evento ${payload.event} não requer processamento`
      });
    }
  } catch (error) {
    console.error('❌ Erro no webhook evolution:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

// Rota genérica para capturar todos os webhooks
router.post('/*', async (req, res) => {
  try {
    const eventPath = req.path.replace('/', '');
    const payload = req.body;
    
    console.log(`🔔 Webhook genérico recebido - Path: ${eventPath}, Evento: ${payload.event}`);

    if (payload.event === 'messages.upsert') {
      const result = await processMessage(payload);
      res.status(200).json({
        received: true,
        processed: true,
        result
      });
    } else {
      console.log(`ℹ️ Evento ${payload.event} em ${eventPath} recebido mas não processado`);
      res.status(200).json({
        received: true,
        processed: false,
        message: `Evento ${payload.event} não requer processamento`
      });
    }
  } catch (error) {
    console.error('❌ Erro no webhook genérico:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-aprimorado',
    endpoints: [
      'POST /webhook/evolution',
      'POST /webhook/evolution/messages-upsert',
      'POST /webhook/* (genérico)',
      'GET /webhook/health'
    ]
  });
});

// Montar router no path /webhook
app.use('/webhook', router);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Webhook Evolution API v2.0 rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log('   POST /webhook/evolution');
  console.log('   POST /webhook/evolution/messages-upsert');
  console.log('   POST /webhook/* (captura todos)');
  console.log('   GET  /webhook/health');
  console.log('🔧 Configurações:');
  console.log(`   📡 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`   🗄️ Supabase: ${supabaseUrl}`);
  console.log(`   🌐 Base URL: ${BASE_URL}`);
}); 