import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Zap,
  Activity,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsAppBridge } from '@/services/whatsapp-bridge';

interface InstanceStatus {
  id: string;
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  phone?: string;
  department: string;
}

export const WhatsAppBridgeMonitor = () => {
  const [bridgeStatus, setBridgeStatus] = useState({
    enabled: false,
    queueSize: 0,
    processing: false
  });
  const [instances, setInstances] = useState<InstanceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Atualizar status do bridge
  const updateBridgeStatus = () => {
    const status = whatsAppBridge.getStatus();
    setBridgeStatus(status);
  };

  // Buscar status das instâncias
  const fetchInstancesStatus = async () => {
    setIsLoading(true);
    try {
      const instancesData = await whatsAppBridge.getInstancesStatus();
      setInstances(instancesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro buscando status das instâncias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-atualizar a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      updateBridgeStatus();
      fetchInstancesStatus();
    }, 10000);

    // Buscar dados iniciais
    updateBridgeStatus();
    fetchInstancesStatus();

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'connecting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'disconnected':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const connectedInstances = instances.filter(i => i.status === 'connected').length;
  const totalInstances = instances.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Smartphone className="w-7 h-7 mr-3 text-green-600" />
            WhatsApp Bridge Monitor
          </h2>
          <p className="text-gray-600 mt-1">
            Status da integração RabbitMQ → Evolution API → WhatsApp
          </p>
        </div>
        <Button 
          onClick={() => {
            updateBridgeStatus();
            fetchInstancesStatus();
          }}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bridge Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Bridge Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={cn(
                  "text-xs",
                  bridgeStatus.enabled 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {bridgeStatus.enabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fila</span>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{bridgeStatus.queueSize}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Processando</span>
                <div className="flex items-center space-x-2">
                  {bridgeStatus.processing ? (
                    <>
                      <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="text-blue-600 font-medium">Sim</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Não</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instances Overview */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Phone className="w-5 h-5 mr-2 text-green-600" />
              Instâncias WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conectadas</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{connectedInstances}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{totalInstances}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Taxa de conexão</span>
                  <span className="text-gray-700">
                    {totalInstances > 0 ? Math.round((connectedInstances / totalInstances) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={totalInstances > 0 ? (connectedInstances / totalInstances) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Update */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-purple-600" />
              Última Atualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {lastUpdate.toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-500">
                  {lastUpdate.toLocaleDateString()}
                </div>
              </div>
              
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  Auto-refresh 10s
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            Detalhes das Instâncias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Carregando instâncias...</span>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma instância encontrada</p>
              <p className="text-sm">Verifique a conexão com a Evolution API</p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(instance.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{instance.department}</h4>
                      <p className="text-sm text-gray-600">{instance.instanceName}</p>
                      {instance.phone && (
                        <p className="text-xs text-gray-500">{instance.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("text-xs", getStatusColor(instance.status))}>
                      {instance.status === 'connected' && 'Conectado'}
                      {instance.status === 'connecting' && 'Conectando'}
                      {instance.status === 'disconnected' && 'Desconectado'}
                      {instance.status === 'error' && 'Erro'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Controles do Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => {
                whatsAppBridge.setEnabled(!bridgeStatus.enabled);
                updateBridgeStatus();
              }}
              className={cn(
                bridgeStatus.enabled 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {bridgeStatus.enabled ? 'Desativar Bridge' : 'Ativar Bridge'}
            </Button>
            
            <div className="text-sm text-gray-600">
              Bridge: {bridgeStatus.enabled ? 'Todas as mensagens serão encaminhadas' : 'Mensagens não serão encaminhadas'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 