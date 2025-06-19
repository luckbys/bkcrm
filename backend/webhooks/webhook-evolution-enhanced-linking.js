const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Configurações
const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU2ODgwNCwiZXhwIjoyMDUwMTQ0ODA0fQ.gqhGSI0hMNa8n4rFIGAHB0WSnRs7Vgm5FWqCYAb6uXU';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Ag4WNOqCFRV4YVQOIKm9LTUi9tgkJN9JYyG8zS4B6LPy4YrGWWcFqOFgFeCFzRGH';

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());

console.log(`🚀 Webhook Evolution API v3.0 - ENHANCED LINKING - rodando na porta ${PORT}`);
console.log(`📋 Melhorias implementadas:
   🔗 Vinculação inteligente de clientes
   📊 Sistema de scoring para matches
   🤖 Criação automática otimizada
   📱 Dados enriquecidos do WhatsApp
   🔄 Sincronização bidirecional
   💾 Persistência aprimorada`);

// ==========================================
// SISTEMA DE VINCULAÇÃO INTELIGENTE
// ==========================================

// Extrair e normalizar telefone com detecção de país
function extractAndNormalizePhone(jid, pushName = null) {
  try {
    if (!jid) return { isValid: false, reason: 'JID não fornecido' };

    // Extrair número do JID
    const phoneNumber = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    
    if (!/^\d+$/.test(phoneNumber)) {
      return { isValid: false, reason: 'JID não é um número válido' };
    }

    let phone = phoneNumber;
    let country = 'unknown';
    let format = 'international';
    let phoneFormatted = phone;

    // Detectar país e formatar
    if (phone.startsWith('55') && phone.length >= 12) {
      // Brasil
      country = 'brazil';
      const ddd = phone.substring(2, 4);
      const number = phone.substring(4);
      
      if (number.length === 9) {
        format = 'brazil_mobile';
        phoneFormatted = `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
      } else if (number.length === 8) {
        format = 'brazil_landline';
        phoneFormatted = `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
      }
    } else if (phone.startsWith('1') && phone.length === 11) {
      // EUA/Canadá
      country = phone.substring(1, 4) <= '999' ? 'usa' : 'canada';
      format = 'north_america';
      phoneFormatted = `+1 (${phone.substring(1, 4)}) ${phone.substring(4, 7)}-${phone.substring(7)}`;
    }

    return {
      isValid: true,
      phone,
      phoneFormatted,
      whatsappJid: jid,
      country,
      format,
      canReply: true,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erro ao extrair telefone:', error);
    return { isValid: false, reason: error.message };
  }
}

// Calcular similaridade entre strings
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const cleanStr1 = str1.toLowerCase().trim();
  const cleanStr2 = str2.toLowerCase().trim();
  
  if (cleanStr1 === cleanStr2) return 1;
  
  // Levenshtein distance simplificado
  const matrix = Array(cleanStr2.length + 1).fill(null).map(() => Array(cleanStr1.length + 1).fill(null));
  
  for (let i = 0; i <= cleanStr1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= cleanStr2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= cleanStr2.length; j++) {
    for (let i = 1; i <= cleanStr1.length; i++) {
      const cost = cleanStr1[i - 1] === cleanStr2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(cleanStr1.length, cleanStr2.length);
  return 1 - (matrix[cleanStr2.length][cleanStr1.length] / maxLength);
}

// Buscar cliente existente com sistema de scoring
async function findExistingCustomerAdvanced(phoneInfo, pushName) {
  try {
    console.log('🔍 Buscando cliente existente com scoring avançado...');

    // Buscar todos os clientes
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .eq('is_active', true);

    if (error) throw error;
    if (!customers || customers.length === 0) {
      return { customer: null, score: 0, method: 'no_customers' };
    }

    console.log(`📊 Analisando ${customers.length} clientes existentes...`);

    let bestMatch = null;
    let bestScore = 0;
    let bestMethod = 'no_match';

    for (const customer of customers) {
      const metadata = customer.metadata || {};
      let score = 0;
      let method = 'fuzzy';

      // Score por telefone (mais importante)
      if (phoneInfo.phone && metadata.phone) {
        const customerPhone = metadata.phone.replace(/\D/g, '');
        const searchPhone = phoneInfo.phone.replace(/\D/g, '');
        
        if (customerPhone === searchPhone) {
          score += 100; // Match exato
          method = 'phone_exact';
        } else if (customerPhone.endsWith(searchPhone.slice(-9)) || searchPhone.endsWith(customerPhone.slice(-9))) {
          score += 85; // Match por últimos 9 dígitos
          method = 'phone_partial';
        }
      }

      // Score por nome
      if (pushName && customer.name) {
        const nameSimilarity = calculateSimilarity(pushName, customer.name);
        if (nameSimilarity >= 0.9) {
          score += 70;
          if (method === 'fuzzy') method = 'name_exact';
        } else if (nameSimilarity >= 0.7) {
          score += 50;
          if (method === 'fuzzy') method = 'name_similar';
        } else if (nameSimilarity >= 0.5) {
          score += 30;
          if (method === 'fuzzy') method = 'name_partial';
        }
      }

      // Score por WhatsApp JID
      if (phoneInfo.whatsappJid && metadata.whatsapp_jid === phoneInfo.whatsappJid) {
        score += 95;
        method = 'jid_exact';
      }

      // Score por histórico de contatos
      if (metadata.contact_history) {
        const hasRecentContact = metadata.contact_history.some(contact => 
          Date.now() - new Date(contact.date).getTime() < 30 * 24 * 60 * 60 * 1000 // 30 dias
        );
        if (hasRecentContact) score += 20;
      }

      console.log(`👤 Cliente ${customer.name}: ${score} pontos (${method})`);

      if (score > bestScore) {
        bestMatch = customer;
        bestScore = score;
        bestMethod = method;
      }
    }

    if (bestMatch && bestScore >= 70) {
      console.log(`✅ Melhor match: ${bestMatch.name} (${bestScore} pontos, ${bestMethod})`);
      return { customer: bestMatch, score: bestScore, method: bestMethod };
    }

    console.log(`❌ Nenhum match satisfatório (melhor: ${bestScore} pontos)`);
    return { customer: null, score: bestScore, method: 'insufficient_score' };

  } catch (error) {
    console.error('❌ Erro na busca avançada:', error);
    return { customer: null, score: 0, method: 'error' };
  }
}

// Criar cliente com dados enriquecidos
async function createEnhancedCustomer(phoneInfo, pushName, instanceName) {
  try {
    console.log('➕ Criando cliente enriquecido...');

    const name = pushName || `Cliente ${phoneInfo.phone.slice(-4)}`;
    const email = `whatsapp-${phoneInfo.phone}@auto-generated.com`;

    // Metadados enriquecidos
    const enrichedMetadata = {
      phone: phoneInfo.phone,
      phone_formatted: phoneInfo.phoneFormatted,
      whatsapp_jid: phoneInfo.whatsappJid,
      country: phoneInfo.country,
      phone_format: phoneInfo.format,
      instance_name: instanceName,
      source: 'whatsapp_webhook_enhanced',
      created_via: 'enhanced_linking',
      category: 'bronze',
      status: 'active',
      tags: ['whatsapp', 'auto-created', 'enhanced'],
      first_contact: new Date().toISOString(),
      can_reply: true,
      auto_generated_email: true,
      contact_history: [
        {
          date: new Date().toISOString(),
          instance: instanceName,
          method: 'whatsapp_first_contact',
          phone_info: phoneInfo
        }
      ],
      enhanced_processing: true,
      response_data: {
        phone_for_reply: phoneInfo.phone,
        formatted_display: phoneInfo.phoneFormatted,
        whatsapp_jid: phoneInfo.whatsappJid,
        instance_name: instanceName,
        can_reply: true,
        last_seen: new Date().toISOString()
      }
    };

    // Inserir no banco
    const { data: newCustomer, error } = await supabase
      .from('profiles')
      .insert({
        name,
        email,
        role: 'customer',
        is_active: true,
        metadata: enrichedMetadata
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Cliente enriquecido criado: ${newCustomer.id} (${name})`);
    return newCustomer;

  } catch (error) {
    console.error('❌ Erro ao criar cliente enriquecido:', error);
    throw error;
  }
}

// Enriquecer cliente existente
async function enrichExistingCustomer(customerId, phoneInfo, instanceName) {
  try {
    console.log(`🔄 Enriquecendo cliente existente: ${customerId}`);

    // Buscar dados atuais
    const { data: currentCustomer, error } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    const currentMetadata = currentCustomer?.metadata || {};

    // Atualizar metadados
    const updatedMetadata = {
      ...currentMetadata,
      phone: phoneInfo.phone,
      phone_formatted: phoneInfo.phoneFormatted,
      whatsapp_jid: phoneInfo.whatsappJid,
      country: phoneInfo.country,
      phone_format: phoneInfo.format,
      last_whatsapp_contact: new Date().toISOString(),
      last_instance: instanceName,
      total_whatsapp_contacts: (currentMetadata.total_whatsapp_contacts || 0) + 1,
      enhanced_processing: true,
      contact_history: [
        ...(currentMetadata.contact_history || []).slice(-9), // Manter últimos 10
        {
          date: new Date().toISOString(),
          instance: instanceName,
          method: 'whatsapp_contact',
          phone_info: phoneInfo
        }
      ],
      response_data: {
        ...currentMetadata.response_data,
        phone_for_reply: phoneInfo.phone,
        formatted_display: phoneInfo.phoneFormatted,
        whatsapp_jid: phoneInfo.whatsappJid,
        instance_name: instanceName,
        can_reply: true,
        last_seen: new Date().toISOString()
      }
    };

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    console.log(`✅ Cliente enriquecido: ${customerId}`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao enriquecer cliente:', error);
    return false;
  }
}

// Função principal de vinculação inteligente
async function intelligentCustomerLinking(phoneInfo, pushName, instanceName) {
  try {
    console.log('🧠 Iniciando vinculação inteligente de cliente...');

    // 1. Buscar cliente existente
    const { customer: existingCustomer, score, method } = await findExistingCustomerAdvanced(phoneInfo, pushName);

    if (existingCustomer && score >= 70) {
      // Cliente encontrado - enriquecer dados
      console.log(`🔗 Vinculando ao cliente existente (${score}% confiança)`);
      await enrichExistingCustomer(existingCustomer.id, phoneInfo, instanceName);
      
      return {
        customerId: existingCustomer.id,
        method: 'existing_enriched',
        confidence: score,
        details: {
          name: existingCustomer.name,
          match_method: method,
          enriched: true
        }
      };
    }

    // 2. Criar novo cliente com dados enriquecidos
    console.log('➕ Criando novo cliente com vinculação inteligente...');
    const newCustomer = await createEnhancedCustomer(phoneInfo, pushName, instanceName);

    return {
      customerId: newCustomer.id,
      method: 'created_enhanced',
      confidence: 100,
      details: {
        name: newCustomer.name,
        match_method: 'new_customer',
        enriched: true
      }
    };

  } catch (error) {
    console.error('❌ Erro na vinculação inteligente:', error);
    throw error;
  }
}

// Buscar ou criar ticket com vinculação aprimorada
async function findOrCreateTicketEnhanced(linkingResult, phoneInfo, instanceName) {
  try {
    console.log(`🎫 Gerenciando ticket para cliente: ${linkingResult.customerId}`);

    // Buscar ticket aberto existente
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', linkingResult.customerId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingTickets && existingTickets.length > 0) {
      const ticket = existingTickets[0];
      console.log(`✅ Ticket existente encontrado: ${ticket.id}`);
      
      // Atualizar última atividade
      await supabase
        .from('tickets')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      return ticket.id;
    }

    // Criar novo ticket com dados enriquecidos
    console.log(`➕ Criando novo ticket enriquecido...`);
    
    const ticketMetadata = {
      client_name: linkingResult.details.name,
      client_phone: phoneInfo.phone,
      phone_formatted: phoneInfo.phoneFormatted,
      whatsapp_jid: phoneInfo.whatsappJid,
      whatsapp_phone: phoneInfo.phone,
      instance_name: instanceName,
      country: phoneInfo.country,
      phone_format: phoneInfo.format,
      source: 'webhook_evolution_enhanced',
      created_via: 'intelligent_linking',
      is_whatsapp: true,
      can_reply: true,
      enhanced_processing: true,
      linking_method: linkingResult.method,
      linking_confidence: linkingResult.confidence,
      phone_info: phoneInfo,
      response_data: {
        phone_for_reply: phoneInfo.phone,
        formatted_display: phoneInfo.phoneFormatted,
        whatsapp_jid: phoneInfo.whatsappJid,
        instance_name: instanceName,
        can_reply: true
      }
    };

    const ticketData = {
      id: crypto.randomUUID(),
      title: `WhatsApp: ${linkingResult.details.name}`,
      description: `Conversa iniciada via WhatsApp (${instanceName})`,
      status: 'open',
      priority: 'medium',
      customer_id: linkingResult.customerId,
      channel: 'whatsapp',
      phone: phoneInfo.phone,
      metadata: ticketMetadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    };

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Ticket enriquecido criado: ${newTicket.id}`);
    return newTicket.id;

  } catch (error) {
    console.error('❌ Erro ao gerenciar ticket:', error);
    throw error;
  }
}

// Salvar mensagem com contexto enriquecido
async function saveEnhancedMessage(ticketId, messageData, linkingResult, phoneInfo, instanceName) {
  try {
    const isFromMe = messageData.key?.fromMe || false;
    let content = '[Mensagem]';
    let messageType = 'text';

    // Extrair conteúdo da mensagem
    if (messageData.message?.conversation) {
      content = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      content = messageData.message.extendedTextMessage.text;
    } else if (messageData.message?.imageMessage) {
      content = `[Imagem: ${messageData.message.imageMessage.caption || 'Sem legenda'}]`;
      messageType = 'image';
    } else if (messageData.message?.videoMessage) {
      content = `[Vídeo: ${messageData.message.videoMessage.caption || 'Sem legenda'}]`;
      messageType = 'video';
    } else if (messageData.message?.audioMessage) {
      content = '[Áudio]';
      messageType = 'audio';
    } else if (messageData.message?.documentMessage) {
      content = `[Documento: ${messageData.message.documentMessage.fileName || 'Arquivo'}]`;
      messageType = 'document';
    }

    // Metadados enriquecidos da mensagem
    const messageMetadata = {
      whatsapp_message_id: messageData.key?.id,
      whatsapp_phone: phoneInfo.phone,
      phone_formatted: phoneInfo.phoneFormatted,
      whatsapp_jid: phoneInfo.whatsappJid,
      instance_name: instanceName,
      push_name: messageData.pushName,
      message_timestamp: messageData.messageTimestamp,
      from_me: isFromMe,
      status: messageData.status,
      country: phoneInfo.country,
      phone_format: phoneInfo.format,
      linking_method: linkingResult.method,
      linking_confidence: linkingResult.confidence,
      enhanced_processing: true,
      original_data: messageData,
      customer_data: linkingResult.details
    };

    const messageRecord = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      content: content,
      sender_type: isFromMe ? 'agent' : 'customer',
      message_type: messageType,
      metadata: messageMetadata,
      created_at: new Date().toISOString()
    };

    const { data: savedMessage, error } = await supabase
      .from('messages')
      .insert([messageRecord])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Mensagem enriquecida salva: ${savedMessage.id}`);
    return savedMessage.id;

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem enriquecida:', error);
    throw error;
  }
}

// Função principal de processamento aprimorado
async function processEnhancedMessage(payload) {
  try {
    console.log(`🔄 Processamento aprimorado iniciado - Evento: ${payload.event}`);
    
    const messageData = payload.data;
    const instanceName = payload.instance;
    const jid = messageData.key?.remoteJid;
    const pushName = messageData.pushName;
    
    if (!jid) {
      console.log('⚠️ JID não encontrado, ignorando mensagem');
      return null;
    }

    // 1. Extrair e normalizar telefone
    const phoneInfo = extractAndNormalizePhone(jid, pushName);
    if (!phoneInfo.isValid) {
      console.log(`⚠️ Telefone inválido: ${phoneInfo.reason}`);
      return null;
    }

    console.log(`📱 Processando mensagem de: ${phoneInfo.phoneFormatted} (${pushName || 'Sem nome'})`);

    // 2. Vinculação inteligente de cliente
    const linkingResult = await intelligentCustomerLinking(phoneInfo, pushName, instanceName);
    
    // 3. Gerenciar ticket com dados enriquecidos
    const ticketId = await findOrCreateTicketEnhanced(linkingResult, phoneInfo, instanceName);
    
    // 4. Salvar mensagem enriquecida
    const messageId = await saveEnhancedMessage(ticketId, messageData, linkingResult, phoneInfo, instanceName);

    const result = {
      success: true,
      customerId: linkingResult.customerId,
      ticketId,
      messageId,
      linking: {
        method: linkingResult.method,
        confidence: linkingResult.confidence,
        details: linkingResult.details
      },
      phoneInfo,
      enhanced: true
    };

    console.log(`✅ Processamento aprimorado concluído:`, {
      cliente: linkingResult.details.name,
      método: linkingResult.method,
      confiança: `${linkingResult.confidence}%`,
      ticket: ticketId,
      mensagem: messageId
    });
    
    return result;

  } catch (error) {
    console.error('❌ Erro no processamento aprimorado:', error);
    throw error;
  }
}

// ==========================================
// ROTAS DO WEBHOOK
// ==========================================

const router = express.Router();

// Rota principal para mensagens
router.post('/evolution', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`🔔 Webhook evolution - Evento: ${payload.event}`);

    if (payload.event === 'messages.upsert') {
      const result = await processEnhancedMessage(payload);
      res.status(200).json({
        received: true,
        processed: true,
        enhanced: true,
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

// Rotas de envio (mantidas do sistema anterior)
router.post('/send-message', async (req, res) => {
  try {
    const { phone, text, instance } = req.body;
    
    console.log('📤 [ENVIO] Recebida solicitação de envio:', {
      phone: phone?.substring(0, 5) + '***',
      text: text?.substring(0, 50) + '...',
      instance
    });

    if (!phone || !text) {
      return res.status(400).json({
        success: false,
        error: 'Phone e text são obrigatórios'
      });
    }

    const instanceName = instance || 'atendimento-ao-cliente-suporte';
    
    console.log(`📱 [ENVIO] Enviando para ${phone} via instância ${instanceName}`);

    const payload = {
      number: phone,
      text: text,
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: true
      }
    };

    console.log('🚀 [ENVIO] Payload:', payload);

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ [ENVIO] Mensagem enviada com sucesso:', result);
      res.json({
        success: true,
        messageId: result.key?.id,
        status: 'sent',
        result
      });
    } else {
      console.error('❌ [ENVIO] Erro da Evolution API:', result);
      res.status(response.status).json({
        success: false,
        error: result.error || 'Erro ao enviar mensagem',
        details: result
      });
    }

  } catch (error) {
    console.error('❌ [ENVIO] Erro interno:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0-enhanced-linking',
    features: [
      'intelligent_customer_linking',
      'advanced_scoring_system',
      'enhanced_metadata',
      'phone_normalization',
      'similarity_matching',
      'automatic_enrichment'
    ]
  });
});

// Usar router
app.use('/webhook', router);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🔗 URLs disponíveis:
     📥 Receber: POST /webhook/evolution
     📤 Enviar: POST /webhook/send-message
     🏥 Health: GET /webhook/health`);
}); 