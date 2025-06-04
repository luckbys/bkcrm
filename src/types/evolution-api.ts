// Tipos para Evolution API
export interface EvolutionAPIInstance {
  instanceName: string;
  instanceId: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status: 'created' | 'open' | 'close' | 'connecting';
  serverUrl: string;
  apikey: string;
  qrcode?: string;
  integration?: {
    integration: string;
    webhook_wa_business?: string;
    token?: string;
  };
}

export interface EvolutionAPISettings {
  reject_call: boolean;
  msg_call: string;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  read_status: boolean;
  sync_full_history: boolean;
}

export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  webhook?: string;
  webhook_by_events?: boolean;
  events?: EvolutionAPIEvent[];
  reject_call?: boolean;
  msg_call?: string;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  websocket_enabled?: boolean;
  websocket_events?: EvolutionAPIEvent[];
  rabbitmq_enabled?: boolean;
  rabbitmq_events?: EvolutionAPIEvent[];
  sqs_enabled?: boolean;
  sqs_events?: EvolutionAPIEvent[];
  typebot_url?: string;
  typebot?: string;
  typebot_expire?: number;
  typebot_keyword_finish?: string;
  typebot_delay_message?: number;
  typebot_unknown_message?: string;
  typebot_listening_from_me?: boolean;
  proxy?: {
    host: string;
    port: string;
    protocol: 'http' | 'https';
    username?: string;
    password?: string;
  };
  chatwoot_account_id?: number;
  chatwoot_token?: string;
  chatwoot_url?: string;
  chatwoot_sign_msg?: boolean;
  chatwoot_reopen_conversation?: boolean;
  chatwoot_conversation_pending?: boolean;
}

export type EvolutionAPIEvent = 
  | 'APPLICATION_STARTUP'
  | 'QRCODE_UPDATED'
  | 'MESSAGES_SET'
  | 'MESSAGES_UPSERT'
  | 'MESSAGES_UPDATE'
  | 'MESSAGES_DELETE'
  | 'SEND_MESSAGE'
  | 'CONTACTS_SET'
  | 'CONTACTS_UPSERT'
  | 'CONTACTS_UPDATE'
  | 'PRESENCE_UPDATE'
  | 'CHATS_SET'
  | 'CHATS_UPSERT'
  | 'CHATS_UPDATE'
  | 'CHATS_DELETE'
  | 'GROUPS_UPSERT'
  | 'GROUP_UPDATE'
  | 'GROUP_PARTICIPANTS_UPDATE'
  | 'CONNECTION_UPDATE'
  | 'CALL'
  | 'NEW_JWT_TOKEN'
  | 'TYPEBOT_START'
  | 'TYPEBOT_CHANGE_STATUS';

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    webhook_wa_business?: string;
    access_token_wa_business?: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  settings: EvolutionAPISettings;
}

export interface EvolutionAPIInfo {
  status: number;
  message: string;
  version: string;
  swagger: string;
  manager: string;
  documentation: string;
}

// Tipos para configuração por setor
export interface DepartmentInstance {
  id: string;
  departmentId: string;
  departmentName: string;
  instanceName: string;
  instanceId: string;
  serverUrl: string;
  apikey: string;
  phoneNumber?: string;
  status: 'created' | 'configured' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'not_found';
  settings: EvolutionAPISettings;
  webhookUrl?: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
} 