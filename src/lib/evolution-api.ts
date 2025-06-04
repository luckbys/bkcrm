import {
  EvolutionAPIInstance,
  EvolutionAPISettings,
  CreateInstanceRequest,
  CreateInstanceResponse,
  EvolutionAPIInfo
} from '@/types/evolution-api';

// Configuração global simplificada
const GLOBAL_INSTANCE_NAME = 'crm_whatsapp_global';
const GLOBAL_WEBHOOK_URL = 'https://press-n8n.jhkbgs.easypanel.host/webhook-test/recebe';

export class EvolutionAPIService {
  private baseUrl: string;
  private globalApiKey: string;

  constructor(baseUrl: string, globalApiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.globalApiKey = globalApiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Fazendo requisição: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('📤 Body da requisição:', options.body);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.globalApiKey,
        ...options.headers,
      },
    });

    console.log(`📡 Resposta recebida: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
        console.error('❌ Dados do erro:', errorData);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do erro:', parseError);
      }
      
      const errorMessage = errorData.message || errorData.error || response.statusText || 'Erro desconhecido';
      
      throw new Error(
        `Evolution API Error: ${response.status} - ${errorMessage}`
      );
    }

    const responseData = await response.json();
    console.log('✅ Dados da resposta:', responseData);
    return responseData;
  }

  // Obter informações da API
  async getInfo(): Promise<EvolutionAPIInfo> {
    return this.request<EvolutionAPIInfo>('/');
  }

  // Testar conectividade com a Evolution API
  async testConnection(): Promise<{ success: boolean; info?: EvolutionAPIInfo; error?: string }> {
    try {
      console.log('🔍 Testando conectividade com Evolution API...');
      const info = await this.getInfo();
      console.log('✅ Evolution API respondeu:', info);
      return { success: true, info };
    } catch (error: any) {
      console.error('❌ Falha na conectividade:', error);
      return { 
        success: false, 
        error: error.message || 'Falha na conexão'
      };
    }
  }

  // Criar a instância global única
  async createGlobalInstance(): Promise<CreateInstanceResponse> {
    console.log('🔍 Verificando se instância global já existe...');
    
    // Primeiro verificar se a instância já existe
    try {
      const instances = await this.fetchInstances();
      const existingInstance = instances.find(inst => inst.instanceName === GLOBAL_INSTANCE_NAME);
      
      if (existingInstance) {
        console.log('⚠️ Instância global já existe:', existingInstance);
        
        if (existingInstance.status === 'open') {
          console.log('✅ Instância já está conectada, não precisa criar nova');
          // Retornar dados da instância existente
          return {
            instance: {
              instanceName: existingInstance.instanceName,
              instanceId: existingInstance.instanceId || GLOBAL_INSTANCE_NAME,
              status: existingInstance.status
            },
            hash: {
              apikey: existingInstance.apikey || this.globalApiKey
            },
            settings: {
              reject_call: false,
              msg_call: 'Desculpe, não podemos atender chamadas no momento. Por favor, envie uma mensagem.',
              groups_ignore: false,
              always_online: true,
              read_messages: true,
              read_status: true,
              sync_full_history: false,
            }
          };
        }
        
        console.log('🔄 Instância existe mas não está conectada, tentando deletar antes de recriar...');
        try {
          await this.deleteGlobalInstance();
          console.log('🗑️ Instância anterior deletada');
          // Aguardar um pouco antes de recriar
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (deleteError) {
          console.log('⚠️ Erro ao deletar instância anterior (continuando):', deleteError);
        }
      }
    } catch (error) {
      console.log('ℹ️ Erro ao verificar instâncias existentes (provavelmente não existe):', error);
    }

    // Criar nova instância conforme documentação oficial
    const createRequest = {
      instanceName: GLOBAL_INSTANCE_NAME,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: GLOBAL_WEBHOOK_URL,
      webhook_by_events: true,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE', 
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'CALL',
        'GROUPS_UPSERT',
        'GROUP_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
        'PRESENCE_UPDATE',
        'CHATS_SET',
        'CHATS_UPSERT',
        'CHATS_UPDATE',
        'CHATS_DELETE',
        'CONTACTS_SET',
        'CONTACTS_UPSERT',
        'CONTACTS_UPDATE'
      ],
      // Settings incluídos diretamente no create (conforme documentação)
      reject_call: false,
      msg_call: 'Desculpe, não podemos atender chamadas no momento. Por favor, envie uma mensagem.',
      groups_ignore: false,
      always_online: true,
      read_messages: true,
      read_status: true
    };

    console.log('🌐 Criando instância global única:', GLOBAL_INSTANCE_NAME);
    console.log('📡 Webhook configurado:', GLOBAL_WEBHOOK_URL);
    console.log('📋 Dados da criação:', JSON.stringify(createRequest, null, 2));
    
    try {
      const response = await this.request<CreateInstanceResponse>('/instance/create', {
        method: 'POST',
        body: JSON.stringify(createRequest),
      });
      
      console.log('✅ Instância global criada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro detalhado ao criar instância:', error);
      throw error;
    }
  }

  // Desconectar instância global
  async disconnectGlobalInstance(): Promise<any> {
    console.log(`🔌 Desconectando instância global: ${GLOBAL_INSTANCE_NAME}`);
    return this.request(`/instance/logout/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`, {
      method: 'DELETE',
    });
  }

  // Deletar instância global
  async deleteGlobalInstance(): Promise<any> {
    console.log(`🗑️ Deletando instância global: ${GLOBAL_INSTANCE_NAME}`);
    return this.request(`/instance/delete/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`, {
      method: 'DELETE',
    });
  }

  // Obter QR Code da instância global
  async getGlobalQRCode(): Promise<{ qrcode: string }> {
    console.log(`🔳 Obtendo QR Code da instância global: ${GLOBAL_INSTANCE_NAME}`);
    
    try {
      // Estratégia 1: Verificar status da instância que pode conter QR Code
      console.log('📡 Verificando status da instância...');
      const statusResponse = await this.getGlobalInstanceStatus();
      
      if (statusResponse.instance && statusResponse.instance.qrcode) {
        console.log('✅ QR Code encontrado no status da instância');
        return { qrcode: statusResponse.instance.qrcode };
      }
      
      // Estratégia 2: Buscar na listagem de instâncias
      console.log('📋 Buscando QR Code na listagem de instâncias...');
      const instances = await this.fetchInstances();
      const globalInstance = instances.find(inst => inst.instanceName === GLOBAL_INSTANCE_NAME);
      
      if (globalInstance && globalInstance.qrcode) {
        console.log('✅ QR Code encontrado na listagem de instâncias');
        return { qrcode: globalInstance.qrcode };
      }
      
      // Se não encontrou QR Code, a instância pode já estar conectada
      if (globalInstance && globalInstance.status === 'open') {
        throw new Error('Instância já está conectada. QR Code não é necessário.');
      }
      
      throw new Error(`QR Code não disponível para a instância global. Status: ${globalInstance?.status || 'desconhecido'}`);
      
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code global:', error);
      throw error;
    }
  }

  // Verificar status da instância global
  async getGlobalInstanceStatus(): Promise<{ instance: EvolutionAPIInstance }> {
    return this.request<{ instance: EvolutionAPIInstance }>(`/instance/connectionState/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`);
  }

  // Buscar instâncias
  async fetchInstances(): Promise<EvolutionAPIInstance[]> {
    return this.request<EvolutionAPIInstance[]>('/instance/fetchInstances');
  }

  // Enviar mensagem através da instância global
  async sendMessage(to: string, message: string, sectorId?: string): Promise<any> {
    const messageData = {
      number: to,
      text: sectorId ? `[Setor ${sectorId}] ${message}` : message,
    };

    console.log(`📤 Enviando mensagem via instância global para: ${to}`);
    
    return this.request(`/message/sendText/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Configurar settings da instância global
  async setGlobalSettings(settings: Partial<EvolutionAPISettings>): Promise<any> {
    console.log('⚙️ Atualizando configurações da instância global');
    return this.request(`/settings/set/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Obter settings da instância global
  async getGlobalSettings(): Promise<EvolutionAPISettings> {
    return this.request<EvolutionAPISettings>(`/settings/find/${encodeURIComponent(GLOBAL_INSTANCE_NAME)}`);
  }
}

// Gerenciador simplificado para WhatsApp global
export class GlobalWhatsAppManager {
  private evolutionAPI: EvolutionAPIService;
  private instanceStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private instanceData: any = null;

  constructor(evolutionAPI: EvolutionAPIService) {
    this.evolutionAPI = evolutionAPI;
    this.loadFromStorage();
  }

  // Inicializar WhatsApp global
  async initializeGlobalWhatsApp(): Promise<{ needsQR: boolean; qrCode?: string }> {
    try {
      console.log('🚀 Inicializando WhatsApp global...');
      
      // Primeiro testar conectividade com a Evolution API
      console.log('🔍 Passo 0: Testando conectividade com Evolution API...');
      const connectionTest = await this.evolutionAPI.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Falha na conectividade: ${connectionTest.error}`);
      }
      
      console.log('✅ Evolution API online:', connectionTest.info?.version);
      
      // Verificar se já existe e está funcionando
      console.log('🔍 Passo 1: Verificando status da instância existente...');
      const existingStatus = await this.checkGlobalInstanceStatus();
      
      if (existingStatus.exists && existingStatus.status === 'open') {
        console.log('✅ Instância global já existe e está conectada');
        this.instanceStatus = 'connected';
        this.saveToStorage();
        return { needsQR: false };
      }
      
      // Se não existe ou não está aberta, criar nova instância
      console.log('📱 Passo 2: Criando instância global...');
      
      const createResponse = await this.evolutionAPI.createGlobalInstance();
      this.instanceData = createResponse;
      console.log('✅ Instância global criada:', createResponse.instance.instanceName);
      
      // Verificar status da instância criada
      if (createResponse.instance.status === 'open') {
        console.log('✅ Instância já está conectada após criação');
        this.instanceStatus = 'connected';
        this.saveToStorage();
        return { needsQR: false };
      }
      
      // Se não está 'open', tentar obter QR Code
      console.log('🔗 Passo 3: Obtendo QR Code...');
      this.instanceStatus = 'connecting';
      this.saveToStorage();
      
      // Aguardar um pouco para a instância ser processada
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const qrCodeData = await this.evolutionAPI.getGlobalQRCode();
        console.log('✅ QR Code obtido com sucesso');
        
        return { 
          needsQR: true, 
          qrCode: qrCodeData.qrcode 
        };
      } catch (qrError: any) {
        console.error('❌ Erro ao obter QR Code:', qrError);
        
        // Se não conseguiu obter QR Code, verificar se a instância está conectada
        const finalStatus = await this.checkGlobalInstanceStatus();
        if (finalStatus.exists && finalStatus.status === 'open') {
          console.log('✅ Instância conectou automaticamente durante o processo');
          this.instanceStatus = 'connected';
          this.saveToStorage();
          return { needsQR: false };
        }
        
        throw qrError;
      }
      
    } catch (error: any) {
      console.error('❌ Erro geral ao inicializar WhatsApp global:', error);
      this.instanceStatus = 'error';
      this.saveToStorage();
      
      // Melhorar a mensagem de erro para o usuário
      let userMessage = 'Erro desconhecido ao conectar WhatsApp';
      
      if (error.message.includes('400')) {
        userMessage = 'Dados inválidos enviados para a API. Verifique a configuração.';
      } else if (error.message.includes('401')) {
        userMessage = 'API Key inválida. Verifique suas credenciais.';
      } else if (error.message.includes('404')) {
        userMessage = 'Serviço Evolution API não encontrado. Verifique a URL.';
      } else if (error.message.includes('already exists')) {
        userMessage = 'Instância já existe. Tente resetar a conexão.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Erro de rede. Verifique sua conexão com a internet.';
      } else if (error.message.includes('Falha na conectividade')) {
        userMessage = `Não foi possível conectar à Evolution API: ${error.message}`;
      }
      
      const enhancedError = new Error(userMessage);
      // Anexar erro original para debugging (no console)
      console.error('Erro original:', error);
      throw enhancedError;
    }
  }

  // Verificar status da instância global
  async checkGlobalInstanceStatus(): Promise<{ exists: boolean; status?: string }> {
    try {
      const statusResponse = await this.evolutionAPI.getGlobalInstanceStatus();
      console.log('📊 Status da instância global:', statusResponse.instance.status);
      
      this.instanceStatus = statusResponse.instance.status === 'open' ? 'connected' : 'disconnected';
      this.saveToStorage();
      
      return {
        exists: true,
        status: statusResponse.instance.status
      };
    } catch (error: any) {
      if (error.message.includes('404')) {
        console.log('ℹ️ Instância global não existe');
        this.instanceStatus = 'disconnected';
        this.saveToStorage();
        return { exists: false };
      }
      throw error;
    }
  }

  // Desconectar WhatsApp global
  async disconnectGlobalWhatsApp(): Promise<void> {
    try {
      await this.evolutionAPI.disconnectGlobalInstance();
      this.instanceStatus = 'disconnected';
      this.saveToStorage();
      console.log('✅ WhatsApp global desconectado');
    } catch (error: any) {
      if (error.message.includes('404')) {
        console.log('✅ Instância já não existe (404) - marcando como desconectada');
        this.instanceStatus = 'disconnected';
        this.saveToStorage();
      } else {
        throw error;
      }
    }
  }

  // Resetar instância global (deletar e permitir recriar)
  async resetGlobalWhatsApp(): Promise<void> {
    try {
      console.log('🔄 Resetando instância global...');
      await this.evolutionAPI.deleteGlobalInstance();
      this.instanceStatus = 'disconnected';
      this.instanceData = null;
      this.saveToStorage();
      console.log('✅ Instância global resetada');
    } catch (error: any) {
      if (error.message.includes('404')) {
        console.log('✅ Instância já não existe (404) - reset concluído');
        this.instanceStatus = 'disconnected';
        this.instanceData = null;
        this.saveToStorage();
      } else {
        throw error;
      }
    }
  }

  // Enviar mensagem
  async sendMessage(to: string, message: string, sectorId?: string): Promise<any> {
    if (this.instanceStatus !== 'connected') {
      throw new Error('WhatsApp global não está conectado');
    }
    
    return this.evolutionAPI.sendMessage(to, message, sectorId);
  }

  // Getters
  getStatus(): string {
    return this.instanceStatus;
  }

  isConnected(): boolean {
    return this.instanceStatus === 'connected';
  }

  // Salvar no localStorage
  private saveToStorage(): void {
    const data = {
      instanceStatus: this.instanceStatus,
      instanceData: this.instanceData,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem('global_whatsapp_manager', JSON.stringify(data));
  }

  // Carregar do localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('global_whatsapp_manager');
      if (data) {
        const parsed = JSON.parse(data);
        this.instanceStatus = parsed.instanceStatus || 'disconnected';
        this.instanceData = parsed.instanceData || null;
      }
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
    }
  }
} 