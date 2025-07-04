import { supabase } from '../lib/supabase';

// Interfaces expandidas para todos os eventos da Evolution API v2
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

// Eventos específicos da Evolution API
export interface MessageUpsertEvent {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  pushName?: string;
  message?: any;
  messageTimestamp: number;
  status?: string;
  messageType?: string;
}

export interface ConnectionUpdateEvent {
  instance: string;
  state: 'open' | 'close' | 'connecting';
  statusReason?: string;
  qr?: string;
}

export interface PresenceUpdateEvent {
  id: string;
  presences: Record<string, {
    lastKnownPresence: string;
    lastSeen?: number;
  }>;
}

export interface ContactsUpdateEvent {
  contacts: Array<{
    id: string;
    name: string;
    notify?: string;
    verifiedName?: string;
    imgUrl?: string;
  }>;
}

export interface ChatsUpdateEvent {
  chats: Array<{
    id: string;
    name?: string;
    conversationTimestamp?: number;
    unreadCount?: number;
    archived?: boolean;
    pinned?: boolean;
  }>;
}

export interface GroupsUpdateEvent {
  groups: Array<{
    id: string;
    subject: string;
    owner?: string;
    participants: Array<{
      id: string;
      admin?: 'admin' | 'superadmin';
    }>;
    creation?: number;
    desc?: string;
    descOwner?: string;
    restrict?: boolean;
    announce?: boolean;
    size?: number;
  }>;
}

export interface MessageReceiptEvent {
  key: {
    remoteJid: string;
    id: string;
    participant?: string;
  };
  receipt: {
    readTimestamp?: number;
    deliveredTimestamp?: number;
  };
}

export interface CallOfferEvent {
  id: string;
  from: string;
  timestamp: number;
  isVideo: boolean;
  isGroup: boolean;
}

/**
 * Processa webhook da Evolution API v2 com suporte completo a todos os eventos
 */
export const handleEvolutionWebhook = async (payload: EvolutionWebhookPayload) => {
  try {
    console.log(`📨 [EVOLUTION-WEBHOOK] Evento recebido: ${payload.event} da instância ${payload.instance}`);
    
    // Registrar evento no banco de dados para auditoria
    await logWebhookEvent(payload);
    
    // Processar evento específico
    switch (payload.event) {
      case 'MESSAGES_UPSERT':
        return await processMessageUpsert(payload);
      
      case 'MESSAGES_UPDATE':
        return await processMessageUpdate(payload);
      
      case 'MESSAGES_DELETE':
        return await processMessageDelete(payload);
      
      case 'MESSAGE_RECEIPT_UPDATE':
        return await processMessageReceipt(payload);
      
      case 'CONNECTION_UPDATE':
        return await processConnectionUpdate(payload);
      
      case 'QRCODE_UPDATED':
        return await processQRCodeUpdate(payload);
      
      case 'INSTANCE_READY':
        return await processInstanceReady(payload);
      
      case 'INSTANCE_LOGOUT':
        return await processInstanceLogout(payload);
      
      case 'PRESENCE_UPDATE':
        return await processPresenceUpdate(payload);
      
      case 'CONTACTS_UPSERT':
        return await processContactsUpdate(payload);
      
      case 'CONTACTS_UPDATE':
        return await processContactsUpdate(payload);
      
      case 'CHATS_UPSERT':
        return await processChatsUpdate(payload);
      
      case 'CHATS_UPDATE':
        return await processChatsUpdate(payload);
      
      case 'CHATS_DELETE':
        return await processChatsDelete(payload);
      
      case 'GROUPS_UPSERT':
        return await processGroupsUpdate(payload);
      
      case 'GROUP_PARTICIPANTS_UPDATE':
        return await processGroupParticipantsUpdate(payload);
      
      case 'CALL_OFFER':
        return await processCallOffer(payload);
      
      case 'CALL_ACCEPT':
        return await processCallAccept(payload);
      
      case 'CALL_REJECT':
        return await processCallReject(payload);
      
      case 'TYPING_START':
        return await processTypingStart(payload);
      
      case 'TYPING_STOP':
        return await processTypingStop(payload);
      
      case 'MEDIA_UPLOAD':
        return await processMediaUpload(payload);
      
      case 'MEDIA_DOWNLOAD':
        return await processMediaDownload(payload);
      
      case 'STATUS_UPDATE':
        return await processStatusUpdate(payload);
      
      case 'LABELS_EDIT':
        return await processLabelsEdit(payload);
      
      case 'LABELS_ASSOCIATION':
        return await processLabelsAssociation(payload);
      
      default:
        console.log(`⚠️ [EVOLUTION-WEBHOOK] Evento não processado: ${payload.event}`);
        return { success: true, processed: false, event: payload.event };
    }
    
  } catch (error: any) {
    console.error(`❌ [EVOLUTION-WEBHOOK] Erro ao processar evento ${payload.event}:`, error);
    
    // Registrar erro no banco
    await logWebhookError(payload, error);
    
    return { success: false, error: error.message, event: payload.event };
  }
};

/**
 * Registrar evento de webhook para auditoria
 */
const logWebhookEvent = async (payload: EvolutionWebhookPayload) => {
  try {
    await supabase
      .from('evolution_webhook_logs')
      .insert([{
        event_type: payload.event,
        instance_name: payload.instance,
        payload: payload,
        processed_at: new Date().toISOString(),
        status: 'processing'
      }]);
  } catch (error) {
    console.error('Erro ao registrar webhook log:', error);
  }
};

/**
 * Registrar erro de webhook
 */
const logWebhookError = async (payload: EvolutionWebhookPayload, error: any) => {
  try {
    await supabase
      .from('evolution_webhook_logs')
      .insert([{
        event_type: payload.event,
        instance_name: payload.instance,
        payload: payload,
        error_message: error.message,
        error_stack: error.stack,
        processed_at: new Date().toISOString(),
        status: 'error'
      }]);
  } catch (logError) {
    console.error('Erro ao registrar erro do webhook:', logError);
  }
};

/**
 * Processar mensagem nova ou atualizada
 */
const processMessageUpsert = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as MessageUpsertEvent;
  
  // Ignorar mensagens enviadas pelo próprio bot
  if (data.key.fromMe) {
    console.log('📤 [EVOLUTION-WEBHOOK] Mensagem enviada pelo bot ignorada');
    return { success: true, processed: false, reason: 'own_message' };
  }
  
  console.log('📥 [EVOLUTION-WEBHOOK] Processando mensagem recebida:', {
    from: data.key.remoteJid,
    instance: payload.instance,
    messageId: data.key.id
  });
  
  // Extrair informações da mensagem
  const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  const isGroupMessage = data.key.remoteJid.includes('@g.us');
  
  let messageContent = '';
  let messageType = 'text';
  let mediaUrl = '';
  let fileName = '';
  
  // Processar diferentes tipos de mensagem
  if (data.message) {
    if (data.message.conversation) {
      messageContent = data.message.conversation;
    } else if (data.message.extendedTextMessage?.text) {
      messageContent = data.message.extendedTextMessage.text;
    } else if (data.message.imageMessage) {
      messageContent = data.message.imageMessage.caption || '[Imagem]';
      messageType = 'image';
      // TODO: Processar mídia
    } else if (data.message.videoMessage) {
      messageContent = data.message.videoMessage.caption || '[Vídeo]';
      messageType = 'video';
    } else if (data.message.audioMessage) {
      messageContent = '[Áudio]';
      messageType = 'audio';
    } else if (data.message.documentMessage) {
      messageContent = data.message.documentMessage.caption || `[Documento: ${data.message.documentMessage.fileName}]`;
      messageType = 'document';
      fileName = data.message.documentMessage.fileName || '';
    } else if (data.message.stickerMessage) {
      messageContent = '[Sticker]';
      messageType = 'sticker';
    } else if (data.message.locationMessage) {
      messageContent = `[Localização: ${data.message.locationMessage.degreesLatitude}, ${data.message.locationMessage.degreesLongitude}]`;
      messageType = 'location';
    } else if (data.message.contactMessage) {
      messageContent = `[Contato: ${data.message.contactMessage.displayName}]`;
      messageType = 'contact';
    } else if (data.message.liveLocationMessage) {
      messageContent = '[Localização em tempo real]';
      messageType = 'live_location';
    } else if (data.message.pollCreationMessage) {
      messageContent = `[Enquete: ${data.message.pollCreationMessage.name}]`;
      messageType = 'poll';
    } else if (data.message.listMessage) {
      messageContent = `[Lista: ${data.message.listMessage.title}]`;
      messageType = 'list';
    } else if (data.message.buttonsMessage) {
      messageContent = `[Botões: ${data.message.buttonsMessage.contentText}]`;
      messageType = 'buttons';
    } else if (data.message.templateMessage) {
      messageContent = '[Mensagem Template]';
      messageType = 'template';
    } else if (data.message.reactionMessage) {
      messageContent = `[Reação: ${data.message.reactionMessage.text}]`;
      messageType = 'reaction';
    } else {
      messageContent = '[Mensagem não suportada]';
      messageType = 'unknown';
    }
  }
  
  // Buscar ou criar ticket
  const ticketId = await findOrCreateTicket(
    phoneNumber,
    data.pushName || 'Cliente WhatsApp',
    payload.instance,
    isGroupMessage
  );
  
  if (!ticketId) {
    console.error('❌ [EVOLUTION-WEBHOOK] Não foi possível criar/encontrar ticket');
    return { success: false, error: 'ticket_creation_failed' };
  }
  
  // Salvar mensagem no banco
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
      evolution_instance: payload.instance,
      message_timestamp: data.messageTimestamp,
      from_me: data.key.fromMe,
      is_group: isGroupMessage,
      participant: data.key.participant,
      media_url: mediaUrl,
      file_name: fileName,
      raw_message: data.message
    },
    created_at: new Date(data.messageTimestamp * 1000).toISOString()
  };
  
  const { data: savedMessage, error: messageError } = await supabase
    .from('messages')
    .insert([messageData])
    .select('id')
    .single();
  
  if (messageError) {
    console.error('❌ [EVOLUTION-WEBHOOK] Erro ao salvar mensagem:', messageError);
    return { success: false, error: 'message_save_failed' };
  }
  
  // Atualizar timestamp do ticket
  await supabase
    .from('tickets')
    .update({ 
      updated_at: new Date().toISOString(),
      metadata: {
        last_whatsapp_message: new Date().toISOString(),
        last_message_content: messageContent.substring(0, 100)
      }
    })
    .eq('id', ticketId);
  
  console.log('✅ [EVOLUTION-WEBHOOK] Mensagem processada com sucesso:', {
    ticketId,
    messageId: savedMessage.id,
    type: messageType
  });
  
  return { 
    success: true, 
    processed: true, 
    ticketId, 
    messageId: savedMessage.id,
    messageType 
  };
};

/**
 * Processar atualização de status de mensagem
 */
const processMessageUpdate = async (payload: EvolutionWebhookPayload) => {
  console.log('📝 [EVOLUTION-WEBHOOK] Processando atualização de mensagem:', payload.data);
  
  // Atualizar status de mensagem no banco se existir
  const { data: message } = await supabase
    .from('messages')
    .select('id')
    .eq('metadata->>whatsapp_message_id', payload.data.key?.id)
    .single();
  
  if (message) {
    await supabase
      .from('messages')
      .update({
        metadata: {
          ...payload.data,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', message.id);
  }
  
  return { success: true, processed: true, event: 'message_update' };
};

/**
 * Processar exclusão de mensagem
 */
const processMessageDelete = async (payload: EvolutionWebhookPayload) => {
  console.log('🗑️ [EVOLUTION-WEBHOOK] Processando exclusão de mensagem:', payload.data);
  
  // Marcar mensagem como deletada
  await supabase
    .from('messages')
    .update({ 
      content: '[Mensagem deletada]',
      metadata: {
        deleted: true,
        deleted_at: new Date().toISOString()
      }
    })
    .eq('metadata->>whatsapp_message_id', payload.data.key?.id);
  
  return { success: true, processed: true, event: 'message_delete' };
};

/**
 * Processar confirmação de leitura/entrega
 */
const processMessageReceipt = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as MessageReceiptEvent;
  
  console.log('📍 [EVOLUTION-WEBHOOK] Processando confirmação de leitura:', {
    messageId: data.key.id,
    delivered: !!data.receipt.deliveredTimestamp,
    read: !!data.receipt.readTimestamp
  });
  
  // Atualizar status de entrega/leitura
  const updateData: any = {};
  
  if (data.receipt.deliveredTimestamp) {
    updateData['metadata'] = {
      delivered: true,
      delivered_at: new Date(data.receipt.deliveredTimestamp * 1000).toISOString()
    };
  }
  
  if (data.receipt.readTimestamp) {
    updateData['metadata'] = {
      ...updateData['metadata'],
      read: true,
      read_at: new Date(data.receipt.readTimestamp * 1000).toISOString()
    };
    updateData['is_read'] = true;
  }
  
  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('messages')
      .update(updateData)
      .eq('metadata->>whatsapp_message_id', data.key.id);
  }
  
  return { success: true, processed: true, event: 'message_receipt' };
};

/**
 * Processar atualização de conexão
 */
const processConnectionUpdate = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as ConnectionUpdateEvent;
  
  console.log('🔗 [EVOLUTION-WEBHOOK] Atualização de conexão:', {
    instance: payload.instance,
    state: data.state,
    reason: data.statusReason
  });
  
  // Atualizar status da instância no banco
  await supabase
    .from('evolution_instances')
    .upsert([{
      instance_name: payload.instance,
      status: data.state,
      status_reason: data.statusReason,
      last_update: new Date().toISOString(),
      qr_code: data.qr || null
    }], {
      onConflict: 'instance_name'
    });
  
  return { success: true, processed: true, event: 'connection_update', state: data.state };
};

/**
 * Processar atualização de QR Code
 */
const processQRCodeUpdate = async (payload: EvolutionWebhookPayload) => {
  console.log('📱 [EVOLUTION-WEBHOOK] QR Code atualizado para instância:', payload.instance);
  
  // Salvar QR code no banco
  await supabase
    .from('evolution_instances')
    .upsert([{
      instance_name: payload.instance,
      qr_code: payload.data.qr || payload.data.base64,
      qr_updated_at: new Date().toISOString(),
      status: 'qrcode'
    }], {
      onConflict: 'instance_name'
    });
  
  return { success: true, processed: true, event: 'qrcode_update' };
};

/**
 * Processar instância pronta
 */
const processInstanceReady = async (payload: EvolutionWebhookPayload) => {
  console.log('✅ [EVOLUTION-WEBHOOK] Instância pronta:', payload.instance);
  
  await supabase
    .from('evolution_instances')
    .upsert([{
      instance_name: payload.instance,
      status: 'open',
      connected_at: new Date().toISOString(),
      profile_name: payload.data.user?.name,
      profile_pic_url: payload.data.user?.profilePicUrl,
      phone_number: payload.data.user?.id?.replace('@s.whatsapp.net', '')
    }], {
      onConflict: 'instance_name'
    });
  
  return { success: true, processed: true, event: 'instance_ready' };
};

/**
 * Processar logout da instância
 */
const processInstanceLogout = async (payload: EvolutionWebhookPayload) => {
  console.log('👋 [EVOLUTION-WEBHOOK] Instância desconectada:', payload.instance);
  
  await supabase
    .from('evolution_instances')
    .update({
      status: 'close',
      disconnected_at: new Date().toISOString(),
      qr_code: null
    })
    .eq('instance_name', payload.instance);
  
  return { success: true, processed: true, event: 'instance_logout' };
};

/**
 * Processar atualização de presença (online/offline/digitando)
 */
const processPresenceUpdate = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as PresenceUpdateEvent;
  
  console.log('👥 [EVOLUTION-WEBHOOK] Atualização de presença:', {
    chatId: data.id,
    presences: Object.keys(data.presences || {})
  });
  
  // Salvar informações de presença para análise posterior
  await supabase
    .from('evolution_presence_logs')
    .insert([{
      instance_name: payload.instance,
      chat_id: data.id,
      presences: data.presences,
      updated_at: new Date().toISOString()
    }]);
  
  return { success: true, processed: true, event: 'presence_update' };
};

/**
 * Processar atualização de contatos
 */
const processContactsUpdate = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as ContactsUpdateEvent;
  
  console.log('👤 [EVOLUTION-WEBHOOK] Atualização de contatos:', {
    instance: payload.instance,
    contactsCount: data.contacts?.length || 0
  });
  
  // Salvar/atualizar contatos no banco
  if (data.contacts && data.contacts.length > 0) {
    const contactsData = data.contacts.map(contact => ({
      instance_name: payload.instance,
      contact_id: contact.id,
      name: contact.name,
      notify_name: contact.notify,
      verified_name: contact.verifiedName,
      profile_pic_url: contact.imgUrl,
      updated_at: new Date().toISOString()
    }));
    
    await supabase
      .from('evolution_contacts')
      .upsert(contactsData, {
        onConflict: 'instance_name,contact_id'
      });
  }
  
  return { success: true, processed: true, event: 'contacts_update', count: data.contacts?.length || 0 };
};

/**
 * Processar atualização de chats
 */
const processChatsUpdate = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as ChatsUpdateEvent;
  
  console.log('💬 [EVOLUTION-WEBHOOK] Atualização de chats:', {
    instance: payload.instance,
    chatsCount: data.chats?.length || 0
  });
  
  // Salvar/atualizar chats no banco
  if (data.chats && data.chats.length > 0) {
    const chatsData = data.chats.map(chat => ({
      instance_name: payload.instance,
      chat_id: chat.id,
      name: chat.name,
      conversation_timestamp: chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000).toISOString() : null,
      unread_count: chat.unreadCount || 0,
      archived: chat.archived || false,
      pinned: chat.pinned || false,
      updated_at: new Date().toISOString()
    }));
    
    await supabase
      .from('evolution_chats')
      .upsert(chatsData, {
        onConflict: 'instance_name,chat_id'
      });
  }
  
  return { success: true, processed: true, event: 'chats_update', count: data.chats?.length || 0 };
};

/**
 * Processar exclusão de chats
 */
const processChatsDelete = async (payload: EvolutionWebhookPayload) => {
  console.log('🗑️ [EVOLUTION-WEBHOOK] Exclusão de chat:', payload.data);
  
  // Marcar chat como deletado
  await supabase
    .from('evolution_chats')
    .update({ 
      deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('instance_name', payload.instance)
    .eq('chat_id', payload.data.id);
  
  return { success: true, processed: true, event: 'chats_delete' };
};

/**
 * Processar atualização de grupos
 */
const processGroupsUpdate = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as GroupsUpdateEvent;
  
  console.log('👥 [EVOLUTION-WEBHOOK] Atualização de grupos:', {
    instance: payload.instance,
    groupsCount: data.groups?.length || 0
  });
  
  // Salvar/atualizar grupos no banco
  if (data.groups && data.groups.length > 0) {
    for (const group of data.groups) {
      await supabase
        .from('evolution_groups')
        .upsert([{
          instance_name: payload.instance,
          group_id: group.id,
          subject: group.subject,
          owner: group.owner,
          creation_date: group.creation ? new Date(group.creation * 1000).toISOString() : null,
          description: group.desc,
          description_owner: group.descOwner,
          restrict: group.restrict || false,
          announce: group.announce || false,
          size: group.size || 0,
          participants: group.participants || [],
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'instance_name,group_id'
        });
    }
  }
  
  return { success: true, processed: true, event: 'groups_update', count: data.groups?.length || 0 };
};

/**
 * Processar atualização de participantes do grupo
 */
const processGroupParticipantsUpdate = async (payload: EvolutionWebhookPayload) => {
  console.log('👥 [EVOLUTION-WEBHOOK] Atualização de participantes do grupo:', payload.data);
  
  // Atualizar participantes do grupo
  await supabase
    .from('evolution_groups')
    .update({
      participants: payload.data.participants || [],
      updated_at: new Date().toISOString()
    })
    .eq('instance_name', payload.instance)
    .eq('group_id', payload.data.id);
  
  return { success: true, processed: true, event: 'group_participants_update' };
};

/**
 * Processar eventos de chamada
 */
const processCallOffer = async (payload: EvolutionWebhookPayload) => {
  const data = payload.data as CallOfferEvent;
  
  console.log('📞 [EVOLUTION-WEBHOOK] Oferta de chamada:', {
    from: data.from,
    isVideo: data.isVideo,
    isGroup: data.isGroup
  });
  
  // Registrar chamada no banco
  await supabase
    .from('evolution_calls')
    .insert([{
      instance_name: payload.instance,
      call_id: data.id,
      from_number: data.from,
      timestamp: new Date(data.timestamp * 1000).toISOString(),
      is_video: data.isVideo,
      is_group: data.isGroup,
      status: 'offered',
      created_at: new Date().toISOString()
    }]);
  
  return { success: true, processed: true, event: 'call_offer' };
};

const processCallAccept = async (payload: EvolutionWebhookPayload) => {
  console.log('✅ [EVOLUTION-WEBHOOK] Chamada aceita:', payload.data);
  
  await supabase
    .from('evolution_calls')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('call_id', payload.data.id);
  
  return { success: true, processed: true, event: 'call_accept' };
};

const processCallReject = async (payload: EvolutionWebhookPayload) => {
  console.log('❌ [EVOLUTION-WEBHOOK] Chamada rejeitada:', payload.data);
  
  await supabase
    .from('evolution_calls')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('call_id', payload.data.id);
  
  return { success: true, processed: true, event: 'call_reject' };
};

/**
 * Processar eventos de digitação
 */
const processTypingStart = async (payload: EvolutionWebhookPayload) => {
  console.log('⌨️ [EVOLUTION-WEBHOOK] Usuário começou a digitar:', payload.data);
  return { success: true, processed: true, event: 'typing_start' };
};

const processTypingStop = async (payload: EvolutionWebhookPayload) => {
  console.log('⏹️ [EVOLUTION-WEBHOOK] Usuário parou de digitar:', payload.data);
  return { success: true, processed: true, event: 'typing_stop' };
};

/**
 * Processar eventos de mídia
 */
const processMediaUpload = async (payload: EvolutionWebhookPayload) => {
  console.log('📤 [EVOLUTION-WEBHOOK] Upload de mídia:', payload.data);
  return { success: true, processed: true, event: 'media_upload' };
};

const processMediaDownload = async (payload: EvolutionWebhookPayload) => {
  console.log('📥 [EVOLUTION-WEBHOOK] Download de mídia:', payload.data);
  return { success: true, processed: true, event: 'media_download' };
};

/**
 * Processar eventos de status
 */
const processStatusUpdate = async (payload: EvolutionWebhookPayload) => {
  console.log('📊 [EVOLUTION-WEBHOOK] Atualização de status:', payload.data);
  return { success: true, processed: true, event: 'status_update' };
};

/**
 * Processar eventos de labels
 */
const processLabelsEdit = async (payload: EvolutionWebhookPayload) => {
  console.log('🏷️ [EVOLUTION-WEBHOOK] Edição de labels:', payload.data);
  return { success: true, processed: true, event: 'labels_edit' };
};

const processLabelsAssociation = async (payload: EvolutionWebhookPayload) => {
  console.log('🔗 [EVOLUTION-WEBHOOK] Associação de labels:', payload.data);
  return { success: true, processed: true, event: 'labels_association' };
};

/**
 * Buscar ou criar ticket para o contato
 */
const findOrCreateTicket = async (
  phoneNumber: string, 
  contactName: string, 
  instance: string, 
  isGroup: boolean = false
): Promise<string | null> => {
  try {
    // Buscar instância no banco para obter departamento
    const { data: evolutionInstance } = await supabase
      .from('evolution_instances')
      .select('department_id, department_name')
      .eq('instance_name', instance)
      .single();
    
    if (!evolutionInstance) {
      console.warn(`⚠️ [EVOLUTION-WEBHOOK] Instância não encontrada no banco: ${instance}`);
      return null;
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
    
    if (existingTickets && existingTickets.length > 0) {
      console.log(`🎯 [EVOLUTION-WEBHOOK] Usando ticket existente: ${existingTickets[0].id}`);
      return existingTickets[0].id;
    }
    
    // Criar novo ticket
    const newTicket = {
      title: `${isGroup ? 'Grupo' : 'WhatsApp'} - ${contactName}`,
      subject: `Conversa ${isGroup ? 'do grupo' : 'WhatsApp'} ${contactName}`,
      description: `Ticket criado automaticamente via Evolution API${isGroup ? ' (mensagem de grupo)' : ''}`,
      status: 'pendente' as const,
      priority: 'normal' as const,
      channel: isGroup ? 'whatsapp_group' as const : 'whatsapp' as const,
      department_id: evolutionInstance.department_id,
      metadata: {
        client_phone: phoneNumber,
        client_name: contactName,
        evolution_instance: instance,
        created_from_whatsapp: true,
        is_group: isGroup,
        anonymous_contact: contactName
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
      console.error('❌ [EVOLUTION-WEBHOOK] Erro ao criar ticket:', error);
      return null;
    }
    
    console.log(`✅ [EVOLUTION-WEBHOOK] Novo ticket criado: ${createdTicket.id}`);
    return createdTicket.id;
    
  } catch (error) {
    console.error('❌ [EVOLUTION-WEBHOOK] Erro ao buscar/criar ticket:', error);
    return null;
  }
};

/**
 * Configurar webhook da Evolution API
 */
export const configureEvolutionWebhook = async (
  instanceName: string,
  webhookUrl: string,
  events: string[] = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
) => {
  try {
    const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
    const API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: events
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao configurar webhook: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ [EVOLUTION-WEBHOOK] Webhook configurado:', result);
    
    return { success: true, data: result };
    
  } catch (error: any) {
    console.error('❌ [EVOLUTION-WEBHOOK] Erro ao configurar webhook:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exportar todas as funções principais
 */
export {
  processMessageUpsert,
  processConnectionUpdate,
  processQRCodeUpdate,
  findOrCreateTicket,
  logWebhookEvent
}; 