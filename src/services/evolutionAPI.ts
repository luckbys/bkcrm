import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG, EVOLUTION_CONFIG, APP_CONFIG } from '@/config';

// Configurações da Evolution API
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://webhook.bkcrm.devsible.com.br/api';
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

export interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
  timestamp: string;
  type?: string;
}

// Rate limiting e retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const RATE_LIMIT_DELAY = 100; // 100ms entre requests

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version?: string;
}

interface StatsResponse {
  success: boolean;
  server: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu: any;
  };
  websocket: {
    connectedClients: number;
    totalConnections: number;
    rooms: string[];
  };
  evolution: {
    instances: number;
    connected: number;
    disconnected: number;
  };
}

interface EvolutionInstance {
  instanceName: string;
  status: 'open' | 'close' | 'connecting';
  serverUrl: string;
  apikey: string;
  qrcode?: {
    base64: string;
    code: string;
  };
}

interface SendMessageRequest {
  instance: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording';
    quoted?: string;
  };
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MessagesResponse {
  success: boolean;
  messages: any[];
  count: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

class EvolutionApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.API_BASE_URL,
      timeout: APP_CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const method = config.method?.toUpperCase() || 'GET';
        const url = config.url || '';
        
        if (APP_CONFIG.DEBUG) {
          console.log(`🚀 [Evolution API] ${method} ${url}`);
          if (config.data) {
            console.log('📤 Request Data:', config.data);
          }
        }
        
      return config;
      },
      (error) => {
        console.error('❌ [Evolution API] Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const method = response.config.method?.toUpperCase() || 'GET';
        const url = response.config.url || '';
        const status = response.status;
        
        if (APP_CONFIG.DEBUG) {
          console.log(`✅ [Evolution API] ${method} ${url} - ${status}`);
          if (response.data) {
            console.log('📥 Response Data:', response.data);
          }
        }
        
        return response;
      },
      (error) => {
        const method = error.config?.method?.toUpperCase() || 'GET';
        const url = error.config?.url || '';
        const status = error.response?.status || 'No Response';
        
        console.error(`❌ [Evolution API] ${method} ${url} - ${status}`, error.message);
        
        if (error.response?.data) {
          console.error('📥 Error Response:', error.response.data);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Health check do servidor webhook
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await this.api.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  // Buscar estatísticas do servidor
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await this.api.get<StatsResponse>('/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  // Buscar estatísticas WebSocket
  async getWebSocketStats(): Promise<any> {
    try {
      const response = await this.api.get('/ws-stats');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get WebSocket stats: ${error.message}`);
    }
  }

  // Buscar instâncias Evolution API
  async fetchInstances(instanceName?: string): Promise<EvolutionInstance[]> {
    try {
      const url = instanceName 
        ? `/instance/fetchInstances?instanceName=${instanceName}` 
        : '/instance/fetchInstances';
      
      const response = await this.api.get<EvolutionInstance[]>(url);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch instances: ${error.message}`);
    }
  }

  // Buscar status de uma instância específica
  async getInstanceStatus(instanceName: string): Promise<EvolutionInstance> {
    try {
      const response = await this.api.get<EvolutionInstance>(`/instance/status/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get instance status: ${error.message}`);
    }
  }

  // Buscar QR Code de uma instância
  async getInstanceQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await this.api.get(`/instance/qrcode/${instanceName}`);
      return response.data.qrCode || null;
    } catch (error: any) {
      console.warn(`QR Code not available for ${instanceName}:`, error.message);
      return null;
    }
  }

  // Buscar mensagens de uma instância
  async getMessages(
    instanceName: string, 
    limit: number = 50, 
    offset: number = 0,
    filters?: {
      fromMe?: boolean;
      messageType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<MessagesResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...filters
      });

      const response = await this.api.get<MessagesResponse>(
        `/messages/${instanceName}?${params}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  // Enviar mensagem (através do webhook)
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.api.post<SendMessageResponse>('/send-message', {
        instance: request.instance,
        to: request.to,
        message: request.message,
        type: request.type || 'text',
        options: request.options || {}
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Testar envio de mensagem
  async testSendMessage(instanceName?: string): Promise<SendMessageResponse> {
    try {
      const instance = instanceName || EVOLUTION_CONFIG.DEFAULT_INSTANCE;
      const response = await this.api.post<SendMessageResponse>('/test-send', {
        instance,
        to: '5511999999999@s.whatsapp.net', // Número de teste
        message: `🧪 Teste de envio - ${new Date().toLocaleString()}`,
        type: 'text'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to test send message: ${error.message}`);
    }
  }

  // Verificar instância na Evolution API
  async checkEvolutionInstance(instanceName?: string): Promise<any> {
    try {
      const instance = instanceName || EVOLUTION_CONFIG.DEFAULT_INSTANCE;
      const response = await this.api.get(`/check-instance?instance=${instance}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to check Evolution instance: ${error.message}`);
    }
  }

  // Criar/configurar instância Evolution API
  async createInstance(instanceData: {
    instanceName: string;
    token?: string;
    qrcode?: boolean;
    webhook?: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/create-instance', {
        instanceName: instanceData.instanceName,
        token: instanceData.token || EVOLUTION_CONFIG.GLOBAL_API_KEY,
        qrcode: instanceData.qrcode !== false,
        webhook: instanceData.webhook || EVOLUTION_CONFIG.WEBHOOK_URL,
        events: [
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
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
          'CHATS_DELETE'
        ]
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create instance: ${error.message}`);
    }
  }

  // Configurar webhook para instância
  async configureWebhook(instanceName: string, webhookUrl?: string): Promise<any> {
    try {
      const response = await this.api.post('/configure-webhook', {
        instance: instanceName,
        webhook: webhookUrl || EVOLUTION_CONFIG.WEBHOOK_URL,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT'
        ]
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to configure webhook: ${error.message}`);
    }
  }

  // Métodos de diagnóstico
  async runDiagnostics(): Promise<{
    health: HealthCheckResponse;
    stats: StatsResponse;
    instances: EvolutionInstance[];
    websocketStats: any;
  }> {
    try {
      console.log('🔍 Executando diagnóstico completo...');
      
      const [health, stats, instances, websocketStats] = await Promise.allSettled([
        this.checkHealth(),
        this.getStats(),
        this.fetchInstances(),
        this.getWebSocketStats()
      ]);

      return {
        health: health.status === 'fulfilled' ? health.value : { status: 'error', timestamp: new Date().toISOString(), uptime: 0 },
        stats: stats.status === 'fulfilled' ? stats.value : {} as StatsResponse,
        instances: instances.status === 'fulfilled' ? instances.value : [],
        websocketStats: websocketStats.status === 'fulfilled' ? websocketStats.value : {}
      };
    } catch (error: any) {
      throw new Error(`Diagnostics failed: ${error.message}`);
    }
  }
}

// Exportar instância única
export const evolutionApi = new EvolutionApiService();

// Exportar classe para casos especiais
export { EvolutionApiService };

// Exportar tipos
export type {
  HealthCheckResponse,
  StatsResponse,
  EvolutionInstance,
  SendMessageRequest,
  SendMessageResponse,
  MessagesResponse
}; 