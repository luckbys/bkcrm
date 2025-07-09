import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Smartphone,
  QrCode,
  Link,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  HelpCircle,
  ExternalLink,
  Copy,
  Download,
  Settings,
  Wifi,
  Server,
  Activity,
  Eye,
  EyeOff,
  Lightbulb,
  Target,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedEvolutionConnection } from '@/hooks/useEnhancedEvolutionConnection';
import { evolutionConnectionMonitor } from '@/services/whatsapp/EvolutionConnectionMonitor';
import { 
  GlassLoadingSpinner, 
  ConnectionLoadingSpinner, 
  ProgressLoadingSpinner,
  ButtonLoadingSpinner,
  ContextualLoadingSpinner
} from '@/components/ui/loading';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  canSkip?: boolean;
  validation?: () => boolean | Promise<boolean>;
}

interface WhatsAppConnectionWizardProps {
  instanceName?: string;
  onComplete?: (instanceName: string, success: boolean) => void;
  onCancel?: () => void;
  autoStart?: boolean;
  showAdvancedOptions?: boolean;
}

export const WhatsAppConnectionWizard: React.FC<WhatsAppConnectionWizardProps> = ({
  instanceName: initialInstanceName,
  onComplete,
  onCancel,
  autoStart = false,
  showAdvancedOptions = false
}) => {
  const { toast } = useToast();

  // Estados principais
  const [currentStep, setCurrentStep] = useState(0);
  const [instanceName, setInstanceName] = useState(initialInstanceName || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepErrors, setStepErrors] = useState<Map<number, string>>(new Map());
  const [wizardData, setWizardData] = useState<any>({});
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Hook de conexão
  const {
    state,
    connectInstance,
    generateQRCode,
    runDiagnostics,
    checkConnectionState
  } = useEnhancedEvolutionConnection(instanceName);

  // Etapas do wizard
  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo',
      description: 'Vamos conectar sua instância WhatsApp',
      icon: <Smartphone className="w-6 h-6" />,
      component: <WelcomeStep />,
      canSkip: false
    },
    {
      id: 'configuration',
      title: 'Configuração',
      description: 'Configure sua instância',
      icon: <Settings className="w-6 h-6" />,
      component: <ConfigurationStep />,
      validation: () => instanceName.trim().length > 0
    },
    {
      id: 'diagnostics',
      title: 'Diagnósticos',
      description: 'Verificar sistema',
      icon: <Activity className="w-6 h-6" />,
      component: <DiagnosticsStep />
    },
    {
      id: 'connection',
      title: 'Conexão',
      description: 'Conectar instância',
      icon: <Link className="w-6 h-6" />,
      component: <ConnectionStep />
    },
    {
      id: 'qrcode',
      title: 'QR Code',
      description: 'Escanear no WhatsApp',
      icon: <QrCode className="w-6 h-6" />,
      component: <QRCodeStep />
    },
    {
      id: 'verification',
      title: 'Verificação',
      description: 'Confirmar conexão',
      icon: <CheckCircle className="w-6 h-6" />,
      component: <VerificationStep />
    },
    {
      id: 'complete',
      title: 'Concluído',
      description: 'Conexão estabelecida',
      icon: <Check className="w-6 h-6" />,
      component: <CompleteStep />
    }
  ];

  // Efeitos
  useEffect(() => {
    if (autoStart) {
      handleNext();
    }
  }, [autoStart]);

  useEffect(() => {
    // Monitorar mudanças no estado de conexão
    updateConnectionProgress();
  }, [state.status]);

  // Função para atualizar progresso
  const updateConnectionProgress = () => {
    switch (state.status) {
      case 'disconnected':
        setConnectionProgress(0);
        break;
      case 'connecting':
        setConnectionProgress(25);
        break;
      case 'qr_code':
        setConnectionProgress(50);
        setShowQRCode(true);
        break;
      case 'connected':
        setConnectionProgress(100);
        setShowQRCode(false);
        break;
      default:
        break;
    }
  };

  // Navegação entre etapas
  const handleNext = async () => {
    const step = steps[currentStep];
    
    // Validar etapa atual
    if (step.validation) {
      const isValid = await step.validation();
      if (!isValid) {
        setStepErrors(prev => new Map(prev).set(currentStep, 'Validação falhou'));
        return;
      }
    }

    // Marcar como concluída
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    setStepErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(currentStep);
      return newErrors;
    });

    // Avançar para próxima etapa
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    const step = steps[currentStep];
    if (step.canSkip) {
      handleNext();
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleComplete = (success: boolean) => {
    onComplete?.(instanceName, success);
  };

  // Componentes das etapas
  function WelcomeStep() {
    return (
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Smartphone className="w-12 h-12 text-white" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar WhatsApp Business
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Este assistente irá guiá-lo através do processo de conexão da sua instância WhatsApp 
            com nossa plataforma de forma simples e segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Seguro</h4>
            <p className="text-sm text-gray-600">Conexão criptografada e protegida</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Rápido</h4>
            <p className="text-sm text-gray-600">Configuração em poucos minutos</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Automático</h4>
            <p className="text-sm text-gray-600">Diagnósticos e verificações automáticas</p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Dica</AlertTitle>
          <AlertDescription>
            Tenha seu smartphone com WhatsApp em mãos para escanear o QR Code quando solicitado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function ConfigurationStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Configuração da Instância
          </h3>
          <p className="text-gray-600">
            Configure os detalhes da sua instância WhatsApp
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="ex: atendimento-vendas"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use apenas letras, números e hífens. Será usado para identificar sua instância.
            </p>
          </div>

          {showAdvancedOptions && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Opções Avançadas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={wizardData.webhookUrl || `${window.location.origin}/api/webhook/evolution`}
                    onChange={(e) => setWizardData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoReconnect">Reconexão Automática</Label>
                  <Switch
                    id="autoReconnect"
                    checked={wizardData.autoReconnect ?? true}
                    onCheckedChange={(checked) => setWizardData(prev => ({ ...prev, autoReconnect: checked }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {instanceName && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                Instância: {instanceName}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  function DiagnosticsStep() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const runSystemDiagnostics = async () => {
      setIsRunning(true);
      setResults([]);

      try {
        const diagnosticResults = await runDiagnostics();
        setResults(diagnosticResults);
        setDiagnostics(diagnosticResults);
      } catch (error: any) {
        toast({
          title: "Erro nos Diagnósticos",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsRunning(false);
      }
    };

    useEffect(() => {
      if (instanceName) {
        runSystemDiagnostics();
      }
    }, [instanceName]);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Diagnósticos do Sistema
          </h3>
          <p className="text-gray-600">
            Verificando a conectividade e configurações
          </p>
        </div>

        <div className="space-y-4">
          {isRunning ? (
            <div className="text-center py-8">
              <ContextualLoadingSpinner type="server" message="Executando diagnósticos..." />
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {result.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {result.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <span className={cn(
                    "text-sm",
                    result.status === 'success' && "text-green-600",
                    result.status === 'warning' && "text-yellow-600",
                    result.status === 'error' && "text-red-600"
                  )}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={runSystemDiagnostics}
              disabled={isRunning || !instanceName}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRunning && "animate-spin")} />
              Executar Novamente
            </Button>
            
            {results.some(r => r.status === 'error') && (
              <Button
                onClick={() => setShowTroubleshooting(true)}
                variant="outline"
                className="flex-1"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Solução de Problemas
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function ConnectionStep() {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
      setIsConnecting(true);
      try {
        await connectInstance();
        toast({
          title: "Conectando...",
          description: "Iniciando processo de conexão",
          duration: 3000
        });
      } catch (error: any) {
        toast({
          title: "Erro na Conexão",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsConnecting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Conectar Instância
          </h3>
          <p className="text-gray-600">
            Estabelecer conexão com a Evolution API
          </p>
        </div>

        <div className="text-center">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            {isConnecting ? (
              <ConnectionLoadingSpinner step="Estabelecendo conexão..." />
            ) : (
              <Link className="w-16 h-16 text-white" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Status: {state.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
              <Progress value={connectionProgress} className="w-full max-w-md mx-auto" />
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || state.status === 'connected'}
              className="px-8 py-3"
            >
              {isConnecting ? (
                <ButtonLoadingSpinner />
              ) : state.status === 'connected' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Conectado
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Conexão
                </>
              )}
            </Button>
          </div>
        </div>

        {state.error && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erro na Conexão</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  function QRCodeStep() {
    const [qrRefreshTime, setQrRefreshTime] = useState(45);

    useEffect(() => {
      if (state.qrCode) {
        setQRCodeData(state.qrCode);
      }
    }, [state.qrCode]);

    useEffect(() => {
      if (showQRCode && qrRefreshTime > 0) {
        const timer = setTimeout(() => {
          setQrRefreshTime(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (qrRefreshTime === 0) {
        generateQRCode();
        setQrRefreshTime(45);
      }
    }, [showQRCode, qrRefreshTime]);

    const handleGenerateQR = async () => {
      try {
        await generateQRCode();
        setQrRefreshTime(45);
      } catch (error: any) {
        toast({
          title: "Erro no QR Code",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Escanear QR Code
          </h3>
          <p className="text-gray-600">
            Use o WhatsApp no seu celular para escanear o código
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code */}
          <div className="text-center">
            {qrCodeData ? (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-lg inline-block">
                  <img 
                    src={qrCodeData} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
                
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Expira em: {qrRefreshTime}s</span>
                  </div>
                  <Button 
                    onClick={handleGenerateQR}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Atualizar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">QR Code não disponível</p>
                <Button onClick={handleGenerateQR}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code
                </Button>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Como conectar:</h4>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Abra o WhatsApp no seu celular</p>
                  <p className="text-sm text-gray-600">Certifique-se de estar conectado à internet</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Vá para Configurações</p>
                  <p className="text-sm text-gray-600">Toque nos três pontos → Aparelhos conectados</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Conectar um aparelho</p>
                  <p className="text-sm text-gray-600">Toque em "Conectar um aparelho"</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
                <div>
                  <p className="font-medium">Escaneie o QR Code</p>
                  <p className="text-sm text-gray-600">Aponte a câmera para o código ao lado</p>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Dica Importante</AlertTitle>
              <AlertDescription>
                O QR Code expira em 45 segundos. Se expirar, clique em "Atualizar" para gerar um novo.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  function VerificationStep() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const handleVerify = async () => {
      setIsVerifying(true);
      try {
        await checkConnectionState();
        
        if (state.status === 'connected') {
          setVerificationStatus('success');
          toast({
            title: "Verificação Concluída",
            description: "Conexão estabelecida com sucesso!",
            duration: 3000
          });
        } else {
          setVerificationStatus('error');
        }
      } catch (error: any) {
        setVerificationStatus('error');
        toast({
          title: "Erro na Verificação",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };

    useEffect(() => {
      if (state.status === 'connected') {
        setVerificationStatus('success');
      }
    }, [state.status]);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Verificação da Conexão
          </h3>
          <p className="text-gray-600">
            Confirmando se a conexão foi estabelecida corretamente
          </p>
        </div>

        <div className="text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
            {isVerifying ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : verificationStatus === 'success' ? (
              <CheckCircle className="w-16 h-16 text-white" />
            ) : verificationStatus === 'error' ? (
              <XCircle className="w-16 h-16 text-white" />
            ) : (
              <Target className="w-16 h-16 text-white" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Status: {
                verificationStatus === 'success' ? 'Conectado com Sucesso!' :
                verificationStatus === 'error' ? 'Erro na Conexão' :
                'Aguardando Verificação'
              }
            </p>
            
            {verificationStatus === 'success' && (
              <div className="space-y-2">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  WhatsApp Online
                </Badge>
                <p className="text-green-600">
                  Sua instância está conectada e pronta para uso!
                </p>
              </div>
            )}
          </div>

          {verificationStatus !== 'success' && (
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-8 py-3"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verificar Conexão
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  function CompleteStep() {
    useEffect(() => {
      // Marcar como concluído
      handleComplete(state.status === 'connected');
    }, []);

    return (
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Conexão Estabelecida!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Sua instância WhatsApp foi conectada com sucesso e está pronta para uso.
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-4">Próximos Passos:</h4>
          <div className="space-y-2 text-left max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-800">Configure webhooks para receber mensagens</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-800">Teste o envio de mensagens</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-800">Configure respostas automáticas</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render principal
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
            <Smartphone className="w-6 h-6" />
            <span>Assistente de Conexão WhatsApp</span>
          </CardTitle>
          <CardDescription>
            Conecte sua instância WhatsApp Business em poucos passos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  index === currentStep 
                    ? "bg-blue-600 text-white scale-110" 
                    : completedSteps.has(index)
                    ? "bg-green-600 text-white"
                    : stepErrors.has(index)
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-600"
                )}>
                  {completedSteps.has(index) ? (
                    <Check className="w-5 h-5" />
                  ) : stepErrors.has(index) ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-1 w-12 mx-2 transition-all duration-300",
                    completedSteps.has(index) ? "bg-green-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {steps[currentStep].component}
          </div>

          {/* Error display */}
          {stepErrors.has(currentStep) && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro na Etapa</AlertTitle>
              <AlertDescription>
                {stepErrors.get(currentStep)}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              {steps[currentStep].canSkip && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                >
                  Pular Etapa
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleCancel}
                variant="ghost"
              >
                Cancelar
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => handleComplete(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Concluir
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConnectionWizard; 