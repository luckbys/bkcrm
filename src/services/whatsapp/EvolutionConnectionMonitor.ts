import { evolutionApi } from '@/services/evolutionApi';
import { supabase } from '@/lib/supabase';

interface ConnectionMetrics {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSeen: Date;
  responseTime: number;
  uptime: number;
  errorCount: number;
  messagesProcessed: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  qrCodeGenerations: number;
  reconnectionAttempts: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: ConnectionMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // Em segundos
  lastTriggered?: Date;
  enabled: boolean;
  description: string;
}

interface Alert {
  id: string;
  instanceName: string;
  rule: AlertRule;
  timestamp: Date;
  message: string;
  acknowledged: boolean;
  resolvedAt?: Date;
}

interface HealthCheckResult {
  instanceName: string;
  isHealthy: boolean;
  checks: {
    api: { status: 'ok' | 'error'; responseTime: number; error?: string };
    instance: { status: 'ok' | 'error'; state?: string; error?: string };
    webhook: { status: 'ok' | 'error'; enabled?: boolean; error?: string };
    connectivity: { status: 'ok' | 'error'; latency?: number; error?: string };
  };
  score: number; // 0-100
  recommendations: string[];
}

class EvolutionConnectionMonitorService {
  private static instance: EvolutionConnectionMonitorService;
  private metricsStore = new Map<string, ConnectionMetrics>();
  private alertsStore = new Map<string, Alert>();
  private alertRules: AlertRule[] = [];
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  // Singleton pattern
  static getInstance(): EvolutionConnectionMonitorService {
    if (!EvolutionConnectionMonitorService.instance) {
      EvolutionConnectionMonitorService.instance = new EvolutionConnectionMonitorService();
    }
    return EvolutionConnectionMonitorService.instance;
  }

  private constructor() {
    this.initializeDefaultAlertRules();
  }

  // Inicializar regras de alerta padrão
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'instance_disconnected',
        name: 'Instância Desconectada',
        condition: (metrics) => metrics.status === 'disconnected',
        severity: 'high',
        cooldown: 300, // 5 minutos
        enabled: true,
        description: 'Instância WhatsApp perdeu conexão'
      },
      {
        id: 'high_response_time',
        name: 'Alto Tempo de Resposta',
        condition: (metrics) => metrics.responseTime > 5000,
        severity: 'medium',
        cooldown: 600, // 10 minutos
        enabled: true,
        description: 'Tempo de resposta acima de 5 segundos'
      },
      {
        id: 'multiple_errors',
        name: 'Múltiplos Erros',
        condition: (metrics) => metrics.errorCount > 5,
        severity: 'high',
        cooldown: 300,
        enabled: true,
        description: 'Mais de 5 erros registrados'
      },
      {
        id: 'poor_connection_quality',
        name: 'Qualidade de Conexão Ruim',
        condition: (metrics) => metrics.connectionQuality === 'poor',
        severity: 'medium',
        cooldown: 900, // 15 minutos
        enabled: true,
        description: 'Qualidade da conexão está ruim'
      },
      {
        id: 'excessive_reconnections',
        name: 'Reconexões Excessivas',
        condition: (metrics) => metrics.reconnectionAttempts > 3,
        severity: 'high',
        cooldown: 1800, // 30 minutos
        enabled: true,
        description: 'Muitas tentativas de reconexão'
      },
      {
        id: 'instance_offline_long',
        name: 'Instância Offline por Muito Tempo',
        condition: (metrics) => {
          if (metrics.status !== 'disconnected') return false;
          const hoursOffline = (Date.now() - metrics.lastSeen.getTime()) / (1000 * 60 * 60);
          return hoursOffline > 1; // Mais de 1 hora offline
        },
        severity: 'critical',
        cooldown: 3600, // 1 hora
        enabled: true,
        description: 'Instância está offline há mais de 1 hora'
      }
    ];
  }

  // Iniciar monitoramento para uma instância
  async startMonitoring(instanceName: string, interval: number = 30000): Promise<void> {
    console.log(`🔍 Iniciando monitoramento para ${instanceName}`);

    // Parar monitoramento existente se houver
    this.stopMonitoring(instanceName);

    // Inicializar métricas
    if (!this.metricsStore.has(instanceName)) {
      this.metricsStore.set(instanceName, {
        instanceName,
        status: 'disconnected',
        lastSeen: new Date(),
        responseTime: 0,
        uptime: 0,
        errorCount: 0,
        messagesProcessed: 0,
        connectionQuality: 'good',
        qrCodeGenerations: 0,
        reconnectionAttempts: 0
      });
    }

    // Configurar intervalo de monitoramento
    const intervalId = setInterval(async () => {
      try {
        await this.checkInstanceHealth(instanceName);
        await this.processAlerts(instanceName);
      } catch (error) {
        console.error(`❌ Erro no monitoramento de ${instanceName}:`, error);
      }
    }, interval);

    this.monitoringIntervals.set(instanceName, intervalId);
    this.isRunning = true;
  }

  // Parar monitoramento para uma instância
  stopMonitoring(instanceName: string): void {
    const intervalId = this.monitoringIntervals.get(instanceName);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(instanceName);
      console.log(`⏹️ Monitoramento parado para ${instanceName}`);
    }
  }

  // Parar todo o monitoramento
  stopAllMonitoring(): void {
    for (const [instanceName] of this.monitoringIntervals) {
      this.stopMonitoring(instanceName);
    }
    this.isRunning = false;
    console.log('⏹️ Todo monitoramento foi parado');
  }

  // Verificar saúde de uma instância
  async checkInstanceHealth(instanceName: string): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      instanceName,
      isHealthy: false,
      checks: {
        api: { status: 'error', responseTime: 0 },
        instance: { status: 'error' },
        webhook: { status: 'error' },
        connectivity: { status: 'error' }
      },
      score: 0,
      recommendations: []
    };

    let metrics = this.metricsStore.get(instanceName);
    if (!metrics) {
      metrics = {
        instanceName,
        status: 'disconnected',
        lastSeen: new Date(),
        responseTime: 0,
        uptime: 0,
        errorCount: 0,
        messagesProcessed: 0,
        connectionQuality: 'good',
        qrCodeGenerations: 0,
        reconnectionAttempts: 0
      };
      this.metricsStore.set(instanceName, metrics);
    }

    try {
      // 1. Verificar API da Evolution
      const apiStartTime = Date.now();
      try {
        const health = await evolutionApi.checkHealth();
        const apiResponseTime = Date.now() - apiStartTime;
        
        result.checks.api = {
          status: health.status === 'ok' ? 'ok' : 'error',
          responseTime: apiResponseTime
        };
        
        metrics.responseTime = apiResponseTime;
      } catch (error: any) {
        result.checks.api = {
          status: 'error',
          responseTime: Date.now() - apiStartTime,
          error: error.message
        };
        metrics.errorCount++;
      }

      // 2. Verificar status da instância
      try {
        const instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
        
        result.checks.instance = {
          status: instanceStatus.status === 'open' ? 'ok' : 'error',
          state: instanceStatus.status
        };
        
        if (instanceStatus.status === 'open') {
          metrics.status = 'connected';
          metrics.lastSeen = new Date();
        } else {
          metrics.status = 'disconnected';
        }
      } catch (error: any) {
        result.checks.instance = {
          status: 'error',
          error: error.message
        };
        metrics.status = 'error';
        metrics.errorCount++;
      }

      // 3. Verificar configuração do webhook
      try {
        const webhook = await evolutionApi.getInstanceWebhook(instanceName);
        
        result.checks.webhook = {
          status: webhook.enabled ? 'ok' : 'error',
          enabled: webhook.enabled
        };
        
        if (!webhook.enabled) {
          result.recommendations.push('Ativar webhook para receber mensagens automaticamente');
        }
      } catch (error: any) {
        result.checks.webhook = {
          status: 'error',
          error: error.message
        };
        result.recommendations.push('Configurar webhook para funcionamento completo');
      }

      // 4. Teste de conectividade
      try {
        const connectivityStartTime = Date.now();
        await evolutionApi.getInstanceStatus(instanceName); // Teste simples
        const latency = Date.now() - connectivityStartTime;
        
        result.checks.connectivity = {
          status: latency < 3000 ? 'ok' : 'error',
          latency
        };
        
        if (latency > 3000) {
          result.recommendations.push('Verificar conexão de rede - alta latência detectada');
        }
      } catch (error: any) {
        result.checks.connectivity = {
          status: 'error',
          error: error.message
        };
        result.recommendations.push('Verificar conectividade com Evolution API');
      }

      // Calcular score de saúde (0-100)
      let score = 0;
      const checks = Object.values(result.checks);
      const okChecks = checks.filter(check => check.status === 'ok').length;
      score = (okChecks / checks.length) * 100;
      
      // Penalizar por alta latência
      if (metrics.responseTime > 2000) score -= 10;
      if (metrics.responseTime > 5000) score -= 20;
      
      // Penalizar por erros recentes
      if (metrics.errorCount > 0) score -= Math.min(metrics.errorCount * 5, 30);
      
      result.score = Math.max(0, Math.round(score));
      result.isHealthy = result.score >= 70;

      // Atualizar qualidade da conexão
      if (result.score >= 90) metrics.connectionQuality = 'excellent';
      else if (result.score >= 75) metrics.connectionQuality = 'good';
      else if (result.score >= 50) metrics.connectionQuality = 'fair';
      else metrics.connectionQuality = 'poor';

      // Adicionar recomendações baseadas no score
      if (result.score < 50) {
        result.recommendations.push('Verificar configuração da instância');
        result.recommendations.push('Considerar reiniciar a conexão');
      }

      // Salvar métricas atualizadas
      this.metricsStore.set(instanceName, metrics);
      
      // Salvar no banco de dados (opcional)
      await this.saveMetricsToDatabase(metrics);

    } catch (error: any) {
      console.error(`❌ Erro no health check de ${instanceName}:`, error);
      result.recommendations.push(`Erro geral: ${error.message}`);
      metrics.errorCount++;
    }

    return result;
  }

  // Processar alertas para uma instância
  private async processAlerts(instanceName: string): Promise<void> {
    const metrics = this.metricsStore.get(instanceName);
    if (!metrics) return;

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Verificar cooldown
      if (rule.lastTriggered) {
        const timeSinceLastAlert = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastAlert < rule.cooldown * 1000) continue;
      }

      // Verificar condição
      if (rule.condition(metrics)) {
        await this.triggerAlert(instanceName, rule, metrics);
      }
    }
  }

  // Disparar alerta
  private async triggerAlert(instanceName: string, rule: AlertRule, metrics: ConnectionMetrics): Promise<void> {
    const alert: Alert = {
      id: `${instanceName}_${rule.id}_${Date.now()}`,
      instanceName,
      rule,
      timestamp: new Date(),
      message: `${rule.name}: ${rule.description}`,
      acknowledged: false
    };

    // Salvar alerta
    this.alertsStore.set(alert.id, alert);
    rule.lastTriggered = new Date();

    console.log(`🚨 ALERTA [${rule.severity.toUpperCase()}] ${instanceName}: ${alert.message}`);

    // Salvar no banco de dados
    await this.saveAlertToDatabase(alert);

    // Enviar notificação (webhook, email, etc.)
    await this.sendAlertNotification(alert);
  }

  // Salvar métricas no banco de dados
  private async saveMetricsToDatabase(metrics: ConnectionMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_instance_metrics')
        .upsert({
          instance_name: metrics.instanceName,
          status: metrics.status,
          last_seen: metrics.lastSeen.toISOString(),
          response_time: metrics.responseTime,
          uptime: metrics.uptime,
          error_count: metrics.errorCount,
          messages_processed: metrics.messagesProcessed,
          connection_quality: metrics.connectionQuality,
          qr_code_generations: metrics.qrCodeGenerations,
          reconnection_attempts: metrics.reconnectionAttempts,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instance_name'
        });

      if (error) {
        console.error('❌ Erro ao salvar métricas no banco:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar métricas:', error);
    }
  }

  // Salvar alerta no banco de dados
  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_alerts')
        .insert({
          id: alert.id,
          instance_name: alert.instanceName,
          rule_id: alert.rule.id,
          rule_name: alert.rule.name,
          severity: alert.rule.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          acknowledged: alert.acknowledged
        });

      if (error) {
        console.error('❌ Erro ao salvar alerta no banco:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar alerta:', error);
    }
  }

  // Enviar notificação de alerta
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Aqui você pode implementar diferentes tipos de notificação:
      // - WebSocket para o frontend
      // - Email
      // - Slack/Teams
      // - Push notification
      
      // Exemplo: WebSocket (se disponível)
      if (typeof window !== 'undefined' && (window as any).webSocketConnection) {
        (window as any).webSocketConnection.emit('whatsapp_alert', {
          id: alert.id,
          instanceName: alert.instanceName,
          severity: alert.rule.severity,
          message: alert.message,
          timestamp: alert.timestamp
        });
      }

      // Exemplo: Console log para desenvolvimento
      console.log(`📢 Notificação enviada para alerta ${alert.id}`);
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }

  // Métodos públicos para gerenciamento

  // Obter métricas de uma instância
  getMetrics(instanceName: string): ConnectionMetrics | undefined {
    return this.metricsStore.get(instanceName);
  }

  // Obter todas as métricas
  getAllMetrics(): ConnectionMetrics[] {
    return Array.from(this.metricsStore.values());
  }

  // Obter alertas ativos
  getActiveAlerts(instanceName?: string): Alert[] {
    const alerts = Array.from(this.alertsStore.values());
    return alerts
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .filter(alert => !instanceName || alert.instanceName === instanceName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Obter histórico de alertas
  getAlertHistory(instanceName?: string, limit: number = 50): Alert[] {
    const alerts = Array.from(this.alertsStore.values());
    return alerts
      .filter(alert => !instanceName || alert.instanceName === instanceName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Reconhecer alerta
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertsStore.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alertsStore.set(alertId, alert);
      console.log(`✅ Alerta ${alertId} reconhecido`);
      return true;
    }
    return false;
  }

  // Resolver alerta
  resolveAlert(alertId: string): boolean {
    const alert = this.alertsStore.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.alertsStore.set(alertId, alert);
      console.log(`✅ Alerta ${alertId} resolvido`);
      return true;
    }
    return false;
  }

  // Configurar regra de alerta
  setAlertRule(rule: AlertRule): void {
    const index = this.alertRules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.alertRules[index] = rule;
    } else {
      this.alertRules.push(rule);
    }
    console.log(`⚙️ Regra de alerta ${rule.id} configurada`);
  }

  // Obter regras de alerta
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  // Executar diagnóstico completo
  async runCompleteDiagnostics(instanceName: string): Promise<{
    health: HealthCheckResult;
    metrics: ConnectionMetrics;
    alerts: Alert[];
    recommendations: string[];
  }> {
    console.log(`🔍 Executando diagnóstico completo para ${instanceName}`);

    const health = await this.checkInstanceHealth(instanceName);
    const metrics = this.getMetrics(instanceName);
    const alerts = this.getActiveAlerts(instanceName);
    
    const recommendations = [
      ...health.recommendations,
      ...(alerts.length > 0 ? ['Resolver alertas ativos'] : []),
      ...(metrics?.errorCount && metrics.errorCount > 0 ? ['Investigar causas dos erros'] : [])
    ];

    return {
      health,
      metrics: metrics!,
      alerts,
      recommendations
    };
  }

  // Obter estatísticas globais
  getGlobalStats(): {
    totalInstances: number;
    connectedInstances: number;
    disconnectedInstances: number;
    instancesWithErrors: number;
    activeAlerts: number;
    averageResponseTime: number;
    overallHealth: number;
  } {
    const allMetrics = this.getAllMetrics();
    const activeAlerts = this.getActiveAlerts();

    const connectedInstances = allMetrics.filter(m => m.status === 'connected').length;
    const disconnectedInstances = allMetrics.filter(m => m.status === 'disconnected').length;
    const instancesWithErrors = allMetrics.filter(m => m.errorCount > 0).length;
    
    const averageResponseTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length 
      : 0;

    const overallHealth = allMetrics.length > 0
      ? (connectedInstances / allMetrics.length) * 100
      : 0;

    return {
      totalInstances: allMetrics.length,
      connectedInstances,
      disconnectedInstances,
      instancesWithErrors,
      activeAlerts: activeAlerts.length,
      averageResponseTime: Math.round(averageResponseTime),
      overallHealth: Math.round(overallHealth)
    };
  }

  // Limpar dados antigos
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Limpar alertas antigos
    for (const [alertId, alert] of this.alertsStore) {
      if (alert.timestamp < cutoffDate) {
        this.alertsStore.delete(alertId);
      }
    }

    // Limpar dados do banco
    try {
      await supabase
        .from('whatsapp_alerts')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      await supabase
        .from('whatsapp_instance_metrics')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());

      console.log(`🧹 Dados antigos limpos (mais de ${daysToKeep} dias)`);
    } catch (error) {
      console.error('❌ Erro ao limpar dados antigos:', error);
    }
  }
}

// Exportar instância singleton
export const evolutionConnectionMonitor = EvolutionConnectionMonitorService.getInstance();

// Exportar tipos
export type {
  ConnectionMetrics,
  AlertRule,
  Alert,
  HealthCheckResult
};

export default EvolutionConnectionMonitorService; 