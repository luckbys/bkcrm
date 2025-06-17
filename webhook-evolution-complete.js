import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

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
    
    console.log('✅ Processamento via endpoint alternativo concluído');
    
  } catch (error) {
    console.error('❌ Erro no endpoint alternativo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Endpoints específicos que a Evolution API v2.2.3 usa
app.post('/webhook/evolution/messages-upsert', async (req, res) => {
  try {
    console.log('📥 [MESSAGES-UPSERT] Recebido webhook de mensagem');
    
    // Reformatar payload para nosso padrão
    const reformattedPayload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || req.headers['instance'] || 'unknown',
      data: req.body.data || req.body
    };
    
    // Processar usando nossa função principal
    const result = await processNewMessage(reformattedPayload);
    
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      event: 'MESSAGES_UPSERT',
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint messages-upsert:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

app.post('/webhook/evolution/contacts-update', async (req, res) => {
  try {
    console.log('📥 [CONTACTS-UPDATE] Recebido webhook de contato');
    
    const result = await processContactUpdate(req.body);
    
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      event: 'CONTACTS_UPDATE',
      processed: result.success
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint contacts-update:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

app.post('/webhook/evolution/chats-update', async (req, res) => {
  try {
    console.log('📥 [CHATS-UPDATE] Recebido webhook de chat');
    
    const result = await processChatUpdate(req.body);
    
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      event: 'CHATS_UPDATE',
      processed: result.success
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint chats-update:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para envio de mensagens do CRM para WhatsApp
app.post('/webhook/send-message', async (req, res) => {
  try {
    const { phone, text, instance, options = {} } = req.body;
    
    console.log('📤 [SEND] Solicitação de envio de mensagem:', {
      phone,
      text: text?.substring(0, 50) + '...',
      instance,
      hasOptions: Object.keys(options).length > 0
    });

    if (!phone || !text) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e texto são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    const result = await sendWhatsAppMessage({
      phone,
      text,
      instance: instance || 'atendimento-ao-cliente-sac1',
      options
    });

    console.log('📤 [SEND] Resultado do envio:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    res.status(result.success ? 200 : 500).json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [SEND] Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para responder a uma mensagem específica
app.post('/webhook/reply-message', async (req, res) => {
  try {
    const { phone, text, instance, quotedMessage, options = {} } = req.body;
    
    console.log('💬 [REPLY] Solicitação de resposta:', {
      phone,
      text: text?.substring(0, 50) + '...',
      instance,
      quotedMessageId: quotedMessage?.id
    });

    if (!phone || !text || !quotedMessage) {
      return res.status(400).json({
        success: false,
        error: 'Telefone, texto e mensagem citada são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    const result = await sendReplyMessage({
      phone,
      text,
      instance: instance || 'atendimento-ao-cliente-sac1',
      options
    }, quotedMessage);

    console.log('💬 [REPLY] Resultado da resposta:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    res.status(result.success ? 200 : 500).json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [REPLY] Erro ao responder mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de health check
app.get('/webhook/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Webhook Evolution API',
    features: {
      receiving: true,
      sending: true,
      replying: true
    },
    endpoints: [
      '/webhook/evolution',
      '/webhook/evolution/messages-upsert',
      '/webhook/evolution/contacts-update', 
      '/webhook/evolution/chats-update',
      '/webhook/messages-upsert',
      '/webhook/send-message',
      '/webhook/reply-message'
    ]
  });
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

    // Processar todas as mensagens, incluindo as enviadas por nós
    if (messageData.key.fromMe) {
      console.log('📤 Mensagem enviada por nós, processando normalmente');
    }

    // Extrair informações da mensagem
    console.log('📊 Dados recebidos:', {
      remoteJid: messageData.key?.remoteJid,
      participant: messageData.key?.participant,
      fromMe: messageData.key?.fromMe,
      messageKeys: Object.keys(messageData.message || {}),
      pushName: messageData.pushName,
      instanceName: instanceName
    });
    
    // Extrair telefone do cliente (considerar grupos)
    let clientPhone = extractPhoneFromJid(messageData.key.remoteJid);
    
    // Se for mensagem de grupo e não conseguiu extrair do remoteJid, tentar do participant
    if (!clientPhone && messageData.key.participant) {
      console.log('👥 Tentando extrair telefone do participant (mensagem de grupo)');
      clientPhone = extractPhoneFromJid(messageData.key.participant);
    }
    
    const messageContent = extractMessageContent(messageData.message);
    const senderName = messageData.pushName || `Cliente ${clientPhone?.slice(-4) || 'Desconhecido'}`;
    
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

    // 🆕 VERIFICAR OU CRIAR CLIENTE AUTOMATICAMENTE
    let customerId = null;
    try {
      customerId = await findOrCreateCustomer({
        phone: clientPhone,
        name: senderName,
        instanceName: instanceName
      });
      
      if (customerId) {
        console.log('✅ Cliente encontrado/criado:', customerId);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar/criar cliente, continuando com cliente anônimo:', error.message);
    }

    // Buscar instância Evolution no banco para obter departamento
    const { data: evolutionInstance, error: instanceError } = await supabase
      .from('evolution_instances')
      .select('id, department_id, instance_name')
      .eq('instance_name', instanceName)
      .eq('status', 'active')
      .single();

    let departmentId = null;
    if (instanceError || !evolutionInstance) {
      console.warn('⚠️ Instância Evolution não encontrada, usando departamento padrão:', instanceName);
      // Buscar departamento padrão
      const { data: defaultDept } = await supabase
        .from('departments')
        .select('id')
        .or('name.eq.Geral,name.eq.Atendimento Geral')
        .limit(1);
      
      if (defaultDept && defaultDept.length > 0) {
        departmentId = defaultDept[0].id;
      }
    } else {
      departmentId = evolutionInstance.department_id;
    }
    
    // Buscar ticket existente ou criar novo
    let ticketId = await findExistingTicket(clientPhone, departmentId);
    
    if (!ticketId) {
      ticketId = await createTicketAutomatically({
        clientName: senderName,
        clientPhone: clientPhone,
        instanceName: instanceName,
        departmentId: departmentId,
        customerId: customerId, // 🆕 Vincular cliente ao ticket
        firstMessage: messageContent
      });
    } else if (customerId) {
      // 🆕 Se ticket existe mas não tem cliente vinculado, vincular agora
      await vinculateCustomerToTicket(ticketId, customerId);
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
        ticketId,
        customerId,
        clientPhone,
        senderName
      };
    } else {
      return { success: false, message: 'Erro ao salvar mensagem' };
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return { success: false, message: error.message };
  }
}

// 🆕 NOVA FUNÇÃO: Verificar se cliente existe ou criar automaticamente
async function findOrCreateCustomer({ phone, name, instanceName }) {
  try {
    console.log('🔍 Verificando se cliente existe:', { phone, name });
    
    // Buscar cliente por telefone
    const { data: existingCustomers, error: searchError } = await supabase
      .from('customers')
      .select('id, name, phone, email, status')
      .eq('phone', phone)
      .eq('is_active', true)
      .limit(1);

    if (searchError) {
      console.error('❌ Erro ao buscar cliente:', searchError);
      throw new Error(`Erro ao buscar cliente: ${searchError.message}`);
    }

    // Se cliente já existe, retornar ID
    if (existingCustomers && existingCustomers.length > 0) {
      const customer = existingCustomers[0];
      console.log('✅ Cliente já cadastrado:', { 
        id: customer.id, 
        name: customer.name, 
        phone: customer.phone 
      });
      
      // Atualizar última interação
      await supabase
        .from('customers')
        .update({ 
          last_interaction: new Date().toISOString(),
          // Atualizar nome se veio do WhatsApp e está vazio/diferente
          ...(name && name !== customer.name && customer.name.includes('Cliente') && { name })
        })
        .eq('id', customer.id);
      
      return customer.id;
    }

    console.log('🆕 Cliente não encontrado, criando automaticamente...');
    
    // Buscar agente responsável padrão (admin/agent)
    const { data: defaultAgent } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'agent'])
      .limit(1);

    // Criar novo cliente
    const customerData = {
      name: name || `Cliente WhatsApp ${phone.slice(-4)}`,
      email: `whatsapp-${phone}@auto-generated.com`, // Email temporário único
      phone: phone,
      status: 'prospect',
      category: 'bronze',
      channel: 'whatsapp',
      tags: ['auto-criado', 'whatsapp'],
      notes: `Cliente criado automaticamente via WhatsApp (${instanceName})`,
      last_interaction: new Date().toISOString(),
      responsible_agent_id: defaultAgent?.[0]?.id || null,
      metadata: {
        auto_created: true,
        created_via: 'webhook_evolution',
        instance_name: instanceName,
        original_contact: phone,
        creation_source: 'whatsapp_message'
      }
    };

    // Tentar criar cliente usando RPC para contornar RLS
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_customer_webhook', {
        customer_name: name,
        customer_phone: phone,
        customer_email: customerData.email
      });

    if (rpcError || (rpcResult && !rpcResult.success)) {
      console.error('❌ Erro RPC ao criar cliente:', rpcError || rpcResult.error);
      
      // Fallback: tentar inserção direta
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([customerData])
        .select('id, name, phone, email')
        .single();

      if (createError) {
        console.error('❌ Erro ao criar cliente (fallback):', createError);
        // Se falhar por email duplicado, tentar com timestamp
        if (createError.code === '23505' && createError.message.includes('email')) {
          const timestampEmail = `whatsapp-${phone}-${Date.now()}@auto-generated.com`;
          customerData.email = timestampEmail;
          
          const { data: retryCustomer, error: retryError } = await supabase
            .from('customers')
            .insert([customerData])
            .select('id, name, phone, email')
            .single();
            
          if (retryError) {
            throw new Error(`Erro ao criar cliente (retry): ${retryError.message}`);
          }
          
          console.log('✅ Cliente criado com email alternativo:', retryCustomer);
          return retryCustomer.id;
        }
        throw new Error(`Erro ao criar cliente: ${createError.message}`);
      }
      
      console.log('✅ Cliente criado via fallback:', newCustomer);
      return newCustomer.id;
    }

    // Sucesso via RPC
    const newCustomer = {
      id: rpcResult.customer_id,
      name: name,
      phone: phone,
      email: customerData.email
    };

    console.log('✅ Novo cliente criado automaticamente:', {
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email
    });

    return newCustomer.id;

  } catch (error) {
    console.error('❌ Erro na verificação/criação de cliente:', error);
    throw error;
  }
}

// 🆕 NOVA FUNÇÃO: Vincular cliente a ticket existente
async function vinculateCustomerToTicket(ticketId, customerId) {
  try {
    console.log('🔗 Vinculando cliente ao ticket:', { ticketId, customerId });
    
    const { error } = await supabase
      .from('tickets')
      .update({ 
        customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error('❌ Erro ao vincular cliente ao ticket:', error);
      throw new Error(`Erro ao vincular cliente: ${error.message}`);
    }

    console.log('✅ Cliente vinculado ao ticket com sucesso');
    return true;

  } catch (error) {
    console.error('❌ Erro ao vincular cliente ao ticket:', error);
    throw error;
  }
}

// Função para buscar ticket existente (APENAS tickets abertos - não finalizados)
async function findExistingTicket(clientPhone, departmentId) {
  try {
    console.log('🔍 Buscando ticket existente para:', { clientPhone, departmentId });
    
    // ⚡ NOVA LÓGICA: Buscar APENAS tickets abertos (não finalizados)
    // Tickets finalizados NÃO devem ser reabertos - sempre criar novo ticket
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, customer_id, status, created_at')
      .or(`metadata->>whatsapp_phone.eq.${clientPhone},metadata->>client_phone.eq.${clientPhone}`)
             .in('status', ['open', 'atendimento']) // ✅ Mapeamento correto: open=pendente, atendimento=em atendimento
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar ticket:', error);
      return null;
    }
    
    if (tickets && tickets.length > 0) {
      const ticket = tickets[0];
      console.log('✅ Ticket aberto encontrado:', {
        id: ticket.id,
        status: ticket.status,
        created_at: ticket.created_at
      });
      return ticket.id;
    }
    
         // Verificar se existem tickets finalizados para este cliente (apenas para log)
     const { data: finalizedTickets, error: finalizedError } = await supabase
       .from('tickets')
       .select('id, status, created_at')
       .or(`metadata->>whatsapp_phone.eq.${clientPhone},metadata->>client_phone.eq.${clientPhone}`)
       .in('status', ['closed', 'finalizado']) // ✅ Mapeamento correto: closed=finalizado
       .order('created_at', { ascending: false })
       .limit(1);

     if (!finalizedError && finalizedTickets && finalizedTickets.length > 0) {
       console.log('ℹ️ Cliente possui tickets finalizados, mas criando novo ticket:', {
         ultimoTicketFinalizado: finalizedTickets[0].id,
         status: finalizedTickets[0].status,
         finalizado_em: finalizedTickets[0].created_at
       });
     }
    
    console.log('🆕 Nenhum ticket aberto encontrado - novo ticket será criado');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar ticket:', error);
    return null;
  }
}

// Função para criar ticket automaticamente
async function createTicketAutomatically(data) {
  try {
    console.log('🎫 Criando ticket automaticamente:', {
      cliente: data.clientName,
      telefone: data.clientPhone,
      customerId: data.customerId,
      departmentId: data.departmentId,
      mensagem: data.firstMessage?.substring(0, 50) + '...',
      instancia: data.instanceName
    });
    
    // Se não tem departmentId, buscar/criar departamento padrão
    let departmentId = data.departmentId;
    if (!departmentId) {
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .or('name.eq.Geral,name.eq.Atendimento Geral')
        .limit(1);
      
      if (departments && departments.length > 0) {
        departmentId = departments[0].id;
      } else {
        // Criar departamento padrão se não existir
        const { data: newDept, error: deptError } = await supabase
          .from('departments')
          .insert([{
            name: 'Geral',
            description: 'Departamento geral para tickets automáticos',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select('id')
          .single();
        
        if (!deptError && newDept) {
          departmentId = newDept.id;
          console.log('✅ Departamento criado:', departmentId);
        }
      }
    }
    
    // Verificar se existiam tickets finalizados para este cliente
    const { data: previousTickets, error: previousError } = await supabase
      .from('tickets')
      .select('id, status, title, created_at')
      .or(`metadata->>whatsapp_phone.eq.${data.clientPhone},metadata->>client_phone.eq.${data.clientPhone}`)
      .order('created_at', { ascending: false })
      .limit(3);

    let ticketSequence = 1;
    let hasPreviousFinalized = false;
    
         if (!previousError && previousTickets && previousTickets.length > 0) {
       ticketSequence = previousTickets.length + 1;
       hasPreviousFinalized = previousTickets.some(t => ['closed', 'finalizado'].includes(t.status)); // ✅ Valores corretos
      
      if (hasPreviousFinalized) {
        console.log('📋 Cliente possui tickets anteriores finalizados:', {
          total: previousTickets.length,
          ultimoStatus: previousTickets[0].status,
          novoSequencial: ticketSequence
        });
      }
    }

    // Criar ticket no banco
    const ticketData = {
      title: hasPreviousFinalized 
        ? `Novo Atendimento - ${data.clientName} (#${ticketSequence})`
        : `Mensagem de ${data.clientName}`,
      description: data.firstMessage,
      status: 'open',
      priority: 'medium',
      channel: 'whatsapp',
      department_id: departmentId,
      customer_id: data.customerId || null, // 🆕 Vincular cliente se existir
      metadata: {
        whatsapp_phone: data.clientPhone,
        whatsapp_name: data.clientName,
        client_phone: data.clientPhone, // Para compatibilidade
        instance_name: data.instanceName,
        first_message: data.firstMessage,
        created_via: 'webhook_auto',
        source: 'evolution_api',
        ticket_sequence: ticketSequence,
        is_new_conversation: hasPreviousFinalized,
        previous_tickets_count: previousTickets?.length || 0,
        // Se não tem cliente vinculado, manter info anônima
        ...(data.customerId ? {} : {
          anonymous_contact: {
            name: data.clientName,
            phone: data.clientPhone
          }
        })
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar ticket no banco:', error);
      
      // Fallback: criar ticket simulado se falhar
      const mockTicketId = `ticket-fallback-${Date.now()}`;
      console.log('🔄 Criando ticket fallback:', mockTicketId);
      return mockTicketId;
    }
    
    console.log('✅ Ticket criado no banco:', {
      id: ticket.id,
      title: ticket.title,
      customer_id: ticket.customer_id,
      status: ticket.status,
      channel: ticket.channel
    });
    
    return ticket.id;
    
  } catch (error) {
    console.error('❌ Erro ao criar ticket:', error);
    
    // Fallback: criar ticket simulado se falhar
    const mockTicketId = `ticket-error-${Date.now()}`;
    console.log('🔄 Criando ticket error fallback:', mockTicketId);
    return mockTicketId;
  }
}

// Função para salvar mensagem no banco
async function saveMessageToDatabase(data) {
  try {
    console.log('💾 Salvando mensagem real no banco:', {
      ticketId: data.ticketId,
      content: data.content.substring(0, 30) + '...',
      sender: data.senderName,
      timestamp: data.timestamp
    });

    // Salvar mensagem no banco
    const messageData = {
      ticket_id: data.ticketId,
      content: data.content,
      sender_id: null, // Cliente anônimo
      sender_type: 'customer',
      message_type: 'text',
      metadata: {
        whatsapp_phone: data.senderPhone,
        sender_name: data.senderName,
        instance_name: data.instanceName,
        message_id: data.messageId,
        timestamp: data.timestamp,
        source: 'webhook'
      },
      created_at: data.timestamp
    };
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      return { success: false, message: error.message };
    }
    
    console.log('✅ Mensagem salva com sucesso:', message.id);
    
    return {
      success: true,
      message: 'Mensagem salva no banco',
      messageId: message.id
    };

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    return { success: false, message: error.message };
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

// Função para processar atualizações de contatos
async function processContactUpdate(payload) {
  try {
    console.log('👤 Processando atualização de contato:', {
      remoteJid: payload.remoteJid,
      pushName: payload.pushName,
      instance: payload.instance
    });
    
    // Por enquanto, apenas log - pode ser usado para atualizar dados do cliente
    return { success: true, message: 'Contato atualizado processado' };
  } catch (error) {
    console.error('❌ Erro ao processar atualização de contato:', error);
    return { success: false, message: error.message };
  }
}

// Função para processar atualizações de chats
async function processChatUpdate(payload) {
  try {
    console.log('💬 Processando atualização de chat:', {
      remoteJid: payload.remoteJid,
      instance: payload.instance
    });
    
    // Por enquanto, apenas log - pode ser usado para atualizar status do chat
    return { success: true, message: 'Chat atualizado processado' };
  } catch (error) {
    console.error('❌ Erro ao processar atualização de chat:', error);
    return { success: false, message: error.message };
  }
}

// Funções auxiliares
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

// ====== FUNÇÕES DE ENVIO DE MENSAGENS VIA EVOLUTION API ======

/**
 * Enviar mensagem de texto via Evolution API
 * Baseado na documentação: https://doc.evolution-api.com/v1/api-reference/message-controller/send-text
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
 * Enviar mensagem com citação (reply)
 */
async function sendReplyMessage(messageData, quotedMessage) {
  const options = {
    ...messageData.options,
    quoted: {
      key: {
        remoteJid: quotedMessage.remoteJid,
        fromMe: quotedMessage.fromMe || false,
        id: quotedMessage.id,
        participant: quotedMessage.participant
      },
      message: {
        conversation: quotedMessage.text || quotedMessage.conversation
      }
    }
  };

  return sendWhatsAppMessage({
    ...messageData,
    options
  });
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
  
  // Remover sufixo @s.whatsapp.net se existir (será enviado apenas o número)
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  
  return cleaned;
}

/**
 * Verificar status da instância Evolution API
 */
async function checkInstanceStatus(instanceName = 'atendimento-ao-cliente-sac1') {
  try {
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
    
    return {
      success: true,
      data: response.data,
      isConnected: response.data.state === 'open'
    };
  } catch (error) {
    console.error(`❌ Erro ao verificar status da instância ${instanceName}:`, error.message);
    
    return {
      success: false,
      error: error.message,
      isConnected: false
    };
  }
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
      test: `${BASE_URL}/test`,
      sendMessage: `${BASE_URL}/webhook/send-message`,
      replyMessage: `${BASE_URL}/webhook/reply-message`
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