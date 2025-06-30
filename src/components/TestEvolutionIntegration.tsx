import React, { useState, useEffect } from 'react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { testEvolutionIntegration, IntegrationTestResult } from '@/utils/testEvolutionIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play,
  Wifi,
  WifiOff,
  MessageSquare,
  Bell,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

function TestEvolutionIntegration() {
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  // Hooks de integração
  const evolutionWebhook = useEvolutionWebhook();
  const notifications = useRealtimeNotifications();

  // Executar testes
  const runTests = async () => {
    setIsRunningTests(true);
    try {
      console.log('🧪 Iniciando bateria de testes...');
      await testEvolutionIntegration();
      setLastTestTime(new Date());
      toast.success('Testes executados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao executar testes:', error);
      toast.error(`Erro nos testes: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Auto-executar testes na primeira carga
  useEffect(() => {
    runTests();
  }, []);

  // Estatísticas do WebSocket
  const getWebSocketStats = () => {
    return {
      connected: evolutionWebhook.isConnected,
      status: evolutionWebhook.connectionStatus,
      messages: evolutionWebhook.messages.length,
      instances: Object.keys(evolutionWebhook.instances).length,
      qrCodes: Object.keys(evolutionWebhook.qrCodes).length
    };
  };

  // Estatísticas das notificações
  const getNotificationStats = () => {
    return {
      total: notifications.notifications.length,
      unread: notifications.unreadCount,
      connected: notifications.isConnected
    };
  };

  const wsStats = getWebSocketStats();
  const notifStats = getNotificationStats();

  // Renderizar badge de status
  const renderStatusBadge = (status: 'success' | 'error' | 'warning') => {
    const config = {
      success: { icon: CheckCircle, className: 'bg-green-500 hover:bg-green-600', text: 'Sucesso' },
      error: { icon: AlertCircle, className: 'bg-red-500 hover:bg-red-600', text: 'Erro' },
      warning: { icon: AlertTriangle, className: 'bg-yellow-500 hover:bg-yellow-600', text: 'Aviso' }
    };

    const { icon: Icon, className, text } = config[status];

    return (
      <Badge variant="default" className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teste de Integração Evolution API</h2>
          <p className="text-muted-foreground mt-1">
            Verificação completa da integração WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={runTests} disabled={isRunningTests} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
            {isRunningTests ? 'Testando...' : 'Executar Testes'}
          </Button>
          {lastTestTime && (
            <p className="text-sm text-muted-foreground">
              {lastTestTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* WebSocket Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
            {wsStats.connected ? 
              <Wifi className="h-4 w-4 text-green-500" /> : 
              <WifiOff className="h-4 w-4 text-red-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {wsStats.connected ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {wsStats.status}
            </p>
          </CardContent>
        </Card>

        {/* Mensagens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{wsStats.messages}</div>
            <p className="text-xs text-muted-foreground">
              Via WebSocket
            </p>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{notifStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {notifStats.unread} não lidas
            </p>
          </CardContent>
        </Card>

        {/* Instâncias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{wsStats.instances}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5" />
            Controles de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => evolutionWebhook.refreshStats()} 
              variant="outline"
              size="sm"
              disabled={!wsStats.connected}
            >
              <Activity className="w-4 h-4 mr-2" />
              Stats
            </Button>
            
            <Button 
              onClick={() => evolutionWebhook.pingServer()} 
              variant="outline"
              size="sm"
              disabled={!wsStats.connected}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Ping
            </Button>
            
            <Button 
              onClick={() => evolutionWebhook.clearMessages()} 
              variant="outline"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            
            <Button 
              onClick={() => notifications.clearNotifications()} 
              variant="outline"
              size="sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notif
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Mensagens Recentes ({wsStats.messages})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionWebhook.messages.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma mensagem recebida. As mensagens aparecerão aqui em tempo real.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {evolutionWebhook.messages.slice(0, 5).map((msg, index) => (
                  <div key={msg.id || index} className="border rounded p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {msg.instance}
                        </Badge>
                        <span className="font-medium text-sm">
                          {msg.pushName || msg.from.split('@')[0]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content.substring(0, 100)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Status das Instâncias */}
      {Object.keys(evolutionWebhook.instances).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Instâncias WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(evolutionWebhook.instances).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium text-sm">{name}</span>
                  <Badge 
                    variant={info.status === 'open' ? 'default' : 'secondary'}
                    className={info.status === 'open' ? 'bg-green-500' : ''}
                  >
                    {info.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TestEvolutionIntegration; 