// ========================================
// SERVIDOR WEBHOOK EVOLUTION API - VERSÃO APRIMORADA
// ========================================
// Funcionalidades Melhoradas:
// 1. Extração avançada de dados de contato
// 2. Sistema de resposta automática
// 3. Cache de contatos para performance
// 4. Detecção inteligente de idioma
// 5. Processamento de mídias
// 6. Sistema de templates de resposta

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// ====== CONFIGURAÇÕES ======
const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;

// Configurações Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// Configurações Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Configurações Base
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bkcrm.devsible.com.br' 
  : 'http://localhost:3000';

console.log('🔧 Carregando configurações das variáveis de ambiente...');
console.log('🚀 Configurações Evolution API:');
console.log('📡 URL:', EVOLUTION_API_URL);
console.log('🔑 API Key:', EVOLUTION_API_KEY ? '***configurada***' : '❌ NÃO CONFIGURADA');

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== MIDDLEWARES ======
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://bkcrm.devsible.com.br'],
  credentials: true
}));

// ====== CACHE DE CONTATOS ======
const contactsCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

// ====== SISTEMA DE TEMPLATES ======
const responseTemplates = {
  welcome: {
    pt: "Olá! 👋 Obrigado por entrar em contato. Em breve um de nossos atendentes irá te responder.",
    en: "Hello! 👋 Thank you for contacting us. One of our agents will respond to you soon.",
    es: "¡Hola! 👋 Gracias por contactarnos. Pronto uno de nuestros agentes te responderá."
  },
  businessHours: {
    pt: "📅 Nosso horário de atendimento é de Segunda a Sexta, das 9h às 18h. Retornaremos assim que possível!",
    en: "📅 Our business hours are Monday to Friday, 9am to 6pm. We'll get back to you as soon as possible!",
    es: "📅 Nuestro horario de atención es de Lunes a Viernes, de 9h a 18h. ¡Te responderemos lo antes posible!"
  },
  autoReply: {
    pt: "🤖 Esta é uma resposta automática. Sua mensagem foi recebida e será respondida em breve.",
    en: "🤖 This is an automatic reply. Your message has been received and will be answered soon.",
    es: "🤖 Esta es una respuesta automática. Su mensaje ha sido recibido y será respondido pronto."
  }
};

// ====== ESTRUTURA DE DADOS APRIMORADA ======
class ContactData {
  constructor(data) {
    this.id = data.id;
    this.phone = data.phone;
    this.name = data.name;
    this.pushName = data.pushName;
    this.profilePictureUrl = data.profilePictureUrl;
    this.isGroup = data.isGroup || false;
    this.language = data.language || 'pt';
    this.status = data.status || 'active';
    this.lastSeen = data.lastSeen;
    this.isOnline = data.isOnline || false;
    this.metadata = data.metadata || {};
    this.lastInteraction = new Date();
    this.messageCount = data.messageCount || 0;
    this.tags = data.tags || [];
  }

  // Detectar idioma baseado na mensagem
  detectLanguage(message) {
    const ptWords = ['olá', 'oi', 'bom dia', 'boa tarde', 'obrigado', 'por favor', 'sim', 'não'];
    const enWords = ['hello', 'hi', 'good morning', 'good afternoon', 'thank you', 'please', 'yes', 'no'];
    const esWords = ['hola', 'buenos días', 'buenas tardes', 'gracias', 'por favor', 'sí', 'no'];

    const lowerMessage = message.toLowerCase();
    
    let ptScore = ptWords.filter(word => lowerMessage.includes(word)).length;
    let enScore = enWords.filter(word => lowerMessage.includes(word)).length;
    let esScore = esWords.filter(word => lowerMessage.includes(word)).length;

    if (ptScore > enScore && ptScore > esScore) return 'pt';
    if (enScore > ptScore && enScore > esScore) return 'en';
    if (esScore > ptScore && esScore > enScore) return 'es';
    
    return this.language; // Manter idioma atual se não detectar
  }

  // Atualizar dados do contato
  update(newData) {
    Object.assign(this, newData);
    this.lastInteraction = new Date();
    this.messageCount++;
  }

  // Verificar se dados estão atualizados
  isStale() {
    return Date.now() - this.lastInteraction.getTime() > CACHE_DURATION;
  }
}

// ====== FUNÇÕES DE EXTRAÇÃO APRIMORADAS ======

/**
 * Extrair dados completos do contato
 */
async function extractContactData(messageData, instanceName) {
  try {
    const remoteJid = messageData.key?.remoteJid;
    const participant = messageData.key?.participant;
    const pushName = messageData.pushName;
    
    console.log('👤 Extraindo dados do contato:', {
      remoteJid,
      participant,
      pushName,
      instance: instanceName
    });

    // Verificar cache primeiro
    const cacheKey = `${instanceName}:${remoteJid}`;
    if (contactsCache.has(cacheKey)) {
      const cachedContact = contactsCache.get(cacheKey);
      if (!cachedContact.isStale()) {
        console.log('📋 Dados do contato encontrados no cache');
        return cachedContact;
      }
    }

    // Extrair telefone
    let phone = extractPhoneFromJid(remoteJid);
    
    // Se for grupo, tentar extrair do participant
    if (!phone && participant) {
      phone = extractPhoneFromJid(participant);
    }

    // Detectar se é grupo
    const isGroup = remoteJid?.includes('@g.us') || false;
    
    // Buscar informações adicionais via Evolution API
    let additionalInfo = {};
    try {
      additionalInfo = await fetchContactInfoFromEvolution(phone, instanceName);
    } catch (error) {
      console.warn('⚠️ Não foi possível buscar informações adicionais do contato:', error.message);
    }

    // Criar objeto de dados do contato
    const contactData = new ContactData({
      id: phone || remoteJid,
      phone: phone,
      name: additionalInfo.name || pushName || `Cliente ${phone?.slice(-4) || 'Desconhecido'}`,
      pushName: pushName,
      profilePictureUrl: additionalInfo.profilePictureUrl,
      isGroup: isGroup,
      language: 'pt', // Será detectado dinamicamente
      status: 'active',
      lastSeen: additionalInfo.lastSeen,
      isOnline: additionalInfo.isOnline || false,
      metadata: {
        remoteJid: remoteJid,
        participant: participant,
        instance: instanceName,
        firstContact: new Date().toISOString(),
        source: 'webhook'
      }
    });

    // Salvar no cache
    contactsCache.set(cacheKey, contactData);

    console.log('✅ Dados do contato extraídos:', {
      id: contactData.id,
      name: contactData.name,
      phone: contactData.phone,
      isGroup: contactData.isGroup
    });

    return contactData;

  } catch (error) {
    console.error('❌ Erro ao extrair dados do contato:', error);
    // Retornar dados mínimos em caso de erro
    return new ContactData({
      id: extractPhoneFromJid(messageData.key?.remoteJid) || 'unknown',
      phone: extractPhoneFromJid(messageData.key?.remoteJid),
      name: messageData.pushName || 'Cliente Desconhecido',
      pushName: messageData.pushName
    });
  }
}

/**
 * Buscar informações do contato via Evolution API
 */
async function fetchContactInfoFromEvolution(phone, instanceName) {
  try {
    if (!phone) return {};

    const response = await axios.get(
      `${EVOLUTION_API_URL}/chat/findContacts/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY
        },
        params: {
          where: {
            remoteJid: `${phone}@s.whatsapp.net`
          }
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.length > 0) {
      const contact = response.data[0];
      return {
        name: contact.pushName || contact.name,
        profilePictureUrl: contact.profilePictureUrl,
        lastSeen: contact.lastSeen,
        isOnline: contact.isOnline || false
      };
    }

    return {};

  } catch (error) {
    console.warn('⚠️ Erro ao buscar dados do contato na Evolution API:', error.message);
    return {};
  }
}

/**
 * Extrair telefone do JID (versão aprimorada)
 */
function extractPhoneFromJid(jid) {
  console.log('📱 Extraindo telefone de JID:', jid);
  
  if (!jid) {
    console.log('❌ JID vazio ou nulo');
    return null;
  }
  
  // Detectar se é mensagem de grupo
  if (jid.includes('@g.us')) {
    console.log('👥 JID de grupo detectado');
    return null; // Para grupos, retornar null para o telefone
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
    console.log('❌ Número muito curto (mínimo 10 dígitos):', cleanJid);
    return null;
  }
  
  // Adicionar código do país se necessário (Brasil = 55)
  if (cleanJid.length >= 10 && !cleanJid.startsWith('55')) {
    console.log('🇧🇷 Adicionando código do país (55) ao número:', cleanJid);
    cleanJid = '55' + cleanJid;
  }
  
  console.log('✅ Número de telefone extraído:', cleanJid);
  return cleanJid;
}

/**
 * Extrair conteúdo da mensagem (versão aprimorada)
 */
function extractMessageContent(message, messageType = 'text') {
  if (!message) return { content: null, type: 'unknown', media: null };
  
  let content = null;
  let type = 'text';
  let media = null;
  
  // Mensagem de texto simples
  if (message.conversation) {
    content = message.conversation;
    type = 'text';
  }
  // Mensagem de texto estendida
  else if (message.extendedTextMessage?.text) {
    content = message.extendedTextMessage.text;
    type = 'text';
  }
  // Imagem com legenda
  else if (message.imageMessage) {
    content = message.imageMessage.caption || '[Imagem]';
    type = 'image';
    media = {
      mimetype: message.imageMessage.mimetype,
      url: message.imageMessage.url,
      size: message.imageMessage.fileLength
    };
  }
  // Vídeo com legenda
  else if (message.videoMessage) {
    content = message.videoMessage.caption || '[Vídeo]';
    type = 'video';
    media = {
      mimetype: message.videoMessage.mimetype,
      url: message.videoMessage.url,
      size: message.videoMessage.fileLength,
      duration: message.videoMessage.seconds
    };
  }
  // Documento
  else if (message.documentMessage) {
    content = message.documentMessage.caption || `[Documento: ${message.documentMessage.fileName || 'arquivo'}]`;
    type = 'document';
    media = {
      mimetype: message.documentMessage.mimetype,
      fileName: message.documentMessage.fileName,
      url: message.documentMessage.url,
      size: message.documentMessage.fileLength
    };
  }
  // Áudio
  else if (message.audioMessage) {
    content = '[Áudio]';
    type = 'audio';
    media = {
      mimetype: message.audioMessage.mimetype,
      url: message.audioMessage.url,
      size: message.audioMessage.fileLength,
      duration: message.audioMessage.seconds,
      isVoiceMessage: message.audioMessage.ptt || false
    };
  }
  // Sticker
  else if (message.stickerMessage) {
    content = '[Sticker]';
    type = 'sticker';
    media = {
      url: message.stickerMessage.url,
      size: message.stickerMessage.fileLength
    };
  }
  // Localização
  else if (message.locationMessage) {
    content = `[Localização: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}]`;
    type = 'location';
    media = {
      latitude: message.locationMessage.degreesLatitude,
      longitude: message.locationMessage.degreesLongitude,
      name: message.locationMessage.name || 'Localização'
    };
  }
  // Contato
  else if (message.contactMessage) {
    content = `[Contato: ${message.contactMessage.displayName}]`;
    type = 'contact';
    media = {
      displayName: message.contactMessage.displayName,
      vcard: message.contactMessage.vcard
    };
  }
  
  return { content, type, media };
}

// ====== SISTEMA DE RESPOSTA AUTOMÁTICA ======

/**
 * Verificar se deve enviar resposta automática
 */
async function shouldSendAutoReply(contactData, messageContent) {
  try {
    // Não enviar resposta automática para grupos
    if (contactData.isGroup) {
      return false;
    }

    // Verificar se é a primeira mensagem do contato nas últimas 24h
    const { data: recentMessages, error } = await supabase
      .from('messages')
      .select('id, created_at')
      .ilike('metadata->>sender_phone', contactData.phone)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (error) {
      console.warn('⚠️ Erro ao verificar mensagens recentes:', error);
      return false;
    }

    // Se não há mensagens nas últimas 24h, enviar resposta automática
    return !recentMessages || recentMessages.length === 0;

  } catch (error) {
    console.error('❌ Erro ao verificar se deve enviar resposta automática:', error);
    return false;
  }
}

/**
 * Enviar resposta automática
 */
async function sendAutoReply(contactData, instanceName, messageType = 'welcome') {
  try {
    console.log('🤖 Enviando resposta automática:', {
      contact: contactData.name,
      phone: contactData.phone,
      language: contactData.language,
      type: messageType
    });

    const template = responseTemplates[messageType];
    if (!template) {
      console.warn('⚠️ Template de resposta não encontrado:', messageType);
      return false;
    }

    const message = template[contactData.language] || template.pt;

    // Verificar se estamos em horário comercial
    const now = new Date();
    const hour = now.getHours();
    const isBusinessHours = hour >= 9 && hour <= 18 && now.getDay() >= 1 && now.getDay() <= 5;

    let finalMessage = message;
    if (!isBusinessHours && messageType === 'welcome') {
      const businessHoursMsg = responseTemplates.businessHours[contactData.language] || responseTemplates.businessHours.pt;
      finalMessage = `${message}\n\n${businessHoursMsg}`;
    }

    // Enviar mensagem
    const result = await sendWhatsAppMessage({
      phone: contactData.phone,
      text: finalMessage,
      instance: instanceName,
      options: {
        delay: 2000, // 2 segundos de delay
        presence: 'composing'
      }
    });

    if (result.success) {
      console.log('✅ Resposta automática enviada com sucesso');
      
      // Salvar resposta automática no banco
      await saveMessageToDatabase({
        ticketId: null, // Será vinculado depois quando ticket for criado
        content: finalMessage,
        senderName: 'Sistema',
        senderPhone: 'system',
        instanceName: instanceName,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        isAutoReply: true,
        metadata: {
          template: messageType,
          language: contactData.language,
          recipient: contactData.phone
        }
      });

      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ Erro ao enviar resposta automática:', error);
    return false;
  }
}

/**
 * Enviar mensagem de texto via Evolution API
 */
async function sendWhatsAppMessage(messageData) {
  try {
    const { phone, text, instance = 'atendimento-ao-cliente-sac1', options = {} } = messageData;

    if (!phone || !text) {
      throw new Error('Telefone e texto são obrigatórios');
    }

    // Formatar número para o padrão WhatsApp
    const formattedPhone = formatPhoneNumber(phone);
    
    console.log('📤 Enviando mensagem via Evolution API:', {
      instance,
      phone: formattedPhone,
      text: text.substring(0, 50) + '...',
      hasOptions: Object.keys(options).length > 0
    });

    // Payload correto conforme teste bem-sucedido
    const payload = {
      number: formattedPhone,
      text: text,
      options: {
        delay: options.delay || 1000, // 1 segundo de delay padrão
        presence: options.presence || 'composing', // Mostrar "digitando..."
        linkPreview: options.linkPreview !== false, // True por padrão
        ...options
      }
    };

    // Fazer requisição para a Evolution API
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${instance}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        timeout: 30000 // 30 segundos
      }
    );

    console.log('✅ Mensagem enviada com sucesso:', {
      messageId: response.data.key?.id,
      status: response.data.status,
      timestamp: response.data.messageTimestamp
    });

    return {
      success: true,
      data: response.data,
      messageId: response.data.key?.id,
      status: response.data.status
    };

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * Formatar número de telefone para o padrão WhatsApp
 */
function formatPhoneNumber(phone) {
  // Remover caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com código do país, adicionar +55 (Brasil)
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  
  // Remover sufixo @s.whatsapp.net se existir
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  
  return cleaned;
}

// ====== ENDPOINTS DE API ======

// Health check
app.get('/webhook/health', (req, res) => {
  console.log('📥', new Date().toISOString(), 'GET /webhook/health');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: {
      contacts: contactsCache.size,
      templates: Object.keys(responseTemplates).length
    }
  });
});

// Endpoint principal do webhook
app.post('/webhook/evolution', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log('📥', `[${timestamp}] POST /webhook/evolution`);
  
  try {
    const payload = req.body;
    
    console.log('🔔', `[${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      dataKeys: payload.data ? Object.keys(payload.data) : []
    });

    let result = { success: false, message: 'Evento não processado' };

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
      
      case 'MESSAGES_UPDATE':
        result = await processSentMessage(payload);
        break;
      
      case 'CONTACTS_UPDATE':
        result = await processContactUpdate(payload);
        break;
      
      case 'CHATS_UPDATE':
        result = await processChatUpdate(payload);
        break;
      
      default:
        console.log('❓ Evento não reconhecido:', payload.event);
        result = { success: true, message: `Evento ${payload.event} ignorado` };
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint para limpar cache
app.post('/webhook/clear-cache', (req, res) => {
  contactsCache.clear();
  console.log('🧹 Cache de contatos limpo');
  res.json({ success: true, message: 'Cache limpo com sucesso' });
});

// Endpoint para visualizar cache
app.get('/webhook/cache', (req, res) => {
  const cacheData = Array.from(contactsCache.entries()).map(([key, contact]) => ({
    key,
    contact: {
      name: contact.name,
      phone: contact.phone,
      language: contact.language,
      messageCount: contact.messageCount,
      lastInteraction: contact.lastInteraction
    }
  }));

  res.json({
    size: contactsCache.size,
    contacts: cacheData
  });
});

// Endpoint para envio de mensagens
app.post('/webhook/send-message', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log('📥', `[${timestamp}] POST /webhook/send-message`);
  
  try {
    const { phone, text, instance, options } = req.body;
    
    console.log('📤 [SEND] Solicitação de envio de mensagem:', {
      phone: phone,
      text: text.substring(0, 50) + '...',
      instance: instance,
      hasOptions: !!options
    });

    const result = await sendWhatsAppMessage({
      phone,
      text,
      instance,
      options
    });

    console.log('📤 [SEND] Resultado do envio:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no endpoint de envio:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ====== FUNÇÃO PRINCIPAL DE PROCESSAMENTO ======

/**
 * Processar nova mensagem (versão aprimorada)
 */
async function processNewMessage(payload) {
  try {
    const messageData = payload.data;
    const instanceName = payload.instance;
    
    console.log('📥 Processando mensagem:', {
      instance: instanceName,
      messageId: messageData.key?.id,
      fromMe: messageData.key?.fromMe
    });

    // Verificar se é uma mensagem válida
    if (!messageData || !messageData.key) {
      console.warn('⚠️ Dados de mensagem inválidos');
      return { success: false, message: 'Dados inválidos' };
    }

    // Extrair dados completos do contato
    const contactData = await extractContactData(messageData, instanceName);
    
    // Extrair conteúdo da mensagem
    const messageInfo = extractMessageContent(messageData.message);
    
    if (!contactData.phone || !messageInfo.content) {
      console.warn('⚠️ Telefone ou conteúdo da mensagem inválido');
      return { success: false, message: 'Dados da mensagem inválidos' };
    }

    // Detectar idioma se for mensagem de texto
    if (messageInfo.type === 'text') {
      contactData.language = contactData.detectLanguage(messageInfo.content);
    }

    console.log('📨 Dados da mensagem processados:', {
      contact: contactData.name,
      phone: contactData.phone,
      type: messageInfo.type,
      content: messageInfo.content?.substring(0, 50) + '...',
      language: contactData.language,
      hasMedia: !!messageInfo.media
    });

    // Atualizar cache do contato
    const cacheKey = `${instanceName}:${messageData.key.remoteJid}`;
    contactsCache.set(cacheKey, contactData);

    // Verificar se deve enviar resposta automática (apenas para mensagens recebidas)
    if (!messageData.key.fromMe && await shouldSendAutoReply(contactData, messageInfo.content)) {
      await sendAutoReply(contactData, instanceName, 'welcome');
    }

    console.log('✅ Mensagem processada com dados aprimorados');
    return {
      success: true,
      message: 'Mensagem processada com dados completos',
      contactData: {
        phone: contactData.phone,
        name: contactData.name,
        language: contactData.language,
        isGroup: contactData.isGroup,
        profilePictureUrl: contactData.profilePictureUrl
      },
      messageInfo: messageInfo
    };

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// ====== INICIALIZAÇÃO DO SERVIDOR ======
app.listen(PORT, () => {
  console.log('🚀 Evolution Webhook Integration APRIMORADO rodando na porta', PORT);
  console.log('🌐 Base URL:', BASE_URL);
  console.log('📡 Webhook URL:', `${BASE_URL}/webhook/evolution`);
  console.log('🗄️ Supabase:', SUPABASE_URL);
  console.log('🏥 Health check:', `${BASE_URL}/webhook/health`);
  console.log('📋 Cache de contatos:', `${BASE_URL}/webhook/cache`);
  console.log('📤 Envio de mensagens:', `${BASE_URL}/webhook/send-message`);
});

export default app; 