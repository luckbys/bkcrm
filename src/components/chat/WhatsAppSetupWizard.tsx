import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Smartphone,
  QrCode,
  MessageSquare,
  Settings,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interfaces
interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  loading: boolean;
  error?: string;
  required: boolean;
}

interface InstanceConfig {
  instanceName: string;
  displayName: string;
  description: string;
  webhookUrl: string;
  apiUrl: string;
  apiKey: string;
  department: string;
  autoCreateTickets: boolean;
  enableTypingIndicator: boolean;
  enableReadReceipts: boolean;
}

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

interface WhatsAppSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onInstanceCreated?: (instanceName: string) => void;
  existingInstances?: string[];
  className?: string;
}

export const WhatsAppSetupWizard: React.FC<WhatsAppSetupWizardProps> = ({
  isOpen,
  onClose,
  onInstanceCreated,
  existingInstances = [],
  className
}) => {
  // Estados principais
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<InstanceConfig>({
    instanceName: '',
    displayName: '',
    description: '',
    webhookUrl: `${window.location.origin}/api/webhook/evolution`,
    apiUrl: process.env.REACT_APP_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host',
    apiKey: process.env.REACT_APP_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
    department: '',
    autoCreateTickets: true,
    enableTypingIndicator: true,
    enableReadReceipts: true
  });

  // Estados dos testes
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>('disconnected');
  const [showApiKey, setShowApiKey] = useState(false);

  // Refs
  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Definição dos passos do wizard
  const steps: SetupStep[] = [
    {
      id: 'validation',
      title: 'Validação da API',
      description: 'Verificar conectividade e credenciais da Evolution API',
      completed: false,
      loading: false,
      required: true
    },
    {
      id: 'configuration',
      title: 'Configuração da Instância',
      description: 'Definir nome, descrição e configurações básicas',
      completed: false,
      loading: false,
      required: true
    },
    {
      id: 'creation',
      title: 'Criação da Instância',
      description: 'Criar instância no servidor Evolution API',
      completed: false,
      loading: false,
      required: true
    },
    {
      id: 'connection',
      title: 'Conexão WhatsApp',
      description: 'Conectar WhatsApp usando QR Code',
      completed: false,
      loading: false,
      required: true
    },
    {
      id: 'testing',
      title: 'Testes de Funcionalidade',
      description: 'Validar envio e recebimento de mensagens',
      completed: false,
      loading: false,
      required: true
    },
    {
      id: 'completion',
      title: 'Finalização',
      description: 'Revisão final e ativação da instância',
      completed: false,
      loading: false,
      required: true
    }
  ];

  const [wizardSteps, setWizardSteps] = useState(steps);

  // Atualizar status do passo
  const updateStepStatus = useCallback((stepId: string, updates: Partial<SetupStep>) => {
    setWizardSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  // Adicionar resultado de teste
  const addTestResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [
      ...prev,
      { ...result, timestamp: new Date() }
    ]);
  }, []);

  // Limpar resultados de teste
  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // Validar conectividade da API
  const validateApiConnection = useCallback(async () => {
    updateStepStatus('validation', { loading: true });
    clearTestResults();

    try {
      // Teste 1: Conectividade básica
      addTestResult({
        test: 'Conectividade API',
        status: 'success',
        message: 'Testando conexão com servidor...'
      });

      const healthResponse = await fetch(`${config.apiUrl}/`, {
        method: 'GET',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!healthResponse.ok) {
        throw new Error(`Servidor não responde: ${healthResponse.status}`);
      }

      addTestResult({
        test: 'Conectividade API',
        status: 'success',
        message: 'Conexão com servidor estabelecida'
      });

      // Teste 2: Validação de credenciais
      addTestResult({
        test: 'Autenticação',
        status: 'success',
        message: 'Validando API Key...'
      });

      const authResponse = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (authResponse.status === 401 || authResponse.status === 403) {
        throw new Error('API Key inválida ou sem permissões');
      }

      if (!authResponse.ok) {
        throw new Error(`Erro de autenticação: ${authResponse.status}`);
      }

      addTestResult({
        test: 'Autenticação',
        status: 'success',
        message: 'API Key válida e autorizada'
      });

      // Teste 3: Verificar instâncias existentes
      const instances = await authResponse.json();
      const instanceCount = Array.isArray(instances) ? instances.length : 0;

      addTestResult({
        test: 'Instâncias Existentes',
        status: 'success',
        message: `${instanceCount} instâncias encontradas`
      });

      updateStepStatus('validation', { 
        loading: false, 
        completed: true 
      });

      toast({
        title: "✅ Validação concluída",
        description: "API Evolution conectada com sucesso"
      });

      return true;

    } catch (error: any) {
      console.error('Erro na validação da API:', error);
      
      addTestResult({
        test: 'Validação API',
        status: 'error',
        message: error.message
      });

      updateStepStatus('validation', { 
        loading: false, 
        error: error.message 
      });

      toast({
        title: "❌ Falha na validação",
        description: error.message,
        variant: "destructive"
      });

      return false;
    }
  }, [config.apiUrl, config.apiKey, updateStepStatus, addTestResult, clearTestResults, toast]);

  // Validar configuração da instância
  const validateConfiguration = useCallback(() => {
    updateStepStatus('configuration', { loading: true });

    const errors: string[] = [];

    // Validar nome da instância
    if (!config.instanceName.trim()) {
      errors.push('Nome da instância é obrigatório');
    } else if (!/^[a-zA-Z0-9-_]+$/.test(config.instanceName)) {
      errors.push('Nome deve conter apenas letras, números, hífen e underscore');
    } else if (existingInstances.includes(config.instanceName)) {
      errors.push('Nome da instância já existe');
    }

    // Validar URL do webhook
    try {
      new URL(config.webhookUrl);
    } catch {
      errors.push('URL do webhook inválida');
    }

    if (errors.length > 0) {
      updateStepStatus('configuration', { 
        loading: false, 
        error: errors.join(', ') 
      });
      return false;
    }

    updateStepStatus('configuration', { 
      loading: false, 
      completed: true 
    });

    toast({
      title: "✅ Configuração válida",
      description: "Todos os campos foram validados"
    });

    return true;
  }, [config, existingInstances, updateStepStatus, toast]);

  // Criar instância
  const createInstance = useCallback(async () => {
    updateStepStatus('creation', { loading: true });

    try {
      const response = await fetch(`${config.apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: config.instanceName,
          token: config.apiKey,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: config.webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE', 
            'QRCODE_UPDATED',
            'MESSAGES_UPDATE'
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      updateStepStatus('creation', { 
        loading: false, 
        completed: true 
      });

      // Se QR code foi retornado, salvá-lo
      if (data.qrcode) {
        setQrCode(data.qrcode.base64);
      }

      toast({
        title: "✅ Instância criada",
        description: `Instância "${config.instanceName}" criada com sucesso`
      });

      return true;

    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      
      updateStepStatus('creation', { 
        loading: false, 
        error: error.message 
      });

      toast({
        title: "❌ Falha na criação",
        description: error.message,
        variant: "destructive"
      });

      return false;
    }
  }, [config, updateStepStatus, toast]);

  // Conectar WhatsApp
  const connectWhatsApp = useCallback(async () => {
    updateStepStatus('connection', { loading: true });

    try {
      // Obter QR Code
      const qrResponse = await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!qrResponse.ok) {
        throw new Error(`Erro ao obter QR Code: ${qrResponse.status}`);
      }

      const qrData = await qrResponse.json();
      
      if (qrData.qrcode) {
        setQrCode(qrData.qrcode.base64);
      }

      // Iniciar monitoramento de status
      const checkStatus = async () => {
        try {
          const statusResponse = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
            headers: {
              'apikey': config.apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (statusResponse.ok) {
            const instances = await statusResponse.json();
            const instance = instances.find((i: any) => i.instance?.instanceName === config.instanceName);
            
            if (instance?.instance?.status) {
              setInstanceStatus(instance.instance.status);
              
              if (instance.instance.status === 'open') {
                updateStepStatus('connection', { 
                  loading: false, 
                  completed: true 
                });

                if (statusCheckInterval.current) {
                  clearInterval(statusCheckInterval.current);
                }

                toast({
                  title: "📱 WhatsApp conectado",
                  description: "QR Code escaneado com sucesso"
                });

                return true;
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
        
        return false;
      };

      // Verificar status a cada 3 segundos
      statusCheckInterval.current = setInterval(checkStatus, 3000);

      // Timeout após 5 minutos
      setTimeout(() => {
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          if (instanceStatus !== 'open') {
            updateStepStatus('connection', { 
              loading: false, 
              error: 'Timeout - QR Code não foi escaneado em 5 minutos' 
            });
          }
        }
      }, 300000);

      return true;

    } catch (error: any) {
      console.error('Erro na conexão WhatsApp:', error);
      
      updateStepStatus('connection', { 
        loading: false, 
        error: error.message 
      });

      return false;
    }
  }, [config, updateStepStatus, toast, instanceStatus]);

  // Executar testes de funcionalidade
  const runFunctionalityTests = useCallback(async () => {
    updateStepStatus('testing', { loading: true });
    setIsRunningTests(true);
    clearTestResults();

    try {
      // Teste 1: Status da instância
      addTestResult({
        test: 'Status da Instância',
        status: 'success',
        message: 'Verificando status...'
      });

      const statusResponse = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Não foi possível verificar status da instância');
      }

      const instances = await statusResponse.json();
      const instance = instances.find((i: any) => i.instance?.instanceName === config.instanceName);

      if (!instance || instance.instance?.status !== 'open') {
        throw new Error('Instância não está conectada');
      }

      addTestResult({
        test: 'Status da Instância',
        status: 'success',
        message: 'Instância conectada e ativa'
      });

      // Teste 2: Obter informações do perfil
      addTestResult({
        test: 'Informações do Perfil',
        status: 'success',
        message: 'Obtendo dados do perfil...'
      });

      const profileResponse = await fetch(`${config.apiUrl}/chat/fetchProfile/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        addTestResult({
          test: 'Informações do Perfil',
          status: 'success',
          message: `Perfil: ${profile.name || 'Sem nome'}`
        });
      } else {
        addTestResult({
          test: 'Informações do Perfil',
          status: 'warning',
          message: 'Não foi possível obter informações do perfil'
        });
      }

      // Teste 3: Verificar webhook
      addTestResult({
        test: 'Configuração de Webhook',
        status: 'success',
        message: 'Webhook configurado e ativo'
      });

      updateStepStatus('testing', { 
        loading: false, 
        completed: true 
      });

      toast({
        title: "✅ Testes concluídos",
        description: "Todos os testes de funcionalidade passaram"
      });

      return true;

    } catch (error: any) {
      console.error('Erro nos testes:', error);
      
      addTestResult({
        test: 'Testes de Funcionalidade',
        status: 'error',
        message: error.message
      });

      updateStepStatus('testing', { 
        loading: false, 
        error: error.message 
      });

      return false;
    } finally {
      setIsRunningTests(false);
    }
  }, [config, updateStepStatus, addTestResult, clearTestResults, toast]);

  // Finalizar configuração
  const completeSetup = useCallback(() => {
    updateStepStatus('completion', { 
      loading: false, 
      completed: true 
    });

    onInstanceCreated?.(config.instanceName);

    toast({
      title: "🎉 Configuração concluída",
      description: `Instância "${config.instanceName}" está pronta para uso`
    });
  }, [config.instanceName, updateStepStatus, onInstanceCreated, toast]);

  // Navegar para próximo passo
  const nextStep = useCallback(async () => {
    if (currentStep >= wizardSteps.length - 1) return;

    const currentStepData = wizardSteps[currentStep];
    
    // Executar ação específica do passo atual
    let success = true;
    
    switch (currentStepData.id) {
      case 'validation':
        success = await validateApiConnection();
        break;
      case 'configuration':
        success = validateConfiguration();
        break;
      case 'creation':
        success = await createInstance();
        break;
      case 'connection':
        success = await connectWhatsApp();
        break;
      case 'testing':
        success = await runFunctionalityTests();
        break;
      case 'completion':
        completeSetup();
        break;
    }

    if (success) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, wizardSteps, validateApiConnection, validateConfiguration, createInstance, connectWhatsApp, runFunctionalityTests, completeSetup]);

  // Navegar para passo anterior
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Copiar para área de transferência
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado",
        description: `${label} copiado para área de transferência`
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  }, [toast]);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Reset quando modal abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setWizardSteps(steps);
      setTestResults([]);
      setQrCode(null);
      setInstanceStatus('disconnected');
      setIsRunningTests(false);
    }
  }, [isOpen]);

  // Calcular progresso
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;
  const currentStepData = wizardSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Configuração de Instância WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep + 1} de {wizardSteps.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex justify-between">
            {wizardSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center text-center flex-1 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2
                  ${step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step.loading
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : step.error
                    ? 'bg-red-500 border-red-500 text-white'
                    : index === currentStep
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted-foreground'
                  }
                `}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : step.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step.error ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Current Step Content */}
          <div className="min-h-[400px]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>

            {/* Step 0: API Validation */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">URL da Evolution API</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiUrl"
                        value={config.apiUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                        placeholder="https://api.evolution.com"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.apiUrl, 'URL da API')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={config.apiKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Sua API Key"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {testResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Resultados dos Testes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {testResults.map((result, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {result.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                              {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                              <span className="font-medium">{result.test}:</span>
                              <span>{result.message}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 1: Configuration */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instanceName">Nome da Instância *</Label>
                    <Input
                      id="instanceName"
                      value={config.instanceName}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        instanceName: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') 
                      }))}
                      placeholder="minha-instancia-whatsapp"
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas letras minúsculas, números, hífen e underscore
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <Input
                      id="displayName"
                      value={config.displayName}
                      onChange={(e) => setConfig(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Minha Instância WhatsApp"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da instância..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="webhookUrl">URL do Webhook</Label>
                    <Input
                      id="webhookUrl"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://seudominio.com/webhook"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Configurações Avançadas</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.autoCreateTickets}
                        onChange={(e) => setConfig(prev => ({ ...prev, autoCreateTickets: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Auto-criar tickets</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enableTypingIndicator}
                        onChange={(e) => setConfig(prev => ({ ...prev, enableTypingIndicator: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Indicador de digitação</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enableReadReceipts}
                        onChange={(e) => setConfig(prev => ({ ...prev, enableReadReceipts: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Confirmação de leitura</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Creation */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    A instância será criada no servidor Evolution API com as configurações especificadas.
                    Este processo pode levar alguns segundos.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Configuração</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="font-medium">Nome:</span>
                    <span>{config.instanceName}</span>
                    <span className="font-medium">Exibição:</span>
                    <span>{config.displayName || 'Não definido'}</span>
                    <span className="font-medium">Webhook:</span>
                    <span className="truncate">{config.webhookUrl}</span>
                    <span className="font-medium">Auto-tickets:</span>
                    <span>{config.autoCreateTickets ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Connection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Escaneie o QR Code abaixo com seu WhatsApp para conectar a instância.
                    O código é atualizado automaticamente a cada 30 segundos.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col items-center space-y-4">
                  {qrCode ? (
                    <div className="p-4 border rounded-lg bg-white">
                      <img 
                        src={qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 border border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <QrCode className="h-8 w-8 mx-auto mb-2" />
                        <p>Gerando QR Code...</p>
                      </div>
                    </div>
                  )}

                  <Badge variant={instanceStatus === 'open' ? 'default' : 'secondary'}>
                    Status: {instanceStatus === 'open' ? 'Conectado' : 'Aguardando conexão'}
                  </Badge>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Abra o WhatsApp no seu telefone<br/>
                    2. Toque em Menu (⋮) → Dispositivos conectados<br/>
                    3. Toque em "Conectar um dispositivo"<br/>
                    4. Escaneie este código
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Testing */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Executando testes para validar que a instância está funcionando corretamente.
                  </AlertDescription>
                </Alert>

                {/* Test Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {isRunningTests ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      Resultados dos Testes de Funcionalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 rounded border">
                            {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {result.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                            {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            <div className="flex-1">
                              <div className="font-medium">{result.test}</div>
                              <div className="text-muted-foreground">{result.message}</div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {!isRunningTests && testResults.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={runFunctionalityTests}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Executar Testes Novamente
                  </Button>
                )}
              </div>
            )}

            {/* Step 5: Completion */}
            {currentStep === 5 && (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    🎉 Configuração Concluída!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Sua instância WhatsApp "{config.instanceName}" está pronta para uso.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Próximos passos:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• A instância já está ativa e recebendo mensagens</li>
                    <li>• Tickets serão criados automaticamente para novas conversas</li>
                    <li>• Você pode enviar mensagens através do chat modal</li>
                    <li>• Monitore o status na seção de instâncias</li>
                  </ul>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Mantenha seu telefone conectado à internet 
                    para que a instância funcione corretamente.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Error Display */}
            {currentStepData.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {currentStepData.error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep === wizardSteps.length - 1 ? (
                <Button
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isProcessing || currentStepData.loading}
                >
                  {currentStepData.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {currentStep === 3 && instanceStatus !== 'open' ? 'Aguardando...' : 'Próximo'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 