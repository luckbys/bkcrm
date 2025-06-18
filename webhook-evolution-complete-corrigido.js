import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import axios from 'axios';

// CONFIGURAÇÕES DO SERVIDOR
const app = express();
app.use(express.json());
app.use(cors());

// CONFIGURAÇÕES DO SUPABASE
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NzI4MDAsImV4cCI6MjAyNDU0ODgwMH0.OuXzKuYAGxnlT8kGgpVRjWLZGEo_eDhPjXGHLLrHUWE';
const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURAÇÕES DA EVOLUTION API
const evolutionApiUrl = 'https://press-evolution-api.jhkbgs.easypanel.host';
const evolutionApiKey = 'press@2024';

// FUNÇÃO PRINCIPAL PARA SALVAR MENSAGENS
// FUNÇÃO PRINCIPAL PARA SALVAR MENSAGENS (VERSÃO ÚNICA)
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
    if (!data.ticketId || !uuidRegex.test(data.ticketId)) {
      console.error('❌ UUID do ticket inválido:', data.ticketId);
      
      // Gerar UUID válido como fallback
      const validTicketId = crypto.randomUUID();
      console.log('🔄 Usando UUID válido como fallback:', validTicketId);
      data.ticketId = validTicketId;
    }

    // PREPARAR DADOS ENRIQUECIDOS PARA MENSAGEM
    const enhancedMessageMetadata = {
      // Dados básicos
      whatsapp_phone: data.senderPhone,
      sender_name: data.senderName,
      instance_name: data.instanceName,
      message_id: data.messageId,
      timestamp: data.timestamp,
      source: data.enhanced ? 'webhook_enhanced' : 'webhook',
      
      // Dados enriquecidos (se disponíveis)
      ...(data.enhanced && {
        phone_formatted: data.senderPhoneFormatted,
        whatsapp_jid: data.whatsappJid,
        client_data: data.clientData,
        phone_info: data.phoneInfo,
        can_reply: true,
        reply_ready: true,
        enhanced_processing: true
      }),
      
      // Flag de fallback se UUID foi corrigido
      ...(data.ticketId !== data.originalTicketId && {
        ticket_id_fallback: true,
        original_ticket_id: data.originalTicketId
      })
    };

    const messageData = {
      ticket_id: data.ticketId,
      content: data.content,
      sender_id: null, // Cliente anônimo
      sender_type: 'customer',
      message_type: 'text',
      metadata: enhancedMessageMetadata,
      created_at: data.timestamp
    };
    
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

// FUNÇÃO PARA PROCESSAR NOVAS MENSAGENS
async function processNewMessage(payload) {
  try {
    const timestamp = new Date().toISOString();
    console.log('📨 Processando nova mensagem:', {
      instance: payload.instance,
      timestamp
    });

    // Extrair dados do remetente
    const senderPhone = extractPhoneFromJid(payload.data.key.remoteJid);
    const senderName = payload.data.pushName || `Cliente ${senderPhone.slice(-4)}`;
    
    // Extrair conteúdo da mensagem
    const messageContent = extractMessageContent(payload.data.message);
    
    if (!messageContent) {
      console.log('⚠️ Mensagem sem conteúdo, ignorando...');
      return { success: false, message: 'Mensagem sem conteúdo' };
    }

    // Preparar dados do cliente
    const clientInfo = prepareClientData(
      extractAndNormalizePhone(payload.data.key.remoteJid, payload.data.pushName),
      payload.data,
      payload.instance
    );

    // Buscar ou criar cliente
    const { id: customerId, isNew } = await findOrCreateCustomerEnhanced(clientInfo);
    console.log(`${isNew ? '🆕' : '✅'} [CLIENTE] ${isNew ? 'Criado' : 'Encontrado'} via RPC:`, customerId);

    // Buscar ticket existente ou criar novo
    const ticketInfo = {
      clientName: clientInfo.name,
      clientPhone: clientInfo.phone,
      customerId,
      messageContent,
      instanceName: payload.instance,
      enhanced: true,
      clientData: clientInfo
    };

    const ticket = await createTicketAutomaticallyEnhanced(ticketInfo);
    console.log('✅ [TICKET] Ticket criado/atualizado:', ticket.id);

    // Salvar mensagem no banco
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
      phoneInfo: clientInfo
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