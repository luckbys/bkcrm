import { supabase } from '@/lib/supabase';

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
        mimetype: string;
        jpegThumbnail: string;
      };
      videoMessage?: {
        caption?: string;
        mimetype: string;
      };
      audioMessage?: {
        mimetype: string;
        seconds: number;
      };
      documentMessage?: {
        fileName: string;
        mimetype: string;
        caption?: string;
      };
    };
    messageTimestamp: number;
    status?: string;
  };
  destination?: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

/**
 * Processa webhook da Evolution API para criar tickets automaticamente
 */
export const handleEvolutionWebhook = async (payload: EvolutionWebhookPayload) => {
  try {
    console.log('📨 Webhook Evolution recebido:', payload.event, payload.instance);
    
    // Processar apenas mensagens recebidas (não enviadas pelo bot)
    if (payload.event === 'MESSAGES_UPSERT' && !payload.data.key.fromMe) {
      await processIncomingMessage(payload);
    }
    
    // Processar atualizações de conexão
    if (payload.event === 'CONNECTION_UPDATE') {
      await processConnectionUpdate(payload);
    }
    
    // Processar QR Code atualizado
    if (payload.event === 'QRCODE_UPDATED') {
      await processQRCodeUpdate(payload);
    }
    
    return { success: true, processed: payload.event };
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook Evolution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Processa mensagem recebida do WhatsApp
 */
const processIncomingMessage = async (payload: EvolutionWebhookPayload) => {
  const { data, instance } = payload;
  
  // Extrair número do telefone
  const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
  
  // Extrair conteúdo da mensagem
  let messageContent = '';
  let messageType = 'text';
  
  if (data.message?.conversation) {
    messageContent = data.message.conversation;
  } else if (data.message?.extendedTextMessage?.text) {
    messageContent = data.message.extendedTextMessage.text;
  } else if (data.message?.imageMessage) {
    messageContent = data.message.imageMessage.caption || '[Imagem]';
    messageType = 'image';
  } else if (data.message?.videoMessage) {
    messageContent = data.message.videoMessage.caption || '[Vídeo]';
    messageType = 'video';
  } else if (data.message?.audioMessage) {
    messageContent = '[Áudio]';
    messageType = 'audio';
  } else if (data.message?.documentMessage) {
    messageContent = data.message.documentMessage.caption || `[Documento: ${data.message.documentMessage.fileName}]`;
    messageType = 'document';
  }
  
  console.log('📱 Mensagem WhatsApp:', {
    from: phoneNumber,
    content: messageContent,
    type: messageType,
    instance
  });
  
  // Buscar instância no banco para obter departamento
  const { data: evolutionInstance } = await supabase
    .from('evolution_instances')
    .select('department_id, department_name')
    .eq('instance_name', instance)
    .single();
  
  if (!evolutionInstance) {
    console.warn('⚠️ Instância não encontrada no banco:', instance);
    return;
  }
  
  // Verificar se já existe ticket ativo para este número
  const { data: existingTickets } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('metadata->>client_phone', phoneNumber)
    .eq('department_id', evolutionInstance.department_id)
    .in('status', ['pendente', 'atendimento'])
    .order('created_at', { ascending: false })
    .limit(1);
  
  let ticketId = null;
  
  if (existingTickets && existingTickets.length > 0) {
    // Usar ticket existente
    ticketId = existingTickets[0].id;
    console.log('🎯 Usando ticket existente:', ticketId);
  } else {
    // Criar novo ticket
    const newTicket = {
      title: `WhatsApp - ${data.pushName || phoneNumber}`,
      subject: `Conversa WhatsApp ${data.pushName || phoneNumber}`,
      description: `Ticket criado automaticamente via WhatsApp`,
      status: 'pendente' as const,
      priority: 'normal' as const,
      channel: 'whatsapp' as const,
      department_id: evolutionInstance.department_id,
      metadata: {
        client_phone: phoneNumber,
        client_name: data.pushName || 'Cliente WhatsApp',
        evolution_instance: instance,
        created_from_whatsapp: true,
        anonymous_contact: data.pushName || phoneNumber
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdTicket, error } = await supabase
      .from('tickets')
      .insert([newTicket])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      return;
    }
    
    ticketId = createdTicket.id;
    console.log('✅ Novo ticket criado:', ticketId);
  }
  
  // Salvar mensagem no ticket
  const messageData = {
    ticket_id: ticketId,
    content: messageContent,
    type: messageType,
    sender_id: null, // Mensagem do cliente
    sender_name: data.pushName || 'Cliente WhatsApp',
    is_internal: false,
    is_read: false,
    metadata: {
      whatsapp_message_id: data.key.id,
      whatsapp_phone: phoneNumber,
      evolution_instance: instance,
      message_timestamp: data.messageTimestamp
    },
    created_at: new Date(data.messageTimestamp * 1000).toISOString()
  };
  
  const { error: messageError } = await supabase
    .from('messages')
    .insert([messageData]);
  
  if (messageError) {
    console.error('❌ Erro ao salvar mensagem:', messageError);
  } else {
    console.log('✅ Mensagem salva no ticket:', ticketId);
  }
  
  // Atualizar timestamp do ticket
  await supabase
    .from('tickets')
    .update({ 
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    })
    .eq('id', ticketId);
};

/**
 * Processa atualizações de conexão da instância
 */
const processConnectionUpdate = async (payload: EvolutionWebhookPayload) => {
  const { instance, data } = payload;
  
  console.log('🔗 Atualização de conexão:', instance, data);
  
  // Atualizar status da instância no banco
  const { error } = await supabase
    .from('evolution_instances')
    .update({
      status: (data as any).status || 'unknown',
      phone: (data as any).phone || null,
      updated_at: new Date().toISOString(),
      metadata: {
        ...data,
        last_connection_update: new Date().toISOString()
      }
    })
    .eq('instance_name', instance);
  
  if (error) {
    console.error('❌ Erro ao atualizar status da instância:', error);
  } else {
    console.log('✅ Status da instância atualizado:', instance);
  }
};

/**
 * Processa atualizações do QR Code
 */
const processQRCodeUpdate = async (payload: EvolutionWebhookPayload) => {
  const { instance, data } = payload;
  
  console.log('📱 QR Code atualizado:', instance);
  
  // Atualizar metadados da instância com informações do QR
  const { error } = await supabase
    .from('evolution_instances')
    .update({
      metadata: {
        qr_code_updated: new Date().toISOString(),
        qr_code_count: (data as any).count || 0
      },
      updated_at: new Date().toISOString()
    })
    .eq('instance_name', instance);
  
  if (error) {
    console.error('❌ Erro ao atualizar QR Code:', error);
  } else {
    console.log('✅ QR Code atualizado para instância:', instance);
  }
};

/**
 * Configurar webhook global na Evolution API
 */
export const configureEvolutionWebhook = async (webhookUrl: string) => {
  try {
    // A configuração do webhook deve ser feita nas variáveis de ambiente da Evolution API
    // WEBHOOK_GLOBAL_URL=sua_url_aqui
    console.log('🔧 Configure a variável WEBHOOK_GLOBAL_URL na Evolution API:', webhookUrl);
    
    return {
      success: true,
      message: 'Configure WEBHOOK_GLOBAL_URL na Evolution API',
      url: webhookUrl
    };
  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error);
    return { success: false, error: error.message };
  }
}; 