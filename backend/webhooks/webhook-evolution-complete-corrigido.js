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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';
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
      
      // 📞 ATUALIZAR TELEFONE NO TICKET EXISTENTE (incluindo campo nunmsg)
      const phoneFormatted = phone.startsWith('+') ? phone : `+${phone}`;
      const updateData = {
        nunmsg: phoneFormatted, // 📱 CAMPO PRINCIPAL PARA NÚMERO DA MENSAGEM
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
      
      console.log(`📱 Vinculando telefone ${phoneFormatted} ao ticket existente ${ticket.id} no campo nunmsg`);
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);
        
      if (updateError) {
        console.error('⚠️ Erro ao atualizar telefone no ticket:', updateError);
      } else {
        console.log(`✅ Telefone vinculado automaticamente ao ticket no campo nunmsg: ${phoneFormatted}`);
      }
      
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
      nunmsg: phoneFormatted, // 📱 CAMPO PRINCIPAL PARA NÚMERO DA MENSAGEM
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
    
    // Se erro for relacionado a coluna inexistente, tentar sem os campos extras
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('⚠️ Tentando criar ticket sem campos extras (compatibilidade)...');
      
      const basicTicketData = {
        id: crypto.randomUUID(),
        title: `Atendimento WhatsApp - ${phoneFormatted}`,
        description: `Conversa iniciada via WhatsApp na instância ${instanceName}`,
        status: 'open',
        priority: 'medium',
        customer_id: customerId,
        channel: 'whatsapp',
        nunmsg: phoneFormatted, // 📱 CAMPO PRINCIPAL PARA NÚMERO DA MENSAGEM (sempre incluir)
        metadata: {
          whatsapp_phone: phoneFormatted,
          client_phone: phoneFormatted,
          instance_name: instanceName,
          created_via: 'webhook_evolution',
          is_whatsapp: true,
          phone_captured_at: new Date().toISOString()
        }
      };
      
      try {
        const { data: basicTicket, error: basicError } = await supabase
          .from('tickets')
          .insert([basicTicketData])
          .select()
          .single();
          
        if (basicError) {
          console.error('❌ Erro mesmo com dados básicos:', basicError);
          return null;
        }
        
        console.log(`✅ Ticket básico criado: ${basicTicket.id} com telefone no campo nunmsg`);
        return basicTicket.id;
        
      } catch (basicErr) {
        console.error('❌ Erro crítico na criação de ticket:', basicErr);
        return null;
      }
    }
    
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

// Rotas específicas para eventos conhecidos da Evolution API
router.post('/messages-upsert', async (req, res) => {
  try {
    console.log('🔔 Webhook messages-upsert (endpoint direto) recebido');
    
    const payload = {
      event: 'messages.upsert',
      instance: req.body.instance || 'unknown',
      data: req.body.data || req.body
    };

    const result = await processMessage(payload);

    res.status(200).json({
      received: true,
      processed: true,
      result
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook messages-upsert direto:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.post('/contacts-update', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook contacts-update recebido`);
    
    // Apenas loggar e responder positivamente (não processamos contatos)
    res.status(200).json({
      received: true,
      processed: false,
      message: 'Evento contacts-update não requer processamento'
    });
  } catch (error) {
    console.error('❌ Erro no webhook contacts-update:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.post('/messages-update', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook messages-update recebido`);
    
    // Apenas loggar e responder positivamente (não processamos updates de mensagem)
    res.status(200).json({
      received: true,
      processed: false,
      message: 'Evento messages-update não requer processamento'
    });
  } catch (error) {
    console.error('❌ Erro no webhook messages-update:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.post('/chats-upsert', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook chats-upsert recebido`);
    
    // Apenas loggar e responder positivamente (não processamos chats)
    res.status(200).json({
      received: true,
      processed: false,
      message: 'Evento chats-upsert não requer processamento'
    });
  } catch (error) {
    console.error('❌ Erro no webhook chats-upsert:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

router.post('/chats-update', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook chats-update recebido`);
    
    // Apenas loggar e responder positivamente (não processamos updates de chat)
    res.status(200).json({
      received: true,
      processed: false,
      message: 'Evento chats-update não requer processamento'
    });
  } catch (error) {
    console.error('❌ Erro no webhook chats-update:', error);
    res.status(500).json({ 
      error: error.message,
      received: true,
      processed: false 
    });
  }
});

// === ENDPOINT DE ENVIO DE MENSAGENS ===
// Endpoint para enviar mensagens do TK para WhatsApp
router.post('/send-message', async (req, res) => {
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
        status: responseData.status,
        timestamp: responseData.messageTimestamp
      });

      res.status(200).json({
        success: true,
        messageId: responseData.key?.id,
        status: responseData.status,
        data: responseData,
        sent: true
      });
    } else {
      console.error('❌ [ENVIO] Erro da Evolution API:', {
        status: evolutionResponse.status,
        error: responseData
      });

      res.status(evolutionResponse.status).json({
        success: false,
        error: responseData.message || 'Erro ao enviar mensagem',
        details: responseData,
        sent: false
      });
    }

  } catch (error) {
    console.error('❌ [ENVIO] Erro no endpoint send-message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      sent: false
    });
  }
});

// === ENDPOINT DE RESPOSTA A MENSAGEM ===
// Endpoint para responder a uma mensagem específica
router.post('/reply-message', async (req, res) => {
  try {
    const { phone, text, instance = 'atendimento-ao-cliente-suporte', quotedMessage, options = {} } = req.body;

    console.log('💬 [REPLY] Recebida solicitação de resposta:', {
      phone: phone,
      text: text?.substring(0, 50) + '...',
      instance: instance,
      hasQuoted: !!quotedMessage
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
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) {
      formattedPhone = '55' + formattedPhone;
    }

    // Payload com citação
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

    // Adicionar citação se fornecida
    if (quotedMessage) {
      payload.options.quoted = {
        key: {
          remoteJid: quotedMessage.remoteJid || `${formattedPhone}@s.whatsapp.net`,
          fromMe: quotedMessage.fromMe || false,
          id: quotedMessage.id,
          participant: quotedMessage.participant
        },
        message: {
          conversation: quotedMessage.text || quotedMessage.conversation
        }
      };
    }

    console.log('🚀 [REPLY] Enviando resposta via Evolution API...');

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
      console.log('✅ [REPLY] Resposta enviada com sucesso:', responseData.key?.id);

      res.status(200).json({
        success: true,
        messageId: responseData.key?.id,
        status: responseData.status,
        data: responseData,
        sent: true
      });
    } else {
      console.error('❌ [REPLY] Erro da Evolution API:', responseData);

      res.status(evolutionResponse.status).json({
        success: false,
        error: responseData.message || 'Erro ao enviar resposta',
        details: responseData,
        sent: false
      });
    }

  } catch (error) {
    console.error('❌ [REPLY] Erro no endpoint reply-message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      sent: false
    });
  }
});

// === ENDPOINT DE VERIFICAÇÃO DE INSTÂNCIA ===
// Endpoint para verificar status da instância padrão
router.get('/check-instance', async (req, res) => {
  try {
    const instanceName = 'atendimento-ao-cliente-suporte';
    
    console.log(`🔍 [CHECK] Verificando instância padrão: ${instanceName}`);

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ [CHECK] Status da instância ${instanceName}:`, data.instance?.state);
      
      res.status(200).json({
        success: true,
        instance: instanceName,
        state: data.instance?.state,
        connected: data.instance?.state === 'open',
        data: data
      });
    } else {
      console.error(`❌ [CHECK] Erro ao verificar instância ${instanceName}:`, data);
      
      res.status(response.status).json({
        success: false,
        error: data.message || 'Erro ao verificar instância',
        instance: instanceName,
        connected: false
      });
    }

  } catch (error) {
    console.error('❌ [CHECK] Erro no endpoint check-instance:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      connected: false
    });
  }
});

// Endpoint para verificar status de instância específica
router.get('/check-instance/:instanceName', async (req, res) => {
  try {
    const instanceName = req.params.instanceName;
    
    console.log(`🔍 [CHECK] Verificando instância: ${instanceName}`);

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ [CHECK] Status da instância ${instanceName}:`, data.instance?.state);
      
      res.status(200).json({
        success: true,
        instance: instanceName,
        state: data.instance?.state,
        connected: data.instance?.state === 'open',
        data: data
      });
    } else {
      console.error(`❌ [CHECK] Erro ao verificar instância ${instanceName}:`, data);
      
      res.status(response.status).json({
        success: false,
        error: data.message || 'Erro ao verificar instância',
        instance: instanceName,
        connected: false
      });
    }

  } catch (error) {
    console.error('❌ [CHECK] Erro no endpoint check-instance:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      connected: false
    });
  }
});

// === ENDPOINT DE TESTE DE ENVIO ===
// Endpoint para testar envio de mensagem
router.post('/test-send', async (req, res) => {
  try {
    const { phone, instance = 'atendimento-ao-cliente-suporte' } = req.body;
    
    const testMessage = `🧪 TESTE AUTOMÁTICO - ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(`🧪 [TEST] Testando envio para ${phone} via ${instance}`);

    const result = await fetch(`http://localhost:${PORT}/webhook/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        text: testMessage,
        instance: instance
      })
    });

    const data = await result.json();

    res.status(result.status).json({
      test: true,
      timestamp: new Date().toISOString(),
      result: data
    });

  } catch (error) {
    console.error('❌ [TEST] Erro no endpoint test-send:', error);
    res.status(500).json({
      test: true,
      error: error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.2.0-envio-habilitado',
    endpoints: [
      'POST /webhook/evolution',
      'POST /webhook/evolution/messages-upsert',
      'POST /webhook/messages-upsert',
      'POST /webhook/contacts-update',
      'POST /webhook/messages-update',
      'POST /webhook/chats-upsert',
      'POST /webhook/chats-update',
      'POST /webhook/send-message',
      'POST /webhook/reply-message',
      'POST /webhook/test-send',
      'GET /webhook/check-instance',
      'GET /webhook/check-instance/:instanceName',
      'GET /webhook/health'
    ]
  });
});

// Montar router no path /webhook
app.use('/webhook', router);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Webhook Evolution API v2.2 - ENVIO HABILITADO - rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log('   📥 RECEBER MENSAGENS:');
  console.log('      POST /webhook/evolution');
  console.log('      POST /webhook/evolution/messages-upsert');
  console.log('      POST /webhook/messages-upsert');
  console.log('      POST /webhook/contacts-update');
  console.log('      POST /webhook/messages-update');
  console.log('      POST /webhook/chats-upsert');
  console.log('      POST /webhook/chats-update');
  console.log('   📤 ENVIAR MENSAGENS:');
  console.log('      POST /webhook/send-message');
  console.log('      POST /webhook/reply-message');
  console.log('      POST /webhook/test-send');
  console.log('   🔧 UTILITÁRIOS:');
  console.log('      GET  /webhook/check-instance/:instanceName?');
  console.log('      GET  /webhook/health');
  console.log('🔧 Configurações:');
  console.log(`   📡 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`   🗄️ Supabase: ${supabaseUrl}`);
  console.log(`   🌐 Base URL: ${BASE_URL}`);
  console.log('');
  console.log('✅ Sistema bidirecional ativo: RECEBER ↔️ ENVIAR mensagens WhatsApp');
}); 