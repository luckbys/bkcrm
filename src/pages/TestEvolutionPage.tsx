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

function TestEvolutionPage() {
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste de Integração Evolution API</h1>
          <p className="text-muted-foreground mt-1">
            Verificação completa da integração WhatsApp com Evolution API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={runTests} disabled={isRunningTests} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
            {isRunningTests ? 'Testando...' : 'Executar Testes'}
          </Button>
          {lastTestTime && (
            <p className="text-sm text-muted-foreground">
              Último teste: {lastTestTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold">
              {wsStats.connected ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
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
            <div className="text-2xl font-bold">{wsStats.messages}</div>
            <p className="text-xs text-muted-foreground">
              Recebidas via WebSocket
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
            <div className="text-2xl font-bold">{notifStats.total}</div>
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
            <div className="text-2xl font-bold">{wsStats.instances}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp conectadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Controles de Teste
          </CardTitle>
          <CardDescription>
            Execute testes individuais ou completos da integração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => evolutionWebhook.refreshStats()} 
              variant="outline"
              disabled={!wsStats.connected}
            >
              <Activity className="w-4 h-4 mr-2" />
              Atualizar Stats
            </Button>
            
            <Button 
              onClick={() => evolutionWebhook.pingServer()} 
              variant="outline"
              disabled={!wsStats.connected}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Ping Server
            </Button>
            
            <Button 
              onClick={() => evolutionWebhook.clearMessages()} 
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Limpar Mensagens
            </Button>
            
            <Button 
              onClick={() => notifications.clearNotifications()} 
              variant="outline"
            >
              <Bell className="w-4 h-4 mr-2" />
              Limpar Notificações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>
              Status detalhado de cada componente da integração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {renderStatusBadge(result.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagens Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens Recentes ({wsStats.messages})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionWebhook.messages.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma mensagem recebida ainda. As mensagens aparecerão aqui em tempo real quando chegarem via Evolution API.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {evolutionWebhook.messages.slice(0, 10).map((msg, index) => (
                  <div key={msg.id || index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {msg.instance}
                        </Badge>
                        <span className="font-medium text-sm">
                          {msg.pushName || msg.from}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {msg.messageType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Notificações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações do Sistema ({notifStats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.notifications.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma notificação ainda. O sistema gerará notificações automaticamente.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {notifications.notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-2 border rounded">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {notif.timestamp.toLocaleString()}
                      </span>
                    </div>
                    {!notif.read && (
                      <Badge variant="default" className="text-xs">Novo</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TestEvolutionPage; 