import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  QrCode, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Power,
  PowerOff,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Download,
  Phone,
  MessageSquare,
  Wifi,
  WifiOff,
  TestTube,
  Zap,
  Shield,
  Activity,
  PlayCircle,
  StopCircle,
  FileBarChart,
  Wrench,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppSetupWizard } from './WhatsAppSetupWizard';
import { useInstanceTesting } from '@/hooks/useInstanceTesting';

// Interfaces da Evolution API
interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: 'open' | 'close' | 'connecting' | 'qrcode';
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

interface InstanceInfo {
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'qrcode';
  profileName?: string;
  profilePicUrl?: string;
  phone?: string;
  connectedAt?: Date;
  lastSeen?: Date;
  version?: string;
  platform?: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface InstanceStats {
  messagesReceived: number;
  messagesSent: number;
  contactsCount: number;
  chatsCount: number;
  uptime?: number;
}

interface EvolutionInstanceManagerProps {
  onInstanceSelect?: (instanceName: string) => void;
  selectedInstance?: string;
  className?: string;
}

export const EvolutionInstanceManager: React.FC<EvolutionInstanceManagerProps> = ({
  onInstanceSelect,
  selectedInstance,
  className
}) => {
  const [instances, setInstances] = useState<Map<string, InstanceInfo>>(new Map());
  const [instanceStats, setInstanceStats] = useState<Map<string, InstanceStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [refreshingInstances, setRefreshingInstances] = useState<Set<string>>(new Set());
  const [showQrCode, setShowQrCode] = useState<Map<string, boolean>>(new Map());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('instances');
  const [testingInstance, setTestingInstance] = useState<string | null>(null);
  const [selectedInstanceForDetails, setSelectedInstanceForDetails] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Hook de testes
  const {
    isRunning: isTestRunning,
    currentSuite,
    testHistory,
    runFullTestSuite,
    runQuickHealthCheck,
    stopTesting,
    getTestRecommendations,
    getTroubleshootingSteps,
    isMonitoring,
    startContinuousMonitoring,
    stopContinuousMonitoring
  } = useInstanceTesting();

  // URL base da Evolution API
  const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
  const API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

  // Headers para requisições
  const apiHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'apikey': API_KEY
  }), [API_KEY]);

  // Buscar instâncias existentes
  const fetchInstances = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: apiHeaders
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const instancesMap = new Map<string, InstanceInfo>();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.instance) {
            instancesMap.set(item.instance.instanceName, {
              instanceName: item.instance.instanceName,
              status: item.instance.status,
              profileName: item.instance.profileName,
              profilePicUrl: item.instance.profilePicUrl,
              phone: item.instance.phone,
              connectedAt: item.instance.connectedAt ? new Date(item.instance.connectedAt) : undefined,
              lastSeen: item.instance.lastSeen ? new Date(item.instance.lastSeen) : undefined,
              version: item.instance.version,
              platform: item.instance.platform,
              batteryLevel: item.instance.batteryLevel,
              isCharging: item.instance.isCharging
            });
          }
        });
      }

      setInstances(instancesMap);
      
      toast({
        title: "✅ Instâncias carregadas",
        description: `${instancesMap.size} instâncias encontradas`
      });

    } catch (error: any) {
      console.error('Erro ao buscar instâncias:', error);
      toast({
        title: "❌ Erro ao buscar instâncias",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiHeaders, EVOLUTION_API_URL, toast]);

  // Criar nova instância
  const createInstance = useCallback(async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "⚠️ Nome obrigatório",
        description: "Por favor, digite um nome para a instância",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          instanceName: newInstanceName.trim(),
          token: API_KEY,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "✅ Instância criada",
        description: `Instância "${newInstanceName}" criada com sucesso`
      });

      setNewInstanceName('');
      setShowCreateDialog(false);
      
      // Recarregar instâncias
      await fetchInstances();
      
      // Se a instância foi criada com QR code, mostrá-lo
      if (data.qrcode) {
        setQrCodes(prev => new Map(prev.set(newInstanceName, data.qrcode.base64)));
        setShowQrCode(prev => new Map(prev.set(newInstanceName, true)));
      }

    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "❌ Erro ao criar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [newInstanceName, apiHeaders, EVOLUTION_API_URL, API_KEY, toast, fetchInstances]);

  // Conectar instância
  const connectInstance = useCallback(async (instanceName: string) => {
    setRefreshingInstances(prev => new Set(prev.add(instanceName)));
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: apiHeaders
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.qrcode) {
        setQrCodes(prev => new Map(prev.set(instanceName, data.qrcode.base64)));
        setShowQrCode(prev => new Map(prev.set(instanceName, true)));
        
        toast({
          title: "📱 QR Code gerado",
          description: `Escaneie o QR Code para conectar "${instanceName}"`
        });
      }

      // Atualizar status da instância
      await fetchInstances();

    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "❌ Erro ao conectar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRefreshingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceName);
        return newSet;
      });
    }
  }, [apiHeaders, EVOLUTION_API_URL, toast, fetchInstances]);

  // Desconectar instância
  const disconnectInstance = useCallback(async (instanceName: string) => {
    setRefreshingInstances(prev => new Set(prev.add(instanceName)));
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: apiHeaders
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "✅ Instância desconectada",
        description: `"${instanceName}" foi desconectada`
      });

      // Remover QR code
      setQrCodes(prev => {
        const newMap = new Map(prev);
        newMap.delete(instanceName);
        return newMap;
      });

      // Atualizar status
      await fetchInstances();

    } catch (error: any) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: "❌ Erro ao desconectar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRefreshingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceName);
        return newSet;
      });
    }
  }, [apiHeaders, EVOLUTION_API_URL, toast, fetchInstances]);

  // Excluir instância
  const deleteInstance = useCallback(async (instanceName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a instância "${instanceName}"?`)) {
      return;
    }

    setRefreshingInstances(prev => new Set(prev.add(instanceName)));
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: apiHeaders
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "✅ Instância excluída",
        description: `"${instanceName}" foi excluída`
      });

      // Remover do estado local
      setInstances(prev => {
        const newMap = new Map(prev);
        newMap.delete(instanceName);
        return newMap;
      });

      setQrCodes(prev => {
        const newMap = new Map(prev);
        newMap.delete(instanceName);
        return newMap;
      });

    } catch (error: any) {
      console.error('Erro ao excluir instância:', error);
      toast({
        title: "❌ Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRefreshingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceName);
        return newSet;
      });
    }
  }, [apiHeaders, EVOLUTION_API_URL, toast]);

  // Obter status da instância
  const getInstanceStatus = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'Conectado',
          color: 'bg-green-500',
          icon: CheckCircle,
          variant: 'default' as const
        };
      case 'close':
        return {
          label: 'Desconectado',
          color: 'bg-red-500',
          icon: XCircle,
          variant: 'destructive' as const
        };
      case 'connecting':
        return {
          label: 'Conectando',
          color: 'bg-yellow-500',
          icon: Loader2,
          variant: 'secondary' as const
        };
      case 'qrcode':
        return {
          label: 'Aguardando QR',
          color: 'bg-blue-500',
          icon: QrCode,
          variant: 'secondary' as const
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gray-500',
          icon: AlertCircle,
          variant: 'secondary' as const
        };
    }
  }, []);

  // Copiar texto
  const copyToClipboard = useCallback(async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado",
        description: `${description} copiado para área de transferência`
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  }, [toast]);

  // Executar testes em uma instância
  const runInstanceTests = useCallback(async (instanceName: string) => {
    const instance = instances.get(instanceName);
    if (!instance) return;

    setTestingInstance(instanceName);

    const testConfig = {
      instanceName,
      apiUrl: EVOLUTION_API_URL,
      apiKey: API_KEY,
      webhookUrl: `${window.location.origin}/api/webhook/evolution`,
      enableDestructiveTests: false, // Não enviar mensagens de teste por padrão
      timeout: 30000
    };

    try {
      const suite = await runFullTestSuite(testConfig);
      
      toast({
        title: suite.status === 'success' ? "✅ Testes aprovados" : "⚠️ Problemas encontrados",
        description: `${suite.successCount} sucessos, ${suite.errorCount} erros`,
        variant: suite.status === 'error' ? 'destructive' : 'default'
      });

    } catch (error: any) {
      toast({
        title: "❌ Erro nos testes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingInstance(null);
    }
  }, [instances, EVOLUTION_API_URL, API_KEY, runFullTestSuite, toast]);

  // Executar verificação rápida
  const runQuickCheck = useCallback(async (instanceName: string) => {
    const testConfig = {
      instanceName,
      apiUrl: EVOLUTION_API_URL,
      apiKey: API_KEY,
      webhookUrl: `${window.location.origin}/api/webhook/evolution`,
      enableDestructiveTests: false,
      timeout: 10000
    };

    try {
      const results = await runQuickHealthCheck(testConfig);
      const hasErrors = results.some(r => r.status === 'error');
      
      toast({
        title: hasErrors ? "⚠️ Problemas detectados" : "✅ Instância saudável",
        description: `Verificação rápida concluída`,
        variant: hasErrors ? 'destructive' : 'default'
      });

    } catch (error: any) {
      toast({
        title: "❌ Erro na verificação",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [EVOLUTION_API_URL, API_KEY, runQuickHealthCheck, toast]);

  // Obter recomendações para uma instância
  const getInstanceRecommendations = useCallback((instanceName: string) => {
    const instance = instances.get(instanceName);
    if (!instance) return [];

    // Recomendações baseadas no status
    const recommendations: string[] = [];

    if (instance.status === 'close') {
      recommendations.push('📱 Conecte a instância escaneando o QR Code');
      recommendations.push('🔄 Verifique se o WhatsApp no telefone está funcionando');
    } else if (instance.status === 'connecting') {
      recommendations.push('⏳ Aguarde a conexão ser estabelecida');
    } else if (instance.status === 'open') {
      recommendations.push('✅ Instância funcionando corretamente');
      
      if (!instance.phone) {
        recommendations.push('📞 Número do telefone não detectado - verifique a conexão');
      }
      
      if (instance.batteryLevel && instance.batteryLevel < 20) {
        recommendations.push('🔋 Bateria baixa - conecte o carregador');
      }
    }

    return recommendations;
  }, [instances]);

  // Auto-refresh das instâncias
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchInstances();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchInstances]);

  // Carregar instâncias na inicialização
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Gerenciador de Instâncias WhatsApp
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "text-green-600" : "text-gray-600"}
                title={autoRefresh ? "Auto-refresh ativo" : "Auto-refresh inativo"}
              >
                {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInstances}
                disabled={isLoading}
                title="Atualizar instâncias"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowWizard(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Nova Instância
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instances" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Instâncias ({instances.size})
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Testes
                {isTestRunning && <Loader2 className="h-3 w-3 animate-spin" />}
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Monitoramento
                {isMonitoring && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </TabsTrigger>
            </TabsList>

            {/* Aba de Instâncias */}
            <TabsContent value="instances" className="mt-4">
        {instances.size === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma instância encontrada</p>
            <p className="text-sm">Crie uma nova instância para começar</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {Array.from(instances.entries()).map(([instanceName, info]) => {
                const statusInfo = getInstanceStatus(info.status);
                const StatusIcon = statusInfo.icon;
                const isRefreshing = refreshingInstances.has(instanceName);
                const hasQrCode = qrCodes.has(instanceName);
                const showQr = showQrCode.get(instanceName) && hasQrCode;
                
                return (
                  <Card 
                    key={instanceName} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInstance === instanceName ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => onInstanceSelect?.(instanceName)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color === 'bg-yellow-500' || statusInfo.color === 'bg-blue-500' ? 'animate-pulse' : ''}`} />
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-medium">{instanceName}</h4>
                            {info.profileName && (
                              <p className="text-sm text-muted-foreground">{info.profileName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {info.status === 'open' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                disconnectInstance(instanceName);
                              }}
                              disabled={isRefreshing}
                              className="h-8 w-8"
                              title="Desconectar"
                            >
                              <PowerOff className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {(info.status === 'close' || info.status === 'qrcode') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                connectInstance(instanceName);
                              }}
                              disabled={isRefreshing}
                              className="h-8 w-8"
                              title="Conectar"
                            >
                              {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                            </Button>
                          )}
                          
                          {hasQrCode && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowQrCode(prev => new Map(prev.set(instanceName, !showQr)));
                              }}
                              className="h-8 w-8"
                              title={showQr ? "Ocultar QR Code" : "Mostrar QR Code"}
                            >
                              {showQr ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteInstance(instanceName);
                            }}
                            disabled={isRefreshing}
                            className="h-8 w-8 hover:text-red-600"
                            title="Excluir instância"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Informações detalhadas */}
                      {info.phone && (
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{info.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(info.phone!, 'Número');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {info.batteryLevel && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Bateria: {info.batteryLevel}%</span>
                              {info.isCharging && <span>⚡</span>}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* QR Code */}
                      {showQr && (
                        <div className="mt-4 p-4 border rounded-lg text-center bg-white">
                          <h5 className="font-medium mb-2">Escaneie o QR Code</h5>
                          <img 
                            src={qrCodes.get(instanceName)} 
                            alt="QR Code" 
                            className="max-w-full h-auto mx-auto"
                            style={{ maxHeight: '200px' }}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Use o WhatsApp para escanear este código
                          </p>
                        </div>
                      )}
                      
                      {info.status === 'qrcode' && !showQr && (
                        <Alert>
                          <QrCode className="h-4 w-4" />
                          <AlertDescription>
                            QR Code disponível. Clique no ícone do olho para visualizar.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {/* Rodapé com informações */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{instances.size} instância(s) • Evolution API</span>
            <span>Auto-refresh: {autoRefresh ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 