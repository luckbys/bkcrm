import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRabbitMQ } from '@/hooks/useRabbitMQ';
import { Activity, MessageSquare, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const RabbitMQMonitor = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    isConnected,
    connectionError,
    queueStats,
    getStats
  } = useRabbitMQ();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await getStats();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor RabbitMQ</h2>
          <p className="text-gray-600">Monitoramento em tempo real do sistema de mensagens</p>
        </div>
        
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Status da Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {connectionError && (
              <p className="text-xs text-red-500 mt-2">{connectionError}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Mensagens na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {queueStats ? Object.values(queueStats).reduce((total: number, queue: any) => total + (queue.messageCount || 0), 0) : '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Consumidores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">
                {queueStats ? Object.values(queueStats).reduce((total: number, queue: any) => total + (queue.consumerCount || 0), 0) : '0'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Fila</CardTitle>
        </CardHeader>
        <CardContent>
          {queueStats ? (
            <div className="space-y-4">
              {Object.entries(queueStats).map(([name, stats]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium">{name.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">{stats.queue}</p>
                  </div>
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <p className="font-semibold">{stats.messageCount}</p>
                      <p className="text-xs text-gray-500">Mensagens</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{stats.consumerCount}</p>
                      <p className="text-xs text-gray-500">Consumidores</p>
                    </div>
                    <Badge variant={stats.consumerCount > 0 ? "default" : "secondary"}>
                      {stats.consumerCount > 0 ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {isConnected ? 'Carregando estatísticas...' : 'Conecte-se ao RabbitMQ para ver as estatísticas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>
          💡 <strong>Dica:</strong> Em produção, configure um servidor RabbitMQ dedicado. 
          Em desenvolvimento, o sistema usa uma simulação local.
        </p>
      </div>
    </div>
  );
}; 