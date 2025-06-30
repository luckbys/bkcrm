import axios, { AxiosError } from 'axios';

// Configurações da Evolution API
const EVOLUTION_API_URL = '/api';  // Usa o proxy local
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

// Rate limiting e retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const RATE_LIMIT_DELAY = 100; // 100ms entre requests

class EvolutionApiManager {
  private apiClient = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
    },
    timeout: 30000,
    // Ignorar certificados auto-assinados
    validateStatus: () => true, // Aceitar qualquer status HTTP
    maxRedirects: 5
  });

  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private connectionStatus = new Map<string, 'connected' | 'disconnected' | 'connecting'>();
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30 segundos

  constructor() {
    this.setupInterceptors();
    this.startHealthCheck();
    
    // Log inicial de configuração
    console.log('🔧 Evolution API configurada:', {
      url: EVOLUTION_API_URL,
      hasApiKey: !!API_KEY,
      environment: 'browser'
    });
  }

  private setupInterceptors() {
    // Request interceptor para logging
    this.apiClient.interceptors.request.use((config) => {
      console.log(`🚀 [Evolution API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor para tratamento de erros
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`✅ [Evolution API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ [Evolution API] ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          await this.delay(RATE_LIMIT_DELAY);
        } catch (error) {
          console.error('❌ Erro ao processar request na fila:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>, 
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      // Log detalhado do erro
      console.error(`❌ [Evolution API] Erro na requisição:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        data: error.response?.data
      });
      
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`⚠️ Tentativa ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} falhou, tentando novamente...`);
        await this.delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
        return this.retryRequest(requestFn, retries - 1);
      }
      
      // Melhorar mensagem de erro
      if (error.response?.status === 404) {
        const urlParts = error.config?.url?.split('/') || [];
        const resource = urlParts[urlParts.length - 1];
        throw new Error(`Recurso '${resource}' não encontrado na Evolution API. Verifique se a instância existe.`);
      }
      
      if (error.response?.status === 401) {
        throw new Error('API Key inválida. Verifique as credenciais da Evolution API.');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Erro interno da Evolution API. Tente novamente em alguns minutos.');
      }
      
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return error.response?.status && retryableStatuses.includes(error.response.status);
  }

  private async startHealthCheck() {
    setInterval(async () => {
      if (Date.now() - this.lastHealthCheck < this.healthCheckInterval) return;
      
      try {
        await this.testConnection();
        this.lastHealthCheck = Date.now();
      } catch (error) {
        console.warn('⚠️ Health check falhou:', error);
      }
    }, this.healthCheckInterval);
  }

  // Método público para testar conexão
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.retryRequest(() => this.apiClient.get('/', { timeout: 5000 }));
      const latency = Date.now() - startTime;
      
      console.log(`✅ Evolution API conectada (${latency}ms)`);
      return { success: true, latency };
    } catch (error: any) {
      console.error('❌ Falha na conexão com Evolution API:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Conexão falhou'
      };
    }
  }

  // Melhorado: Criação de instância com validação robusta
  async createInstance(
    instanceName: string, 
    options: {
      webhookUrl?: string;
      qrcode?: boolean;
      integration?: string;
      rejectCall?: boolean;
      msgCall?: string;
      groupsIgnore?: boolean;
      alwaysOnline?: boolean;
      readMessages?: boolean;
      readStatus?: boolean;
    } = {}
  ) {
    const payload = {
      instanceName,
      qrcode: options.qrcode ?? true,
      integration: options.integration || 'WHATSAPP-BAILEYS',
      webhook: {
        enabled: !!options.webhookUrl,
        url: options.webhookUrl || `${window.location.origin}/api/webhooks/evolution`,
        byEvents: true,
        base64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED', 
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'SEND_MESSAGE'
        ]
      },
      rejectCall: options.rejectCall ?? false,
      msgCall: options.msgCall || 'Chamadas não são aceitas por este número.',
      groupsIgnore: options.groupsIgnore ?? false,
      alwaysOnline: options.alwaysOnline ?? false,
      readMessages: options.readMessages ?? true,
      readStatus: options.readStatus ?? true,
      syncFullHistory: false
    };

    return this.retryRequest(async () => {
      const response = await this.apiClient.post('/instance/create', payload);
      
      // Atualizar status local
      this.connectionStatus.set(instanceName, 'connecting');
      
      console.log('✅ Instância criada:', instanceName);
      return response.data;
    });
  }

  // Melhorado: Status com cache e validação
  async getInstanceStatus(instanceName: string, useCache = true): Promise<{
    instance: {
      instanceName: string;
      state: 'open' | 'close' | 'connecting';
    };
    connectionInfo?: any;
  }> {
    // Verificar cache primeiro se solicitado
    if (useCache && this.connectionStatus.has(instanceName)) {
      const cachedStatus = this.connectionStatus.get(instanceName)!;
      console.log(`📋 Status em cache para ${instanceName}: ${cachedStatus}`);
    }

    try {
      return await this.retryRequest(async () => {
        const response = await this.apiClient.get(`/instance/connectionState/${instanceName}`);
        const status = response.data;
        
        // Atualizar cache local
        if (status.instance?.state === 'open') {
          this.connectionStatus.set(instanceName, 'connected');
        } else {
          this.connectionStatus.set(instanceName, 'disconnected');
        }
        
        console.log(`📊 Status da instância ${instanceName}:`, status.instance?.state);
        return status;
      });
    } catch (error: any) {
      // Se instância não existe, verificar se precisa ser criada
      if (error.message.includes('não encontrado')) {
        console.warn(`⚠️ Instância ${instanceName} não encontrada na Evolution API`);
        
        // Verificar se existe no banco local
        const instanceExistsLocally = await this.checkLocalInstance(instanceName);
        if (instanceExistsLocally) {
          console.log(`🔄 Tentando recriar instância ${instanceName} na Evolution API...`);
          try {
            await this.createInstance(instanceName);
            // Retry o status após criação
            return this.getInstanceStatus(instanceName, false);
          } catch (createError) {
            console.error('❌ Falha ao recriar instância:', createError);
          }
        }
      }
      
      // Retornar status offline se não conseguir conectar
      return {
        instance: {
          instanceName,
          state: 'close' as const
        },
        connectionInfo: null
      };
    }
  }

  private async checkLocalInstance(instanceName: string): Promise<boolean> {
    try {
      // Verificar no Supabase se instância existe localmente
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data } = await supabase
        .from('evolution_instances')
        .select('id')
        .eq('instance_name', instanceName)
        .eq('is_active', true)
        .single();
      
      return !!data;
    } catch {
      return false;
    }
  }

  // Otimizado: QR Code com múltiplos formatos e fallback
  async getInstanceQRCode(instanceName: string): Promise<{
    base64?: string;
    success: boolean;
    error?: string;
    count?: number;
  }> {
    try {
      console.log(`📱 Obtendo QR Code para instância: ${instanceName}`);
      
      const response = await this.retryRequest(() => 
        this.apiClient.get(`/instance/connect/${instanceName}`)
      );

      const data = response.data;
      
      if (data?.base64) {
        console.log('✅ QR Code obtido com sucesso');
        return { 
          base64: data.base64, 
          success: true,
          count: data.count || 0
        };
      }
      
      if (data?.code && typeof data.code === 'string') {
        // Se recebeu um código textual, gerar imagem QR
        const qrCodeImage = await this.generateQRCodeImage(data.code);
        return {
          base64: qrCodeImage,
          success: true,
          count: data.count || 0
        };
      }
      
      return { 
        success: false, 
        error: 'QR Code não disponível' 
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Envio de mensagem com validação
  async sendTextMessage(instanceName: string, payload: {
    number: string;
    textMessage: { text: string };
    options?: {
      delay?: number;
      presence?: 'composing' | 'paused';
      linkPreview?: boolean;
    };
  }) {
    const formattedPayload = {
      ...payload,
      number: this.formatPhoneNumber(payload.number),
      options: {
        delay: 1200,
        presence: 'composing' as const,
        linkPreview: false,
        ...payload.options
      }
    };

    return this.retryRequest(async () => {
      console.log('📤 Enviando mensagem de texto para:', formattedPayload.number);
      const response = await this.apiClient.post(`/message/sendText/${instanceName}`, formattedPayload);
      console.log('✅ Mensagem enviada com sucesso');
      return response.data;
    });
  }

  // Webhook configuration
  async setInstanceWebhook(instanceName: string, webhookData: {
    url: string;
    events?: string[];
    enabled?: boolean;
  }) {
    if (!this.isValidUrl(webhookData.url)) {
      throw new Error('URL do webhook inválida');
    }

    const payload = {
      url: webhookData.url,
      enabled: webhookData.enabled ?? true,
      events: webhookData.events ?? this.getValidEvents()
    };

    return this.retryRequest(async () => {
      console.log(`🔗 Configurando webhook para ${instanceName}:`, webhookData.url);
      const response = await this.apiClient.put(`/webhook/set/${instanceName}`, payload);
      console.log('✅ Webhook configurado com sucesso');
      return response.data;
    });
  }

  // Método auxiliar para gerar QR Code visual
  private async generateQRCodeImage(qrText: string): Promise<string> {
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code via API externa:', error);
      throw error;
    }
  }

  // Validações
  isValidWhatsAppNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private getValidEvents(): string[] {
    return [
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE', 
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONNECTION_UPDATE',
      'PRESENCE_UPDATE',
      'CHATS_SET',
      'CHATS_UPSERT',
      'CHATS_UPDATE',
      'CHATS_DELETE',
      'CONTACTS_SET',
      'CONTACTS_UPSERT',
      'CONTACTS_UPDATE'
    ];
  }

  // Utilitários
  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      return cleanPhone;
    }
    
    if (cleanPhone.length === 11) {
      return `55${cleanPhone}`;
    }
    
    if (cleanPhone.length === 10) {
      const ddd = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      return `55${ddd}9${number}`;
    }
    
    return cleanPhone;
  }

  phoneToJid(phone: string): string {
    const formattedPhone = this.formatPhoneNumber(phone);
    return `${formattedPhone}@s.whatsapp.net`;
  }

  async listInstances() {
    return this.retryRequest(async () => {
      const response = await this.apiClient.get('/instance/fetchInstances');
      return response.data;
    });
  }

  async deleteInstance(instanceName: string) {
    return this.retryRequest(async () => {
      const response = await this.apiClient.delete(`/instance/delete/${instanceName}`);
      this.connectionStatus.delete(instanceName);
      return response.data;
    });
  }

  async restartInstance(instanceName: string) {
    return this.retryRequest(async () => {
      const response = await this.apiClient.put(`/instance/restart/${instanceName}`);
      this.connectionStatus.set(instanceName, 'connecting');
      return response.data;
    });
  }

  async logoutInstance(instanceName: string) {
    return this.retryRequest(async () => {
      const response = await this.apiClient.delete(`/instance/logout/${instanceName}`);
      this.connectionStatus.set(instanceName, 'disconnected');
      console.log('👋 Logout da instância realizado:', instanceName);
      return response.data;
    });
  }

  // Reconectar instâncias desconectadas automaticamente
  async autoReconnectInstances() {
    try {
      const instances = await this.listInstances();
      
      for (const instance of instances) {
        const instanceName = instance.instanceName || instance.instance?.instanceName;
        
        if (instanceName) {
          try {
            const status = await this.getInstanceStatus(instanceName, false);
            
            if (status.instance?.state === 'close') {
              console.log(`🔄 Tentando reconectar instância: ${instanceName}`);
              await this.apiClient.get(`/instance/connect/${instanceName}`);
              console.log(`✅ Reconexão iniciada para: ${instanceName}`);
            }
          } catch (error) {
            console.warn(`⚠️ Falha ao reconectar ${instanceName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro na reconexão automática:', error);
    }
  }

  // Adiciona método para verificar se a instância existe
  async instanceExists(instanceName: string): Promise<boolean> {
    try {
      await this.apiClient.get(`/instance/connectionState/${instanceName}`);
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Método para obter estatísticas do sistema
  async getStats(): Promise<{
    instances: {
      total: number;
      connected: number;
      disconnected: number;
    };
    messages: {
      total: number;
      today: number;
    };
    uptime: string;
    version: string;
  }> {
    try {
      const instances = await this.listInstances();
      
      let connectedCount = 0;
      let disconnectedCount = 0;
      
      // Verificar status de cada instância
      for (const instance of instances) {
        const instanceName = instance.instanceName || instance.instance?.instanceName;
        if (instanceName) {
          try {
            const status = await this.getInstanceStatus(instanceName, true);
            if (status.instance?.state === 'open') {
              connectedCount++;
            } else {
              disconnectedCount++;
            }
          } catch (error) {
            disconnectedCount++;
          }
        }
      }

      // Calcular uptime (simples baseado no tempo de funcionamento)
      const uptimeMs = Date.now() - this.lastHealthCheck;
      const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      const uptime = `${uptimeHours}h ${uptimeMinutes}m`;

      return {
        instances: {
          total: instances.length,
          connected: connectedCount,
          disconnected: disconnectedCount
        },
        messages: {
          total: 0, // Pode ser implementado com contadores reais
          today: 0
        },
        uptime: uptime || '0h 0m',
        version: '1.0.0'
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        instances: {
          total: 0,
          connected: 0,
          disconnected: 0
        },
        messages: {
          total: 0,
          today: 0
        },
        uptime: '0h 0m',
        version: '1.0.0'
      };
    }
  }
}

// Interfaces TypeScript
export interface InstanceCreatePayload {
  instanceName: string;
  qrcode?: boolean;
  integration?: string;
  webhook?: {
    enabled?: boolean;
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    events?: string[];
  };
  token?: string;
  number?: string;
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
}

export interface InstanceStatus {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
  };
}

export interface QRCodeResponse {
  base64?: string | null;
  code?: string;
  count?: number;
  success?: boolean;
  error?: string;
  rawCode?: string;
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
    media: string;
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

// Instância global
const evolutionManager = new EvolutionApiManager();

// Exports das funções principais (delegando para a instância)
export const createInstance = (instanceName: string, webhookUrl?: string) =>
  evolutionManager.createInstance(instanceName, { webhookUrl });

export const getInstanceQRCode = (instanceName: string) =>
  evolutionManager.getInstanceQRCode(instanceName);

export const getInstanceStatus = (instanceName: string) =>
  evolutionManager.getInstanceStatus(instanceName);

export const sendTextMessage = (instanceName: string, payload: SendTextPayload) =>
  evolutionManager.sendTextMessage(instanceName, payload);

export const deleteInstance = (instanceName: string) =>
  evolutionManager.deleteInstance(instanceName);

export const restartInstance = (instanceName: string) =>
  evolutionManager.restartInstance(instanceName);

export const logoutInstance = (instanceName: string) =>
  evolutionManager.logoutInstance(instanceName);

export const listInstances = () =>
  evolutionManager.listInstances();

export const testConnection = () =>
  evolutionManager.testConnection();

export const formatPhoneNumber = (phone: string) =>
  evolutionManager.formatPhoneNumber(phone);

export const isValidWhatsAppNumber = (phone: string) =>
  evolutionManager.isValidWhatsAppNumber(phone);

export const phoneToJid = (phone: string) =>
  evolutionManager.phoneToJid(phone);

export const setInstanceWebhook = (instanceName: string, webhookData: {
  url: string;
  events?: string[];
  enabled?: boolean;
}) => evolutionManager.setInstanceWebhook(instanceName, webhookData);

export const autoReconnectInstances = () =>
  evolutionManager.autoReconnectInstances();

export const instanceExists = (instanceName: string) =>
  evolutionManager.instanceExists(instanceName);

export const getStats = () =>
  evolutionManager.getStats();

// Interface simplificada para o Dashboard
export const evolutionApiService = {
  getStats: () => evolutionManager.getStats(),
  testConnection: () => evolutionManager.testConnection(),
  listInstances: () => evolutionManager.listInstances(),
  getInstanceStatus: (instanceName: string) => evolutionManager.getInstanceStatus(instanceName),
  getInstanceQRCode: (instanceName: string) => evolutionManager.getInstanceQRCode(instanceName),
  sendTextMessage: (instanceName: string, payload: SendTextPayload) => 
    evolutionManager.sendTextMessage(instanceName, payload),
  createInstance: (instanceName: string, options?: any) => 
    evolutionManager.createInstance(instanceName, options),
  deleteInstance: (instanceName: string) => evolutionManager.deleteInstance(instanceName),
  restartInstance: (instanceName: string) => evolutionManager.restartInstance(instanceName),
};

export default evolutionManager; 