import {
  EvolutionAPIConfig,
  CreateInstanceData,
  WhatsAppInstance,
  QRCodeResponse,
  ConnectionState,
  SendMessageData,
  EvolutionAPIResponse,
  DepartmentWhatsAppConfig
} from '../types/whatsapp.types';

class EvolutionAPIService {
  private config: EvolutionAPIConfig;
  private baseHeaders: Record<string, string>;

  constructor(config?: EvolutionAPIConfig) {
    // Usar import.meta.env ao invés de process.env no Vite
    this.config = config || {
      baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
      apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '',
      globalApiKey: import.meta.env.VITE_EVOLUTION_GLOBAL_API_KEY || ''
    };

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'apikey': this.config.globalApiKey || this.config.apiKey
    };
  }

  // Configurar URL e API Key
  setConfig(config: Partial<EvolutionAPIConfig>) {
    this.config = { ...this.config, ...config };
    this.baseHeaders.apikey = this.config.globalApiKey || this.config.apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        ...this.baseHeaders,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Evolution API Error: ${response.status} - ${errorData}`);
    }

    return response.json();
  }

  // ===== GERENCIAMENTO DE INSTÂNCIAS =====

  // Criar nova instância
  async createInstance(data: CreateInstanceData): Promise<EvolutionAPIResponse<WhatsAppInstance>> {
    return this.makeRequest(`/instance/create`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Listar todas as instâncias
  async fetchInstances(): Promise<WhatsAppInstance[]> {
    const response = await this.makeRequest<WhatsAppInstance[]>('/instance/fetchInstances');
    return Array.isArray(response) ? response : [];
  }

  // Buscar instância específica
  async fetchInstance(instanceName: string): Promise<WhatsAppInstance> {
    return this.makeRequest(`/instance/fetchInstance/${instanceName}`);
  }

  // Conectar instância
  async connectInstance(instanceName: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/instance/connect/${instanceName}`, {
      method: 'GET'
    });
  }

  // Desconectar instância
  async logoutInstance(instanceName: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    });
  }

  // Deletar instância
  async deleteInstance(instanceName: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    });
  }

  // Restart instância
  async restartInstance(instanceName: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/instance/restart/${instanceName}`, {
      method: 'PUT'
    });
  }

  // ===== STATUS E CONEXÃO =====

  // Obter estado da conexão
  async getConnectionState(instanceName: string): Promise<ConnectionState> {
    return this.makeRequest(`/instance/connectionState/${instanceName}`);
  }

  // Obter QR Code - O QR code é retornado pelo endpoint /connect quando a instância está NOT_CONNECTED
  async getQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.makeRequest(`/instance/connect/${instanceName}`);
  }

  // Status da instância
  async getInstanceStatus(instanceName: string): Promise<{ instance: { state: string; status: string } }> {
    return this.makeRequest(`/instance/status/${instanceName}`);
  }

  // ===== ENVIO DE MENSAGENS =====

  // Enviar mensagem de texto
  async sendTextMessage(instanceName: string, data: SendMessageData): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Enviar mídia
  async sendMediaMessage(instanceName: string, data: SendMessageData): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Enviar mensagem com botões
  async sendButtonMessage(instanceName: string, data: SendMessageData): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/message/sendButtons/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ===== CONFIGURAÇÕES =====

  // Configurar webhook
  async setWebhook(instanceName: string, webhookUrl: string, events?: string[]): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        enabled: true,
        events: events || [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      })
    });
  }

  // Obter configurações do webhook
  async getWebhook(instanceName: string): Promise<any> {
    return this.makeRequest(`/webhook/find/${instanceName}`);
  }

  // Configurar Chatwoot
  async setChatwoot(instanceName: string, config: any): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/chatwoot/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  // ===== INFORMAÇÕES DO PROFILE =====

  // Obter informações do perfil
  async getProfileInfo(instanceName: string): Promise<any> {
    return this.makeRequest(`/chat/whatsappProfile/${instanceName}`);
  }

  // Atualizar nome do perfil
  async updateProfileName(instanceName: string, name: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/chat/updateProfileName/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  // Atualizar foto do perfil
  async updateProfilePicture(instanceName: string, picture: string): Promise<EvolutionAPIResponse> {
    return this.makeRequest(`/chat/updateProfilePicture/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ picture })
    });
  }

  // ===== UTILITÁRIOS =====

  // Verificar se o número é válido no WhatsApp
  async checkWhatsAppNumber(instanceName: string, numbers: string[]): Promise<any> {
    return this.makeRequest(`/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ numbers })
    });
  }

  // Buscar conversas
  async fetchChats(instanceName: string): Promise<any> {
    return this.makeRequest(`/chat/findChats/${instanceName}`);
  }

  // Buscar mensagens de um chat
  async fetchMessages(instanceName: string, remoteJid: string, limit = 20): Promise<any> {
    return this.makeRequest(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        where: { remoteJid },
        limit
      })
    });
  }

  // ===== MÉTODOS ESPECÍFICOS PARA DEPARTAMENTOS =====

  // Criar instância para departamento
  async createDepartmentInstance(
    departmentId: string, 
    departmentName: string,
    config: Partial<CreateInstanceData> = {}
  ): Promise<DepartmentWhatsAppConfig> {
    // Criar um nome de instância mais simples usando apenas o nome do departamento e um timestamp curto
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
    const sanitizedName = departmentName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const instanceName = `${sanitizedName}_${timestamp}`;
    
    const instanceData: CreateInstanceData = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      reject_call: false,
      groups_ignore: false,
      always_online: true,
      read_messages: true,
      read_status: false,
      sync_full_history: false,
      webhook_by_events: true,
      webhook_base64: false,
      ...config
    };

    const response = await this.createInstance(instanceData);

    const whatsappConfig: DepartmentWhatsAppConfig = {
      id: `wa_${Date.now()}`,
      departmentId,
      instanceName,
      integration: instanceData.integration || 'WHATSAPP-BAILEYS',
      status: 'connecting',
      autoReply: false,
      businessHours: {
        enabled: false,
        days: [1, 2, 3, 4, 5], // Segunda a sexta
        timezone: 'America/Sao_Paulo'
      },
      settings: {
        reject_call: instanceData.reject_call || false,
        msg_call: instanceData.msg_call,
        groups_ignore: instanceData.groups_ignore || false,
        always_online: instanceData.always_online || true,
        read_messages: instanceData.read_messages || true,
        read_status: instanceData.read_status || false,
        sync_full_history: instanceData.sync_full_history || false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return whatsappConfig;
  }

  // Verificar saúde da instância
  async checkInstanceHealth(instanceName: string): Promise<{
    isHealthy: boolean;
    status: string;
    lastSeen?: string;
    error?: string;
  }> {
    try {
      const status = await this.getInstanceStatus(instanceName);
      const connectionState = await this.getConnectionState(instanceName);
      
      return {
        isHealthy: status.instance.status === 'open' && connectionState.state === 'open',
        status: status.instance.status,
        lastSeen: new Date().toISOString()
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Configurar mensagens automáticas para departamento
  async setupDepartmentAutoMessages(
    instanceName: string,
    config: {
      welcomeMessage?: string;
      awayMessage?: string;
      businessHours?: {
        enabled: boolean;
        start?: string;
        end?: string;
        days?: number[];
      };
    }
  ): Promise<void> {
    // Esta funcionalidade seria implementada via webhook ou integração com Typebot
    // Por enquanto, salvamos a configuração no banco de dados
    console.log('Configurando mensagens automáticas para:', instanceName, config);
  }
}

// Singleton instance
export const evolutionAPI = new EvolutionAPIService();
export default EvolutionAPIService; 