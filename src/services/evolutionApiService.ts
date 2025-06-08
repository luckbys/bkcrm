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
  // Webhook configuration
  webhook?: {
    enabled?: boolean;
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    events?: string[];
  };
  // Campos adicionais que podem ser necessários
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
      webhook: {
        enabled: true,
        url: webhookUrl || `${window.location.origin}/api/webhooks/evolution`,
        byEvents: true,
        base64: false,
        events: [
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
      },
      // Configurações padrão para WhatsApp
      rejectCall: false,
      msgCall: 'Chamadas não são aceitas por este número.',
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: true,
      readStatus: true,
      syncFullHistory: false
    };

    console.log('🚀 Criando instância com payload:', payload);
    
    const response = await apiClient.post('/instance/create', payload);
    console.log('✅ Instância criada com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro detalhado ao criar instância:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // Tratamento específico de erros
    if (error.response?.status === 401) {
      throw new Error('API Key inválida ou não autorizada. Verifique VITE_EVOLUTION_API_KEY.');
    } else if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Dados inválidos';
      throw new Error(`Dados inválidos para criação da instância: ${errorMsg}`);
    } else if (error.response?.status === 409) {
      throw new Error('Instância já existe. Escolha um nome diferente.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Não foi possível conectar com Evolution API. Verifique se está rodando.');
    }
    
    throw new Error(`Falha ao criar instância: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Obtém o QR Code para conectar uma instância.
 * @param instanceName - O nome da instância.
 */
export const getInstanceQRCode = async (instanceName: string): Promise<QRCodeResponse | null> => {
  try {
    console.log(`📱 Obtendo QR Code para instância: ${instanceName}`);
    
    const response = await apiClient.get(`/instance/connect/${instanceName}`);
    console.log('🔍 Resposta da Evolution API:', response.data);
    
    if (response.data) {
      const data = response.data;
      
      // Cenário 1: QR Code vem no campo 'code' como string de texto
      if (data.code && typeof data.code === 'string') {
        console.log('📱 QR Code encontrado no campo "code"');
        
        // Verificar se é base64 de imagem
        if (data.code.startsWith('data:image/')) {
          console.log('✅ QR Code formatado corretamente');
          return {
            success: true,
            code: data.code,
            base64: data.code
          };
        }
        
        // Se é texto do QR Code, precisamos converter para imagem
        if (data.code.length > 50 && !data.code.startsWith('http')) {
          console.log('⚠️ QR Code parece ser textual, não base64 de imagem:', data.code.substring(0, 50) + '...');
          
          try {
            // Usar uma biblioteca para gerar QR Code visual a partir do texto
            const qrCodeDataUrl = await generateQRCodeImage(data.code);
            
            return {
              success: true,
              code: data.code,
              base64: qrCodeDataUrl
            };
          } catch (qrError) {
            console.error('❌ Erro ao gerar imagem do QR Code:', qrError);
            
            // Fallback: retornar o código raw para debug
            return {
              success: true,
              code: data.code,
              base64: null,
              rawCode: data.code
            };
          }
        }
      }
      
      // Cenário 2: QR Code vem no campo 'base64'
      if (data.base64) {
        console.log('🖼️ QR Code encontrado no campo "base64"');
        
        let qrCodeImage = data.base64;
        
        // Adicionar prefixo se necessário
        if (!qrCodeImage.startsWith('data:image/')) {
          qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
        }
        
        // Verificar se não há duplicação
        if (qrCodeImage.startsWith('data:image/png;base64,data:image/')) {
          qrCodeImage = qrCodeImage.replace('data:image/png;base64,data:image/', 'data:image/');
        }
        
        return {
          success: true,
          code: data.code || qrCodeImage,
          base64: qrCodeImage
        };
      }
      
      // Cenário 3: QR Code vem diretamente na raiz da resposta
      if (data.qrcode) {
        console.log('📲 QR Code encontrado no campo "qrcode"');
        
        let qrCodeImage = data.qrcode;
        if (!qrCodeImage.startsWith('data:image/')) {
          qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
        }
        
        return {
          success: true,
          code: data.qrcode,
          base64: qrCodeImage
        };
      }
      
      // Cenário 4: Resposta vazia ou instância já conectada
      if (data.instance?.status === 'open') {
        console.log('✅ Instância já está conectada - QR Code não necessário');
        return {
          success: false,
          error: 'Instância já conectada'
        };
      }
      
      console.log('⚠️ Estrutura de resposta não reconhecida:', data);
      return {
        success: false,
        error: 'Formato de QR Code não reconhecido'
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Erro ao obter QR Code:', error);
    
    if (error.response?.status === 404) {
      throw new Error(`Instância '${instanceName}' não encontrada`);
    }
    
    throw error;
  }
};

// Método auxiliar para gerar imagem QR Code a partir de texto
const generateQRCodeImage = async (qrText: string): Promise<string> => {
  try {
    // Usar uma API online ou biblioteca para gerar QR Code
    // Por agora, vamos usar uma API pública simples
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
    
    // Fazer requisição para obter a imagem
    const response = await fetch(qrApiUrl);
    const blob = await response.blob();
    
    // Converter blob para base64
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

/**
 * Força a reconexão de uma instância (útil quando está em estado inconsistente).
 * @param instanceName - O nome da instância.
 */
export const restartInstanceConnection = async (instanceName: string) => {
  try {
    console.log('🔄 Reiniciando conexão da instância:', instanceName);
    
    // Primeiro tentar desconectar
    try {
      await logoutInstance(instanceName);
      console.log('👋 Instância desconectada');
      
      // Aguardar um pouco antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (logoutError) {
      console.warn('⚠️ Erro ao desconectar (normal se já estava desconectada):', logoutError);
    }
    
    // Tentar conectar novamente
    const response = await apiClient.get(`/instance/connect/${instanceName}`);
    console.log('✅ Reconexão iniciada:', response.data);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Erro ao reiniciar conexão:', error.response?.data || error.message);
    throw new Error(`Falha ao reiniciar conexão: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Verifica se uma instância existe na Evolution API.
 * @param instanceName - O nome da instância.
 */
export const instanceExists = async (instanceName: string): Promise<boolean> => {
  try {
    await getInstanceStatus(instanceName);
    return true;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return false;
    }
    // Se der outro erro, assumir que existe mas há problemas de conectividade
    return true;
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

// --- FUNÇÕES DE DEBUG E TESTE ---

/**
 * Testa a conectividade com a Evolution API.
 */
export const testConnection = async () => {
  try {
    console.log('🔗 Testando conectividade com Evolution API...');
    console.log('📍 URL:', EVOLUTION_API_URL);
    console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Não configurada');
    
    // Testar endpoint básico
    const response = await apiClient.get('/');
    console.log('✅ Conectividade OK:', response.status, response.statusText);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Erro de conectividade:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

/**
 * Lista todas as instâncias existentes.
 */
export const listInstances = async () => {
  try {
    console.log('📋 Listando instâncias existentes...');
    const response = await apiClient.get('/instance/fetchInstances');
    console.log('✅ Instâncias encontradas:', response.data?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao listar instâncias:', error.response?.data || error.message);
    throw new Error(`Falha ao listar instâncias: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Função de teste para criação de instância com logging detalhado.
 */
export const testCreateInstance = async (instanceName: string) => {
  try {
    console.log('🧪 TESTE: Iniciando criação de instância de teste...');
    console.log('📝 Nome da instância:', instanceName);
    
    // 1. Testar conectividade primeiro
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`Falha na conectividade: ${connectionTest.error}`);
    }
    
    // 2. Verificar se instância já existe
    try {
      const existingInstances = await listInstances();
      const instanceExists = existingInstances?.some((inst: any) => 
        inst.instanceName === instanceName || inst.instance?.instanceName === instanceName
      );
      
      if (instanceExists) {
        console.log('⚠️ Instância já existe:', instanceName);
        return { success: false, error: 'Instância já existe' };
      }
    } catch (listError) {
      console.warn('⚠️ Não foi possível verificar instâncias existentes, continuando...');
    }
    
    // 3. Criar instância
    const result = await createInstance(instanceName);
    console.log('✅ TESTE: Instância criada com sucesso!', result);
    return { success: true, data: result };
    
  } catch (error: any) {
    console.error('❌ TESTE: Falha na criação da instância:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Função para depuração completa do Evolution API.
 */
export const debugEvolutionApi = async () => {
  console.log('🔍 INICIANDO DEBUG EVOLUTION API');
  console.log('=====================================');
  
  // Configurações
  console.log('📋 CONFIGURAÇÕES:');
  console.log('- URL:', EVOLUTION_API_URL);
  console.log('- API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : '❌ Não configurada');
  console.log('- Headers:', {
    'apikey': API_KEY ? `${API_KEY.substring(0, 8)}...` : '❌ Não configurada',
    'Content-Type': 'application/json'
  });
  
  // Teste de conectividade
  console.log('\n🔗 TESTE DE CONECTIVIDADE:');
  const connectionResult = await testConnection();
  
  if (!connectionResult.success) {
    console.log('❌ FALHA NA CONECTIVIDADE - Parando debug');
    return connectionResult;
  }
  
  // Listar instâncias
  console.log('\n📋 INSTÂNCIAS EXISTENTES:');
  try {
    const instances = await listInstances();
    if (instances?.length > 0) {
      instances.forEach((inst: any, index: number) => {
        console.log(`${index + 1}. ${inst.instanceName || inst.instance?.instanceName} - Status: ${inst.instance?.status || 'unknown'}`);
      });
    } else {
      console.log('ℹ️ Nenhuma instância encontrada');
    }
  } catch (error) {
    console.log('⚠️ Erro ao listar instâncias:', error);
  }
  
  console.log('\n✅ DEBUG CONCLUÍDO');
  console.log('=====================================');
  
  return { success: true, connectionResult };
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
  listInstances,
  
  // Mensagens
  sendTextMessage,
  sendMediaMessage,
  markMessageAsRead,
  
  // Utilitários
  formatPhoneNumber,
  isValidWhatsAppNumber,
  phoneToJid,
  processWebhookPayload,
  
  // Debug e teste
  testConnection,
  testCreateInstance,
  debugEvolutionApi,
  
  // Novas funções
  restartInstanceConnection,
  instanceExists
};

export default evolutionApiService; 