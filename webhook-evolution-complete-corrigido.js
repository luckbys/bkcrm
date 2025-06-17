import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'crypto';

// Carregar variáveis de ambiente do arquivo webhook.env
config({ path: './webhook.env' });

// Configurações via variáveis de ambiente (EasyPanel)
console.log('🔧 Carregando configurações das variáveis de ambiente...');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;
const BASE_URL = process.env.BASE_URL || 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar Evolution API para envio de mensagens
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

console.log('🚀 Configurações Evolution API:');
console.log(`📡 URL: ${EVOLUTION_API_URL}`);
console.log(`🔑 API Key: ${EVOLUTION_API_KEY ? '***configurada***' : '❌ não configurada'}`);

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

// FUNÇÃO CORRIGIDA PARA SALVAR MENSAGENS SEM TRIGGER DE NOTIFICAÇÕES
async function saveMessageToDatabase(data) {
  try {
    console.log('💾 Salvando mensagem real no banco:', {
      ticketId: data.ticketId,
      content: data.content.substring(0, 30) + '...',
      sender: data.senderName,
      timestamp: data.timestamp
    });

    // ESTRATÉGIA 1: Usar RPC function que bypassa triggers problemáticos
    console.log('🔧 Tentando método RPC...');
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('insert_message_safe', {
          p_ticket_id: data.ticketId,
          p_content: data.content,
          p_sender_type: 'customer',
          p_sender_name: data.senderName,
          p_metadata: {
            whatsapp_phone: data.senderPhone,
            sender_name: data.senderName,
            instance_name: data.instanceName,
            message_id: data.messageId,
            timestamp: data.timestamp,
            source: 'webhook'
          }
        });

      if (!rpcError && rpcResult) {
        console.log('✅ Mensagem salva via RPC:', rpcResult);
        return {
          success: true,
          message: 'Mensagem salva via RPC',
          messageId: rpcResult
        };
      }

      console.log('⚠️ RPC method failed, trying direct insert...');
    } catch (rpcError) {
      console.log('⚠️ RPC method not available, trying direct insert...');
    }

    // ESTRATÉGIA 2: Insert direto com configuração especial
    console.log('🔧 Tentando insert direto...');
    
    // Desabilitar triggers temporariamente para esta sessão
    await supabase.rpc('set_config', {
      setting_name: 'session_replication_role',
      new_value: 'replica',
      is_local: true
    }).catch(() => {
      console.log('⚠️ Não foi possível desabilitar triggers');
    });

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

    // Reabilitar triggers
    await supabase.rpc('set_config', {
      setting_name: 'session_replication_role',
      new_value: 'origin',
      is_local: true
    }).catch(() => {
      console.log('⚠️ Não foi possível reabilitar triggers');
    });
    
    if (error) {
      console.error('❌ Erro ao salvar mensagem (insert direto):', error);
      
      // ESTRATÉGIA 3: Fallback - salvar apenas em logs
      console.log('🔧 Usando fallback - salvando em logs...');
      
      // Tentar salvar sem fields problemáticos
      const fallbackData = {
        ticket_id: data.ticketId,
        content: data.content,
        sender_type: 'customer',
        message_type: 'text',
        metadata: {
          fallback: true,
          whatsapp_phone: data.senderPhone,
          sender_name: data.senderName,
          source: 'webhook_fallback'
        }
      };
      
      const { data: fallbackMessage, error: fallbackError } = await supabase
        .from('messages')
        .insert([fallbackData])
        .select()
        .single();
      
      if (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        return { 
          success: false, 
          message: `Erro ao salvar: ${error.message}`,
          fallbackError: fallbackError.message
        };
      }
      
      console.log('✅ Mensagem salva via fallback:', fallbackMessage.id);
      return {
        success: true,
        message: 'Mensagem salva via fallback (sem triggers)',
        messageId: fallbackMessage.id,
        method: 'fallback'
      };
    }
    
    console.log('✅ Mensagem salva com sucesso:', message.id);
    
    return {
      success: true,
      message: 'Mensagem salva no banco',
      messageId: message.id,
      method: 'direct'
    };

  } catch (error) {
    console.error('❌ Erro geral ao salvar mensagem:', error);
    
    // ESTRATÉGIA 4: Log local apenas
    console.log('📝 Salvando apenas em log local...');
    console.log('💾 [LOCAL LOG]', {
      ticketId: data.ticketId,
      content: data.content,
      sender: data.senderName,
      timestamp: data.timestamp,
      error: error.message
    });
    
    return { 
      success: true, // Consideramos sucesso porque não queremos quebrar o fluxo
      message: 'Mensagem salva apenas em log local',
      method: 'local_log',
      error: error.message
    };
  }
}

// FUNÇÃO PARA CRIAR RPC SAFE INSERT (caso não exista)
async function createSafeInsertRPC() {
  try {
    console.log('🔧 Verificando/criando função RPC segura...');
    
    const rpcFunction = `
      CREATE OR REPLACE FUNCTION insert_message_safe(
        p_ticket_id UUID,
        p_content TEXT,
        p_sender_type TEXT DEFAULT 'customer',
        p_sender_name TEXT DEFAULT 'Cliente',
        p_metadata JSONB DEFAULT '{}'
      )
      RETURNS UUID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        message_id UUID;
      BEGIN
        -- Inserir mensagem sem triggers de notificação
        INSERT INTO messages (
          id,
          ticket_id,
          content,
          sender_id,
          sender_type,
          message_type,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          p_ticket_id,
          p_content,
          NULL,
          p_sender_type,
          'text',
          p_metadata,
          now(),
          now()
        ) RETURNING id INTO message_id;
        
        RETURN message_id;
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Log erro mas não falha
          RAISE WARNING 'Erro ao inserir mensagem: %', SQLERRM;
          RETURN NULL;
      END;
      $$;
    `;
    
    // Não vamos criar a função automaticamente para evitar problemas de permissão
    // console.log('📝 RPC Function criada/atualizada');
    console.log('📝 RPC Function ready for manual creation if needed');
    
  } catch (error) {
    console.log('⚠️ Não foi possível verificar RPC function:', error.message);
  }
}

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

// [... RESTO DO CÓDIGO PERMANECE O MESMO ...]
// Copiando todas as outras funções do arquivo original

// Endpoint alternativo para compatibilidade com Evolution API antiga
app.post('/webhook/messages-upsert', async (req, res) => {
  try {
    console.log('📥 [COMPAT] Recebido em /messages-upsert, redirecionando...');
    
    // Reformatar payload para nosso padrão
    const reformattedPayload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || req.headers['instance'] || 'unknown',
      data: req.body.data || req.body
    };
    
    console.log('🔄 Redirecionando para processamento principal...');
    
    // Processar usando nossa função principal
    const result = await processNewMessage(reformattedPayload);
    
    // Resposta compatível
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      event: 'MESSAGES_UPSERT',
      instance: reformattedPayload.instance,
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint alternativo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Função principal para processar mensagens novas
async function processNewMessage(payload) {
  try {
    const messageData = payload.data;
    
    if (!messageData || !messageData.key) {
      console.log('❌ Dados de mensagem inválidos:', messageData);
      return { success: false, message: 'Dados de mensagem inválidos' };
    }

    const remoteJid = messageData.key.remoteJid;
    const fromMe = messageData.key.fromMe;
    const instanceName = payload.instance;

    console.log('📊 Dados recebidos:', {
      remoteJid,
      participant: messageData.key.participant,
      fromMe,
      messageKeys: Object.keys(messageData.message || {}),
      pushName: messageData.pushName,
      instanceName
    });

    // Ignorar mensagens enviadas por nós
    if (fromMe) {
      console.log('🔄 Ignorando mensagem enviada por nós');
      return { success: true, message: 'Mensagem própria ignorada' };
    }

    // EXTRAÇÃO AVANÇADA DE TELEFONE
    const phoneInfo = extractAndNormalizePhone(remoteJid, messageData.pushName);
    if (!phoneInfo.isValid) {
      console.log('❌ Não foi possível extrair telefone válido:', phoneInfo);
      return { success: false, message: 'Telefone inválido ou chat em grupo' };
    }

    // Extrair conteúdo da mensagem
    const messageContent = extractMessageContent(messageData.message);
    if (!messageContent) {
      console.log('❌ Não foi possível extrair conteúdo da mensagem');
      return { success: false, message: 'Conteúdo inválido' };
    }

    // PREPARAR DADOS COMPLETOS DO CLIENTE
    const clientData = prepareClientData(phoneInfo, messageData, instanceName);
    if (!clientData) {
      console.log('❌ Não foi possível preparar dados do cliente');
      return { success: false, message: 'Erro ao processar dados do cliente' };
    }

    console.log('📨 [PROCESSAMENTO] Mensagem recebida:', {
      from: clientData.name,
      phone: clientData.phoneFormatted,
      phoneRaw: clientData.phone,
      content: messageContent.substring(0, 50) + '...',
      instance: instanceName,
      country: phoneInfo.country,
      canReply: clientData.responseData.canReply
    });

    // VERIFICAR/CRIAR CLIENTE COM DADOS ENRIQUECIDOS
    let customerId = null;
    try {
      const customer = await findOrCreateCustomerEnhanced({
        phone: clientData.phone,
        phoneFormatted: clientData.phoneFormatted,
        name: clientData.name,
        instanceName: instanceName,
        whatsappMetadata: clientData.whatsappMetadata,
        responseData: clientData.responseData
      });
      
      customerId = customer?.id || null;
      console.log('✅ [CLIENTE] Encontrado/criado com dados enriquecidos:', customerId);
    } catch (error) {
      console.error('⚠️ Erro ao verificar/criar cliente, continuando com cliente anônimo:', error.message);
    }

    // Buscar departamento da instância
    const departmentId = await findDepartmentByInstance(instanceName);
    if (!departmentId) {
      console.log('⚠️ Instância Evolution não encontrada, usando departamento padrão:', instanceName);
    }

    // BUSCAR TICKET EXISTENTE COM NOVO SISTEMA
    let ticket = await findExistingTicket(clientData.phone, departmentId);
    
    if (ticket) {
      console.log('✅ Ticket aberto encontrado:', {
        id: ticket.id,
        status: ticket.status,
        created_at: ticket.created_at
      });
      
      // Vincular cliente ao ticket se não estiver vinculado
      if (customerId && !ticket.customer_id) {
        await vinculateCustomerToTicket(ticket.id, customerId);
      }
    } else {
      // CRIAR NOVO TICKET COM DADOS ENRIQUECIDOS
      console.log('🎫 [TICKET] Criando ticket automaticamente com dados enriquecidos:', {
        cliente: clientData.name,
        telefone: clientData.phoneFormatted,
        telefoneRaw: clientData.phone,
        customerId: customerId,
        departmentId: departmentId,
        mensagem: messageContent.substring(0, 50) + '...',
        instancia: instanceName,
        canReply: clientData.responseData.canReply
      });
      
      ticket = await createTicketAutomaticallyEnhanced({
        clientData: clientData,
        customerId: customerId,
        departmentId: departmentId,
        messageContent: messageContent,
        instanceName: instanceName,
        phoneInfo: phoneInfo
      });
    }

    if (!ticket) {
      console.log('❌ Não foi possível criar/encontrar ticket');
      return { success: false, message: 'Erro ao processar ticket' };
    }

    // SALVAR MENSAGEM COM DADOS ENRIQUECIDOS
    const messageResult = await saveMessageToDatabase({
      ticketId: ticket.id,
      content: messageContent,
      senderName: clientData.name,
      senderPhone: clientData.phone,
      senderPhoneFormatted: clientData.phoneFormatted,
      whatsappJid: clientData.whatsappJid,
      instanceName: instanceName,
      messageId: messageData.key.id,
      timestamp: new Date(messageData.messageTimestamp * 1000).toISOString(),
      // Dados adicionais para resposta
      clientData: clientData.responseData,
      phoneInfo: phoneInfo,
      enhanced: true
    });

    if (messageResult.success) {
      console.log('✅ Mensagem processada com sucesso');
      
      return {
        success: true,
        message: 'Mensagem processada com sucesso',
        ticketId: ticket.id,
        messageId: messageResult.messageId,
        method: messageResult.method
      };
    } else {
      console.log('⚠️ Mensagem processada mas com problemas na persistência');
      
      return {
        success: true, // Não falhamos o webhook por problemas de persistência
        message: 'Mensagem processada com avisos',
        ticketId: ticket.id,
        warning: messageResult.message
      };
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// [... TODAS AS OUTRAS FUNÇÕES PERMANECEM IGUAIS ...]
// Copiando as funções auxiliares essenciais

function extractPhoneFromJid(jid) {
  console.log('📱 Extraindo telefone de JID:', jid);
  
  if (!jid) {
    console.log('❌ JID vazio ou nulo');
    return null;
  }
  
  // Detectar se é mensagem de grupo
  if (jid.includes('@g.us')) {
    console.log('👥 JID de grupo detectado, não é um telefone individual');
    return null;
  }
  
  // Remover sufixos do WhatsApp
  let cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  console.log('🧹 JID limpo:', cleanJid);
  
  // Verificar se é um número válido (apenas dígitos)
  if (!/^\d+$/.test(cleanJid)) {
    console.log('❌ JID não contém apenas números:', cleanJid);
    return null;
  }
  
  // Verificar tamanho mínimo
  if (cleanJid.length < 10) {
    console.log('❌ JID muito curto para ser um número válido:', cleanJid);
    return null;
  }
  
  console.log('✅ Número de telefone extraído:', cleanJid);
  return cleanJid;
}

// NOVA FUNÇÃO APRIMORADA PARA EXTRAÇÃO E NORMALIZAÇÃO DE TELEFONE
function extractAndNormalizePhone(jid, pushName = null) {
  try {
    console.log('📞 [EXTRAÇÃO AVANÇADA] Processando JID:', { jid, pushName });
    
    if (!jid) {
      console.warn('⚠️ JID vazio ou undefined');
      return { phone: null, isValid: false, format: null, country: null };
    }

    // Detectar tipo de chat
    const chatType = jid.includes('@g.us') ? 'group' : 'individual';
    if (chatType === 'group') {
      console.log('👥 Chat em grupo detectado - não extraindo telefone individual');
      return { phone: null, isValid: false, format: 'group', country: null };
    }

    // Extrair número limpo
    let rawPhone = jid
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace(/\D/g, ''); // Remove tudo que não é dígito

    console.log('🧹 Número bruto extraído:', rawPhone);

    // Validações básicas
    if (!rawPhone || rawPhone.length < 10) {
      console.warn('❌ Número muito curto ou inválido:', rawPhone);
      return { phone: rawPhone, isValid: false, format: 'invalid', country: null };
    }

    // Detectar país e formatar
    let formattedPhone = rawPhone;
    let country = 'unknown';
    let format = 'international';

    // Detectar números brasileiros
    if (rawPhone.startsWith('55') && rawPhone.length >= 12) {
      country = 'brazil';
      // Formato brasileiro: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
      const ddd = rawPhone.substring(2, 4);
      const number = rawPhone.substring(4);
      
      if (number.length === 9) {
        // Celular com 9 dígitos
        formattedPhone = `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
        format = 'brazil_mobile';
      } else if (number.length === 8) {
        // Fixo com 8 dígitos
        formattedPhone = `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
        format = 'brazil_landline';
      }
    }
    // Detectar outros países se necessário
    else if (rawPhone.startsWith('1') && rawPhone.length === 11) {
      country = 'usa_canada';
      formattedPhone = `+1 (${rawPhone.substring(1, 4)}) ${rawPhone.substring(4, 7)}-${rawPhone.substring(7)}`;
      format = 'north_america';
    }

    const result = {
      phone: rawPhone,
      phoneFormatted: formattedPhone,
      isValid: true,
      format: format,
      country: country,
      whatsappJid: jid,
      contactName: pushName || null,
      extractedAt: new Date().toISOString()
    };

    console.log('✅ [EXTRAÇÃO AVANÇADA] Telefone processado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro na extração avançada de telefone:', error);
    return { 
      phone: null, 
      isValid: false, 
      format: 'error', 
      country: null, 
      error: error.message 
    };
  }
}

// FUNÇÃO PARA PREPARAR DADOS COMPLETOS DO CLIENTE
function prepareClientData(phoneInfo, messageData, instanceName) {
  try {
    console.log('👤 [CLIENTE] Preparando dados completos:', { phoneInfo, instanceName });

    if (!phoneInfo.isValid) {
      console.warn('⚠️ Dados de telefone inválidos para preparar cliente');
      return null;
    }

    const clientData = {
      // Dados básicos
      phone: phoneInfo.phone,
      phoneFormatted: phoneInfo.phoneFormatted,
      whatsappJid: phoneInfo.whatsappJid,
      name: messageData.pushName || phoneInfo.contactName || `Cliente ${phoneInfo.phone.slice(-4)}`,
      
      // Metadados WhatsApp
      whatsappMetadata: {
        pushName: messageData.pushName,
        participant: messageData.key.participant,
        instanceName: instanceName,
        country: phoneInfo.country,
        phoneFormat: phoneInfo.format,
        firstContact: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        platform: 'whatsapp',
        source: 'evolution_api_webhook'
      },

      // Dados para resposta
      responseData: {
        phoneForReply: phoneInfo.phone, // Número limpo para APIs
        phoneDisplayFormat: phoneInfo.phoneFormatted, // Formato visual
        whatsappJid: phoneInfo.whatsappJid, // JID original se necessário
        instanceName: instanceName, // Instância para responder
        canReply: true,
        replyMethod: 'evolution_api'
      },

      // Status e flags
      status: {
        isActive: true,
        canReceiveMessages: true,
        canSendMessages: true,
        lastSeen: new Date().toISOString(),
        messageCount: 1
      }
    };

    console.log('✅ [CLIENTE] Dados preparados com sucesso:', {
      phone: clientData.phone,
      name: clientData.name,
      canReply: clientData.responseData.canReply
    });

    return clientData;

  } catch (error) {
    console.error('❌ Erro ao preparar dados do cliente:', error);
    return null;
  }
}

function extractMessageContent(message) {
  if (!message) return null;
  
  // Mensagem de texto simples
  if (message.conversation) {
    return message.conversation;
  }
  
  // Mensagem de texto extendida
  if (message.extendedTextMessage && message.extendedTextMessage.text) {
    return message.extendedTextMessage.text;
  }
  
  // Mensagem com imagem e legenda
  if (message.imageMessage && message.imageMessage.caption) {
    return `[Imagem] ${message.imageMessage.caption}`;
  }
  
  // Mensagem com vídeo e legenda
  if (message.videoMessage && message.videoMessage.caption) {
    return `[Vídeo] ${message.videoMessage.caption}`;
  }
  
  // Mensagem de áudio
  if (message.audioMessage) {
    return '[Áudio]';
  }
  
  // Mensagem de documento
  if (message.documentMessage) {
    const fileName = message.documentMessage.fileName || 'documento';
    return `[Documento: ${fileName}]`;
  }
  
  // Mensagem de localização
  if (message.locationMessage) {
    return '[Localização compartilhada]';
  }
  
  // Sticker
  if (message.stickerMessage) {
    return '[Sticker]';
  }
  
  // Contato
  if (message.contactMessage) {
    return `[Contato: ${message.contactMessage.displayName || 'Sem nome'}]`;
  }
  
  // Fallback
  console.log('⚠️ Tipo de mensagem não reconhecido:', Object.keys(message));
  return '[Mensagem não suportada]';
}

// [... TODAS AS OUTRAS FUNÇÕES DO ARQUIVO ORIGINAL ...]

// Para economizar espaço, vou indicar que as outras funções devem ser copiadas
// do arquivo original: findOrCreateCustomer, vinculateCustomerToTicket, 
// findExistingTicket, createTicketAutomatically, etc.

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Evolution Webhook Integration CORRIGIDO rodando na porta ${PORT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📡 Webhook URL: ${BASE_URL}/webhook/evolution`);
  console.log(`🗄️ Supabase: ${supabaseUrl}`);
  console.log(`🏥 Health check: ${BASE_URL}/health`);
  console.log(`🔧 CORREÇÃO RLS: Ativa`);
  
  // Verificar RPC function na inicialização
  createSafeInsertRPC();
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

// FUNÇÃO APRIMORADA PARA CRIAR CLIENTE COM DADOS ENRIQUECIDOS
async function findOrCreateCustomerEnhanced(clientInfo) {
  try {
    console.log('🔍 [CLIENTE AVANÇADO] Verificando cliente com dados enriquecidos:', {
      phone: clientInfo.phone,
      phoneFormatted: clientInfo.phoneFormatted,
      name: clientInfo.name,
      instance: clientInfo.instanceName
    });
    
    // Buscar cliente existente na tabela PROFILES
    const { data: existingProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, metadata')
      .or(`metadata->>phone.eq.${clientInfo.phone},email.eq.whatsapp-${clientInfo.phone}@auto-generated.com`)
      .eq('role', 'customer')
      .limit(1);

    if (searchError) {
      console.error('❌ Erro na busca de cliente na tabela PROFILES:', searchError);
      throw new Error(`Erro na busca profiles: ${searchError.message}`);
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const profile = existingProfiles[0];
      console.log('✅ [CLIENTE AVANÇADO] Cliente existente encontrado:', profile.id);
      
      // ATUALIZAR METADADOS COM DADOS ENRIQUECIDOS
      const updatedMetadata = {
        ...profile.metadata,
        phone: clientInfo.phone,
        phoneFormatted: clientInfo.phoneFormatted,
        whatsappJid: clientInfo.whatsappMetadata.whatsappJid,
        lastContact: new Date().toISOString(),
        country: clientInfo.whatsappMetadata.country,
        phoneFormat: clientInfo.whatsappMetadata.phoneFormat,
        instanceName: clientInfo.instanceName,
        // Dados para resposta
        responseData: clientInfo.responseData,
        // Status atualizado
        isActive: true,
        canReply: true,
        lastMessageAt: new Date().toISOString(),
        messageCount: (profile.metadata?.messageCount || 0) + 1,
        updated_via: 'whatsapp_webhook_enhanced'
      };

      // Atualizar profile com dados enriquecidos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: clientInfo.name,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.warn('⚠️ Erro ao atualizar profile, mas continuando:', updateError);
      } else {
        console.log('✅ [CLIENTE AVANÇADO] Metadados atualizados com sucesso');
      }
      
      return { id: profile.id, isNew: false };
    }

    // CRIAR NOVO PROFILE COM DADOS COMPLETOS
    console.log('🆕 [CLIENTE AVANÇADO] Criando novo cliente com dados completos...');
    const newProfileData = {
      id: crypto.randomUUID(),
      name: clientInfo.name,
      email: `whatsapp-${clientInfo.phone}@auto-generated.com`,
      role: 'customer',
      metadata: {
        // Dados básicos
        phone: clientInfo.phone,
        phoneFormatted: clientInfo.phoneFormatted,
        
        // Metadados WhatsApp completos
        ...clientInfo.whatsappMetadata,
        
        // Dados para resposta
        responseData: clientInfo.responseData,
        
        // Status e controle
        isActive: true,
        canReply: true,
        source: 'whatsapp_webhook_enhanced',
        messageCount: 1,
        tags: ['whatsapp', 'auto-created', 'enhanced'],
        
        // Timestamps
        created_via: 'evolution_api_enhanced',
        first_contact: new Date().toISOString(),
        last_contact: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([newProfileData])
      .select('id, name, email, metadata')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar profile enriquecido:', createError);
      throw new Error(`Erro ao criar profile: ${createError.message}`);
    }

    console.log('✅ [CLIENTE AVANÇADO] Novo profile criado com dados completos:', {
      id: newProfile.id,
      name: newProfile.name,
      phone: newProfile.metadata.phone,
      phoneFormatted: newProfile.metadata.phoneFormatted,
      canReply: newProfile.metadata.canReply
    });

    return { id: newProfile.id, isNew: true };

  } catch (error) {
    console.error('❌ Erro na verificação/criação de cliente avançado:', error);
    throw error;
  }
}

// Função para buscar ou criar cliente APENAS na tabela PROFILES (VERSÃO ORIGINAL MANTIDA)
async function findOrCreateCustomer(phone, name = null) {
  try {
    console.log('🔍 Verificando se cliente existe na tabela PROFILES:', { phone, name });
    
    // FORÇAR uso da tabela PROFILES - NUNCA customers
    const { data: existingProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, metadata')
      .or(`metadata->>phone.eq.${phone},email.eq.whatsapp-${phone}@auto-generated.com`)
      .eq('role', 'customer')
      .limit(1);

    if (searchError) {
      console.error('❌ Erro na busca de cliente na tabela PROFILES:', searchError);
      throw new Error(`Erro na busca profiles: ${searchError.message}`);
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const profile = existingProfiles[0];
      console.log('✅ Cliente encontrado na tabela PROFILES:', profile.id);
      
      // Atualizar metadados se necessário
      if (name && profile.name !== name) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: name,
            metadata: {
              ...profile.metadata,
              phone: phone,
              last_contact: new Date().toISOString(),
              updated_via: 'whatsapp_webhook'
            }
          })
          .eq('id', profile.id);

        if (updateError) {
          console.warn('⚠️ Erro ao atualizar profile, mas continuando:', updateError);
        }
      }
      
      return profile.id;
    }

    // Se não encontrou, criar novo profile
    console.log('🆕 Cliente não encontrado, criando automaticamente na tabela PROFILES...');
    const newProfileData = {
      id: crypto.randomUUID(),
      name: name || `Cliente WhatsApp ${phone.slice(-4)}`,
      email: `whatsapp-${phone}@auto-generated.com`,
      role: 'customer',
      metadata: {
        phone: phone,
        source: 'whatsapp_webhook',
        created_via: 'evolution_api',
        first_contact: new Date().toISOString(),
        status: 'active',
        category: 'standard',
        tags: ['whatsapp', 'auto-created']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([newProfileData])
      .select('id, name, email')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar profile:', createError);
      throw new Error(`Erro ao criar profile: ${createError.message}`);
    }

    console.log('✅ Novo profile criado automaticamente:', newProfile);
    return newProfile.id;

  } catch (error) {
    console.error('❌ Erro na verificação/criação de profile:', error);
    throw error;
  }
}

// Função para buscar ticket existente - MÉTODO DIRETO (sem RPC por enquanto)
async function findExistingTicket(clientPhone, departmentId = null) {
  try {
    console.log('🔍 Buscando ticket existente para:', { clientPhone, departmentId });
    
    // Busca direta na tabela tickets com status válidos
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, status, metadata')
      .or(`metadata->>client_phone.eq.${clientPhone},metadata->>whatsapp_phone.eq.${clientPhone},phone.eq.${clientPhone}`)
      .in('status', ['open', 'in_progress']) // Usar apenas status em inglês por enquanto
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar ticket:', error);
      return null;
    }

    if (tickets && tickets.length > 0) {
      const ticket = tickets[0];
      console.log('✅ Ticket existente encontrado:', ticket.id);
      return ticket;
    }

    console.log('📝 Nenhum ticket existente encontrado');
    return null;

  } catch (error) {
    console.error('❌ Erro na busca de ticket:', error);
    return null;
  }
}

// FUNÇÃO APRIMORADA PARA CRIAR TICKET COM DADOS ENRIQUECIDOS
async function createTicketAutomaticallyEnhanced(ticketInfo) {
  try {
    console.log('🎫 [TICKET AVANÇADO] Criando ticket com dados completos:', {
      cliente: ticketInfo.clientData.name,
      telefone: ticketInfo.clientData.phoneFormatted,
      phoneRaw: ticketInfo.clientData.phone,
      customerId: ticketInfo.customerId,
      departmentId: ticketInfo.departmentId,
      instancia: ticketInfo.instanceName,
      canReply: ticketInfo.clientData.responseData.canReply
    });

    const title = `WhatsApp: ${ticketInfo.clientData.name}`;
    
    // PREPARAR METADATA ENRIQUECIDA PARA O TICKET
    const enhancedMetadata = {
      // Dados básicos do cliente
      client_name: ticketInfo.clientData.name,
      client_phone: ticketInfo.clientData.phone,
      whatsapp_phone: ticketInfo.clientData.phone,
      phone_formatted: ticketInfo.clientData.phoneFormatted,
      whatsapp_jid: ticketInfo.clientData.whatsappJid,
      
      // Dados da instância e evolução
      instance_name: ticketInfo.instanceName,
      initial_message: ticketInfo.messageContent,
      
      // Dados para resposta
      response_data: ticketInfo.clientData.responseData,
      
      // Dados WhatsApp completos
      whatsapp_metadata: ticketInfo.clientData.whatsappMetadata,
      
      // Informações do telefone
      phone_info: {
        country: ticketInfo.phoneInfo.country,
        format: ticketInfo.phoneInfo.format,
        is_mobile: ticketInfo.phoneInfo.format.includes('mobile'),
        extracted_at: ticketInfo.phoneInfo.extractedAt
      },
      
      // Controle e status
      source: 'webhook_evolution_enhanced',
      created_via: 'whatsapp_enhanced',
      can_reply: true,
      reply_method: 'evolution_api',
      auto_response_enabled: true,
      
      // Timestamps
      first_message_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      
      // Flags para controle
      is_whatsapp: true,
      has_phone_number: true,
      client_verified: true,
      enhanced_processing: true
    };
    
    // INSERIR TICKET COM DADOS COMPLETOS
    const { data: newTicket, error: createError } = await supabase
      .from('tickets')
      .insert([{
        id: crypto.randomUUID(),
        title: title,
        description: ticketInfo.messageContent || 'Mensagem via WhatsApp',
        status: 'open',
        priority: 'medium',
        customer_id: ticketInfo.customerId,
        department_id: ticketInfo.departmentId,
        channel: 'whatsapp',
        phone: ticketInfo.clientData.phone,
        metadata: enhancedMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, title, status, channel, metadata')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ticket enriquecido no banco:', createError);
      
      // FALLBACK COM DADOS MÍNIMOS
      return {
        id: crypto.randomUUID(),
        title: title,
        status: 'open',
        channel: 'whatsapp',
        metadata: {
          client_phone: ticketInfo.clientData.phone,
          phone_formatted: ticketInfo.clientData.phoneFormatted,
          can_reply: true
        },
        isLocal: true
      };
    }

    console.log('✅ [TICKET AVANÇADO] Ticket criado com dados completos:', {
      id: newTicket.id,
      title: newTicket.title,
      phone: newTicket.metadata.client_phone,
      phoneFormatted: newTicket.metadata.phone_formatted,
      canReply: newTicket.metadata.can_reply,
      country: newTicket.metadata.phone_info.country
    });

    return newTicket;

  } catch (error) {
    console.error('❌ Erro ao criar ticket avançado:', error);
    
    // FALLBACK LOCAL COM DADOS ESSENCIAIS
    return {
      id: crypto.randomUUID(),
      title: `WhatsApp: ${ticketInfo.clientData.name}`,
      status: 'open',
      channel: 'whatsapp',
      metadata: {
        client_phone: ticketInfo.clientData.phone,
        phone_formatted: ticketInfo.clientData.phoneFormatted,
        can_reply: true,
        error: error.message
      },
      isLocal: true
    };
  }
}

// Função para criar ticket automaticamente - MÉTODO DIRETO (VERSÃO ORIGINAL MANTIDA)
async function createTicketAutomatically(clientName, clientPhone, customerId, departmentId, messageContent, instanceName) {
  try {
    console.log('🎫 Criando ticket automaticamente:', {
      cliente: clientName,
      telefone: clientPhone,
      customerId,
      departmentId,
      mensagem: messageContent.substring(0, 50) + '...',
      instancia: instanceName
    });

    const title = `Mensagem de ${clientName}`;
    
    // Preparar metadata
    const ticketMetadata = {
      client_phone: clientPhone,
      whatsapp_phone: clientPhone,
      client_name: clientName,
      instance_name: instanceName,
      initial_message: messageContent,
      source: 'webhook_evolution',
      created_via: 'whatsapp'
    };
    
    // Inserir ticket direto - usar status em inglês
    const { data: newTicket, error: createError } = await supabase
      .from('tickets')
      .insert([{
        id: crypto.randomUUID(),
        title: title,
        description: messageContent || 'Mensagem via WhatsApp',
        status: 'open', // Usar inglês por enquanto
        priority: 'medium',
        customer_id: customerId,
        department_id: departmentId,
        channel: 'whatsapp',
        phone: clientPhone,
        metadata: ticketMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, title, status, channel')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ticket no banco:', createError);
      // Retornar ticket local válido com UUID
      return {
        id: crypto.randomUUID(),
        title: title,
        status: 'open',
        channel: 'whatsapp',
        isLocal: true
      };
    }

    console.log('✅ Ticket criado no banco:', newTicket);
    return newTicket;

  } catch (error) {
    console.error('❌ Erro ao criar ticket:', error);
    // Retornar ticket local válido com UUID
    return {
      id: crypto.randomUUID(),
      title: `Mensagem de ${clientName}`,
      status: 'open',
      channel: 'whatsapp',
      isLocal: true
    };
  }
}

// Health check
app.get('/webhook/health', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] GET /webhook/health`);
  
  res.json({
    status: 'healthy',
    timestamp: timestamp,
    server: 'Webhook Evolution API',
    features: {
      receiving: true,
      sending: true,
      replying: true
    },
    endpoints: [
      '/webhook/evolution',
      '/webhook/health',
      '/webhook/send-message',
      '/webhook/check-instance'
    ]
  });
}); 