import axios from 'axios';

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.VITE_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = process.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

const apiClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 segundos
});

// --- INTERFACES ---

export interface InstanceCreatePayload {
  instanceName: string;
  qrcode?: boolean;
  integration?: string;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
}

export interface InstanceStatus {
  instance: {
    instanceName: string;
    status: 'open' | 'close' | 'connecting';
  };
}

export interface QRCodeResponse {
  base64: string;
  code: string;
  count: number;
}

export interface SendTextPayload {
  number: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'paused';
    linkPreview?: boolean;
  };
  textMessage: {
    text: string;
  };
}

export interface SendMediaPayload {
  number: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'paused';
  };
  mediaMessage: {
    mediatype: 'image' | 'video' | 'audio' | 'document';
    media: string; // base64 ou URL
    caption?: string;
    fileName?: string;
  };
}

export interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

// --- GERENCIAMENTO DE INSTÂNCIAS ---

/**
 * Cria uma nova instância na Evolution API.
 * @param instanceName - Um nome único para a instância (ex: 'vendas-01').
 * @param webhookUrl - URL para receber eventos via webhook
 */
export const createInstance = async (instanceName: string, webhookUrl?: string) => {
  try {
    const payload: InstanceCreatePayload = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhookUrl: webhookUrl || `${window.location.origin}/api/webhooks/evolution`,
      webhookByEvents: true,
      webhookBase64: false,
      webhookEvents: [
        'APPLICATION_STARTUP',
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONTACTS_SET',
        'CONTACTS_UPSERT',
        'CONTACTS_UPDATE',
        'PRESENCE_UPDATE',
        'CHATS_SET',
        'CHATS_UPSERT',
        'CHATS_UPDATE',
        'CHATS_DELETE',
        'GROUPS_UPSERT',
        'GROUP_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
        'CONNECTION_UPDATE',
        'CALL',
        'NEW_JWT_TOKEN'
      ]
    };

    const response = await apiClient.post('/instance/create', payload);
    console.log('✅ Instância criada com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
    throw new Error(`Falha ao criar instância: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Obtém o QR Code para conectar uma instância.
 * @param instanceName - O nome da instância.
 */
export const getInstanceQRCode = async (instanceName: string): Promise<QRCodeResponse> => {
  try {
    const response = await apiClient.get(`/instance/connect/${instanceName}`);
    console.log('📱 QR Code obtido para instância:', instanceName);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao obter QR Code:', error.response?.data || error.message);
    throw new Error(`Falha ao obter QR Code: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Obtém o estado da conexão de uma instância.
 * @param instanceName - O nome da instância.
 */
export const getInstanceStatus = async (instanceName: string): Promise<InstanceStatus> => {
  try {
    const response = await apiClient.get(`/instance/connectionState/${instanceName}`);
    console.log('🔗 Status da instância obtido:', instanceName, response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao obter status da instância:', error.response?.data || error.message);
    throw new Error(`Falha ao obter status: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Deleta uma instância da Evolution API.
 * @param instanceName - O nome da instância.
 */
export const deleteInstance = async (instanceName: string) => {
  try {
    const response = await apiClient.delete(`/instance/delete/${instanceName}`);
    console.log('🗑️ Instância deletada:', instanceName);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao deletar instância:', error.response?.data || error.message);
    throw new Error(`Falha ao deletar instância: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Desconecta uma instância (logout do WhatsApp).
 * @param instanceName - O nome da instância.
 */
export const logoutInstance = async (instanceName: string) => {
  try {
    const response = await apiClient.delete(`/instance/logout/${instanceName}`);
    console.log('👋 Logout da instância realizado:', instanceName);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao fazer logout da instância:', error.response?.data || error.message);
    throw new Error(`Falha ao fazer logout: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Reinicia uma instância.
 * @param instanceName - O nome da instância.
 */
export const restartInstance = async (instanceName: string) => {
  try {
    const response = await apiClient.put(`/instance/restart/${instanceName}`);
    console.log('🔄 Instância reiniciada:', instanceName);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao reiniciar instância:', error.response?.data || error.message);
    throw new Error(`Falha ao reiniciar instância: ${error.response?.data?.message || error.message}`);
  }
};

// --- ENVIO DE MENSAGENS ---

/**
 * Envia uma mensagem de texto para um número.
 * @param instanceName - A instância que enviará a mensagem.
 * @param payload - Os dados da mensagem.
 */
export const sendTextMessage = async (instanceName: string, payload: SendTextPayload) => {
  try {
    // Validar e formatar número
    const formattedPayload = {
      ...payload,
      number: formatPhoneNumber(payload.number),
      options: {
        delay: 1200,
        presence: 'composing' as const,
        linkPreview: false,
        ...payload.options
      }
    };

    console.log('📤 Enviando mensagem de texto:', { instanceName, to: formattedPayload.number });
    
    const response = await apiClient.post(`/message/sendText/${instanceName}`, formattedPayload);
    console.log('✅ Mensagem de texto enviada com sucesso');
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem de texto:', error.response?.data || error.message);
    throw new Error(`Falha ao enviar mensagem: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Envia uma mensagem de mídia para um número.
 * @param instanceName - A instância que enviará a mensagem.
 * @param payload - Os dados da mídia.
 */
export const sendMediaMessage = async (instanceName: string, payload: SendMediaPayload) => {
  try {
    const formattedPayload = {
      ...payload,
      number: formatPhoneNumber(payload.number),
      options: {
        delay: 1200,
        presence: 'composing' as const,
        ...payload.options
      }
    };

    console.log('📤 Enviando mensagem de mídia:', { instanceName, to: formattedPayload.number, type: payload.mediaMessage.mediatype });
    
    const response = await apiClient.post(`/message/sendMedia/${instanceName}`, formattedPayload);
    console.log('✅ Mensagem de mídia enviada com sucesso');
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem de mídia:', error.response?.data || error.message);
    throw new Error(`Falha ao enviar mídia: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Marca mensagens como lidas.
 * @param instanceName - A instância.
 * @param remoteJid - O JID do chat (número + @s.whatsapp.net).
 */
export const markMessageAsRead = async (instanceName: string, remoteJid: string) => {
  try {
    const response = await apiClient.put(`/chat/markMessageAsRead/${instanceName}`, {
      readMessages: [{
        remoteJid: remoteJid,
        fromMe: false,
        id: 'all'
      }]
    });
    console.log('✅ Mensagens marcadas como lidas');
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao marcar mensagens como lidas:', error.response?.data || error.message);
    throw new Error(`Falha ao marcar como lida: ${error.response?.data?.message || error.message}`);
  }
};

// --- UTILS ---

/**
 * Formata um número de telefone para o padrão internacional.
 * @param phone - Número de telefone (ex: "11999998888" ou "(11) 99999-8888")
 * @returns Número formatado (ex: "5511999998888")
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se já tem código do país (55), retorna como está
  if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    return cleanPhone;
  }
  
  // Se tem 11 dígitos (com DDD), adiciona código do país
  if (cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  }
  
  // Se tem 10 dígitos, adiciona 9 no meio + código do país
  if (cleanPhone.length === 10) {
    const ddd = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    return `55${ddd}9${number}`;
  }
  
  // Retorna como está se não conseguir formatar
  console.warn('⚠️ Não foi possível formatar o número:', phone);
  return cleanPhone;
};

/**
 * Verifica se um número está no formato correto do WhatsApp.
 * @param phone - Número de telefone formatado
 * @returns true se está no formato correto
 */
export const isValidWhatsAppNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 12 && cleanPhone.startsWith('55');
};

/**
 * Converte número para JID do WhatsApp.
 * @param phone - Número de telefone
 * @returns JID formatado (ex: "5511999998888@s.whatsapp.net")
 */
export const phoneToJid = (phone: string): string => {
  const formattedPhone = formatPhoneNumber(phone);
  return `${formattedPhone}@s.whatsapp.net`;
};

// --- WEBHOOKS E EVENTOS ---

/**
 * Processa um payload de webhook recebido da Evolution API.
 * @param payload - Dados do webhook
 */
export const processWebhookPayload = (payload: WebhookPayload) => {
  console.log('📨 Processando webhook:', payload.event, payload.instance);
  
  switch (payload.event) {
    case 'QRCODE_UPDATED':
      console.log('📱 QR Code atualizado para instância:', payload.instance);
      break;
      
    case 'CONNECTION_UPDATE':
      console.log('🔗 Status de conexão atualizado:', payload.instance, payload.data);
      break;
      
    case 'MESSAGES_UPSERT':
      console.log('📩 Nova mensagem recebida:', payload.instance);
      break;
      
    case 'SEND_MESSAGE':
      console.log('📤 Mensagem enviada confirmada:', payload.instance);
      break;
      
    default:
      console.log('📦 Evento recebido:', payload.event);
  }
  
  return payload;
};

// --- EXPORT DO SERVIÇO ---

export const evolutionApiService = {
  // Instâncias
  createInstance,
  getInstanceQRCode,
  getInstanceStatus,
  deleteInstance,
  logoutInstance,
  restartInstance,
  
  // Mensagens
  sendTextMessage,
  sendMediaMessage,
  markMessageAsRead,
  
  // Utils
  formatPhoneNumber,
  isValidWhatsAppNumber,
  phoneToJid,
  processWebhookPayload,
};

export default evolutionApiService; 