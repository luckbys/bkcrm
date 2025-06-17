// ========================================
// SERVIDOR WEBHOOK EVOLUTION API - VERSÃO APRIMORADA
// ========================================
// Funcionalidades Melhoradas:
// 1. Extração avançada de dados de contato (nome, telefone, foto de perfil)
// 2. Sistema de resposta automática inteligente
// 3. Cache de contatos para performance
// 4. Detecção inteligente de idioma
// 5. Processamento completo de mídias
// 6. Sistema de templates de resposta
// 7. Busca de informações do contato via Evolution API

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: './webhook.env' });

console.log('🔧 Carregando configurações das variáveis de ambiente...');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;
const BASE_URL = process.env.BASE_URL || 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

console.log('🚀 Configurações Evolution API:');
console.log(`📡 URL: ${EVOLUTION_API_URL}`);
console.log(`🔑 API Key: ${EVOLUTION_API_KEY ? '***configurada***' : '❌ não configurada'}`);

// Cache em memória para contatos (30 minutos)
const contactCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Classe para gerenciar dados de contato
class ContactData {
  constructor(data = {}) {
    this.phone = data.phone || '';
    this.name = data.name || '';
    this.profilePicUrl = data.profilePicUrl || '';
    this.status = data.status || '';
    this.isOnline = data.isOnline || false;
    this.lastSeen = data.lastSeen || null;
    this.pushName = data.pushName || '';
    this.language = data.language || 'pt-BR';
    this.metadata = data.metadata || {};
    this.lastCacheUpdate = Date.now();
  }

  isCacheValid() {
    return (Date.now() - this.lastCacheUpdate) < CACHE_DURATION;
  }

  detectLanguage(message) {
    const portuguese = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'por favor'];
    const english = ['hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'thank you', 'please'];
    const spanish = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'gracias', 'por favor'];
    
    const lowerMessage = message.toLowerCase();
    
    const ptCount = portuguese.filter(word => lowerMessage.includes(word)).length;
    const enCount = english.filter(word => lowerMessage.includes(word)).length;
    const esCount = spanish.filter(word => lowerMessage.includes(word)).length;
    
    if (ptCount > enCount && ptCount > esCount) return 'pt-BR';
    if (enCount > ptCount && enCount > esCount) return 'en-US';
    if (esCount > ptCount && esCount > enCount) return 'es-ES';
    
    return this.language || 'pt-BR';
  }

  updateMetadata(messageData) {
    this.metadata = {
      ...this.metadata,
      lastMessage: messageData.content?.substring(0, 100),
      lastMessageTime: new Date().toISOString(),
      messageCount: (this.metadata.messageCount || 0) + 1
    };
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Log de requisições avançado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`📥 [${timestamp}] ${req.method} ${req.path} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`);
  next();
});

// ENDPOINT PRINCIPAL - Webhook Evolution API
app.post('/webhook/evolution', async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      dataKeys: Object.keys(payload.data || {}),
      hasMedia: !!(payload.data?.message?.imageMessage || payload.data?.message?.videoMessage || payload.data?.message?.audioMessage)
    });

    let result = { success: false, message: 'Evento não processado' };

    // Processar diferentes tipos de eventos
    switch (payload.event) {
      case 'MESSAGES_UPSERT':
        result = await processAdvancedMessage(payload);
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
        
      case 'CONTACTS_SET':
      case 'CONTACTS_UPSERT':
      case 'CONTACTS_UPDATE':
        result = await processContactUpdate(payload);
        break;
        
      case 'CHATS_SET':
      case 'CHATS_UPSERT':
      case 'CHATS_UPDATE':
        result = await processChatUpdate(payload);
        break;
        
      case 'PRESENCE_UPDATE':
        result = await processPresenceUpdate(payload);
        break;
        
      case 'GROUPS_UPSERT':
      case 'GROUP_UPDATE':
      case 'GROUP_PARTICIPANTS_UPDATE':
        result = await processGroupUpdate(payload);
        break;
        
      default:
        console.log(`📋 Evento não processado: ${payload.event}`);
        result = { success: true, message: `Evento ${payload.event} recebido` };
    }

    // Resposta aprimorada
    res.status(200).json({ 
      received: true, 
      timestamp,
      event: payload.event || 'unknown',
      instance: payload.instance,
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId,
      contactId: result.contactId,
      metadata: result.metadata || {}
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

// PROCESSAMENTO AVANÇADO DE MENSAGENS
async function processAdvancedMessage(payload) {
  try {
    const messageData = payload.data;
    const instanceName = payload.instance;

    // Validar dados da mensagem
    if (!messageData?.key?.remoteJid) {
      throw new Error('Dados de mensagem inválidos');
    }

    // Extrair informações básicas
    const remoteJid = messageData.key.remoteJid;
    const fromMe = messageData.key.fromMe || false;
    const isGroup = remoteJid.includes('@g.us');
    
    // Ignorar mensagens enviadas por nós ou de grupos (opcional)
    if (fromMe) {
      console.log('🔄 Ignorando mensagem enviada por nós');
      return { success: true, message: 'Mensagem própria ignorada' };
    }

    if (isGroup) {
      console.log('👥 Mensagem de grupo recebida, processamento opcional');
      // Aqui você pode decidir se quer processar mensagens de grupos
    }

    // Extrair telefone
    const clientPhone = extractPhoneFromJid(remoteJid);
    console.log(`📱 Telefone extraído: ${clientPhone}`);

    // Extrair conteúdo da mensagem com suporte a mídia
    const messageContent = extractAdvancedMessageContent(messageData.message);
    console.log(`📨 Conteúdo extraído:`, {
      type: messageContent.type,
      hasText: !!messageContent.text,
      hasMedia: !!messageContent.mediaUrl,
      hasLocation: !!messageContent.location
    });

    // Buscar/criar dados do contato com informações enriquecidas
    const contactData = await extractContactData(clientPhone, messageData.pushName, instanceName, messageContent);
    
    // Atualizar metadados do contato
    contactData.updateMetadata(messageContent);
    
    // Detectar idioma da mensagem
    if (messageContent.text) {
      contactData.language = contactData.detectLanguage(messageContent.text);
    }

    console.log(`👤 Dados do contato:`, {
      name: contactData.name,
      phone: contactData.phone,
      language: contactData.language,
      isOnline: contactData.isOnline,
      messageCount: contactData.metadata.messageCount
    });

    // Verificar se deve enviar resposta automática
    const shouldAutoReply = await shouldSendAutoReply(clientPhone, contactData, messageContent);
    
    if (shouldAutoReply) {
      await sendIntelligentAutoReply(clientPhone, contactData, instanceName);
    }

    // Buscar departamento baseado na instância
    const departmentId = await findDepartmentByInstance(instanceName);
    
    // Buscar ticket existente ou criar novo
    let ticket = await findExistingTicket(clientPhone, departmentId);
    
    if (!ticket) {
      console.log('🎫 Criando novo ticket automaticamente...');
      
      const ticketData = {
        cliente: contactData.name,
        telefone: clientPhone,
        customerId: contactData.customerId,
        departmentId: departmentId,
        mensagem: messageContent.text || messageContent.caption || 'Mídia enviada',
        instancia: instanceName,
        contactData: contactData,
        messageType: messageContent.type
      };
      
      ticket = await createAdvancedTicket(ticketData);
    }

    // Salvar mensagem no banco com dados enriquecidos
    if (ticket) {
      const messageId = await saveAdvancedMessage({
        ticketId: ticket.id,
        content: messageContent.text || messageContent.caption || `[${messageContent.type.toUpperCase()}]`,
        sender: contactData.name,
        timestamp: new Date(messageData.messageTimestamp * 1000).toISOString(),
        metadata: {
          messageType: messageContent.type,
          mediaUrl: messageContent.mediaUrl,
          location: messageContent.location,
          quotedMessage: messageContent.quotedMessage,
          contactLanguage: contactData.language,
          contactStatus: contactData.status,
          isOnline: contactData.isOnline
        }
      });
      
      console.log('✅ Mensagem avançada processada com sucesso');
      
      return {
        success: true,
        message: 'Mensagem processada com dados enriquecidos',
        ticketId: ticket.id,
        messageId: messageId,
        contactId: contactData.customerId,
        metadata: {
          messageType: messageContent.type,
          language: contactData.language,
          hasMedia: !!messageContent.mediaUrl
        }
      };
    }

    return { success: false, message: 'Erro ao processar mensagem' };

  } catch (error) {
    console.error('❌ Erro no processamento avançado:', error);
    return { success: false, message: `Erro: ${error.message}` };
  }
}

// EXTRAÇÃO AVANÇADA DE DADOS DE CONTATO
async function extractContactData(phone, pushName, instanceName, messageContent) {
  const cacheKey = `contact_${phone}`;
  
  // Verificar cache primeiro
  if (contactCache.has(cacheKey)) {
    const cached = contactCache.get(cacheKey);
    if (cached.isCacheValid()) {
      console.log(`📋 Usando dados em cache para ${phone}`);
      return cached;
    } else {
      contactCache.delete(cacheKey);
    }
  }

  console.log(`🔍 Extraindo dados completos do contato: ${phone}`);
  
  // Criar objeto de dados do contato
  let contactData = new ContactData({
    phone: phone,
    name: pushName || 'Cliente Anônimo',
    pushName: pushName
  });

  try {
    // Buscar informações detalhadas via Evolution API
    const evolutionContact = await fetchContactInfoFromEvolution(phone, instanceName);
    
    if (evolutionContact) {
      contactData.name = evolutionContact.name || pushName || 'Cliente Anônimo';
      contactData.profilePicUrl = evolutionContact.profilePicUrl || '';
      contactData.status = evolutionContact.status || '';
      contactData.isOnline = evolutionContact.isOnline || false;
      contactData.lastSeen = evolutionContact.lastSeen || null;
    }

    // Buscar/criar cliente no banco de dados
    const customer = await findOrCreateAdvancedCustomer({
      phone: phone,
      name: contactData.name,
      profilePicUrl: contactData.profilePicUrl,
      status: contactData.status,
      language: contactData.language,
      instanceName: instanceName
    });

    if (customer) {
      contactData.customerId = customer.id;
    }

    // Armazenar no cache
    contactCache.set(cacheKey, contactData);
    console.log(`✅ Dados do contato extraídos e armazenados em cache`);

  } catch (error) {
    console.error(`⚠️ Erro ao extrair dados do contato ${phone}:`, error.message);
    // Continuar com dados básicos mesmo se houver erro
  }

  return contactData;
}

// BUSCAR INFORMAÇÕES DETALHADAS VIA EVOLUTION API
async function fetchContactInfoFromEvolution(phone, instanceName) {
  try {
    console.log(`🔎 Buscando informações detalhadas do contato ${phone} via Evolution API`);
    
    // Endpoint para buscar contato
    const response = await axios.get(
      `${EVOLUTION_API_URL}/chat/findContact/${instanceName}`,
      {
        params: {
          number: formatPhoneNumber(phone)
        },
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.length > 0) {
      const contact = response.data[0];
      
      // Buscar foto do perfil se disponível
      let profilePicUrl = '';
      try {
        const picResponse = await axios.get(
          `${EVOLUTION_API_URL}/chat/getProfilePicUrl/${instanceName}`,
          {
            params: {
              number: formatPhoneNumber(phone)
            },
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY
            },
            timeout: 5000
          }
        );
        profilePicUrl = picResponse.data?.profilePicUrl || '';
      } catch (picError) {
        console.log(`📷 Não foi possível obter foto do perfil para ${phone}`);
      }

      console.log(`✅ Informações detalhadas obtidas para ${phone}`);
      
      return {
        name: contact.name || contact.pushName || '',
        profilePicUrl: profilePicUrl,
        status: contact.status || '',
        isOnline: contact.presence === 'available',
        lastSeen: contact.lastSeen || null
      };
    }

    return null;

  } catch (error) {
    console.error(`❌ Erro ao buscar informações via Evolution API para ${phone}:`, error.message);
    return null;
  }
}

// EXTRAIR CONTEÚDO AVANÇADO DA MENSAGEM (SUPORTE A MÍDIA)
function extractAdvancedMessageContent(message) {
  if (!message) return { type: 'unknown', text: '' };

  // Mensagem de texto simples
  if (message.conversation) {
    return {
      type: 'text',
      text: message.conversation,
      timestamp: Date.now()
    };
  }

  // Mensagem com texto estendido
  if (message.extendedTextMessage) {
    return {
      type: 'text',
      text: message.extendedTextMessage.text,
      quotedMessage: message.extendedTextMessage.contextInfo?.quotedMessage,
      timestamp: Date.now()
    };
  }

  // Imagem
  if (message.imageMessage) {
    return {
      type: 'image',
      caption: message.imageMessage.caption || '',
      mediaUrl: message.imageMessage.url || '',
      mimetype: message.imageMessage.mimetype || '',
      filesize: message.imageMessage.fileLength || 0,
      timestamp: Date.now()
    };
  }

  // Vídeo
  if (message.videoMessage) {
    return {
      type: 'video',
      caption: message.videoMessage.caption || '',
      mediaUrl: message.videoMessage.url || '',
      mimetype: message.videoMessage.mimetype || '',
      filesize: message.videoMessage.fileLength || 0,
      duration: message.videoMessage.seconds || 0,
      timestamp: Date.now()
    };
  }

  // Áudio/Nota de voz
  if (message.audioMessage) {
    return {
      type: message.audioMessage.ptt ? 'voice' : 'audio',
      mediaUrl: message.audioMessage.url || '',
      mimetype: message.audioMessage.mimetype || '',
      filesize: message.audioMessage.fileLength || 0,
      duration: message.audioMessage.seconds || 0,
      timestamp: Date.now()
    };
  }

  // Documento
  if (message.documentMessage) {
    return {
      type: 'document',
      filename: message.documentMessage.fileName || 'documento',
      mediaUrl: message.documentMessage.url || '',
      mimetype: message.documentMessage.mimetype || '',
      filesize: message.documentMessage.fileLength || 0,
      timestamp: Date.now()
    };
  }

  // Localização
  if (message.locationMessage) {
    return {
      type: 'location',
      latitude: message.locationMessage.degreesLatitude,
      longitude: message.locationMessage.degreesLongitude,
      location: {
        lat: message.locationMessage.degreesLatitude,
        lng: message.locationMessage.degreesLongitude,
        name: message.locationMessage.name || '',
        address: message.locationMessage.address || ''
      },
      timestamp: Date.now()
    };
  }

  // Contato
  if (message.contactMessage) {
    return {
      type: 'contact',
      displayName: message.contactMessage.displayName || '',
      vcard: message.contactMessage.vcard || '',
      timestamp: Date.now()
    };
  }

  // Sticker
  if (message.stickerMessage) {
    return {
      type: 'sticker',
      mediaUrl: message.stickerMessage.url || '',
      mimetype: message.stickerMessage.mimetype || '',
      timestamp: Date.now()
    };
  }

  // Tipo não reconhecido
  console.log('⚠️ Tipo de mensagem não reconhecido:', Object.keys(message));
  return {
    type: 'unknown',
    text: '',
    rawMessage: message,
    timestamp: Date.now()
  };
}

// LÓGICA DE RESPOSTA AUTOMÁTICA INTELIGENTE
async function shouldSendAutoReply(phone, contactData, messageContent) {
  try {
    // Verificar se é a primeira mensagem nas últimas 24 horas
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id, created_at')
      .ilike('metadata->>whatsapp_phone', `%${phone}%`)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const isFirstMessageToday = !recentMessages || recentMessages.length === 0;
    
    // Verificar horário comercial (9h às 18h, segunda a sexta)
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 6 = sábado
    const isBusinessHours = (day >= 1 && day <= 5) && (hour >= 9 && hour <= 18);

    console.log(`🤖 Verificação de resposta automática:`, {
      phone,
      isFirstMessageToday,
      isBusinessHours,
      messageType: messageContent.type
    });

    // Enviar resposta automática apenas se:
    // 1. É a primeira mensagem do dia
    // 2. Não é mídia (evitar responder a stickers, etc.)
    // 3. Dentro ou fora do horário comercial (mensagens diferentes)
    return isFirstMessageToday && ['text', 'voice'].includes(messageContent.type);

  } catch (error) {
    console.error('❌ Erro ao verificar necessidade de resposta automática:', error);
    return false;
  }
}

// ENVIAR RESPOSTA AUTOMÁTICA INTELIGENTE
async function sendIntelligentAutoReply(phone, contactData, instanceName) {
  try {
    console.log(`🤖 Enviando resposta automática inteligente para ${phone}`);

    // Detectar horário comercial
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isBusinessHours = (day >= 1 && day <= 5) && (hour >= 9 && hour <= 18);

    // Templates de resposta baseados no idioma detectado
    const templates = {
      'pt-BR': {
        business: `Olá ${contactData.name}! 👋\n\nObrigado por entrar em contato conosco. Recebemos sua mensagem e um de nossos atendentes irá responder em breve.\n\n⏰ Horário de atendimento: Segunda a Sexta, 9h às 18h\n\nEm caso de urgência, digite *URGENTE* que priorizaremos seu atendimento.`,
        afterHours: `Olá ${contactData.name}! 👋\n\nRecebemos sua mensagem fora do nosso horário de atendimento.\n\n⏰ Retornaremos na próxima segunda-feira às 9h\n🌙 Para urgências, nossa equipe de plantão está disponível.\n\nDigite *PLANTÃO* se precisar de atendimento imediato.`
      },
      'en-US': {
        business: `Hello ${contactData.name}! 👋\n\nThank you for contacting us. We received your message and one of our agents will respond shortly.\n\n⏰ Business hours: Monday to Friday, 9 AM to 6 PM\n\nFor urgent matters, type *URGENT* and we'll prioritize your request.`,
        afterHours: `Hello ${contactData.name}! 👋\n\nWe received your message outside our business hours.\n\n⏰ We'll get back to you on Monday at 9 AM\n🌙 For emergencies, our on-call team is available.\n\nType *EMERGENCY* if you need immediate assistance.`
      },
      'es-ES': {
        business: `¡Hola ${contactData.name}! 👋\n\nGracias por contactarnos. Hemos recibido tu mensaje y uno de nuestros agentes responderá pronto.\n\n⏰ Horario de atención: Lunes a Viernes, 9h a 18h\n\nPara asuntos urgentes, escribe *URGENTE* y priorizaremos tu solicitud.`,
        afterHours: `¡Hola ${contactData.name}! 👋\n\nRecibimos tu mensaje fuera de nuestro horario de atención.\n\n⏰ Te responderemos el lunes a las 9h\n🌙 Para emergencias, nuestro equipo de guardia está disponible.\n\nEscribe *EMERGENCIA* si necesitas asistencia inmediata.`
      }
    };

    const language = contactData.language || 'pt-BR';
    const template = templates[language] || templates['pt-BR'];
    const message = isBusinessHours ? template.business : template.afterHours;

    // Enviar resposta automática
    const result = await sendAdvancedWhatsAppMessage({
      phone: phone,
      text: message,
      instance: instanceName,
      options: {
        delay: 2000, // 2 segundos de delay
        presence: 'composing'
      }
    });

    if (result.success) {
      console.log(`✅ Resposta automática enviada com sucesso para ${phone}`);
    } else {
      console.error(`❌ Erro ao enviar resposta automática para ${phone}:`, result.error);
    }

  } catch (error) {
    console.error('❌ Erro na resposta automática inteligente:', error);
  }
}

// BUSCAR/CRIAR CLIENTE COM DADOS ENRIQUECIDOS
async function findOrCreateAdvancedCustomer({ phone, name, profilePicUrl, status, language, instanceName }) {
  try {
    console.log(`🔍 Buscando/criando cliente avançado: ${phone}`);

    // Buscar cliente existente primeiro por telefone
    const { data: existingCustomer, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .or(`phone.eq.${phone},metadata->>phone.eq.${phone}`)
      .eq('role', 'customer')
      .single();

    if (existingCustomer && !searchError) {
      console.log(`✅ Cliente existente encontrado: ${existingCustomer.id}`);
      
      // Atualizar dados se necessário
      const updatedMetadata = {
        ...existingCustomer.metadata,
        phone: phone,
        whatsapp_phone: phone,
        profile_pic_url: profilePicUrl || existingCustomer.metadata?.profile_pic_url,
        status: status || existingCustomer.metadata?.status,
        language: language || existingCustomer.metadata?.language || 'pt-BR',
        last_seen: new Date().toISOString(),
        instance_name: instanceName
      };

      const { data: updatedCustomer, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name || existingCustomer.name,
          metadata: updatedMetadata
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (!updateError) {
        console.log(`🔄 Dados do cliente atualizados: ${updatedCustomer.id}`);
        return updatedCustomer;
      }
    }

    // Criar novo cliente com dados enriquecidos
    console.log(`🆕 Criando novo cliente avançado...`);
    
    const { data: newCustomer, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        name: name || 'Cliente WhatsApp',
        email: `whatsapp-${phone}@auto-generated.com`,
        role: 'customer',
        phone: phone,
        metadata: {
          phone: phone,
          whatsapp_phone: phone,
          profile_pic_url: profilePicUrl || '',
          status: status || '',
          language: language || 'pt-BR',
          source: 'whatsapp_webhook',
          instance_name: instanceName,
          created_via: 'evolution_api',
          first_contact: new Date().toISOString(),
          category: 'standard',
          tags: ['whatsapp', 'auto-created']
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar cliente:', createError);
      return null;
    }

    console.log(`✅ Novo cliente criado: ${newCustomer.id}`);
    return newCustomer;

  } catch (error) {
    console.error('❌ Erro na busca/criação de cliente avançado:', error);
    return null;
  }
}

// CRIAR TICKET COM DADOS AVANÇADOS
async function createAdvancedTicket(data) {
  try {
    console.log('🎫 Criando ticket avançado:', {
      cliente: data.cliente,
      telefone: data.telefone,
      messageType: data.messageType
    });

    const ticketData = {
      title: `${data.messageType === 'voice' ? '🎤' : data.messageType === 'image' ? '🖼️' : '💬'} ${data.cliente}`,
      description: data.mensagem,
      status: 'open',
      priority: 'normal',
      channel: 'whatsapp',
      customer_id: data.customerId,
      department_id: data.departmentId,
      metadata: {
        whatsapp_phone: data.telefone,
        client_phone: data.telefone,
        client_name: data.cliente,
        instance_name: data.instancia,
        message_type: data.messageType,
        contact_language: data.contactData?.language || 'pt-BR',
        contact_status: data.contactData?.status || '',
        profile_pic_url: data.contactData?.profilePicUrl || '',
        first_message: data.mensagem,
        created_via: 'evolution_webhook',
        is_whatsapp: true
      }
    };

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket avançado:', error);
      return null;
    }

    console.log(`✅ Ticket avançado criado: ${ticket.id}`);
    return ticket;

  } catch (error) {
    console.error('❌ Erro na criação de ticket avançado:', error);
    return null;
  }
}

// SALVAR MENSAGEM COM METADADOS AVANÇADOS
async function saveAdvancedMessage(data) {
  try {
    const messageData = {
      ticket_id: data.ticketId,
      content: data.content,
      sender_type: 'customer',
      sender_name: data.sender,
      created_at: data.timestamp,
      metadata: {
        ...data.metadata,
        source: 'whatsapp_webhook',
        processed_at: new Date().toISOString()
      }
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar mensagem avançada:', error);
      return null;
    }

    console.log(`✅ Mensagem avançada salva: ${message.id}`);
    return message.id;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem avançada:', error);
    return null;
  }
}

// ENVIO AVANÇADO DE MENSAGENS VIA EVOLUTION API
async function sendAdvancedWhatsAppMessage(messageData) {
  try {
    const { phone, text, instance = 'atendimento-ao-cliente-sac1', options = {} } = messageData;

    if (!phone || !text) {
      throw new Error('Telefone e texto são obrigatórios');
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    console.log('📤 Enviando mensagem avançada via Evolution API:', {
      instance,
      phone: formattedPhone,
      text: text.substring(0, 50) + '...',
      hasOptions: Object.keys(options).length > 0
    });

    // Payload otimizado conforme documentação Evolution API
    const payload = {
      number: formattedPhone,
      text: text,
      options: {
        delay: options.delay || 1000,
        presence: options.presence || 'composing',
        linkPreview: options.linkPreview !== false,
        quoted: options.quoted || null,
        ...options
      }
    };

    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${instance}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        timeout: 30000
      }
    );

    console.log('✅ Mensagem avançada enviada:', {
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
    console.error('❌ Erro ao enviar mensagem avançada:', {
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

// FUNÇÕES AUXILIARES APRIMORADAS
function extractPhoneFromJid(jid) {
  if (!jid) return '';
  
  // Remove sufixos WhatsApp (@s.whatsapp.net, @g.us, etc.)
  let cleaned = jid.split('@')[0];
  
  // Remove caracteres não numéricos
  cleaned = cleaned.replace(/\D/g, '');
  
  // Validar se é um número válido (mínimo 10 dígitos)
  if (cleaned.length < 10) {
    console.warn(`⚠️ Número de telefone muito curto: ${cleaned}`);
    return cleaned;
  }
  
  console.log(`📱 Telefone extraído de JID ${jid}: ${cleaned}`);
  return cleaned;
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  
  // Adicionar código do país Brasil se necessário
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  
  // Remover sufixo WhatsApp se presente
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  
  return cleaned;
}

async function findDepartmentByInstance(instanceName) {
  try {
    const { data: instance } = await supabase
      .from('evolution_instances')
      .select('department_id')
      .eq('instance_name', instanceName)
      .single();
    
    return instance?.department_id || null;
  } catch (error) {
    console.warn(`⚠️ Departamento não encontrado para instância ${instanceName}`);
    return null;
  }
}

async function findExistingTicket(clientPhone, departmentId) {
  try {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .or(`metadata->>whatsapp_phone.eq.${clientPhone},metadata->>client_phone.eq.${clientPhone}`)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);

    return tickets && tickets.length > 0 ? tickets[0] : null;
  } catch (error) {
    console.error('❌ Erro ao buscar ticket existente:', error);
    return null;
  }
}

// PROCESSADORES DE EVENTOS ADICIONAIS
async function processPresenceUpdate(payload) {
  console.log('👁️ Atualização de presença recebida:', payload.data);
  return { success: true, message: 'Presença atualizada' };
}

async function processGroupUpdate(payload) {
  console.log('👥 Atualização de grupo recebida:', payload.data);
  return { success: true, message: 'Grupo atualizado' };
}

async function processQRCodeUpdate(payload) {
  console.log('📱 QR Code atualizado:', payload.instance);
  return { success: true, message: 'QR Code processado' };
}

async function processConnectionUpdate(payload) {
  console.log('🔌 Status de conexão:', payload.data);
  return { success: true, message: 'Conexão atualizada' };
}

async function processSentMessage(payload) {
  console.log('📤 Mensagem enviada confirmada:', payload.data);
  return { success: true, message: 'Envio confirmado' };
}

async function processContactUpdate(payload) {
  console.log('👤 Contato atualizado:', payload.data);
  return { success: true, message: 'Contato processado' };
}

async function processChatUpdate(payload) {
  console.log('💬 Chat atualizado:', payload.data);
  return { success: true, message: 'Chat processado' };
}

// ENDPOINTS AUXILIARES APRIMORADOS
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Evolution Webhook Integration - APRIMORADO',
    version: '2.0.0',
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    features: [
      'Extração avançada de dados de contato',
      'Suporte completo a mídia (imagem, vídeo, áudio, documentos)',
      'Respostas automáticas inteligentes',
      'Cache de performance',
      'Detecção de idioma',
      'Horário comercial',
      'Metadados enriquecidos'
    ],
    endpoints: {
      webhook: `${BASE_URL}/webhook/evolution`,
      health: `${BASE_URL}/webhook/health`,
      cache: `${BASE_URL}/webhook/cache`,
      clearCache: `${BASE_URL}/webhook/clear-cache`,
      sendMessage: `${BASE_URL}/webhook/send-message`,
      sendMedia: `${BASE_URL}/webhook/send-media`,
      checkInstance: `${BASE_URL}/webhook/check-instance`
    }
  });
});

app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Evolution Webhook Integration - APRIMORADO',
    supabase: supabaseUrl,
    evolutionApi: EVOLUTION_API_URL,
    cache: {
      size: contactCache.size,
      entries: Array.from(contactCache.keys())
    },
    timestamp: new Date().toISOString()
  });
});

// Endpoint para visualizar cache
app.get('/webhook/cache', (req, res) => {
  const cacheData = Array.from(contactCache.entries()).map(([key, value]) => ({
    key,
    name: value.name,
    phone: value.phone,
    language: value.language,
    lastUpdate: new Date(value.lastCacheUpdate).toISOString(),
    isValid: value.isCacheValid()
  }));

  res.json({
    size: contactCache.size,
    entries: cacheData
  });
});

// Endpoint para limpar cache
app.post('/webhook/clear-cache', (req, res) => {
  const sizeBefore = contactCache.size;
  contactCache.clear();
  
  res.json({
    message: 'Cache limpo com sucesso',
    entriesCleared: sizeBefore,
    timestamp: new Date().toISOString()
  });
});

// Endpoint avançado para envio de mensagens
app.post('/webhook/send-message', async (req, res) => {
  try {
    const { phone, text, instance, options } = req.body;
    
    console.log('📤 [SEND] Solicitação de envio de mensagem:', {
      phone,
      text: text?.substring(0, 50) + '...',
      instance,
      hasOptions: !!options
    });

    const result = await sendAdvancedWhatsAppMessage({
      phone,
      text,
      instance: instance || 'atendimento-ao-cliente-sac1',
      options: options || {}
    });

    console.log('📤 [SEND] Resultado do envio:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    res.json(result);

  } catch (error) {
    console.error('❌ [SEND] Erro no endpoint de envio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar status da instância
app.post('/webhook/check-instance', async (req, res) => {
  try {
    const { instance } = req.body;
    const instanceName = instance || 'atendimento-ao-cliente-sac1';
    
    console.log(`🔌 [CHECK] Verificando status da instância: ${instanceName}`);

    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY
        },
        timeout: 10000
      }
    );
    
    console.log(`📊 Status da instância ${instanceName}:`, response.data);
    
    res.json({
      success: true,
      instance: response.data,
      isConnected: response.data.state === 'open'
    });

  } catch (error) {
    console.error('❌ [CHECK] Erro ao verificar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      isConnected: false
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Evolution Webhook Integration APRIMORADO rodando na porta ${PORT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📡 Webhook URL: ${BASE_URL}/webhook/evolution`);
  console.log(`🗄️ Supabase: ${supabaseUrl}`);
  console.log(`🏥 Health check: ${BASE_URL}/webhook/health`);
  console.log(`🔧 Cache de contatos: ATIVO (${CACHE_DURATION / 60000} min)`);
  console.log(`🤖 Respostas automáticas: ATIVAS`);
  console.log(`📱 Suporte a mídia: COMPLETO`);
  console.log(`🌍 Detecção de idioma: ATIVA`);
});

// Tratamento aprimorado de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  // Não encerrar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  // Não encerrar o processo, apenas logar
});

// Limpeza automática do cache a cada hora
setInterval(() => {
  const before = contactCache.size;
  const now = Date.now();
  
  for (const [key, contact] of contactCache.entries()) {
    if (!contact.isCacheValid()) {
      contactCache.delete(key);
    }
  }
  
  const after = contactCache.size;
  if (before > after) {
    console.log(`🧹 Cache limpo automaticamente: ${before - after} entradas removidas`);
  }
}, 60 * 60 * 1000); // 1 hora

export default app; 