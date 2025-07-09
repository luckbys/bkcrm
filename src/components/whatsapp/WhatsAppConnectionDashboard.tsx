import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Settings,
  Activity,
  Smartphone,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Filter,
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Shield,
  Server,
  Database,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WhatsAppConnectionWizard from './WhatsAppConnectionWizard';
import EvolutionConnectionManager from './EvolutionConnectionManager';
import { evolutionConnectionMonitor, type ConnectionMetrics, type Alert as ConnectionAlert } from '@/services/whatsapp/EvolutionConnectionMonitor';
import { useEnhancedEvolutionConnection } from '@/hooks/useEnhancedEvolutionConnection';

interface InstanceCard {
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  metrics: ConnectionMetrics;
  lastSeen: Date;
  department?: string;
  description?: string;
}

interface DashboardProps {
  onInstanceSelect?: (instanceName: string) => void;
  showCreateButton?: boolean;
  showAdvancedFeatures?: boolean;
  compactMode?: boolean;
}

export const WhatsAppConnectionDashboard: React.FC<DashboardProps> = ({
  onInstanceSelect,
  showCreateButton = true,
  showAdvancedFeatures = true,
  compactMode = false
}) => {
  const { toast } = useToast();

  // Estados principais
  const [instances, setInstances] = useState<InstanceCard[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastSeen'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState<any>({});
  const [activeAlerts, setActiveAlerts] = useState<ConnectionAlert[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showInstanceManager, setShowInstanceManager] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos

  // Carregar dados iniciais
  useEffect(() => {
    loadInstances();
    loadGlobalStats();
    loadActiveAlerts();

    // Configurar auto-refresh
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadInstances();
        loadGlobalStats();
        loadActiveAlerts();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Carregar instâncias
  const loadInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Obter métricas de todas as instâncias monitoradas
      const allMetrics = evolutionConnectionMonitor.getAllMetrics();
      
      const instanceCards: InstanceCard[] = allMetrics.map(metrics => ({
        name: metrics.instanceName,
        status: metrics.status,
        metrics,
        lastSeen: metrics.lastSeen,
        department: 'Atendimento', // Pode ser obtido do banco de dados
        description: `Instância WhatsApp ${metrics.instanceName}`
      }));

      setInstances(instanceCards);
    } catch (error: any) {
      console.error('❌ Erro ao carregar instâncias:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar as instâncias",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar estatísticas globais
  const loadGlobalStats = useCallback(async () => {
    try {
      const stats = evolutionConnectionMonitor.getGlobalStats();
      setGlobalStats(stats);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  }, []);

  // Carregar alertas ativos
  const loadActiveAlerts = useCallback(async () => {
    try {
      const alerts = evolutionConnectionMonitor.getActiveAlerts();
      setActiveAlerts(alerts);
    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error);
    }
  }, []);

  // Filtrar e ordenar instâncias
  const filteredAndSortedInstances = React.useMemo(() => {
    let filtered = instances.filter(instance => {
      const matchesSearch = instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           instance.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'lastSeen':
          comparison = a.lastSeen.getTime() - b.lastSeen.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [instances, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handlers
  const handleCreateInstance = () => {
    setShowWizard(true);
  };

  const handleInstanceSelect = (instanceName: string) => {
    setSelectedInstance(instanceName);
    setShowInstanceManager(true);
    onInstanceSelect?.(instanceName);
  };

  const handleWizardComplete = (instanceName: string, success: boolean) => {
    setShowWizard(false);
    if (success) {
      toast({
        title: "Instância Criada",
        description: `Instância ${instanceName} conectada com sucesso`,
        duration: 5000
      });
      loadInstances();
    }
  };

  const handleDeleteInstance = async (instanceName: string) => {
    try {
      // Implementar lógica de exclusão
      evolutionConnectionMonitor.stopMonitoring(instanceName);
      
      toast({
        title: "Instância Removida",
        description: `Instância ${instanceName} foi removida`,
        duration: 3000
      });
      
      loadInstances();
    } catch (error: any) {
      toast({
        title: "Erro ao Remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStartMonitoring = (instanceName: string) => {
    evolutionConnectionMonitor.startMonitoring(instanceName);
    toast({
      title: "Monitoramento Iniciado",
      description: `Monitorando instância ${instanceName}`,
      duration: 3000
    });
  };

  const handleStopMonitoring = (instanceName: string) => {
    evolutionConnectionMonitor.stopMonitoring(instanceName);
    toast({
      title: "Monitoramento Parado",
      description: `Parou de monitorar instância ${instanceName}`,
      duration: 3000
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'connecting': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'disconnected': return <WifiOff className="w-5 h-5 text-red-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Smartphone className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'disconnected': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  // Componente de card de instância
  const InstanceCard: React.FC<{ instance: InstanceCard }> = ({ instance }) => (
    <Card 
      className={cn(
        "bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/30 transition-all duration-300 cursor-pointer group",
        instance.status === 'connected' && "ring-2 ring-green-500/20",
        instance.status === 'error' && "ring-2 ring-red-500/20"
      )}
      onClick={() => handleInstanceSelect(instance.name)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{instance.name}</h3>
              <p className="text-sm text-gray-600">{instance.department}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleInstanceSelect(instance.name)}>
                <Eye className="w-4 h-4 mr-2" />
                Gerenciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStartMonitoring(instance.name)}>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Monitoramento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStopMonitoring(instance.name)}>
                <Pause className="w-4 h-4 mr-2" />
                Parar Monitoramento
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteInstance(instance.name)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge className={getStatusColor(instance.status)}>
              {getStatusIcon(instance.status)}
              <span className="ml-1 capitalize">{instance.status}</span>
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Última atividade:</span>
            <span className="text-sm font-medium">{formatLastSeen(instance.lastSeen)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Qualidade:</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    instance.metrics.connectionQuality === 'excellent' && "bg-green-500",
                    instance.metrics.connectionQuality === 'good' && "bg-blue-500",
                    instance.metrics.connectionQuality === 'fair' && "bg-yellow-500",
                    instance.metrics.connectionQuality === 'poor' && "bg-red-500"
                  )}
                  style={{ 
                    width: `${
                      instance.metrics.connectionQuality === 'excellent' ? 100 :
                      instance.metrics.connectionQuality === 'good' ? 75 :
                      instance.metrics.connectionQuality === 'fair' ? 50 : 25
                    }%` 
                  }}
                />
              </div>
              <span className="text-xs font-medium capitalize">
                {instance.metrics.connectionQuality}
              </span>
            </div>
          </div>

          {instance.metrics.messagesProcessed > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mensagens:</span>
              <span className="text-sm font-medium">{instance.metrics.messagesProcessed}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      {/* Header com estatísticas globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Instâncias</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalInstances || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conectadas</p>
                <p className="text-2xl font-bold text-green-600">{globalStats.connectedInstances || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-red-600">{activeAlerts.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saúde Geral</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.overallHealth || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas ativos */}
      {activeAlerts.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alertas Ativos ({activeAlerts.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm">
                  <strong>{alert.instanceName}:</strong> {alert.message}
                </div>
              ))}
              {activeAlerts.length > 3 && (
                <div className="text-sm text-red-600">
                  E mais {activeAlerts.length - 3} alertas...
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Controles e filtros */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar instâncias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="connected">Conectado</SelectItem>
                  <SelectItem value="disconnected">Desconectado</SelectItem>
                  <SelectItem value="connecting">Conectando</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="lastSeen">Última atividade</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto-refresh:</span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadInstances();
                    loadGlobalStats();
                    loadActiveAlerts();
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
              </div>

              {showCreateButton && (
                <Button onClick={handleCreateInstance} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Instância
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de instâncias */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' 
          ? compactMode 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      )}>
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando instâncias...</p>
          </div>
        ) : filteredAndSortedInstances.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Smartphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instância encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira instância WhatsApp'
              }
            </p>
            {showCreateButton && !searchTerm && statusFilter === 'all' && (
              <Button onClick={handleCreateInstance} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Instância
              </Button>
            )}
          </div>
        ) : (
          filteredAndSortedInstances.map(instance => (
            <InstanceCard key={instance.name} instance={instance} />
          ))
        )}
      </div>

      {/* Modal do Wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-5xl w-full h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          <WhatsAppConnectionWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
            showAdvancedOptions={showAdvancedFeatures}
          />
        </DialogContent>
      </Dialog>

      {/* Modal do Gerenciador */}
      <Dialog open={showInstanceManager} onOpenChange={setShowInstanceManager}>
        <DialogContent className="max-w-6xl w-full h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Instância: {selectedInstance}</DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <EvolutionConnectionManager
              instanceName={selectedInstance}
              onStatusChange={(status) => {
                console.log(`Status da instância ${selectedInstance}: ${status}`);
              }}
              showAdvancedOptions={showAdvancedFeatures}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppConnectionDashboard; 