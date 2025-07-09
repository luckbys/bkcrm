import { evolutionApi } from '@/services/evolutionAPI';
import { supabase } from '@/lib/supabase';
import { wsService } from '@/services/websocket';

export interface PerformanceMetrics {
  instanceId: string;
  instanceName: string;
  responseTime: number;
  messageCount: number;
  errorRate: number;
  uptime: number;
  lastActivity: Date;
  webhookHealth: 'healthy' | 'degraded' | 'down';
  qrCodeStatus: 'valid' | 'expired' | 'not_generated';
  memoryUsage: number;
  cpuUsage: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  instances: {
    total: number;
    active: number;
    inactive: number;
    errors: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    messageVolume: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  lastUpdate: Date;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  instanceId?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  action?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  checkInterval: number; // segundos
  alertThresholds: {
    responseTime: number; // ms
    errorRate: number; // porcentagem
    uptime: number; // porcentagem
    memoryUsage: number; // porcentagem
  };
  notifications: {
    email: boolean;
    webhook: boolean;
    push: boolean;
  };
  retention: {
    metrics: number; // dias
    alerts: number; // dias
    logs: number; // dias
  };
}

class WhatsAppMonitoringService {
  private static instance: WhatsAppMonitoringService;
  private config: MonitoringConfig;
  private monitoringInterval: number | null = null;
  private activeAlerts: Map<string, Alert> = new Map();
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private subscribers: Map<string, (data: any) => void> = new Map();

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeMonitoring();
  }

  public static getInstance(): WhatsAppMonitoringService {
    if (!WhatsAppMonitoringService.instance) {
      WhatsAppMonitoringService.instance = new WhatsAppMonitoringService();
    }
    return WhatsAppMonitoringService.instance;
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      checkInterval: 30, // 30 segundos
      alertThresholds: {
        responseTime: 2000, // 2 segundos
        errorRate: 5, // 5%
        uptime: 95, // 95%
        memoryUsage: 80 // 80%
      },
      notifications: {
        email: true,
        webhook: true,
        push: false
      },
      retention: {
        metrics: 30, // 30 dias
        alerts: 90, // 90 dias
        logs: 7 // 7 dias
      }
    };
  }

  private initializeMonitoring(): void {
    console.log('🔍 [Monitor] Iniciando serviço de monitoramento WhatsApp');
    
    // Iniciar monitoramento periódico
    this.startPeriodicMonitoring();
    
    // Configurar WebSocket para alertas em tempo real
    this.setupWebSocketAlerts();
    
    // Limpar dados antigos
    this.scheduleCleanup();
  }

  private startPeriodicMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval * 1000);

    console.log(`📊 [Monitor] Monitoramento iniciado (${this.config.checkInterval}s)`);
  }

  private setupWebSocketAlerts(): void {
    const socket = wsService.connect();
    
    socket.on('instance-status-change', (data) => {
      this.handleInstanceStatusChange(data);
    });

    socket.on('message-sent', (data) => {
      this.updateMessageMetrics(data);
    });

    socket.on('error-occurred', (data) => {
      this.handleError(data);
    });
  }

  private scheduleCleanup(): void {
    // Executar limpeza diariamente
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // 24 horas
  }

  public async performHealthCheck(): Promise<SystemHealth> {
    try {
      console.log('🏥 [Monitor] Executando verificação de saúde do sistema');
      
      const instances = await this.getInstancesHealth();
      const systemMetrics = await this.getSystemMetrics();
      const performanceData = await this.getPerformanceData();
      
      const health: SystemHealth = {
        overall: this.calculateOverallHealth(instances, performanceData),
        instances: {
          total: instances.length,
          active: instances.filter(i => i.webhookHealth === 'healthy').length,
          inactive: instances.filter(i => i.webhookHealth === 'down').length,
          errors: instances.filter(i => i.errorRate > this.config.alertThresholds.errorRate).length
        },
        performance: {
          averageResponseTime: this.calculateAverageResponseTime(instances),
          successRate: this.calculateSuccessRate(instances),
          messageVolume: this.calculateMessageVolume(instances)
        },
        resources: systemMetrics,
        lastUpdate: new Date()
      };

      // Gerar alertas baseados na saúde do sistema
      await this.generateAlerts(health, instances);
      
      // Notificar subscribers
      this.notifySubscribers('health-update', health);
      
      // Persistir métricas
      await this.persistMetrics(instances, health);
      
      return health;
      
    } catch (error: any) {
      console.error('❌ [Monitor] Erro na verificação de saúde:', error);
      
      const criticalAlert: Alert = {
        id: `system-health-error-${Date.now()}`,
        type: 'critical',
        severity: 'critical',
        title: 'Erro na Verificação de Saúde',
        message: `Falha ao verificar saúde do sistema: ${error.message}`,
        timestamp: new Date(),
        resolved: false,
        action: 'check-monitoring-service'
      };
      
      await this.addAlert(criticalAlert);
      
      throw error;
    }
  }

  private async getInstancesHealth(): Promise<PerformanceMetrics[]> {
    try {
      const instances = await evolutionApi.fetchInstances();
      const metricsPromises = instances.map(async (instance) => {
        try {
          const metrics = await this.collectInstanceMetrics(instance.instanceName);
          return metrics;
        } catch (error) {
          console.warn(`⚠️ [Monitor] Erro ao coletar métricas para ${instance.instanceName}:`, error);
          return this.createErrorMetrics(instance.instanceName);
        }
      });

      const results = await Promise.allSettled(metricsPromises);
      return results
        .filter((result): result is PromiseFulfilledResult<PerformanceMetrics> => result.status === 'fulfilled')
        .map(result => result.value);
        
    } catch (error) {
      console.error('❌ [Monitor] Erro ao obter saúde das instâncias:', error);
      return [];
    }
  }

  private async collectInstanceMetrics(instanceName: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      // Verificar status da instância
      const status = await evolutionApi.getInstanceStatus(instanceName);
      const responseTime = Date.now() - startTime;
      
      // Obter métricas do banco de dados
      const { data: dbMetrics } = await supabase
        .from('whatsapp_metrics')
        .select('*')
        .eq('instance_name', instanceName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calcular métricas
      const messageCount = await this.getMessageCount(instanceName);
      const errorRate = await this.calculateErrorRate(instanceName);
      const uptime = await this.calculateUptime(instanceName);
      const webhookHealth = await this.checkWebhookHealth(instanceName);
      
      const metrics: PerformanceMetrics = {
        instanceId: instanceName,
        instanceName,
        responseTime,
        messageCount,
        errorRate,
        uptime,
        lastActivity: new Date(),
        webhookHealth,
        qrCodeStatus: status.status === 'open' ? 'valid' : 'expired',
        memoryUsage: dbMetrics?.memory_usage || 0,
        cpuUsage: dbMetrics?.cpu_usage || 0
      };

      // Armazenar no histórico
      this.updateMetricsHistory(instanceName, metrics);
      
      return metrics;
      
    } catch (error: any) {
      console.error(`❌ [Monitor] Erro ao coletar métricas para ${instanceName}:`, error);
      return this.createErrorMetrics(instanceName);
    }
  }

  private createErrorMetrics(instanceName: string): PerformanceMetrics {
    return {
      instanceId: instanceName,
      instanceName,
      responseTime: 0,
      messageCount: 0,
      errorRate: 100,
      uptime: 0,
      lastActivity: new Date(),
      webhookHealth: 'down',
      qrCodeStatus: 'not_generated',
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  private async getSystemMetrics(): Promise<{ memoryUsage: number; cpuUsage: number; diskUsage: number }> {
    try {
      const stats = await evolutionApi.getStats();
      
      return {
        memoryUsage: stats.server?.memory ? 
          (stats.server.memory.heapUsed / stats.server.memory.heapTotal) * 100 : 0,
        cpuUsage: stats.server?.cpu ? stats.server.cpu.usage || 0 : 0,
        diskUsage: 0 // TODO: Implementar métricas de disco
      };
    } catch (error) {
      console.error('❌ [Monitor] Erro ao obter métricas do sistema:', error);
      return { memoryUsage: 0, cpuUsage: 0, diskUsage: 0 };
    }
  }

  private async getPerformanceData(): Promise<PerformanceMetrics[]> {
    const instances = Array.from(this.metricsHistory.values()).flat();
    return instances.filter(metric => 
      Date.now() - metric.lastActivity.getTime() < 5 * 60 * 1000 // Últimos 5 minutos
    );
  }

  private calculateOverallHealth(instances: PerformanceMetrics[], performanceData: PerformanceMetrics[]): SystemHealth['overall'] {
    const healthyInstances = instances.filter(i => i.webhookHealth === 'healthy').length;
    const totalInstances = instances.length;
    
    if (totalInstances === 0) return 'critical';
    
    const healthRatio = healthyInstances / totalInstances;
    
    if (healthRatio >= 0.9) return 'healthy';
    if (healthRatio >= 0.7) return 'degraded';
    return 'critical';
  }

  private calculateAverageResponseTime(instances: PerformanceMetrics[]): number {
    if (instances.length === 0) return 0;
    
    const totalResponseTime = instances.reduce((sum, instance) => sum + instance.responseTime, 0);
    return totalResponseTime / instances.length;
  }

  private calculateSuccessRate(instances: PerformanceMetrics[]): number {
    if (instances.length === 0) return 0;
    
    const totalSuccessRate = instances.reduce((sum, instance) => sum + (100 - instance.errorRate), 0);
    return totalSuccessRate / instances.length;
  }

  private calculateMessageVolume(instances: PerformanceMetrics[]): number {
    return instances.reduce((sum, instance) => sum + instance.messageCount, 0);
  }

  private async generateAlerts(health: SystemHealth, instances: PerformanceMetrics[]): Promise<void> {
    const alerts: Alert[] = [];
    
    // Alertas de sistema
    if (health.overall === 'critical') {
      alerts.push({
        id: `system-critical-${Date.now()}`,
        type: 'critical',
        severity: 'critical',
        title: 'Sistema em Estado Crítico',
        message: `Sistema com ${health.instances.active}/${health.instances.total} instâncias ativas`,
        timestamp: new Date(),
        resolved: false,
        action: 'check-all-instances'
      });
    }

    // Alertas por instância
    for (const instance of instances) {
      // Tempo de resposta alto
      if (instance.responseTime > this.config.alertThresholds.responseTime) {
        alerts.push({
          id: `${instance.instanceId}-response-time-${Date.now()}`,
          type: 'warning',
          severity: 'medium',
          title: 'Tempo de Resposta Alto',
          message: `${instance.instanceName} com ${instance.responseTime}ms de resposta`,
          instanceId: instance.instanceId,
          timestamp: new Date(),
          resolved: false,
          action: 'check-instance-performance'
        });
      }

      // Taxa de erro alta
      if (instance.errorRate > this.config.alertThresholds.errorRate) {
        alerts.push({
          id: `${instance.instanceId}-error-rate-${Date.now()}`,
          type: 'error',
          severity: 'high',
          title: 'Taxa de Erro Elevada',
          message: `${instance.instanceName} com ${instance.errorRate.toFixed(1)}% de erros`,
          instanceId: instance.instanceId,
          timestamp: new Date(),
          resolved: false,
          action: 'check-instance-logs'
        });
      }

      // Webhook inativo
      if (instance.webhookHealth === 'down') {
        alerts.push({
          id: `${instance.instanceId}-webhook-down-${Date.now()}`,
          type: 'error',
          severity: 'high',
          title: 'Webhook Inativo',
          message: `Webhook da instância ${instance.instanceName} não está respondendo`,
          instanceId: instance.instanceId,
          timestamp: new Date(),
          resolved: false,
          action: 'check-webhook-config'
        });
      }

      // Uptime baixo
      if (instance.uptime < this.config.alertThresholds.uptime) {
        alerts.push({
          id: `${instance.instanceId}-uptime-${Date.now()}`,
          type: 'warning',
          severity: 'medium',
          title: 'Uptime Baixo',
          message: `${instance.instanceName} com ${instance.uptime.toFixed(1)}% de uptime`,
          instanceId: instance.instanceId,
          timestamp: new Date(),
          resolved: false,
          action: 'check-instance-stability'
        });
      }
    }

    // Adicionar todos os alertas
    for (const alert of alerts) {
      await this.addAlert(alert);
    }
  }

  private async addAlert(alert: Alert): Promise<void> {
    try {
      // Verificar se não é um alerta duplicado
      const existingAlert = this.activeAlerts.get(alert.id);
      if (existingAlert && !existingAlert.resolved) {
        return;
      }

      // Adicionar ao mapa de alertas ativos
      this.activeAlerts.set(alert.id, alert);
      
      // Persistir no banco de dados
      await supabase
        .from('whatsapp_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          instance_id: alert.instanceId,
          timestamp: alert.timestamp.toISOString(),
          resolved: alert.resolved,
          action: alert.action,
          metadata: alert.metadata || {}
        });

      // Notificar subscribers
      this.notifySubscribers('new-alert', alert);
      
      // Enviar notificações
      await this.sendNotification(alert);
      
      console.log(`🚨 [Monitor] Alerta gerado: ${alert.title} (${alert.severity})`);
      
    } catch (error) {
      console.error('❌ [Monitor] Erro ao adicionar alerta:', error);
    }
  }

  private async sendNotification(alert: Alert): Promise<void> {
    try {
      if (this.config.notifications.webhook) {
        // Enviar via WebSocket
        wsService.sendMessage('new-alert', alert);
      }

      if (this.config.notifications.email) {
        // TODO: Implementar notificação por email
        console.log('📧 [Monitor] Enviando notificação por email:', alert.title);
      }

      if (this.config.notifications.push) {
        // TODO: Implementar notificação push
        console.log('📱 [Monitor] Enviando notificação push:', alert.title);
      }
    } catch (error) {
      console.error('❌ [Monitor] Erro ao enviar notificação:', error);
    }
  }

  private async persistMetrics(instances: PerformanceMetrics[], health: SystemHealth): Promise<void> {
    try {
      // Persistir métricas das instâncias
      const metricsData = instances.map(instance => ({
        instance_name: instance.instanceName,
        response_time: instance.responseTime,
        message_count: instance.messageCount,
        error_rate: instance.errorRate,
        uptime: instance.uptime,
        webhook_health: instance.webhookHealth,
        memory_usage: instance.memoryUsage,
        cpu_usage: instance.cpuUsage,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('whatsapp_metrics')
        .insert(metricsData);

      // Persistir métricas do sistema
      await supabase
        .from('system_health')
        .insert({
          overall_health: health.overall,
          total_instances: health.instances.total,
          active_instances: health.instances.active,
          average_response_time: health.performance.averageResponseTime,
          success_rate: health.performance.successRate,
          message_volume: health.performance.messageVolume,
          memory_usage: health.resources.memoryUsage,
          cpu_usage: health.resources.cpuUsage,
          created_at: health.lastUpdate.toISOString()
        });

    } catch (error) {
      console.error('❌ [Monitor] Erro ao persistir métricas:', error);
    }
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach((callback, id) => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error(`❌ [Monitor] Erro ao notificar subscriber ${id}:`, error);
      }
    });
  }

  private updateMetricsHistory(instanceName: string, metrics: PerformanceMetrics): void {
    if (!this.metricsHistory.has(instanceName)) {
      this.metricsHistory.set(instanceName, []);
    }
    
    const history = this.metricsHistory.get(instanceName)!;
    history.push(metrics);
    
    // Manter apenas os últimos 100 pontos
    if (history.length > 100) {
      history.shift();
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      console.log('🧹 [Monitor] Limpando dados antigos...');
      
      const metricsRetentionDate = new Date();
      metricsRetentionDate.setDate(metricsRetentionDate.getDate() - this.config.retention.metrics);
      
      const alertsRetentionDate = new Date();
      alertsRetentionDate.setDate(alertsRetentionDate.getDate() - this.config.retention.alerts);
      
      // Limpar métricas antigas
      await supabase
        .from('whatsapp_metrics')
        .delete()
        .lt('created_at', metricsRetentionDate.toISOString());
      
      // Limpar alertas antigos
      await supabase
        .from('whatsapp_alerts')
        .delete()
        .lt('timestamp', alertsRetentionDate.toISOString());
      
      console.log('✅ [Monitor] Limpeza concluída');
      
    } catch (error) {
      console.error('❌ [Monitor] Erro na limpeza de dados:', error);
    }
  }

  // Métodos privados auxiliares
  private async getMessageCount(instanceName: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('instance_name', instanceName)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error(`❌ [Monitor] Erro ao contar mensagens para ${instanceName}:`, error);
      return 0;
    }
  }

  private async calculateErrorRate(instanceName: string): Promise<number> {
    try {
      const { data: totalMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('instance_name', instanceName)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: errorMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('instance_name', instanceName)
        .eq('status', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const total = totalMessages?.length || 0;
      const errors = errorMessages?.length || 0;
      
      return total > 0 ? (errors / total) * 100 : 0;
    } catch (error) {
      console.error(`❌ [Monitor] Erro ao calcular taxa de erro para ${instanceName}:`, error);
      return 0;
    }
  }

  private async calculateUptime(instanceName: string): Promise<number> {
    try {
      const { data: statusHistory } = await supabase
        .from('instance_status_history')
        .select('status, timestamp')
        .eq('instance_name', instanceName)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (!statusHistory || statusHistory.length === 0) {
        return 0;
      }

      let uptimeSeconds = 0;
      let totalSeconds = 0;
      
      for (let i = 0; i < statusHistory.length - 1; i++) {
        const current = statusHistory[i];
        const next = statusHistory[i + 1];
        
        const duration = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
        totalSeconds += duration / 1000;
        
        if (current.status === 'connected') {
          uptimeSeconds += duration / 1000;
        }
      }

      return totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : 0;
    } catch (error) {
      console.error(`❌ [Monitor] Erro ao calcular uptime para ${instanceName}:`, error);
      return 0;
    }
  }

  private async checkWebhookHealth(instanceName: string): Promise<PerformanceMetrics['webhookHealth']> {
    try {
      const { data: recentWebhooks } = await supabase
        .from('webhook_logs')
        .select('status, timestamp')
        .eq('instance_name', instanceName)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!recentWebhooks || recentWebhooks.length === 0) {
        return 'down';
      }

      const successfulWebhooks = recentWebhooks.filter(w => w.status === 'success').length;
      const successRate = successfulWebhooks / recentWebhooks.length;

      if (successRate >= 0.9) return 'healthy';
      if (successRate >= 0.7) return 'degraded';
      return 'down';
    } catch (error) {
      console.error(`❌ [Monitor] Erro ao verificar saúde do webhook para ${instanceName}:`, error);
      return 'down';
    }
  }

  private handleInstanceStatusChange(data: any): void {
    console.log('📊 [Monitor] Mudança de status da instância:', data);
    
    // Atualizar métricas em tempo real
    const instanceName = data.instanceName;
    const metrics = this.metricsHistory.get(instanceName);
    
    if (metrics && metrics.length > 0) {
      const lastMetric = metrics[metrics.length - 1];
      lastMetric.lastActivity = new Date();
      lastMetric.webhookHealth = data.status === 'connected' ? 'healthy' : 'down';
    }
    
    // Notificar subscribers
    this.notifySubscribers('instance-status-change', data);
  }

  private updateMessageMetrics(data: any): void {
    const instanceName = data.instanceName;
    const metrics = this.metricsHistory.get(instanceName);
    
    if (metrics && metrics.length > 0) {
      const lastMetric = metrics[metrics.length - 1];
      lastMetric.messageCount++;
      lastMetric.lastActivity = new Date();
    }
  }

  private handleError(data: any): void {
    console.error('🚨 [Monitor] Erro detectado:', data);
    
    // Criar alerta de erro
    const alert: Alert = {
      id: `error-${data.instanceName}-${Date.now()}`,
      type: 'error',
      severity: 'high',
      title: 'Erro Detectado',
      message: data.message || 'Erro não especificado',
      instanceId: data.instanceName,
      timestamp: new Date(),
      resolved: false,
      metadata: data
    };
    
    this.addAlert(alert);
  }

  // Métodos públicos para integração
  public subscribe(id: string, callback: (data: any) => void): void {
    this.subscribers.set(id, callback);
  }

  public unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  public async getAlerts(instanceId?: string): Promise<Alert[]> {
    const alerts = Array.from(this.activeAlerts.values());
    
    if (instanceId) {
      return alerts.filter(alert => alert.instanceId === instanceId);
    }
    
    return alerts;
  }

  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    // Atualizar no banco
    await supabase
      .from('whatsapp_alerts')
      .update({
        resolved: true,
        resolved_at: alert.resolvedAt.toISOString()
      })
      .eq('id', alertId);
    
    // Notificar subscribers
    this.notifySubscribers('alert-resolved', alert);
  }

  public async getMetricsHistory(instanceName: string, hours: number = 24): Promise<PerformanceMetrics[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    try {
      const { data } = await supabase
        .from('whatsapp_metrics')
        .select('*')
        .eq('instance_name', instanceName)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: true });

      return data?.map(row => ({
        instanceId: row.instance_name,
        instanceName: row.instance_name,
        responseTime: row.response_time,
        messageCount: row.message_count,
        errorRate: row.error_rate,
        uptime: row.uptime,
        lastActivity: new Date(row.created_at),
        webhookHealth: row.webhook_health,
        qrCodeStatus: 'valid', // TODO: Implementar
        memoryUsage: row.memory_usage,
        cpuUsage: row.cpu_usage
      })) || [];
    } catch (error) {
      console.error('❌ [Monitor] Erro ao obter histórico de métricas:', error);
      return [];
    }
  }

  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar monitoramento com nova configuração
    this.startPeriodicMonitoring();
    
    console.log('⚙️ [Monitor] Configuração atualizada:', this.config);
  }

  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  public async generateReport(instanceName?: string): Promise<{
    summary: any;
    metrics: PerformanceMetrics[];
    alerts: Alert[];
  }> {
    const metrics = instanceName 
      ? await this.getMetricsHistory(instanceName, 24)
      : Array.from(this.metricsHistory.values()).flat();
    
    const alerts = await this.getAlerts(instanceName);
    
    const summary = {
      totalInstances: this.metricsHistory.size,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      averageUptime: metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length,
      totalMessages: metrics.reduce((sum, m) => sum + m.messageCount, 0),
      activeAlerts: alerts.filter(a => !a.resolved).length,
      period: '24 horas'
    };

    return { summary, metrics, alerts };
  }

  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.subscribers.clear();
    this.activeAlerts.clear();
    this.metricsHistory.clear();
    
    console.log('🛑 [Monitor] Serviço de monitoramento parado');
  }
}

// Exportar instância singleton
export const whatsappMonitoring = WhatsAppMonitoringService.getInstance();

// Exportar classe para casos especiais
export { WhatsAppMonitoringService };