const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const axios = require('axios');

// CONFIGURAÇÕES DO SERVIDOR
const app = express();
app.use(express.json());
app.use(cors());

// CONFIGURAÇÕES DO SUPABASE
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';
const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURAÇÕES DA EVOLUTION API
const evolutionApiUrl = 'https://press-evolution-api.jhkbgs.easypanel.host';
const evolutionApiKey = 'press@2024';

// FUNÇÕES AUXILIARES
function extractPhoneFromJid(jid) {
  if (!jid) return null;
  if (jid.includes('@g.us')) return null;
  
  const cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  if (!/^\d+$/.test(cleanJid) || cleanJid.length < 10) return null;
  
  return cleanJid;
}

function extractAndNormalizePhone(jid, pushName = null) {
  try {
    if (!jid) return { phone: null, isValid: false };
    if (jid.includes('@g.us')) return { phone: null, isValid: false, format: 'group' };

    const rawPhone = jid.replace(/@[sc]\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
    
    if (!rawPhone || rawPhone.length < 10) {
      return { phone: rawPhone, isValid: false };
    }

    let formattedPhone = rawPhone;
    let country = 'unknown';
    let format = 'international';

    if (rawPhone.startsWith('55') && rawPhone.length >= 12) {
      country = 'brazil';
      const ddd = rawPhone.substring(2, 4);
      const number = rawPhone.substring(4);
      formattedPhone = number.length === 9 
        ? `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
        : `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
      format = number.length === 9 ? 'brazil_mobile' : 'brazil_landline';
    }

    return {
      phone: rawPhone,
      phoneFormatted: formattedPhone,
      isValid: true,
      format,
      country,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erro na extração de telefone:', error);
    return { phone: null, isValid: false };
  }
}

function extractMessageContent(message) {
  if (!message) return null;
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  
  // Outros tipos de mensagem podem ser implementados aqui
  return null;
}

function prepareClientData(phoneInfo, messageData, instanceName) {
  try {
    console.log('🔄 Preparando dados do cliente:', {
      phoneInfo,
      pushName: messageData.pushName,
      instance: instanceName
    });

    if (!phoneInfo || !phoneInfo.phone) {
      console.warn('⚠️ Dados de telefone inválidos');
      return null;
    }

    return {
      phone: phoneInfo.phone,
      phoneFormatted: phoneInfo.phoneFormatted || phoneInfo.phone,
      name: messageData.pushName || `Cliente ${phoneInfo.phone.slice(-4)}`,
      instanceName,
      whatsappMetadata: {
        whatsappJid: messageData.key.remoteJid,
        pushName: messageData.pushName,
        country: phoneInfo.country || 'unknown',
        phoneFormat: phoneInfo.format || 'international',
        lastSeen: new Date().toISOString()
      },
      responseData: {
        canReply: true,
        isActive: true,
        lastMessageAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Erro ao preparar dados do cliente:', error);
    return null;
  }
}

// FUNÇÕES DE BANCO DE DADOS
async function findOrCreateCustomerEnhanced(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.phone) {
      throw new Error('Dados do cliente inválidos');
    }

    // Buscar cliente existente pelo telefone
    const { data: existingCustomer } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .filter('metadata->phone', 'eq', clientInfo.phone)
      .single();

    if (existingCustomer) {
      console.log('✅ Cliente encontrado:', existingCustomer.id);
      return { id: existingCustomer.id, isNew: false };
    }

    // Criar novo cliente
    const newCustomerId = crypto.randomUUID();
    const customerData = {
      id: newCustomerId,
      role: 'customer',
      email: `whatsapp-${clientInfo.phone}@auto-generated.com`,
      name: clientInfo.name,
      metadata: {
        phone: clientInfo.phone,
        whatsapp_data: clientInfo.whatsappMetadata,
        response_data: clientInfo.responseData,
        auto_created: true,
        created_from: 'webhook_evolution'
      }
    };

    const { data: newCustomer, error } = await supabase
      .from('profiles')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }

    console.log('✅ Novo cliente criado:', newCustomer.id);
    return { id: newCustomer.id, isNew: true };

  } catch (error) {
    console.error('❌ Erro ao buscar/criar cliente:', error);
    throw error;
  }
}

async function createTicketAutomaticallyEnhanced(ticketInfo) {
  try {
    console.log('🎫 Criando ticket automaticamente:', {
      cliente: ticketInfo.clientName,
      telefone: ticketInfo.clientPhone,
      customerId: ticketInfo.customerId,
      departmentId: null,
      mensagem: ticketInfo.messageContent?.substring(0, 30) + '...',
      instancia: ticketInfo.instanceName
    });

    // Gerar UUID válido para o ticket
    const ticketId = crypto.randomUUID();
    console.log('🔑 UUID gerado para ticket:', ticketId);

    // Preparar dados do ticket
    const ticketData = {
      id: ticketId, // UUID válido
      title: `Atendimento WhatsApp - ${ticketInfo.clientName}`,
      description: ticketInfo.messageContent,
      status: 'open',
      priority: 'normal',
      channel: 'whatsapp',
      customer_id: ticketInfo.customerId,
      department_id: null, // Será atualizado depois
      nunmsg: ticketInfo.clientPhone.startsWith('+') ? ticketInfo.clientPhone : `+${ticketInfo.clientPhone}`,
      metadata: {
        client_name: ticketInfo.clientName,
        client_phone: ticketInfo.clientPhone,
        whatsapp_instance: ticketInfo.instanceName,
        is_whatsapp: true,
        auto_created: true,
        first_message: ticketInfo.messageContent,
        created_from: 'webhook_evolution',
        enhanced_ticket: ticketInfo.enhanced,
        client_data: ticketInfo.clientData
      },
      created_at: new Date().toISOString()
    };

    // Inserir ticket no banco
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw new Error(`Erro ao criar ticket: ${error.message}`);
    }

    console.log('✅ Ticket criado com sucesso:', ticket.id);
    return ticket;

  } catch (error) {
    console.error('❌ Erro ao criar ticket automaticamente:', error);
    throw error;
  }
}

async function saveMessageToDatabase(data) {
  try {
    console.log('💾 Salvando mensagem no banco:', {
      ticketId: data.ticketId,
      content: data.content.substring(0, 30) + '...',
      sender: data.senderName,
      timestamp: data.timestamp
    });

    // VALIDAR UUID DO TICKET
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let validTicketId = data.ticketId;
    
    if (!validTicketId || !uuidRegex.test(validTicketId)) {
      console.error('❌ UUID do ticket inválido:', validTicketId);
      validTicketId = crypto.randomUUID();
      console.log('🔄 Usando novo UUID válido:', validTicketId);
    }

    // Preparar metadados enriquecidos
    const enhancedMessageMetadata = {
      whatsapp_data: {
        messageId: data.messageId,
        senderPhone: data.senderPhone,
        senderPhoneFormatted: data.senderPhoneFormatted,
        whatsappJid: data.whatsappJid,
        instanceName: data.instanceName
      },
      client_data: data.clientData,
      phone_info: data.phoneInfo,
      enhanced: true,
      original_ticket_id: data.originalTicketId,
      created_from: 'webhook_evolution_enhanced'
    };

    // Dados da mensagem
    const messageData = {
      ticket_id: validTicketId,
      content: data.content,
      sender_id: null, // Será atualizado depois
      sender_type: 'customer',
      message_type: 'text',
      metadata: enhancedMessageMetadata,
      created_at: data.timestamp
    };

    // Inserir mensagem no banco
    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      
      // Se ainda der erro, tentar salvar sem ticket_id (mensagem órfã)
      if (error.code === '22P02' || error.message.includes('uuid')) {
        console.log('🔄 Tentando salvar mensagem sem ticket_id (mensagem órfã)...');
        
        const orphanMessageData = {
          content: data.content,
          sender_id: null,
          sender_type: 'customer',
          message_type: 'text',
          metadata: {
            ...enhancedMessageMetadata,
            orphan_message: true,
            original_ticket_id: data.ticketId,
            error_reason: 'invalid_ticket_uuid'
          },
          created_at: data.timestamp
        };
        
        const { data: orphanMessage, error: orphanError } = await supabase
          .from('messages')
          .insert([orphanMessageData])
          .select()
          .single();
        
        if (!orphanError) {
          console.log('✅ Mensagem órfã salva com sucesso:', orphanMessage.id);
          return {
            success: true,
            message: 'Mensagem salva como órfã (ticket UUID inválido)',
            messageId: orphanMessage.id,
            method: 'orphan'
          };
        }
      }
      
      return { 
        success: false, 
        message: `Erro ao salvar: ${error.message}`
      };
    }
    
    console.log('✅ Mensagem salva com sucesso:', message.id);
    
    return {
      success: true,
      message: 'Mensagem salva no banco',
      messageId: message.id
    };

  } catch (error) {
    console.error('❌ Erro geral ao salvar mensagem:', error);
    
    return { 
      success: false, 
      message: `Erro: ${error.message}`
    };
  }
}

// FUNÇÃO PRINCIPAL PARA PROCESSAR MENSAGENS
async function processNewMessage(payload) {
  try {
    const timestamp = new Date().toISOString();
    console.log('📨 Processando mensagem:', {
      instance: payload.instance,
      timestamp
    });

    // Extrair dados do remetente
    const senderPhone = extractPhoneFromJid(payload.data.key.remoteJid);
    if (!senderPhone) {
      console.error('❌ Telefone inválido:', payload.data.key.remoteJid);
      return { success: false, message: 'Telefone inválido' };
    }
    console.log('📱 Telefone extraído:', senderPhone);

    // Extrair conteúdo da mensagem
    const messageContent = extractMessageContent(payload.data.message);
    if (!messageContent) {
      console.log('⚠️ Mensagem sem conteúdo, ignorando...');
      return { success: false, message: 'Mensagem sem conteúdo' };
    }
    console.log('💬 Conteúdo:', messageContent.substring(0, 30) + '...');

    // Normalizar telefone
    const phoneInfo = extractAndNormalizePhone(payload.data.key.remoteJid, payload.data.pushName);
    if (!phoneInfo.isValid) {
      console.error('❌ Telefone não pôde ser normalizado:', phoneInfo);
      return { success: false, message: 'Telefone inválido' };
    }
    console.log('📱 Telefone normalizado:', phoneInfo);

    // Preparar dados do cliente
    const clientInfo = prepareClientData(phoneInfo, payload.data, payload.instance);
    if (!clientInfo) {
      console.error('❌ Erro ao preparar dados do cliente');
      return { success: false, message: 'Erro ao preparar dados do cliente' };
    }
    console.log('👤 Dados do cliente:', clientInfo);

    // Buscar ou criar cliente
    const { id: customerId, isNew } = await findOrCreateCustomerEnhanced(clientInfo);
    console.log(`${isNew ? '🆕' : '✅'} [CLIENTE] ${isNew ? 'Criado' : 'Encontrado'} via RPC:`, customerId);

    // Criar ticket
    const ticketInfo = {
      clientName: clientInfo.name,
      clientPhone: clientInfo.phone,
      customerId,
      messageContent,
      instanceName: payload.instance,
      enhanced: true,
      clientData: clientInfo
    };

    let ticket;
    try {
      ticket = await createTicketAutomaticallyEnhanced(ticketInfo);
      console.log('✅ [TICKET] Ticket criado:', ticket.id);
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      // Gerar UUID válido como fallback
      const fallbackTicketId = crypto.randomUUID();
      console.log('🔄 Usando UUID válido como fallback:', fallbackTicketId);
      
      // Tentar criar ticket com UUID válido
      try {
        const fallbackTicketData = {
          id: fallbackTicketId,
          title: `Atendimento WhatsApp - ${clientInfo.name} (Fallback)`,
          description: messageContent,
          status: 'open',
          priority: 'normal',
          channel: 'whatsapp',
          customer_id: customerId,
          metadata: {
            client_name: clientInfo.name,
            client_phone: clientInfo.phone,
            whatsapp_instance: payload.instance,
            is_whatsapp: true,
            auto_created: true,
            is_fallback: true,
            first_message: messageContent,
            created_from: 'webhook_evolution_fallback',
            error_original: error.message
          }
        };

        const { data: fallbackTicket, error: fallbackError } = await supabase
          .from('tickets')
          .insert([fallbackTicketData])
          .select()
          .single();

        if (fallbackError) {
          console.error('❌ Erro ao criar ticket fallback:', fallbackError);
          ticket = { id: fallbackTicketId, isFallback: true };
        } else {
          console.log('✅ [TICKET] Ticket fallback criado:', fallbackTicket.id);
          ticket = fallbackTicket;
        }
      } catch (fallbackError) {
        console.error('❌ Erro ao criar ticket fallback:', fallbackError);
        ticket = { id: fallbackTicketId, isFallback: true };
      }
    }

    // Validar UUID do ticket antes de salvar mensagem
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!ticket.id || !uuidRegex.test(ticket.id)) {
      console.error('❌ UUID do ticket inválido após todas as tentativas');
      const lastResortTicketId = crypto.randomUUID();
      console.log('🔄 Usando UUID last resort:', lastResortTicketId);
      ticket.id = lastResortTicketId;
    }

    // Salvar mensagem
    const messageData = {
      ticketId: ticket.id,
      content: messageContent,
      senderName: clientInfo.name,
      senderPhone: clientInfo.phone,
      messageId: payload.data.key.id,
      timestamp,
      instanceName: payload.instance,
      enhanced: true,
      senderPhoneFormatted: clientInfo.phoneFormatted,
      whatsappJid: payload.data.key.remoteJid,
      clientData: clientInfo,
      phoneInfo: clientInfo,
      originalTicketId: ticket.id
    };

    const saveResult = await saveMessageToDatabase(messageData);
    if (!saveResult.success) {
      console.error('❌ Erro ao salvar mensagem:', saveResult.message);
      return { success: false, message: saveResult.message };
    }

    console.log('✅ Mensagem processada com sucesso');
    return {
      success: true,
      message: 'Mensagem processada com sucesso',
      ticketId: ticket.id,
      messageId: saveResult.messageId
    };

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// ROTAS DO WEBHOOK
app.get('/webhook/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-corrigido'
  });
});

app.post('/webhook/evolution', async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance
    });

    let result = { success: false, message: 'Evento não processado' };

    if (payload.event === 'MESSAGES_UPSERT') {
      result = await processNewMessage(payload);
    }

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

// INICIAR SERVIDOR
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('🔧 Carregando configurações das variáveis de ambiente...');
  console.log('🚀 Configurações Evolution API:');
  console.log('📡 URL:', evolutionApiUrl);
  console.log('🔑 API Key:', evolutionApiKey ? '***configurada***' : '***não configurada***');
  
  console.log(`🚀 Evolution Webhook Integration CORRIGIDO rodando na porta ${PORT}`);
  console.log('🌐 Base URL:', process.env.BASE_URL || 'http://localhost:4000');
  console.log('📡 Webhook URL:', process.env.WEBHOOK_URL || `http://localhost:${PORT}/webhook/evolution`);
  console.log('🗄️ Supabase:', supabaseUrl);
  console.log('🏥 Health check:', `http://localhost:${PORT}/webhook/health`);
}); 