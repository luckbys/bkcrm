import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { whatsappMonitoring, PerformanceMetrics, SystemHealth, Alert, MonitoringConfig } from '@/services/whatsapp/WhatsAppMonitoringService';
import { useToast } from '@/hooks/use-toast';

export interface UseWhatsAppMonitoringReturn {
  // Estados de dados
  systemHealth: SystemHealth | null;
  instanceMetrics: PerformanceMetrics[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  
  // Estados de configuração
  config: MonitoringConfig;
  isMonitoring: boolean;
  
  // Ações
  startMonitoring: () => void;
  stopMonitoring: () => void;
  refreshData: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  updateConfig: (newConfig: Partial<MonitoringConfig>) => void;
  generateReport: (instanceName?: string) => Promise<any>;
  
  // Utilitários
  getInstanceMetrics: (instanceName: string) => PerformanceMetrics | undefined;
  getInstanceAlerts: (instanceName: string) => Alert[];
  getMetricsHistory: (instanceName: string, hours?: number) => Promise<PerformanceMetrics[]>;
  
  // Estatísticas derivadas
  stats: {
    totalInstances: number;
    healthyInstances: number;
    criticalAlerts: number;
    averageResponseTime: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  };
}

export const useWhatsAppMonitoring = (): UseWhatsAppMonitoringReturn => {
  const { toast } = useToast();
  const subscriberIdRef = useRef<string>(`monitoring-hook-${Date.now()}`);
  
  // Estados principais
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [instanceMetrics, setInstanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MonitoringConfig>(whatsappMonitoring.getConfig());
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    const subscriberId = subscriberIdRef.current;
    
    const handleMonitoringUpdate = (data: any) => {
      try {
        const { event, data: eventData } = data;
        
        switch (event) {
          case 'health-update':
            setSystemHealth(eventData);
            break;
            
          case 'new-alert':
            setAlerts(prev => [eventData, ...prev]);
            showAlertNotification(eventData);
            break;
            
          case 'alert-resolved':
            setAlerts(prev => prev.map(alert => 
              alert.id === eventData.id ? eventData : alert
            ));
            break;
            
          case 'instance-status-change':
            updateInstanceMetrics(eventData);
            break;
            
          default:
            console.log('📊 [Hook] Evento não tratado:', event);
        }
      } catch (error) {
        console.error('❌ [Hook] Erro ao processar atualização:', error);
      }
    };

    whatsappMonitoring.subscribe(subscriberId, handleMonitoringUpdate);
    
    return () => {
      whatsappMonitoring.unsubscribe(subscriberId);
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (isMonitoring) {
      loadInitialData();
    }
  }, [isMonitoring]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [Hook] Carregando dados iniciais do monitoramento...');
      
      // Carregar dados em paralelo
      const [health, alertsData] = await Promise.all([
        whatsappMonitoring.performHealthCheck(),
        whatsappMonitoring.getAlerts()
      ]);
      
      setSystemHealth(health);
      setAlerts(alertsData);
      
      // Extrair métricas das instâncias da saúde do sistema
      if (health) {
        // TODO: Implementar extração de métricas do health
        console.log('✅ [Hook] Dados carregados com sucesso');
      }
      
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao carregar dados iniciais:', error);
      setError(error.message);
      
      toast({
        title: "Erro no Monitoramento",
        description: "Não foi possível carregar os dados de monitoramento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showAlertNotification = (alert: Alert) => {
    const variant = alert.severity === 'critical' || alert.type === 'error' ? 'destructive' : 'default';
    
    toast({
      title: alert.title,
      description: alert.message,
      variant,
      duration: alert.severity === 'critical' ? 10000 : 5000 // Alertas críticos ficam mais tempo
    });
  };

  const updateInstanceMetrics = (data: any) => {
    const { instanceName, status } = data;
    
    setInstanceMetrics(prev => prev.map(metric => 
      metric.instanceName === instanceName 
        ? { 
            ...metric, 
            webhookHealth: status === 'connected' ? 'healthy' : 'down',
            lastActivity: new Date()
          }
        : metric
    ));
  };

  // Ações
  const startMonitoring = useCallback(() => {
    console.log('▶️ [Hook] Iniciando monitoramento');
    setIsMonitoring(true);
    setError(null);
  }, []);

  const stopMonitoring = useCallback(() => {
    console.log('⏸️ [Hook] Parando monitoramento');
    setIsMonitoring(false);
  }, []);

  const refreshData = useCallback(async () => {
    if (!isMonitoring) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const health = await whatsappMonitoring.performHealthCheck();
      setSystemHealth(health);
      
      const alertsData = await whatsappMonitoring.getAlerts();
      setAlerts(alertsData);
      
      toast({
        title: "Dados Atualizados",
        description: "Informações de monitoramento atualizadas com sucesso",
      });
      
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao atualizar dados:', error);
      setError(error.message);
      
      toast({
        title: "Erro na Atualização",
        description: "Não foi possível atualizar os dados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isMonitoring, toast]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await whatsappMonitoring.resolveAlert(alertId);
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolvedAt: new Date() }
          : alert
      ));
      
      toast({
        title: "Alerta Resolvido",
        description: "O alerta foi marcado como resolvido",
      });
      
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao resolver alerta:', error);
      
      toast({
        title: "Erro ao Resolver Alerta",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateConfig = useCallback((newConfig: Partial<MonitoringConfig>) => {
    try {
      whatsappMonitoring.updateConfig(newConfig);
      setConfig(whatsappMonitoring.getConfig());
      
      toast({
        title: "Configuração Atualizada",
        description: "As configurações de monitoramento foram salvas",
      });
      
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao atualizar configuração:', error);
      
      toast({
        title: "Erro na Configuração",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [toast]);

  const generateReport = useCallback(async (instanceName?: string) => {
    try {
      setIsLoading(true);
      const report = await whatsappMonitoring.generateReport(instanceName);
      
      toast({
        title: "Relatório Gerado",
        description: `Relatório ${instanceName ? `da instância ${instanceName}` : 'geral'} gerado com sucesso`,
      });
      
      return report;
      
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao gerar relatório:', error);
      
      toast({
        title: "Erro no Relatório",
        description: error.message,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Utilitários
  const getInstanceMetrics = useCallback((instanceName: string): PerformanceMetrics | undefined => {
    return instanceMetrics.find(metric => metric.instanceName === instanceName);
  }, [instanceMetrics]);

  const getInstanceAlerts = useCallback((instanceName: string): Alert[] => {
    return alerts.filter(alert => alert.instanceId === instanceName);
  }, [alerts]);

  const getMetricsHistory = useCallback(async (instanceName: string, hours: number = 24): Promise<PerformanceMetrics[]> => {
    try {
      return await whatsappMonitoring.getMetricsHistory(instanceName, hours);
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao obter histórico de métricas:', error);
      
      toast({
        title: "Erro no Histórico",
        description: "Não foi possível carregar o histórico de métricas",
        variant: "destructive"
      });
      
      return [];
    }
  }, [toast]);

  // Estatísticas derivadas (calculadas a partir dos dados atuais)
  const stats = useMemo(() => {
    const totalInstances = instanceMetrics.length;
    const healthyInstances = instanceMetrics.filter(m => m.webhookHealth === 'healthy').length;
    const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'critical').length;
    const averageResponseTime = totalInstances > 0 
      ? instanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalInstances 
      : 0;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (systemHealth) {
      overallHealth = systemHealth.overall;
    } else if (totalInstances === 0) {
      overallHealth = 'critical';
    } else {
      const healthRatio = healthyInstances / totalInstances;
      if (healthRatio < 0.7) overallHealth = 'critical';
      else if (healthRatio < 0.9) overallHealth = 'degraded';
    }
    
    return {
      totalInstances,
      healthyInstances,
      criticalAlerts,
      averageResponseTime,
      overallHealth
    };
  }, [instanceMetrics, alerts, systemHealth]);

  return {
    // Estados de dados
    systemHealth,
    instanceMetrics,
    alerts,
    isLoading,
    error,
    
    // Estados de configuração
    config,
    isMonitoring,
    
    // Ações
    startMonitoring,
    stopMonitoring,
    refreshData,
    resolveAlert,
    updateConfig,
    generateReport,
    
    // Utilitários
    getInstanceMetrics,
    getInstanceAlerts,
    getMetricsHistory,
    
    // Estatísticas derivadas
    stats
  };
};

// Hook especializado para uma instância específica
export const useInstanceMonitoring = (instanceName: string) => {
  const monitoring = useWhatsAppMonitoring();
  
  const instanceMetrics = monitoring.getInstanceMetrics(instanceName);
  const instanceAlerts = monitoring.getInstanceAlerts(instanceName);
  
  const refreshInstanceData = useCallback(async () => {
    const history = await monitoring.getMetricsHistory(instanceName, 1);
    return history;
  }, [instanceName, monitoring]);

  const resolveInstanceAlerts = useCallback(async () => {
    const alertPromises = instanceAlerts
      .filter(alert => !alert.resolved)
      .map(alert => monitoring.resolveAlert(alert.id));
    
    await Promise.all(alertPromises);
  }, [instanceAlerts, monitoring]);

  const generateInstanceReport = useCallback(async () => {
    return await monitoring.generateReport(instanceName);
  }, [instanceName, monitoring]);

  const isHealthy = instanceMetrics?.webhookHealth === 'healthy';
  const hasErrors = instanceMetrics ? instanceMetrics.errorRate > 5 : false;
  const isActive = instanceMetrics ? instanceMetrics.lastActivity.getTime() > Date.now() - 5 * 60 * 1000 : false;

  return {
    ...monitoring,
    
    // Dados específicos da instância
    instanceMetrics,
    instanceAlerts,
    
    // Ações específicas da instância
    refreshInstanceData,
    resolveInstanceAlerts,
    generateInstanceReport,
    
    // Status derivados
    isHealthy,
    hasErrors,
    isActive,
    
    // Estatísticas da instância
    instanceStats: instanceMetrics ? {
      responseTime: instanceMetrics.responseTime,
      messageCount: instanceMetrics.messageCount,
      errorRate: instanceMetrics.errorRate,
      uptime: instanceMetrics.uptime,
      webhookHealth: instanceMetrics.webhookHealth,
      lastActivity: instanceMetrics.lastActivity
    } : null
  };
};

// Hook para monitoramento em tempo real (apenas alertas críticos)
export const useRealtimeAlerts = () => {
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const subscriberId = `realtime-alerts-${Date.now()}`;
    
    const handleAlert = (data: any) => {
      const { event, data: alertData } = data;
      
      if (event === 'new-alert' && alertData.severity === 'critical') {
        setCriticalAlerts(prev => [alertData, ...prev.slice(0, 4)]); // Manter apenas 5 alertas
        
        // Notificação urgente
        toast({
          title: `🚨 ALERTA CRÍTICO: ${alertData.title}`,
          description: alertData.message,
          variant: "destructive",
          duration: 15000 // 15 segundos para alertas críticos
        });
      } else if (event === 'alert-resolved') {
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertData.id));
      }
    };

    whatsappMonitoring.subscribe(subscriberId, handleAlert);
    
    // Carregar alertas críticos iniciais
    whatsappMonitoring.getAlerts().then(alerts => {
      const critical = alerts.filter(a => !a.resolved && a.severity === 'critical');
      setCriticalAlerts(critical.slice(0, 5));
    });
    
    return () => {
      whatsappMonitoring.unsubscribe(subscriberId);
    };
  }, [toast]);

  const clearAlert = useCallback(async (alertId: string) => {
    try {
      await whatsappMonitoring.resolveAlert(alertId);
      setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Erro ao resolver alerta crítico:', error);
    }
  }, []);

  return {
    criticalAlerts,
    clearAlert,
    hasCriticalAlerts: criticalAlerts.length > 0
  };
};