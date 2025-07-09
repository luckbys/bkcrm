import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { evolutionApi } from '@/services/evolutionAPI';
import { wsService } from '@/services/websocket';
import { 
  MessageSquare, 
  Smartphone, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Users, 
  BarChart3, 
  Zap,
  Bell,
  ShieldCheck,
  PlayCircle,
  Pause,
  RefreshCw,
  Plus,
  Eye,
  Download,
  Upload,
  BookOpen,
  HelpCircle,
  Clock,
  Target,
  Wifi,
  WifiOff,
  Bot,
  Globe,
  Server,
  Database,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ContextualLoadingSpinner,
  LoadingSpinner,
  ListSkeleton,
  CardSkeleton,
  GlassLoadingSpinner
} from '@/components/ui/loading';

interface InstanceMetrics {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  department: string;
  phone?: string;
  messagesCount: number;
  lastActivity: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
  qrCodeExpiry?: Date;
  webhookStatus: 'active' | 'inactive' | 'error';
  version: string;
}

interface HubStats {
  totalInstances: number;
  activeInstances: number;
  totalMessages: number;
  messagesLastHour: number;
  averageResponseTime: number;
  successRate: number;
  webhookHealth: number;
  systemUptime: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  instanceId?: string;
  action?: string;
}

export const WhatsAppIntegrationHub: React.FC = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [instances, setInstances] = useState<InstanceMetrics[]>([]);
  const [hubStats, setHubStats] = useState<HubStats>({
    totalInstances: 0,
    activeInstances: 0,
    totalMessages: 0,
    messagesLastHour: 0,
    averageResponseTime: 0,
    successRate: 0,
    webhookHealth: 0,
    systemUptime: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<InstanceMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de modais
  const [showInstanceDetails, setShowInstanceDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Carregar dados do hub
  useEffect(() => {
    loadHubData();
    
    if (autoRefresh) {
      const interval = setInterval(loadHubData, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Conexão WebSocket para atualizações em tempo real
  useEffect(() => {
    const socket = wsService.connect();
    
    socket.on('instance-status-update', (data) => {
      handleInstanceStatusUpdate(data);
    });

    socket.on('new-alert', (alert) => {
      handleNewAlert(alert);
    });

    socket.on('metrics-update', (metrics) => {
      handleMetricsUpdate(metrics);
    });

    return () => {
      socket.off('instance-status-update');
      socket.off('new-alert');
      socket.off('metrics-update');
    };
  }, []);

  const loadHubData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar instâncias e métricas
      const [instancesData, statsData] = await Promise.all([
        loadInstancesMetrics(),
        loadHubStats()
      ]);

      setInstances(instancesData);
      setHubStats(statsData);
      
      // Gerar alertas baseados nos dados
      const newAlerts = generateAlerts(instancesData, statsData);
      setAlerts(newAlerts);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do hub:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Algumas informações podem estar desatualizadas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstancesMetrics = async (): Promise<InstanceMetrics[]> => {
    try {
      const instances = await evolutionApi.fetchInstances();
      
      return instances.map(instance => ({
        id: instance.instanceName,
        name: instance.instanceName,
        status: mapInstanceStatus(instance.status),
        department: 'Geral', // TODO: Buscar do banco
                 phone: undefined, // TODO: Buscar do banco ou API
        messagesCount: Math.floor(Math.random() * 1000), // TODO: Métricas reais
        lastActivity: new Date(Date.now() - Math.random() * 3600000),
        uptime: Math.random() * 100,
        responseTime: Math.random() * 2000,
        errorRate: Math.random() * 10,
        webhookStatus: Math.random() > 0.3 ? 'active' : 'inactive',
        version: '2.0.0'
      }));
    } catch (error) {
      console.error('Erro ao carregar métricas de instâncias:', error);
      return [];
    }
  };

  const loadHubStats = async (): Promise<HubStats> => {
    try {
      const stats = await evolutionApi.getStats();
      
      return {
        totalInstances: stats.evolution?.instances || 0,
        activeInstances: stats.evolution?.connected || 0,
        totalMessages: Math.floor(Math.random() * 10000),
        messagesLastHour: Math.floor(Math.random() * 500),
        averageResponseTime: Math.random() * 1000,
        successRate: 95 + Math.random() * 5,
        webhookHealth: Math.random() * 100,
        systemUptime: stats.server?.uptime || 0
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas do hub:', error);
      return {
        totalInstances: 0,
        activeInstances: 0,
        totalMessages: 0,
        messagesLastHour: 0,
        averageResponseTime: 0,
        successRate: 0,
        webhookHealth: 0,
        systemUptime: 0
      };
    }
  };

  const generateAlerts = (instances: InstanceMetrics[], stats: HubStats): Alert[] => {
    const alerts: Alert[] = [];
    
    // Alertas de instâncias desconectadas
    instances.forEach(instance => {
      if (instance.status === 'disconnected') {
        alerts.push({
          id: `${instance.id}-disconnected`,
          type: 'error',
          title: 'Instância Desconectada',
          message: `${instance.name} está desconectada há ${Math.floor(Math.random() * 60)} minutos`,
          timestamp: new Date(),
          instanceId: instance.id,
          action: 'reconnect'
        });
      }
      
      if (instance.errorRate > 5) {
        alerts.push({
          id: `${instance.id}-errors`,
          type: 'warning',
          title: 'Alta Taxa de Erros',
          message: `${instance.name} tem ${instance.errorRate.toFixed(1)}% de erros`,
          timestamp: new Date(),
          instanceId: instance.id,
          action: 'check-logs'
        });
      }
    });
    
    // Alertas de sistema
    if (stats.successRate < 95) {
      alerts.push({
        id: 'system-success-rate',
        type: 'warning',
        title: 'Taxa de Sucesso Baixa',
        message: `Sistema com ${stats.successRate.toFixed(1)}% de sucesso`,
        timestamp: new Date(),
        action: 'check-system'
      });
    }
    
    return alerts;
  };

  const mapInstanceStatus = (status: string): InstanceMetrics['status'] => {
    switch (status) {
      case 'open': return 'connected';
      case 'close': return 'disconnected';
      case 'connecting': return 'connecting';
      default: return 'error';
    }
  };

  const handleInstanceStatusUpdate = (data: any) => {
    setInstances(prev => 
      prev.map(instance => 
        instance.id === data.instanceId 
          ? { ...instance, status: data.status, lastActivity: new Date() }
          : instance
      )
    );
  };

  const handleNewAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Manter apenas 20 alertas
    
    // Mostrar notificação
    toast({
      title: alert.title,
      description: alert.message,
      variant: alert.type === 'error' ? 'destructive' : 'default'
    });
  };

  const handleMetricsUpdate = (metrics: any) => {
    setHubStats(prev => ({ ...prev, ...metrics }));
  };

  const getStatusColor = (status: InstanceMetrics['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: InstanceMetrics['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      case 'connecting': return <LoadingSpinner size="sm" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleInstanceAction = async (instanceId: string, action: string) => {
    try {
      switch (action) {
        case 'reconnect':
          await evolutionApi.createInstance({ instanceName: instanceId });
          break;
        case 'restart':
          // TODO: Implementar restart
          break;
        case 'view-logs':
          // TODO: Implementar visualização de logs
          break;
      }
      
      toast({
        title: "Ação executada",
        description: `${action} executado para ${instanceId}`,
      });
      
      // Recarregar dados
      await loadHubData();
    } catch (error: any) {
      toast({
        title: "Erro na ação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            Hub de Integração WhatsApp
          </h1>
          <p className="text-gray-600">
            Gerenciamento centralizado de instâncias e monitoramento avançado
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2",
              autoRefresh && "bg-green-50 border-green-200"
            )}
          >
            {autoRefresh ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            Auto-refresh
          </Button>
          
          <Button
            onClick={() => loadHubData()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="grid gap-3">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={cn(
              "border-l-4",
              alert.type === 'error' && "border-l-red-500 bg-red-50",
              alert.type === 'warning' && "border-l-yellow-500 bg-yellow-50",
              alert.type === 'info' && "border-l-blue-500 bg-blue-50"
            )}>
              <AlertTriangle className="w-4 h-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-medium">{alert.title}</h4>
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
                {alert.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => alert.instanceId && handleInstanceAction(alert.instanceId, alert.action!)}
                  >
                    Resolver
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Instâncias Ativas</p>
                <p className="text-2xl font-bold text-blue-900">
                  {hubStats.activeInstances}/{hubStats.totalInstances}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Smartphone className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Mensagens/Hora</p>
                <p className="text-2xl font-bold text-green-900">
                  {hubStats.messagesLastHour.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <MessageSquare className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Tempo Resposta</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatResponseTime(hubStats.averageResponseTime)}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Zap className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-orange-900">
                  {hubStats.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs do Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status das Instâncias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instances.slice(0, 5).map((instance) => (
                    <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", getStatusColor(instance.status))}>
                          {getStatusIcon(instance.status)}
                        </div>
                        <div>
                          <p className="font-medium">{instance.name}</p>
                          <p className="text-sm text-gray-600">{instance.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{instance.messagesCount} msgs</p>
                        <p className="text-xs text-gray-500">
                          {formatUptime((Date.now() - instance.lastActivity.getTime()) / 1000)} atrás
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Performance do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Saúde dos Webhooks</span>
                      <span className="text-sm text-gray-600">{hubStats.webhookHealth.toFixed(0)}%</span>
                    </div>
                    <Progress value={hubStats.webhookHealth} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Taxa de Sucesso</span>
                      <span className="text-sm text-gray-600">{hubStats.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={hubStats.successRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Uptime do Sistema</span>
                      <span className="text-sm text-gray-600">{formatUptime(hubStats.systemUptime)}</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Instâncias ({instances.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBulkActions(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Ações em Lote
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Instância
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {instances.map((instance) => (
              <Card key={instance.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-lg", getStatusColor(instance.status))}>
                        {getStatusIcon(instance.status)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{instance.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{instance.department}</span>
                          {instance.phone && <span>📱 {instance.phone}</span>}
                          <span>v{instance.version}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">{instance.messagesCount}</p>
                        <p className="text-xs text-gray-500">Mensagens</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{formatResponseTime(instance.responseTime)}</p>
                        <p className="text-xs text-gray-500">Resposta</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{instance.uptime.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Uptime</p>
                      </div>
                      <div className="text-center">
                                                 <div className={cn(
                           "px-2 py-1 text-xs rounded-full",
                           instance.webhookStatus === 'active' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-gray-100 text-gray-800'
                         )}>
                           {instance.webhookStatus}
                         </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInstance(instance);
                          setShowInstanceDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Gráfico de mensagens por hora</p>
                    <p className="text-sm">(Em desenvolvimento)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Instância</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p>Gráfico de performance</p>
                    <p className="text-sm">(Em desenvolvimento)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={cn(
                "border-l-4",
                alert.type === 'error' && "border-l-red-500",
                alert.type === 'warning' && "border-l-yellow-500",
                alert.type === 'info' && "border-l-blue-500"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={cn(
                        "w-5 h-5",
                        alert.type === 'error' && "text-red-500",
                        alert.type === 'warning' && "text-yellow-500",
                        alert.type === 'info' && "text-blue-500"
                      )} />
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {alert.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert.instanceId && handleInstanceAction(alert.instanceId, alert.action!)}
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Hub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Intervalo de Atualização</label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option value="15">15 segundos</option>
                    <option value="30" selected>30 segundos</option>
                    <option value="60">1 minuto</option>
                    <option value="300">5 minutos</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Retenção de Alertas</label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option value="20" selected>20 alertas</option>
                    <option value="50">50 alertas</option>
                    <option value="100">100 alertas</option>
                  </select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Notificações</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Instâncias desconectadas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Erros de webhook</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span className="text-sm">Relatórios diários</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Instância */}
      <Dialog open={showInstanceDetails} onOpenChange={setShowInstanceDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Instância</DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg font-medium">{selectedInstance.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                                     <div className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(selectedInstance.status))}>
                     {selectedInstance.status}
                   </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Departamento</label>
                  <p>{selectedInstance.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p>{selectedInstance.phone || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedInstance.messagesCount}</p>
                  <p className="text-sm text-gray-500">Mensagens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatResponseTime(selectedInstance.responseTime)}</p>
                  <p className="text-sm text-gray-500">Resp. Média</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedInstance.uptime.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Uptime</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleInstanceAction(selectedInstance.id, 'reconnect')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleInstanceAction(selectedInstance.id, 'view-logs')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ver Logs
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};