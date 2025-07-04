import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from './use-toast';

// Tipos de status de mensagem
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Interface para status de mensagem
export interface MessageStatusInfo {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  recipientNumber: string;
  evolutionInstance?: string;
  errorMessage?: string;
  metadata?: any;
}

// Interface para estatísticas de mensagens
export interface MessageStatusStats {
  total: number;
  sending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// Interface para relatório de entrega
export interface DeliveryReport {
  messageId: string;
  recipientNumber: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: MessageStatus;
  deliveryTime?: number; // tempo em ms
  readTime?: number; // tempo em ms
}

interface UseMessageStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseMessageStatusReturn {
  // Estado
  messageStatuses: Map<string, MessageStatusInfo>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Estatísticas
  stats: MessageStatusStats;
  deliveryReports: Map<string, DeliveryReport>;
  
  // Métodos principais
  updateMessageStatus: (messageId: string, status: MessageStatus, metadata?: any) => void;
  getMessageStatus: (messageId: string) => MessageStatusInfo | null;
  trackMessage: (messageId: string, recipientNumber: string, evolutionInstance?: string) => void;
  markAsRead: (messageId: string) => void;
  markAsDelivered: (messageId: string) => void;
  markAsFailed: (messageId: string, errorMessage?: string) => void;
  
  // Métodos de consulta
  getUnreadMessages: () => MessageStatusInfo[];
  getFailedMessages: () => MessageStatusInfo[];
  getPendingMessages: () => MessageStatusInfo[];
  getDeliveryReport: (messageId: string) => DeliveryReport | null;
  
  // Métodos de controle
  refreshStatus: (messageId?: string) => Promise<void>;
  clearStatuses: () => void;
  exportReport: () => string;
  
  // WebSocket e tempo real
  subscribeToStatusUpdates: (instanceName: string) => void;
  unsubscribeFromStatusUpdates: () => void;
  
  // Configurações
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
}

export const useMessageStatus = (options: UseMessageStatusOptions = {}): UseMessageStatusReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  // Estados
  const [messageStatuses, setMessageStatuses] = useState<Map<string, MessageStatusInfo>>(new Map());
  const [deliveryReports, setDeliveryReports] = useState<Map<string, DeliveryReport>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [currentRefreshInterval, setCurrentRefreshInterval] = useState(refreshInterval);

  // Refs
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const { toast } = useToast();

  // URLs da Evolution API
  const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
  const API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

  // Calcular estatísticas
  const stats: MessageStatusStats = {
    total: messageStatuses.size,
    sending: Array.from(messageStatuses.values()).filter(m => m.status === 'sending').length,
    sent: Array.from(messageStatuses.values()).filter(m => m.status === 'sent').length,
    delivered: Array.from(messageStatuses.values()).filter(m => m.status === 'delivered').length,
    read: Array.from(messageStatuses.values()).filter(m => m.status === 'read').length,
    failed: Array.from(messageStatuses.values()).filter(m => m.status === 'failed').length
  };

  // Atualizar status de mensagem
  const updateMessageStatus = useCallback((
    messageId: string, 
    status: MessageStatus, 
    metadata?: any
  ) => {
    const timestamp = new Date();
    
    setMessageStatuses(prev => {
      const newMap = new Map(prev);
      const existingStatus = newMap.get(messageId);
      
      const updatedStatus: MessageStatusInfo = {
        messageId,
        status,
        timestamp,
        recipientNumber: existingStatus?.recipientNumber || '',
        evolutionInstance: existingStatus?.evolutionInstance,
        errorMessage: status === 'failed' ? metadata?.errorMessage : undefined,
        metadata: { ...existingStatus?.metadata, ...metadata }
      };
      
      newMap.set(messageId, updatedStatus);
      
      // Atualizar relatório de entrega
      updateDeliveryReport(messageId, status, timestamp);
      
      return newMap;
    });

    // Notificar mudança de status se relevante
    if (status === 'failed') {
      toast({
        title: "❌ Falha na entrega",
        description: `Mensagem ${messageId.substring(0, 8)}... falhou`,
        variant: "destructive"
      });
    } else if (status === 'delivered') {
      toast({
        title: "✅ Mensagem entregue",
        description: `Mensagem entregue com sucesso`,
        variant: "default"
      });
    } else if (status === 'read') {
      toast({
        title: "👁️ Mensagem lida",
        description: `Mensagem foi lida pelo destinatário`,
        variant: "default"
      });
    }

    console.log(`📊 [MESSAGE-STATUS] Status atualizado: ${messageId} -> ${status}`);
  }, [toast]);

  // Atualizar relatório de entrega
  const updateDeliveryReport = useCallback((
    messageId: string, 
    status: MessageStatus, 
    timestamp: Date
  ) => {
    setDeliveryReports(prev => {
      const newMap = new Map(prev);
      const existingReport = newMap.get(messageId) || {
        messageId,
        recipientNumber: messageStatuses.get(messageId)?.recipientNumber || '',
        status: 'sending'
      };

      const updatedReport: DeliveryReport = { ...existingReport, status };

      switch (status) {
        case 'sent':
          updatedReport.sentAt = timestamp;
          break;
        case 'delivered':
          updatedReport.deliveredAt = timestamp;
          if (updatedReport.sentAt) {
            updatedReport.deliveryTime = timestamp.getTime() - updatedReport.sentAt.getTime();
          }
          break;
        case 'read':
          updatedReport.readAt = timestamp;
          if (updatedReport.sentAt) {
            updatedReport.readTime = timestamp.getTime() - updatedReport.sentAt.getTime();
          }
          break;
      }

      newMap.set(messageId, updatedReport);
      return newMap;
    });
  }, [messageStatuses]);

  // Obter status de mensagem
  const getMessageStatus = useCallback((messageId: string): MessageStatusInfo | null => {
    return messageStatuses.get(messageId) || null;
  }, [messageStatuses]);

  // Iniciar rastreamento de mensagem
  const trackMessage = useCallback((
    messageId: string, 
    recipientNumber: string, 
    evolutionInstance?: string
  ) => {
    const messageStatus: MessageStatusInfo = {
      messageId,
      status: 'sending',
      timestamp: new Date(),
      recipientNumber,
      evolutionInstance
    };

    setMessageStatuses(prev => new Map(prev.set(messageId, messageStatus)));
    
    console.log(`🔍 [MESSAGE-STATUS] Iniciando rastreamento: ${messageId} para ${recipientNumber}`);

    // Tentar obter status inicial da Evolution API
    refreshStatus(messageId);
  }, []);

  // Marcar como lida
  const markAsRead = useCallback((messageId: string) => {
    updateMessageStatus(messageId, 'read');
  }, [updateMessageStatus]);

  // Marcar como entregue
  const markAsDelivered = useCallback((messageId: string) => {
    updateMessageStatus(messageId, 'delivered');
  }, [updateMessageStatus]);

  // Marcar como falha
  const markAsFailed = useCallback((messageId: string, errorMessage?: string) => {
    updateMessageStatus(messageId, 'failed', { errorMessage });
  }, [updateMessageStatus]);

  // Obter mensagens não lidas
  const getUnreadMessages = useCallback((): MessageStatusInfo[] => {
    return Array.from(messageStatuses.values()).filter(m => 
      m.status === 'sent' || m.status === 'delivered'
    );
  }, [messageStatuses]);

  // Obter mensagens com falha
  const getFailedMessages = useCallback((): MessageStatusInfo[] => {
    return Array.from(messageStatuses.values()).filter(m => m.status === 'failed');
  }, [messageStatuses]);

  // Obter mensagens pendentes
  const getPendingMessages = useCallback((): MessageStatusInfo[] => {
    return Array.from(messageStatuses.values()).filter(m => 
      m.status === 'sending' || m.status === 'sent'
    );
  }, [messageStatuses]);

  // Obter relatório de entrega
  const getDeliveryReport = useCallback((messageId: string): DeliveryReport | null => {
    return deliveryReports.get(messageId) || null;
  }, [deliveryReports]);

  // Atualizar status via API
  const refreshStatus = useCallback(async (messageId?: string) => {
    if (!messageId && messageStatuses.size === 0) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const messagesToRefresh = messageId 
        ? [messageStatuses.get(messageId)].filter(Boolean)
        : Array.from(messageStatuses.values()).filter(m => 
            m.status === 'sending' || m.status === 'sent' || m.status === 'delivered'
          );

      console.log(`🔄 [MESSAGE-STATUS] Atualizando status de ${messagesToRefresh.length} mensagens`);

      for (const messageInfo of messagesToRefresh) {
        if (!messageInfo.evolutionInstance) continue;

        try {
          // Consultar status na Evolution API
          const response = await fetch(
            `${EVOLUTION_API_URL}/chat/fetchProfile/${messageInfo.evolutionInstance}`, 
            {
              headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Simular status com base na resposta da API
            // Em uma implementação real, você consultaria o status específico da mensagem
            const isOnline = data.status === 'online';
            
            if (messageInfo.status === 'sent' && isOnline) {
              updateMessageStatus(messageInfo.messageId, 'delivered');
            }
          }

          // Reset retry count on success
          retryCountRef.current.delete(messageInfo.messageId);

        } catch (messageError: any) {
          console.error(`❌ [MESSAGE-STATUS] Erro ao atualizar ${messageInfo.messageId}:`, messageError);
          
          // Implementar retry logic
          const retryCount = retryCountRef.current.get(messageInfo.messageId) || 0;
          if (retryCount < maxRetries) {
            retryCountRef.current.set(messageInfo.messageId, retryCount + 1);
            setTimeout(() => refreshStatus(messageInfo.messageId), retryDelay * (retryCount + 1));
          } else {
            markAsFailed(messageInfo.messageId, `Falha após ${maxRetries} tentativas`);
            retryCountRef.current.delete(messageInfo.messageId);
          }
        }
      }

    } catch (error: any) {
      console.error('❌ [MESSAGE-STATUS] Erro ao atualizar status:', error);
      setError(error.message);
      
      toast({
        title: "❌ Erro na atualização",
        description: "Não foi possível atualizar status das mensagens",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [messageStatuses, EVOLUTION_API_URL, API_KEY, updateMessageStatus, markAsFailed, maxRetries, retryDelay, toast]);

  // Limpar todos os status
  const clearStatuses = useCallback(() => {
    setMessageStatuses(new Map());
    setDeliveryReports(new Map());
    retryCountRef.current.clear();
    setError(null);
    
    console.log('🧹 [MESSAGE-STATUS] Status de mensagens limpos');
  }, []);

  // Exportar relatório
  const exportReport = useCallback((): string => {
    const reports = Array.from(deliveryReports.values());
    
    const csvHeader = 'MessageID,RecipientNumber,Status,SentAt,DeliveredAt,ReadAt,DeliveryTime(ms),ReadTime(ms)\n';
    const csvRows = reports.map(report => [
      report.messageId,
      report.recipientNumber,
      report.status,
      report.sentAt?.toISOString() || '',
      report.deliveredAt?.toISOString() || '',
      report.readAt?.toISOString() || '',
      report.deliveryTime || '',
      report.readTime || ''
    ].join(',')).join('\n');

    return csvHeader + csvRows;
  }, [deliveryReports]);

  // Subscrever atualizações via WebSocket
  const subscribeToStatusUpdates = useCallback((instanceName: string) => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    const wsUrl = `${EVOLUTION_API_URL.replace('http', 'ws')}/status/${instanceName}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`🔌 [MESSAGE-STATUS] WebSocket conectado para ${instanceName}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'message-status') {
          updateMessageStatus(
            data.messageId, 
            data.status as MessageStatus, 
            data.metadata
          );
        }
      } catch (error) {
        console.error('❌ [MESSAGE-STATUS] Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ [MESSAGE-STATUS] Erro WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('🔌 [MESSAGE-STATUS] WebSocket desconectado');
    };

    websocketRef.current = ws;
  }, [EVOLUTION_API_URL, updateMessageStatus]);

  // Cancelar subscrição WebSocket
  const unsubscribeFromStatusUpdates = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
      console.log('🔌 [MESSAGE-STATUS] WebSocket desconectado manualmente');
    }
  }, []);

  // Controle de auto-refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    
    if (!enabled && refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Controle de intervalo de refresh
  const setRefreshInterval = useCallback((interval: number) => {
    setCurrentRefreshInterval(interval);
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || messageStatuses.size === 0) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshStatus();
        scheduleRefresh();
      }, currentRefreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefreshEnabled, currentRefreshInterval, messageStatuses.size, refreshStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return {
    // Estado
    messageStatuses,
    isLoading,
    isRefreshing,
    error,
    
    // Estatísticas
    stats,
    deliveryReports,
    
    // Métodos principais
    updateMessageStatus,
    getMessageStatus,
    trackMessage,
    markAsRead,
    markAsDelivered,
    markAsFailed,
    
    // Métodos de consulta
    getUnreadMessages,
    getFailedMessages,
    getPendingMessages,
    getDeliveryReport,
    
    // Métodos de controle
    refreshStatus,
    clearStatuses,
    exportReport,
    
    // WebSocket e tempo real
    subscribeToStatusUpdates,
    unsubscribeFromStatusUpdates,
    
    // Configurações
    setAutoRefresh,
    setRefreshInterval
  };
}; 