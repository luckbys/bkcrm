/**
 * Configurações da Evolution API
 */
export const EVOLUTION_CONFIG = {
  baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
  timeout: 30000,
  retryAttempts: 3,
  qrCodeTimeout: 120000, // 2 minutes
  statusCheckInterval: 3000, // 3 seconds
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

/**
 * Endpoints da Evolution API
 */
export const EvolutionEndpoints = {
  createInstance: () => `${EVOLUTION_CONFIG.baseUrl}/instance/create`,
  connect: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`,
  fetchInstances: () => `${EVOLUTION_CONFIG.baseUrl}/instance/fetchInstances`,
  logoutInstance: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`,
  deleteInstance: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/instance/delete/${encodeURIComponent(instanceName)}`,
  connectionState: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
  sendMessage: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`,
  setWebhook: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`,
  findWebhook: (instanceName: string) => `${EVOLUTION_CONFIG.baseUrl}/webhook/find/${encodeURIComponent(instanceName)}`,
};

/**
 * Configuração padrão para criação de instâncias
 */
export const DEFAULT_INSTANCE_CONFIG = {
  qrcode: true,
  integration: "WHATSAPP-BAILEYS",
  rejectCall: true,
  msgCall: "Chamadas não são aceitas neste número. Por favor, envie uma mensagem de texto.",
  groupsIgnore: false,
  alwaysOnline: true,
  readMessages: true,
  readStatus: true,
  syncFullHistory: false,
  webhook: {
    url: "",
    byEvents: true,
    base64: true,
    headers: {
      "Content-Type": "application/json"
    },
    events: [
      "APPLICATION_STARTUP",
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONTACTS_SET",
      "CONTACTS_UPSERT",
      "CONTACTS_UPDATE",
      "PRESENCE_UPDATE",
      "CHATS_SET",
      "CHATS_UPSERT",
      "CHATS_UPDATE",
      "CHATS_DELETE",
      "GROUPS_UPSERT",
      "GROUP_UPDATE",
      "GROUP_PARTICIPANTS_UPDATE",
      "CONNECTION_UPDATE",
      "LABELS_EDIT",
      "LABELS_ASSOCIATION",
      "CALL_UPSERT"
    ]
  }
} as const;

/**
 * Tipos para as respostas da Evolution API
 */
export interface EvolutionResponse {
  base64?: string;
  qrcode?: string;
  qr?: string;
  instance?: {
    state: 'open' | 'close' | 'connecting';
    owner?: string;
    profileName?: string;
    profilePicture?: string;
    key?: {
      remoteJid?: string;
    };
  };
  message?: string;
  error?: string;
}

export interface EvolutionInstance {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  instance?: {
    state: 'open' | 'close' | 'connecting';
    owner?: string;
    profileName?: string;
    profilePicture?: string;
  };
}

/**
 * Utilitários para Evolution API
 */
export const evolutionUtils = {
  /**
   * Converte base64 para data URL
   */
  base64ToDataUrl: (base64: string): string => {
    if (base64.startsWith('data:')) {
      return base64;
    }
    return `data:image/png;base64,${base64}`;
  },

  /**
   * Extrai número de telefone do formato WhatsApp
   */
  extractPhoneNumber: (whatsappId: string): string => {
    return whatsappId.replace('@s.whatsapp.net', '');
  },

  /**
   * Formata número de telefone para o padrão brasileiro
   */
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    return phone;
  }
}; 