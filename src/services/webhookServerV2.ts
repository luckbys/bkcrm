import { WEBHOOK_SERVER_V2_CONFIG } from '@/config';

export interface WebhookServerV2Response {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

export interface MessagePayload {
  ticketId: string;
  content: string;
  sender: 'agent' | 'client';
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  metadata?: Record<string, any>;
  isInternal?: boolean;
}

export interface WebhookMessage {
  id: string;
  ticketId: string;
  content: string;
  sender: string;
  messageType: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * Serviço para integração com o novo Webhook Server V2
 * Responsável por enviar e processar mensagens do CRM
 */
export class WebhookServerV2Service {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = WEBHOOK_SERVER_V2_CONFIG.BASE_URL;
    this.timeout = WEBHOOK_SERVER_V2_CONFIG.TIMEOUT;
    this.retryAttempts = WEBHOOK_SERVER_V2_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = WEBHOOK_SERVER_V2_CONFIG.RETRY_DELAY;
  }

  /**
   * Fazer requisição HTTP com retry automático
   */
  private async makeRequest(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<WebhookServerV2Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BKCRM-Client/1.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || response.statusText}`);
      }

      return {
        success: true,
        data,
        statusCode: response.status
      };

    } catch (error: any) {
      console.error(`❌ [WEBHOOK-V2] Tentativa ${attempt} falhou:`, error.message);

      if (attempt < this.retryAttempts) {
        console.log(`🔄 [WEBHOOK-V2] Tentando novamente em ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.makeRequest(url, options, attempt + 1);
      }

      return {
        success: false,
        error: error.message,
        statusCode: error.name === 'AbortError' ? 408 : 500
      };
    }
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verificar saúde do servidor webhook
   */
  async healthCheck(): Promise<WebhookServerV2Response> {
    console.log('🏥 [WEBHOOK-V2] Verificando saúde do servidor...');
    
    return this.makeRequest(WEBHOOK_SERVER_V2_CONFIG.HEALTH_CHECK_URL, {
      method: 'GET'
    });
  }

  /**
   * Enviar mensagem para o webhook server para processamento
   */
  async sendMessage(payload: MessagePayload): Promise<WebhookServerV2Response> {
    console.log('📤 [WEBHOOK-V2] Enviando mensagem:', {
      ticketId: payload.ticketId,
      messageType: payload.messageType,
      sender: payload.sender,
      isInternal: payload.isInternal
    });

    return this.makeRequest(WEBHOOK_SERVER_V2_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'message',
        action: 'send',
        data: payload,
        timestamp: new Date().toISOString(),
        source: 'bkcrm-frontend'
      })
    });
  }

  /**
   * Processar mensagem recebida do webhook
   */
  async processIncomingMessage(webhookData: any): Promise<WebhookServerV2Response> {
    console.log('📥 [WEBHOOK-V2] Processando mensagem recebida:', {
      type: webhookData.type,
      action: webhookData.action
    });

    return this.makeRequest(WEBHOOK_SERVER_V2_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'message',
        action: 'process',
        data: webhookData,
        timestamp: new Date().toISOString(),
        source: 'bkcrm-frontend'
      })
    });
  }

  /**
   * Obter status de uma mensagem específica
   */
  async getMessageStatus(messageId: string): Promise<WebhookServerV2Response> {
    console.log('📊 [WEBHOOK-V2] Obtendo status da mensagem:', messageId);

    return this.makeRequest(`${this.baseUrl}/message/${messageId}/status`, {
      method: 'GET'
    });
  }

  /**
   * Configurar webhook na Evolution API para usar o novo servidor
   */
  async configureEvolutionWebhook(instanceName: string): Promise<WebhookServerV2Response> {
    console.log('⚙️ [WEBHOOK-V2] Configurando webhook na Evolution API:', instanceName);

    return this.makeRequest(`${this.baseUrl}/evolution/configure`, {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        webhookUrl: WEBHOOK_SERVER_V2_CONFIG.WEBHOOK_URL,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'SEND_MESSAGE'
        ]
      })
    });
  }

  /**
   * Sincronizar mensagens com o servidor webhook
   */
  async syncMessages(ticketId: string, lastSyncTimestamp?: string): Promise<WebhookServerV2Response> {
    console.log('🔄 [WEBHOOK-V2] Sincronizando mensagens:', {
      ticketId,
      since: lastSyncTimestamp
    });

    return this.makeRequest(`${this.baseUrl}/sync/messages`, {
      method: 'POST',
      body: JSON.stringify({
        ticketId,
        since: lastSyncTimestamp,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Testar conectividade com o servidor
   */
  async testConnection(): Promise<WebhookServerV2Response> {
    console.log('🧪 [WEBHOOK-V2] Testando conectividade...');

    const healthResult = await this.healthCheck();
    
    if (!healthResult.success) {
      return healthResult;
    }

    // Testar envio de mensagem de teste
    const testMessage: MessagePayload = {
      ticketId: 'test-ticket-' + Date.now(),
      content: 'Teste de conectividade BKCRM',
      sender: 'agent',
      messageType: 'text',
      isInternal: true,
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    return this.sendMessage(testMessage);
  }
}

// Instância singleton do serviço
export const webhookServerV2 = new WebhookServerV2Service();

// Funções utilitárias para uso direto
export const sendMessageToWebhookV2 = (payload: MessagePayload) => 
  webhookServerV2.sendMessage(payload);

export const testWebhookV2Connection = () => 
  webhookServerV2.testConnection();

export const configureEvolutionWebhookV2 = (instanceName: string) => 
  webhookServerV2.configureEvolutionWebhook(instanceName);

// Expor funções globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).webhookV2Debug = {
    service: webhookServerV2,
    testConnection: testWebhookV2Connection,
    sendMessage: sendMessageToWebhookV2,
    configure: configureEvolutionWebhookV2
  };
}

console.log('✅ [WEBHOOK-V2] Serviço inicializado. Debug disponível em: window.webhookV2Debug'); 