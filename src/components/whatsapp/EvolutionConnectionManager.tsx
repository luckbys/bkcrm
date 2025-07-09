import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Power,
  Eye,
  EyeOff,
  Copy,
  Download,
  Settings,
  Activity,
  Zap,
  Shield,
  Clock,
  Monitor,
  Phone,
  MessageSquare,
  QrCode,
  Smartphone,
  Link,
  Unlink,
  PlayCircle,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useEvolutionConnection } from '@/hooks/useEvolutionConnection';
import { evolutionApi } from '@/services/evolutionApi';
import { 
  GlassLoadingSpinner, 
  ConnectionLoadingSpinner, 
  ProgressLoadingSpinner,
  LoadingOverlay,
  FormLoadingSpinner
} from '@/components/ui/loading';

interface ConnectionStats {
  uptime: number;
  messagesProcessed: number;
  lastActivity: Date;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  responseTime: number;
  errorRate: number;
}

interface QRCodeData {
  code: string;
  base64: string;
  expiresAt: Date;
  attempts: number;
}

interface EvolutionConnectionManagerProps {
  instanceName: string;
  onStatusChange?: (status: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  showAdvancedOptions?: boolean;
}

export const EvolutionConnectionManager: React.FC<EvolutionConnectionManagerProps> = ({
  instanceName,
  onStatusChange,
  onConnect,
  onDisconnect,
  autoReconnect = true,
  showAdvancedOptions = false
}) => {
  const { toast } = useToast();
  const {
    state,
    connectInstance,
    disconnectInstance,
    monitorConnection,
    checkConnectionState
  } = useEvolutionConnection(instanceName);

  // Estados locais
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    uptime: 0,
    messagesProcessed: 0,
    lastActivity: new Date(),
    connectionQuality: 'good',
    responseTime: 0,
    errorRate: 0
  });
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [autoReconnectEnabled, setAutoReconnectEnabled] = useState(autoReconnect);
  const [connectionHistory, setConnectionHistory] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);

  // Refs para controle de intervalos
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrCodeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito para monitorar mudanças de status
  useEffect(() => {
    onStatusChange?.(state.status);
  }, [state.status, onStatusChange]);

  // Efeito para iniciar monitoramento quando conectado
  useEffect(() => {
    if (state.status === 'connected') {
      startStatsMonitoring();
      onConnect?.();
    } else {
      stopStatsMonitoring();
      if (state.status === 'disconnected') {
        onDisconnect?.();
      }
    }

    return () => {
      stopStatsMonitoring();
    };
  }, [state.status, onConnect, onDisconnect]);

  // Efeito para reconexão automática
  useEffect(() => {
    if (autoReconnectEnabled && state.status === 'disconnected' && state.error) {
      startAutoReconnect();
    } else {
      stopAutoReconnect();
    }

    return () => {
      stopAutoReconnect();
    };
  }, [autoReconnectEnabled, state.status, state.error]);

  // Funções de conexão
  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      console.log(`🔌 Iniciando conexão para ${instanceName}...`);

      // Limpar QR Code anterior
      setQRCodeData(null);
      setShowQRCode(false);

      // Conectar instância
      await connectInstance();

      // Buscar QR Code se necessário
      if (state.status === 'qr_code' || state.status === 'connecting') {
        await fetchQRCode();
      }

      // Adicionar ao histórico
      addToConnectionHistory('connect_attempt', 'Tentativa de conexão iniciada');

      toast({
        title: "Conectando...",
        description: "Iniciando conexão com a instância WhatsApp",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Erro na conexão:', error);
      
      addToConnectionHistory('connect_error', error.message);
      
      toast({
        title: "Erro na Conexão",
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsConnecting(false);
    }
  }, [instanceName, connectInstance, state.status]);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log(`🔌 Desconectando ${instanceName}...`);
      
      // Parar monitoramento
      stopStatsMonitoring();
      stopAutoReconnect();
      
      // Desconectar instância
      await disconnectInstance();
      
      // Limpar dados
      setQRCodeData(null);
      setShowQRCode(false);
      setReconnectAttempts(0);
      
      // Adicionar ao histórico
      addToConnectionHistory('disconnect', 'Desconexão manual');
      
      toast({
        title: "Desconectado",
        description: "Instância WhatsApp desconectada com sucesso",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Erro na desconexão:', error);
      
      toast({
        title: "Erro na Desconexão",
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
    }
  }, [instanceName, disconnectInstance]);

  // Funções para QR Code
  const fetchQRCode = useCallback(async () => {
    try {
      console.log(`📱 Buscando QR Code para ${instanceName}...`);
      
      const qrCode = await evolutionApi.getInstanceQRCode(instanceName);
      
      if (qrCode) {
        const qrData: QRCodeData = {
          code: qrCode,
          base64: qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`,
          expiresAt: new Date(Date.now() + 45000), // 45 segundos
          attempts: (qrCodeData?.attempts || 0) + 1
        };
        
        setQRCodeData(qrData);
        setShowQRCode(true);
        
        // Atualizar QR Code automaticamente
        startQRCodeRefresh();
        
        addToConnectionHistory('qr_code_generated', 'QR Code gerado');
        
        toast({
          title: "QR Code Gerado",
          description: "Escaneie o QR Code no WhatsApp para conectar",
          duration: 5000
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar QR Code:', error);
      
      toast({
        title: "Erro no QR Code",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [instanceName, qrCodeData?.attempts]);

  const startQRCodeRefresh = useCallback(() => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
    }
    
    qrCodeIntervalRef.current = setInterval(() => {
      if (state.status === 'qr_code' || state.status === 'connecting') {
        fetchQRCode();
      } else {
        stopQRCodeRefresh();
      }
    }, 45000); // Atualizar a cada 45 segundos
  }, [state.status, fetchQRCode]);

  const stopQRCodeRefresh = useCallback(() => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
      qrCodeIntervalRef.current = null;
    }
  }, []);

  // Funções de reconexão automática
  const startAutoReconnect = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Backoff exponencial, max 30s
    
    console.log(`🔄 Reagendando reconexão em ${delay / 1000}s (tentativa ${reconnectAttempts + 1})`);
    
    reconnectIntervalRef.current = setTimeout(async () => {
      if (autoReconnectEnabled && state.status === 'disconnected') {
        setIsReconnecting(true);
        setReconnectAttempts(prev => prev + 1);
        
        try {
          await handleConnect();
          setReconnectAttempts(0); // Reset em caso de sucesso
        } catch (error) {
          console.error('❌ Falha na reconexão:', error);
        } finally {
          setIsReconnecting(false);
        }
      }
    }, delay);
  }, [reconnectAttempts, autoReconnectEnabled, state.status, handleConnect]);

  const stopAutoReconnect = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
  }, []);

  // Funções de monitoramento
  const startStatsMonitoring = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
    
    statsIntervalRef.current = setInterval(async () => {
      try {
        const startTime = Date.now();
        const status = await evolutionApi.getInstanceStatus(instanceName);
        const responseTime = Date.now() - startTime;
        
        setConnectionStats(prev => ({
          ...prev,
          uptime: prev.uptime + 5000, // Incrementar 5 segundos
          lastActivity: new Date(),
          responseTime,
          connectionQuality: getConnectionQuality(responseTime, prev.errorRate)
        }));
        
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
        
        setConnectionStats(prev => ({
          ...prev,
          errorRate: prev.errorRate + 1,
          connectionQuality: 'poor'
        }));
      }
    }, 5000); // Atualizar a cada 5 segundos
  }, [instanceName]);

  const stopStatsMonitoring = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  }, []);

  // Funções de diagnóstico
  const runDiagnostics = useCallback(async () => {
    setShowDiagnostics(true);
    setDiagnostics([]);
    
    const diagnosticResults = [];
    
    try {
      // Teste 1: Conectividade básica
      diagnosticResults.push({
        test: 'Conectividade Evolution API',
        status: 'testing',
        message: 'Verificando conectividade...'
      });
      
      const healthCheck = await evolutionApi.checkHealth();
      diagnosticResults[0] = {
        test: 'Conectividade Evolution API',
        status: healthCheck.status === 'ok' ? 'success' : 'warning',
        message: healthCheck.status === 'ok' ? 'Conectividade OK' : 'Conectividade com problemas'
      };
      
      // Teste 2: Status da instância
      diagnosticResults.push({
        test: 'Status da Instância',
        status: 'testing',
        message: 'Verificando status...'
      });
      
      const instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
      diagnosticResults[1] = {
        test: 'Status da Instância',
        status: instanceStatus.status === 'open' ? 'success' : 'warning',
        message: `Status: ${instanceStatus.status}`
      };
      
      // Teste 3: Configuração de webhook
      diagnosticResults.push({
        test: 'Configuração Webhook',
        status: 'testing',
        message: 'Verificando webhook...'
      });
      
      try {
        const webhookConfig = await evolutionApi.getInstanceWebhook(instanceName);
        diagnosticResults[2] = {
          test: 'Configuração Webhook',
          status: webhookConfig.enabled ? 'success' : 'warning',
          message: webhookConfig.enabled ? 'Webhook configurado' : 'Webhook desabilitado'
        };
      } catch (error) {
        diagnosticResults[2] = {
          test: 'Configuração Webhook',
          status: 'error',
          message: 'Webhook não configurado'
        };
      }
      
      setDiagnostics(diagnosticResults);
      
    } catch (error: any) {
      console.error('❌ Erro nos diagnósticos:', error);
      
      setDiagnostics([
        {
          test: 'Diagnóstico Geral',
          status: 'error',
          message: `Erro: ${error.message}`
        }
      ]);
    }
  }, [instanceName]);

  // Funções utilitárias
  const getConnectionQuality = (responseTime: number, errorRate: number): ConnectionStats['connectionQuality'] => {
    if (errorRate > 5) return 'poor';
    if (responseTime > 3000) return 'fair';
    if (responseTime > 1000) return 'good';
    return 'excellent';
  };

  const addToConnectionHistory = (type: string, message: string) => {
    setConnectionHistory(prev => [
      {
        id: Date.now(),
        type,
        message,
        timestamp: new Date()
      },
      ...prev.slice(0, 49) // Manter apenas últimos 50 registros
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-blue-600';
      case 'qr_code': return 'text-orange-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'connecting': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'qr_code': return <QrCode className="w-5 h-5 text-orange-600" />;
      case 'disconnected': return <WifiOff className="w-5 h-5 text-red-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Monitor className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'qr_code': return 'QR Code Gerado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para área de transferência",
      duration: 2000
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Principal */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                {getStatusIcon(state.status)}
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {instanceName}
              </h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <span className={cn("font-medium", getStatusColor(state.status))}>
                  {getStatusText(state.status)}
                </span>
                {state.status === 'connected' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Activity className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                )}
                {isReconnecting && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Reconectando...
                  </Badge>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Controles principais */}
            {state.status === 'disconnected' || state.status === 'error' ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Conectar
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="px-6"
              >
                <Power className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            )}
            
            <Button
              onClick={runDiagnostics}
              variant="outline"
              className="border-gray-300 hover:border-gray-400"
            >
              <Activity className="w-4 h-4 mr-2" />
              Diagnosticar
            </Button>
            
            {showAdvancedOptions && (
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="outline"
                className="border-gray-300 hover:border-gray-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Avançado
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Principal */}
      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-1">
          <TabsTrigger value="connection" className="data-[state=active]:bg-white/20">
            <Link className="w-4 h-4 mr-2" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="data-[state=active]:bg-white/20">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
            <Activity className="w-4 h-4 mr-2" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo: Conexão */}
        <TabsContent value="connection" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status da Conexão */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5" />
                  <span>Status da Conexão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(state.status)}
                    <span className={cn("font-medium", getStatusColor(state.status))}>
                      {getStatusText(state.status)}
                    </span>
                  </div>
                </div>
                
                {state.status === 'connected' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-medium">{formatUptime(connectionStats.uptime)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Qualidade:</span>
                      <Badge 
                        variant={connectionStats.connectionQuality === 'excellent' ? 'default' : 'secondary'}
                        className={cn(
                          connectionStats.connectionQuality === 'excellent' && 'bg-green-500 text-white',
                          connectionStats.connectionQuality === 'good' && 'bg-blue-500 text-white',
                          connectionStats.connectionQuality === 'fair' && 'bg-yellow-500 text-white',
                          connectionStats.connectionQuality === 'poor' && 'bg-red-500 text-white'
                        )}
                      >
                        {connectionStats.connectionQuality === 'excellent' && 'Excelente'}
                        {connectionStats.connectionQuality === 'good' && 'Boa'}
                        {connectionStats.connectionQuality === 'fair' && 'Regular'}
                        {connectionStats.connectionQuality === 'poor' && 'Ruim'}
                      </Badge>
                    </div>
                  </>
                )}
                
                {state.error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Conexão</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Configurações de Reconexão */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Reconexão Automática</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Habilitada:</span>
                  <Switch
                    checked={autoReconnectEnabled}
                    onCheckedChange={setAutoReconnectEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tentativas:</span>
                  <span className="font-medium">{reconnectAttempts}</span>
                </div>
                
                {isReconnecting && (
                  <div className="space-y-4">
                    <ConnectionLoadingSpinner step="Reconectando instância..." />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo: QR Code */}
        <TabsContent value="qrcode" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>QR Code para Conexão</span>
                </CardTitle>
                <CardDescription>
                  Escaneie este QR Code no WhatsApp para conectar a instância
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrCodeData && showQRCode ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-xl shadow-lg">
                        <img 
                          src={qrCodeData.base64} 
                          alt="QR Code WhatsApp" 
                          className="w-64 h-64 object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Tentativa: {qrCodeData.attempts}</span>
                      <span>Expira em: {Math.max(0, Math.ceil((qrCodeData.expiresAt.getTime() - Date.now()) / 1000))}s</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={fetchQRCode}
                        variant="outline"
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                      </Button>
                      <Button 
                        onClick={() => copyToClipboard(qrCodeData.code)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {isConnecting ? (
                      <GlassLoadingSpinner size="md" className="mb-4" />
                    ) : (
                      <>
                        <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">Nenhum QR Code disponível</p>
                        <Button 
                          onClick={fetchQRCode}
                          variant="outline"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Gerar QR Code
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5" />
                  <span>Como Conectar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <p className="font-medium">Abra o WhatsApp</p>
                      <p className="text-sm text-gray-600">No seu smartphone</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <p className="font-medium">Vá para Configurações</p>
                      <p className="text-sm text-gray-600">Toque nos três pontos → Aparelhos conectados</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <p className="font-medium">Conectar um aparelho</p>
                      <p className="text-sm text-gray-600">Toque em "Conectar um aparelho"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <p className="font-medium">Escaneie o QR Code</p>
                      <p className="text-sm text-gray-600">Aponte a câmera para o QR Code acima</p>
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Dica</AlertTitle>
                  <AlertDescription>
                    O QR Code expira em 45 segundos. Clique em "Atualizar" se necessário.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo: Estatísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Métricas de Performance */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tempo de Resposta</span>
                  <span className="font-medium">{connectionStats.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxa de Erro</span>
                  <span className="font-medium">{connectionStats.errorRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Última Atividade</span>
                  <span className="font-medium text-sm">
                    {connectionStats.lastActivity.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Uso */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mensagens</span>
                  <span className="font-medium">{connectionStats.messagesProcessed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-medium">{formatUptime(connectionStats.uptime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reconexões</span>
                  <span className="font-medium">{reconnectAttempts}</span>
                </div>
              </CardContent>
            </Card>

            {/* Qualidade da Conexão */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Qualidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Conexão</span>
                    <Badge 
                      variant={connectionStats.connectionQuality === 'excellent' ? 'default' : 'secondary'}
                      className={cn(
                        connectionStats.connectionQuality === 'excellent' && 'bg-green-500 text-white',
                        connectionStats.connectionQuality === 'good' && 'bg-blue-500 text-white',
                        connectionStats.connectionQuality === 'fair' && 'bg-yellow-500 text-white',
                        connectionStats.connectionQuality === 'poor' && 'bg-red-500 text-white'
                      )}
                    >
                      {connectionStats.connectionQuality === 'excellent' && 'Excelente'}
                      {connectionStats.connectionQuality === 'good' && 'Boa'}
                      {connectionStats.connectionQuality === 'fair' && 'Regular'}
                      {connectionStats.connectionQuality === 'poor' && 'Ruim'}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={
                      connectionStats.connectionQuality === 'excellent' ? 100 :
                      connectionStats.connectionQuality === 'good' ? 75 :
                      connectionStats.connectionQuality === 'fair' ? 50 : 25
                    } 
                    className="h-2"
                  />
                </div>
                
                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Estável</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo: Histórico */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Histórico de Conexões</span>
              </CardTitle>
              <CardDescription>
                Registro das últimas atividades da instância
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {connectionHistory.length > 0 ? (
                  connectionHistory.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          entry.type === 'connect_attempt' && "bg-blue-500",
                          entry.type === 'connect_success' && "bg-green-500",
                          entry.type === 'connect_error' && "bg-red-500",
                          entry.type === 'disconnect' && "bg-yellow-500",
                          entry.type === 'qr_code_generated' && "bg-purple-500"
                        )} />
                        <span className="font-medium">{entry.message}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Diagnósticos */}
      {showDiagnostics && (
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Diagnósticos do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnostics.map((diagnostic, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    {diagnostic.status === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {diagnostic.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {diagnostic.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {diagnostic.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-medium">{diagnostic.test}</span>
                  </div>
                  <span className={cn(
                    "text-sm",
                    diagnostic.status === 'success' && "text-green-600",
                    diagnostic.status === 'warning' && "text-yellow-600",
                    diagnostic.status === 'error' && "text-red-600",
                    diagnostic.status === 'testing' && "text-blue-600"
                  )}>
                    {diagnostic.message}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button 
                onClick={() => setShowDiagnostics(false)} 
                variant="outline"
                className="w-full"
              >
                Fechar Diagnósticos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvolutionConnectionManager; 