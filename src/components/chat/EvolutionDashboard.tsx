import React, { useEffect, useState, useCallback } from 'react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { evolutionApi, HealthCheckResponse, StatsResponse, EvolutionInstance } from '@/services/evolutionApi.';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Smartphone, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Send,
  QrCode,
  Server,
  Users,
  Clock,
  MemoryStick,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticsData {
  health: HealthCheckResponse | null;
  stats: StatsResponse | null;
  instances: EvolutionInstance[];
  websocketStats: any;
}

export function EvolutionDashboard() {
  const {
    isConnected,
    connectionStatus,
    messages,
    instances,
    qrCodes,
    stats: websocketStats,
    joinInstance,
    refreshStats,
    clearMessages
  } = useEvolutionWebhook();

  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({
    health: null,
    stats: null,
    instances: [],
    websocketStats: null
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando dados Evolution API...');
      
      const diagnosticsData = await evolutionApi.runDiagnostics();
      setDiagnostics(diagnosticsData);
      setLastUpdate(new Date());
      
      console.log('✅ Dados carregados com sucesso:', diagnosticsData);
      toast.success('Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar mensagem de teste
  const sendTestMessage = useCallback(async () => {
    try {
      const result = await evolutionApi.testSendMessage();

      if (result.success) {
        toast.success(`Mensagem teste enviada! ID: ${result.messageId}`);
      } else {
        toast.error(`Erro ao enviar: ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem teste:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }, []);

  // Verificar instância Evolution
  const checkInstance = useCallback(async () => {
    try {
      const result = await evolutionApi.checkEvolutionInstance();
      
      toast.success(`Instância verificada: ${result.status || 'OK'}`);
      console.log('📊 Status da instância:', result);
    } catch (error: any) {
      console.error('❌ Erro ao verificar instância:', error);
      toast.error(`Erro ao verificar instância: ${error.message}`);
    }
  }, []);

  // Conectar à instância padrão
  const connectToDefaultInstance = useCallback(() => {
    const defaultInstance = 'atendimento-ao-cliente-suporte';
    joinInstance(defaultInstance);
    toast.info(`Conectando à instância: ${defaultInstance}`);
  }, [joinInstance]);

  // Limpar mensagens
  const handleClearMessages = useCallback(() => {
    clearMessages();
    toast.info('Mensagens limpas!');
  }, [clearMessages]);

  // Auto-load inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status da conexão WebSocket
  const getConnectionBadge = () => {
    if (isConnected) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <Wifi className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Desconectado
        </Badge>
      );
    }
  };

  // Formatação de bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatação de tempo
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evolution API Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor e gerencie a integração WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getConnectionBadge()}
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString()}
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
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isConnected ? 'Online' : 'Offline'}</div>
            <p className="text-xs text-muted-foreground">
              {connectionStatus}
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
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 100 mensagens
            </p>
          </CardContent>
        </Card>

        {/* Instâncias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(instances).length}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp conectadas
            </p>
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(qrCodes).length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando conexão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Controles Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={loadData} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Atualizar Dados'}
            </Button>
            
            <Button onClick={sendTestMessage} variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Enviar Teste
            </Button>
            
            <Button onClick={checkInstance} variant="outline">
              <Server className="w-4 h-4 mr-2" />
              Verificar Instância
            </Button>
            
            <Button onClick={connectToDefaultInstance} variant="outline">
              <Smartphone className="w-4 h-4 mr-2" />
              Conectar Instância
            </Button>
            
            <Button onClick={handleClearMessages} variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Limpar Mensagens
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Estatísticas do Sistema
          </CardTitle>
          <CardDescription>
            Métricas de desempenho do servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Uptime */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uptime</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {diagnostics.stats?.server?.uptime ? formatUptime(diagnostics.stats.server.uptime) : 'Carregando...'}
            </div>
          </div>
          
          {/* Memory Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uso de Memória</span>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Heap Usado</span>
                <span>{diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.heapUsed) : 'Carregando...'}</span>
              </div>
              <Progress 
                value={diagnostics.stats?.server?.memory 
                  ? (diagnostics.stats.server.memory.heapUsed / diagnostics.stats.server.memory.heapTotal) * 100 
                  : 0
                } 
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total: {diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.heapTotal) : 'Carregando...'}</span>
                <span>RSS: {diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.rss) : 'Carregando...'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes */}
      {Object.keys(qrCodes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Codes para Conexão
            </CardTitle>
            <CardDescription>
              Escaneie com o WhatsApp para conectar as instâncias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(qrCodes).map(([instance, qr]) => (
                <div key={instance} className="text-center space-y-2">
                  <h4 className="font-medium">{instance}</h4>
                  <div className="border rounded-lg p-4 bg-white">
                    <img 
                      src={qr} 
                      alt={`QR Code ${instance}`} 
                      className="w-full max-w-[200px] mx-auto" 
                    />
                  </div>
                  <Badge variant="outline">Aguardando conexão</Badge>
            </div>
          ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status das Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status das Instâncias WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(instances).length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma instância conectada. Use os controles acima para conectar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {Object.entries(instances).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        Última atualização: {info.lastUpdate.toLocaleString()}
                      </p>
        </div>
      </div>
                  <Badge 
                    variant={info.status === 'open' ? 'default' : 'secondary'}
                    className={info.status === 'open' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {info.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens Recentes ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma mensagem recebida ainda. As mensagens aparecerão aqui em tempo real.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {messages.map((msg, index) => (
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
    </div>
  );
} 