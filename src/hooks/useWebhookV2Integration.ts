import { useState, useEffect, useCallback, useRef } from 'react';
import { webhookServerV2, MessagePayload, WebhookServerV2Response } from '@/services/webhookServerV2';
import { toast } from 'sonner';

export interface WebhookV2State {
  isConnected: boolean;
  isHealthy: boolean;
  lastHealthCheck: Date | null;
  messageQueue: MessagePayload[];
  failedMessages: MessagePayload[];
  connectionAttempts: number;
  lastError: string | null;
}

export interface UseWebhookV2IntegrationOptions {
  enableAutoRetry?: boolean;
  healthCheckInterval?: number;
  maxRetryAttempts?: number;
  retryDelay?: number;
  onMessageSent?: (payload: MessagePayload, response: WebhookServerV2Response) => void;
  onMessageFailed?: (payload: MessagePayload, error: string) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * Hook para integração com o Webhook Server V2
 * Gerencia envio de mensagens, health checks e reconexão automática
 */
export const useWebhookV2Integration = (options: UseWebhookV2IntegrationOptions = {}) => {
  const {
    enableAutoRetry = true,
    healthCheckInterval = 30000, // 30 segundos
    maxRetryAttempts = 3,
    retryDelay = 2000,
    onMessageSent,
    onMessageFailed,
    onConnectionChange
  } = options;

  const [state, setState] = useState<WebhookV2State>({
    isConnected: false,
    isHealthy: false,
    lastHealthCheck: null,
    messageQueue: [],
    failedMessages: [],
    connectionAttempts: 0,
    lastError: null
  });

  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingQueueRef = useRef<boolean>(false);

  /**
   * Realizar health check do servidor
   */
  const performHealthCheck = useCallback(async () => {
    try {
      console.log('🏥 [WEBHOOK-V2-HOOK] Realizando health check...');
      
      const result = await webhookServerV2.healthCheck();
      const isHealthy = result.success;
      const now = new Date();

      setState(prev => ({
        ...prev,
        isHealthy,
        lastHealthCheck: now,
        lastError: isHealthy ? null : result.error || 'Health check falhou',
        connectionAttempts: isHealthy ? 0 : prev.connectionAttempts + 1
      }));

      if (isHealthy !== state.isConnected) {
        onConnectionChange?.(isHealthy);
      }

      console.log(isHealthy ? '✅ [WEBHOOK-V2-HOOK] Servidor saudável' : '❌ [WEBHOOK-V2-HOOK] Servidor indisponível');
      
      return isHealthy;

    } catch (error: any) {
      console.error('❌ [WEBHOOK-V2-HOOK] Erro no health check:', error.message);
      
      setState(prev => ({
        ...prev,
        isHealthy: false,
        lastHealthCheck: new Date(),
        lastError: error.message,
        connectionAttempts: prev.connectionAttempts + 1
      }));

      return false;
    }
  }, [state.isConnected, onConnectionChange]);

  /**
   * Processar fila de mensagens
   */
  const processMessageQueue = useCallback(async () => {
    if (processingQueueRef.current || state.messageQueue.length === 0) {
      return;
    }

    processingQueueRef.current = true;

    try {
      const messagesToProcess = [...state.messageQueue];
      
      setState(prev => ({
        ...prev,
        messageQueue: []
      }));

      for (const message of messagesToProcess) {
        try {
          console.log('📤 [WEBHOOK-V2-HOOK] Processando mensagem da fila:', message.ticketId);
          
          const result = await webhookServerV2.sendMessage(message);
          
          if (result.success) {
            console.log('✅ [WEBHOOK-V2-HOOK] Mensagem enviada com sucesso');
            onMessageSent?.(message, result);
            
            toast.success('Mensagem enviada via webhook v2', {
              description: `Ticket: ${message.ticketId}`
            });
          } else {
            throw new Error(result.error || 'Falha no envio');
          }

        } catch (error: any) {
          console.error('❌ [WEBHOOK-V2-HOOK] Falha ao enviar mensagem:', error.message);
          
          setState(prev => ({
            ...prev,
            failedMessages: [...prev.failedMessages, message]
          }));

          onMessageFailed?.(message, error.message);
          
          toast.error('Falha no envio via webhook v2', {
            description: error.message
          });
        }

        // Delay entre mensagens para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } finally {
      processingQueueRef.current = false;
    }
  }, [state.messageQueue, onMessageSent, onMessageFailed]);

  /**
   * Enviar mensagem (adiciona à fila se servidor indisponível)
   */
  const sendMessage = useCallback(async (payload: MessagePayload): Promise<WebhookServerV2Response> => {
    console.log('📨 [WEBHOOK-V2-HOOK] Enviando mensagem:', payload.ticketId);

    // Se servidor não está saudável, adicionar à fila
    if (!state.isHealthy) {
      console.log('⏳ [WEBHOOK-V2-HOOK] Servidor indisponível, adicionando à fila');
      
      setState(prev => ({
        ...prev,
        messageQueue: [...prev.messageQueue, payload]
      }));

      toast.warning('Mensagem adicionada à fila', {
        description: 'Webhook v2 temporariamente indisponível'
      });

      return {
        success: false,
        error: 'Servidor indisponível - mensagem adicionada à fila'
      };
    }

    // Tentar envio direto
    try {
      const result = await webhookServerV2.sendMessage(payload);
      
      if (result.success) {
        onMessageSent?.(payload, result);
        
        toast.success('Mensagem enviada via webhook v2');
      } else {
        onMessageFailed?.(payload, result.error || 'Falha no envio');
      }

      return result;

    } catch (error: any) {
      console.error('❌ [WEBHOOK-V2-HOOK] Erro no envio direto:', error.message);
      
      // Se falhou, adicionar à fila para retry
      if (enableAutoRetry) {
        setState(prev => ({
          ...prev,
          messageQueue: [...prev.messageQueue, payload]
        }));
      }

      onMessageFailed?.(payload, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [state.isHealthy, enableAutoRetry, onMessageSent, onMessageFailed]);

  /**
   * Tentar reenviar mensagens falhadas
   */
  const retryFailedMessages = useCallback(async () => {
    if (state.failedMessages.length === 0) {
      toast.info('Nenhuma mensagem para reenviar');
      return;
    }

    console.log(`🔄 [WEBHOOK-V2-HOOK] Reenviando ${state.failedMessages.length} mensagens falhadas`);

    const messagesToRetry = [...state.failedMessages];
    
    setState(prev => ({
      ...prev,
      failedMessages: []
    }));

    for (const message of messagesToRetry) {
      await sendMessage(message);
    }

    toast.success(`Reenvio iniciado para ${messagesToRetry.length} mensagens`);
  }, [state.failedMessages, sendMessage]);

  /**
   * Configurar webhook na Evolution API
   */
  const configureEvolutionWebhook = useCallback(async (instanceName: string) => {
    console.log('⚙️ [WEBHOOK-V2-HOOK] Configurando webhook na Evolution API:', instanceName);

    try {
      const result = await webhookServerV2.configureEvolutionWebhook(instanceName);
      
      if (result.success) {
        toast.success('Webhook configurado na Evolution API', {
          description: `Instância: ${instanceName}`
        });
      } else {
        toast.error('Falha na configuração do webhook', {
          description: result.error
        });
      }

      return result;

    } catch (error: any) {
      toast.error('Erro na configuração do webhook', {
        description: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  /**
   * Limpar fila de mensagens
   */
  const clearMessageQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      messageQueue: [],
      failedMessages: []
    }));

    toast.success('Fila de mensagens limpa');
  }, []);

  /**
   * Obter estatísticas do webhook
   */
  const getStatistics = useCallback(() => {
    return {
      queuedMessages: state.messageQueue.length,
      failedMessages: state.failedMessages.length,
      connectionAttempts: state.connectionAttempts,
      lastHealthCheck: state.lastHealthCheck,
      uptime: state.lastHealthCheck ? Date.now() - state.lastHealthCheck.getTime() : 0
    };
  }, [state]);

  // Inicializar health check periódico
  useEffect(() => {
    console.log('🚀 [WEBHOOK-V2-HOOK] Iniciando monitoramento do webhook v2');

    // Health check inicial
    performHealthCheck();

    // Health check periódico
    if (healthCheckInterval > 0) {
      healthCheckIntervalRef.current = setInterval(performHealthCheck, healthCheckInterval);
    }

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [performHealthCheck, healthCheckInterval]);

  // Processar fila quando servidor fica saudável
  useEffect(() => {
    if (state.isHealthy && state.messageQueue.length > 0) {
      console.log('🔄 [WEBHOOK-V2-HOOK] Servidor saudável, processando fila...');
      processMessageQueue();
    }
  }, [state.isHealthy, state.messageQueue.length, processMessageQueue]);

  return {
    // Estado
    ...state,
    isConnected: state.isHealthy,

    // Ações
    sendMessage,
    retryFailedMessages,
    configureEvolutionWebhook,
    clearMessageQueue,
    performHealthCheck,

    // Utilitários
    getStatistics,

    // Referências
    webhookService: webhookServerV2
  };
};

export type WebhookV2Integration = ReturnType<typeof useWebhookV2Integration>; 