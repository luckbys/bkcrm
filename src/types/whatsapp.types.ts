// Tipos para integração com Evolution API
export interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
  globalApiKey?: string;
}

export interface WhatsAppInstance {
  id?: string;
  instanceName: string;
  departmentId: string;
  status?: string;
  webhookUrl?: string;
  serverUrl?: string;
  integration?: {
    integration: string;
    webhook_wa_business?: string;
  };
  read_messages?: boolean;
  groups_ignore?: boolean;
  reject_call?: boolean;
  always_online?: boolean;
  read_status?: boolean;
  sync_full_history?: boolean;
}

export interface WhatsAppSettings {
  always_online: boolean;
  groups_ignore: boolean;
  read_messages: boolean;
  read_status: boolean;
  reject_call: boolean;
  sync_full_history: boolean;
}

export interface CreateInstanceParams {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
  always_online?: boolean;
  groups_ignore?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  reject_call?: boolean;
  sync_full_history?: boolean;
}

export interface QRCodeResponse {
  base64?: string;
  error?: string;
}

export interface UseWhatsAppInstancesReturn {
  instances: WhatsAppInstance[];
  loading: boolean;
  error: string | null;
  refreshInstances: () => Promise<void>;
  createInstance: (departmentId: string, params: CreateInstanceParams) => Promise<WhatsAppInstance>;
  connectInstance: (instanceName: string) => Promise<void>;
  getQRCode: (instanceName: string) => Promise<QRCodeResponse>;
  updateSettings: (instanceName: string, settings: Partial<WhatsAppSettings>) => Promise<void>;
  deleteInstance: (instanceId: string) => Promise<void>;
  getInstanceByDepartment: (departmentId: string) => WhatsAppInstance | undefined;
}

export interface ConnectionState {
  instance: string;
  state: 'open' | 'close' | 'connecting';
}

export interface WebhookEvent {
  event: string;
  instance: string;
  data: any;
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

// Tipos específicos para departamentos com WhatsApp
export interface DepartmentWhatsAppConfig {
  id?: string;
  instance_id?: string;
  instanceName: string;
  departmentId: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  status: string;
  phoneNumber?: string;
  profileName?: string;
  profilePictureUrl?: string;
  lastConnection?: string;
  welcomeMessage?: string;
  awayMessage?: string;
  businessHours?: {
    enabled: boolean;
    start: string;
    end: string;
    days: number[];
    timezone: string;
    message: string;
  };
  autoReply?: {
    enabled: boolean;
    keywords: string;
    response: string;
  };
  notifications?: {
    newMessage: boolean;
    statusChange: boolean;
    sound: boolean;
    desktop: boolean;
  };
  filters?: {
    ignoreGroups?: boolean;
    blockSpam?: boolean;
    allowBroadcast?: boolean;
    mediaAutoDownload?: boolean;
    blockedWords?: string[];
    mediaFilters?: MediaFilters;
    timeFilter?: TimeFilter;
  };
  templates?: TemplateConfig;
  webhookUrl?: string;
  settings?: {
    qrcode: boolean;
    reject_call: boolean;
    groups_ignore: boolean;
    always_online: boolean;
    read_messages: boolean;
    read_status: boolean;
    sync_full_history: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
      contextInfo?: any;
    };
    imageMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
    };
    videoMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
    };
    audioMessage?: {
      url: string;
      mimetype: string;
    };
    documentMessage?: {
      url: string;
      mimetype: string;
      title?: string;
      fileName?: string;
    };
  };
  messageTimestamp: number;
  status?: 'ERROR' | 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ';
}

export interface SendMessageData {
  number: string;
  textMessage?: {
    text: string;
  };
  mediaMessage?: {
    mediatype: 'image' | 'video' | 'audio' | 'document';
    media: string; // base64 ou URL
    caption?: string;
    fileName?: string;
  };
  optionsMessage?: {
    title: string;
    footer?: string;
    buttonText: string;
    buttons: Array<{
      buttonId: string;
      buttonText: string;
      type: number;
    }>;
  };
}

export interface EvolutionAPIResponse<T = any> {
  instance: {
    instanceName: string;
    status: string;
  };
  hash?: {
    apikey: string;
  };
  webhook?: string;
  events?: string[];
  qrcode?: {
    code: string;
    base64: string;
  };
  data?: T;
  error?: string;
  message?: string;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  category?: 'saudacao' | 'vendas' | 'suporte' | 'finalizacao';
  priority?: 'alta' | 'media' | 'baixa';
}

export interface TemplateConfig {
  autoReplace?: boolean;
  smartSuggestions?: boolean;
  livePreview?: boolean;
}

export interface MediaFilters {
  enabled?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface TimeFilter {
  enabled?: boolean;
  start?: string;
  end?: string;
} 