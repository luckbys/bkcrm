// Tipos para integração com Evolution API
export interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
  globalApiKey?: string;
}

export interface WhatsAppInstance {
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'qrcode';
  qrcode?: string;
  connectionState: string;
  profilePictureUrl?: string;
  profileName?: string;
  owner: string;
  serverUrl: string;
  apikey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstanceData {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  reject_call?: boolean;
  msg_call?: string;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  sync_full_history?: boolean;
  webhook_url?: string;
  webhook_by_events?: boolean;
  webhook_base64?: boolean;
  proxy?: {
    enabled: boolean;
    host?: string;
    port?: number;
    protocol?: 'http' | 'https';
    username?: string;
    password?: string;
  };
  rabbitmq?: {
    enabled: boolean;
    events: string[];
  };
  sqs?: {
    enabled: boolean;
    access_key_id?: string;
    secret_access_key?: string;
    account_id?: string;
    region?: string;
  };
  websocket?: {
    enabled: boolean;
    events: string[];
  };
  chatwoot?: {
    enabled: boolean;
    account_id?: string;
    token?: string;
    url?: string;
    sign_msg?: boolean;
    reopen_conversation?: boolean;
    conversation_pending?: boolean;
  };
  typebot?: {
    enabled: boolean;
    url?: string;
    typebot?: string;
    expire?: number;
    keyword_finish?: string;
    delay_message?: number;
    unknown_message?: string;
    listening_from_me?: boolean;
  };
}

export interface QRCodeResponse {
  base64: string;
  code: string;
  count: number;
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
  id: string; // UUID - chave primária
  instance_id: string; // ID da Evolution API (ex: wa_1751501378575)
  departmentId: string;
  instanceName: string;
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  status: 'active' | 'inactive' | 'connecting' | 'error';
  phoneNumber?: string;
  profileName?: string;
  profilePictureUrl?: string;
  lastConnection?: string;
  autoReply: boolean;
  businessHours: {
    enabled: boolean;
    start?: string;
    end?: string;
    days?: number[];
    timezone?: string;
  };
  welcomeMessage?: string;
  awayMessage?: string;
  webhookUrl?: string;
  settings: {
    reject_call: boolean;
    msg_call?: string;
    groups_ignore: boolean;
    always_online: boolean;
    read_messages: boolean;
    read_status: boolean;
    sync_full_history: boolean;
  };
  createdAt: string;
  updatedAt: string;
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