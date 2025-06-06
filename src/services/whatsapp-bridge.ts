import { TicketMessage, TicketEvent } from './rabbitmq';
import { supabase } from '../lib/supabase';

// Configuração da Evolution API
const EVOLUTION_CONFIG = {
  baseUrl: 'https://press-evolution-api.jhkbgs.easypanel.host',
  apiKey: '429683C4C977415CAAFCCE10F7D57E11',
  timeout: 10000,
  webhookUrl: 'https://press-n8n.jhkbgs.easypanel.host/webhook-test/recebe'
};

// Interface para dados do departamento/instância
interface DepartmentInstance {
  id: string;
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  phone?: string;
  department: string;
}

// Mapeamento de departamentos para instâncias
const DEPARTMENT_INSTANCES: Record<string, string> = {
  'vendas': 'sales_instance',
  'suporte': 'support_instance', 
  'atendimento': 'customer_service_instance',
  'financeiro': 'finance_instance',
  'marketing': 'marketing_instance',
  'rh': 'hr_instance'
};

// Interface para mensagem da Evolution API
interface EvolutionMessage {
  number: string;
  text?: string;
  mediaMessage?: {
    mediatype: 'image' | 'video' | 'audio' | 'document';
    media: string; // Base64 ou URL
    fileName?: string;
    caption?: string;
  };
}

interface TicketWithProfile {
  id: string;
  customer_id: string;
  department: string;
  profiles: {
    phone: string;
  } | null;
}

// Interface para instância da Evolution API
interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: string;
    phone?: string;
  };
}

// Interface para erros da Evolution API
interface EvolutionAPIError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
}

// Classe de erro customizada
class WhatsAppBridgeError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'WhatsAppBridgeError';
  }
}

export class WhatsAppBridgeService {
  private isEnabled: boolean = false;
  private messageQueue: TicketMessage[] = [];
  private processingQueue: boolean = false;

  constructor() {
    this.checkEvolutionConnection();
    this.startQueueProcessor();
  }

  // Verificar se Evolution API está disponível
  private async checkEvolutionConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/manager/findInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_CONFIG.apiKey
        },
        signal: AbortSignal.timeout(EVOLUTION_CONFIG.timeout)
      });

      if (response.ok) {
        this.isEnabled = true;
        console.log('✅ [WHATSAPP-BRIDGE] Evolution API conectada');
        return true;
      }

      const errorData = await response.json();
      throw new WhatsAppBridgeError(
        `Evolution API retornou status ${response.status}: ${errorData.message || response.statusText}`
      );
    } catch (error) {
      const bridgeError = new WhatsAppBridgeError(
        'Evolution API não disponível',
        error instanceof Error ? error : undefined
      );
      console.warn('⚠️ [WHATSAPP-BRIDGE]', bridgeError);
      this.isEnabled = false;
      return false;
    }
  }

  // Processar mensagem do RabbitMQ para WhatsApp
  async processRabbitMQMessage(message: TicketMessage): Promise<void> {
    if (!this.isEnabled) {
      console.log('📱 [WHATSAPP-BRIDGE] Evolution API desabilitada - mensagem ignorada');
      return;
    }

    // Apenas processar mensagens de agentes para clientes
    if (message.sender !== 'agent' || message.isInternal) {
      console.log('📱 [WHATSAPP-BRIDGE] Mensagem interna ou de cliente - ignorada');
      return;
    }

    // Adicionar à fila
    this.messageQueue.push(message);
    console.log(`📱 [WHATSAPP-BRIDGE] Mensagem adicionada à fila: ${message.messageId}`);
  }

  // Processar fila de mensagens
  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.processingQueue || this.messageQueue.length === 0) {
        return;
      }

      this.processingQueue = true;
      
      try {
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (message) {
            await this.sendToWhatsApp(message);
            // Delay entre envios para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('❌ [WHATSAPP-BRIDGE] Erro processando fila:', error);
      } finally {
        this.processingQueue = false;
      }
    }, 2000); // Processar a cada 2 segundos
  }

  // Enviar mensagem para WhatsApp via webhook
  private async sendToWhatsApp(message: TicketMessage): Promise<void> {
    try {
      // Buscar informações do ticket e cliente no banco
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id,
          customer_id,
          department,
          profiles!inner (
            phone
          )
        `)
        .eq('id', message.ticketId)
        .single();

      if (ticketError) {
        throw new WhatsAppBridgeError(
          `Erro ao buscar ticket: ${ticketError.message}`,
          ticketError
        );
      }
      
      const typedTicket = ticket as unknown as TicketWithProfile;
      if (!typedTicket) {
        throw new WhatsAppBridgeError('Ticket não encontrado');
      }
      if (!typedTicket.profiles?.phone) {
        throw new WhatsAppBridgeError('Telefone do cliente não encontrado');
      }

      // Determinar instância baseada no departamento
      const instanceName = DEPARTMENT_INSTANCES[typedTicket.department.toLowerCase()] || 'support_instance';

      // Preparar payload do webhook
      const webhookData = {
        type: 'whatsapp_message',
        source: 'crm',
        timestamp: new Date().toISOString(),
        data: {
          instanceName: instanceName,
          to: typedTicket.profiles.phone,
          message: message.content,
          messageType: 'text',
          ticketId: message.ticketId,
          messageId: message.messageId,
          metadata: {
            department: typedTicket.department,
            isAgent: true,
            isInternal: false
          }
        }
      };

      console.log('📤 [WHATSAPP-BRIDGE] Enviando para webhook:', {
        url: EVOLUTION_CONFIG.webhookUrl,
        data: webhookData
      });

      // Enviar via webhook com retry
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch(EVOLUTION_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_CONFIG.apiKey,
              'X-Source': 'crm-whatsapp-bridge'
            },
            body: JSON.stringify(webhookData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [WHATSAPP-BRIDGE] Tentativa ${retryCount + 1}/${maxRetries} falhou:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            
            if (retryCount === maxRetries - 1) {
              throw new Error(`Webhook Error: ${response.status} - ${errorText}`);
            }
            
            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            retryCount++;
            continue;
          }

          const result = await response.json();
          console.log(`✅ [WHATSAPP-BRIDGE] Resposta do webhook:`, result);
          break;
        } catch (error) {
          if (retryCount === maxRetries - 1) {
            throw error;
          }
          console.warn(`⚠️ [WHATSAPP-BRIDGE] Erro na tentativa ${retryCount + 1}/${maxRetries}:`, error);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          retryCount++;
        }
      }

    } catch (error) {
      const bridgeError = error instanceof WhatsAppBridgeError 
        ? error 
        : new WhatsAppBridgeError(
            'Erro ao enviar mensagem',
            error instanceof Error ? error : undefined
          );
      
      console.error('❌ [WHATSAPP-BRIDGE]', bridgeError);
      
      // Adicionar à fila de retry apenas se não for um erro permanente
      if (!(error instanceof WhatsAppBridgeError) || 
          !error.message.includes('não encontrado')) {
        this.messageQueue.push(message);
      }
    }
  }

  // Verificar status das instâncias
  async getInstancesStatus(): Promise<DepartmentInstance[]> {
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/manager/findInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_CONFIG.apiKey
        }
      });

      if (response.ok) {
        const instances = await response.json() as EvolutionInstance[];
        return instances.map((instance) => ({
          id: instance.instance.instanceName,
          instanceName: instance.instance.instanceName,
          status: this.mapEvolutionStatus(instance.instance.status),
          phone: instance.instance.phone,
          department: this.getDepartmentFromInstance(instance.instance.instanceName)
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ [WHATSAPP-BRIDGE] Erro ao buscar status das instâncias:', error);
      return [];
    }
  }

  private mapEvolutionStatus(status: string): DepartmentInstance['status'] {
    switch (status) {
      case 'open':
        return 'connected';
      case 'close':
      case 'created':
        return 'disconnected';
      case 'connecting':
        return 'connecting';
      default:
        return 'error';
    }
  }

  // Mapear instância para departamento
  private getDepartmentFromInstance(instanceName: string): string {
    const departmentMap: Record<string, string> = {
      'sales_instance': 'Vendas',
      'support_instance': 'Suporte Técnico',
      'customer_service_instance': 'Atendimento',
      'finance_instance': 'Financeiro',
      'marketing_instance': 'Marketing',
      'hr_instance': 'RH'
    };

    return departmentMap[instanceName] || 'Desconhecido';
  }

  // Processar evento do RabbitMQ
  async processRabbitMQEvent(event: TicketEvent): Promise<void> {
    console.log(`📋 [WHATSAPP-BRIDGE] Processando evento: ${event.eventType}`, event);
    
    // Aqui você pode implementar lógica para eventos específicos
    // Por exemplo, enviar notificações automáticas quando status muda
    if (event.eventType === 'status_change' && event.data.newStatus === 'resolvido') {
      // Enviar mensagem de encerramento
      console.log('✅ [WHATSAPP-BRIDGE] Ticket resolvido - considerando envio de mensagem de satisfação');
    }
  }

  // Status do bridge
  getStatus(): { enabled: boolean; queueSize: number; processing: boolean } {
    return {
      enabled: this.isEnabled,
      queueSize: this.messageQueue.length,
      processing: this.processingQueue
    };
  }

  // Ativar/desativar bridge
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔧 [WHATSAPP-BRIDGE] Bridge ${enabled ? 'ativado' : 'desativado'}`);
  }
}

// Instância singleton
export const whatsAppBridge = new WhatsAppBridgeService(); 