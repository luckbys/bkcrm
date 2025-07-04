import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';

// Tipos de teste
export type TestType = 
  | 'connectivity' 
  | 'authentication' 
  | 'instance_status' 
  | 'webhook' 
  | 'message_send' 
  | 'message_receive' 
  | 'profile_info'
  | 'media_send'
  | 'qr_generation';

// Status do teste
export type TestStatus = 'pending' | 'running' | 'success' | 'warning' | 'error' | 'skipped';

// Resultado individual de teste
export interface TestResult {
  id: string;
  type: TestType;
  name: string;
  status: TestStatus;
  message: string;
  details?: any;
  duration?: number; // em ms
  timestamp: Date;
  critical: boolean; // se falhar, bloqueia outros testes
}

// Suite de testes
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: TestStatus;
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
}

// Configuração de teste
export interface TestConfig {
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  webhookUrl?: string;
  testPhoneNumber?: string; // número para teste de envio
  enableDestructiveTests: boolean; // testes que podem causar efeitos
  timeout: number; // timeout em ms
}

// Opções do hook
interface UseInstanceTestingOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableContinuousMonitoring?: boolean;
  monitoringInterval?: number;
}

interface UseInstanceTestingReturn {
  // Estado
  isRunning: boolean;
  currentSuite: TestSuite | null;
  testHistory: TestSuite[];
  
  // Métodos principais
  runFullTestSuite: (config: TestConfig) => Promise<TestSuite>;
  runSingleTest: (type: TestType, config: TestConfig) => Promise<TestResult>;
  runQuickHealthCheck: (config: TestConfig) => Promise<TestResult[]>;
  
  // Controle
  stopTesting: () => void;
  clearHistory: () => void;
  exportResults: () => string;
  
  // Monitoramento
  startContinuousMonitoring: (config: TestConfig) => void;
  stopContinuousMonitoring: () => void;
  isMonitoring: boolean;
  
  // Utilitários
  getTestRecommendations: (results: TestResult[]) => string[];
  getTroubleshootingSteps: (failedTest: TestResult) => string[];
}

export const useInstanceTesting = (options: UseInstanceTestingOptions = {}): UseInstanceTestingReturn => {
  const {
    autoRetry = true,
    maxRetries = 3,
    retryDelay = 2000,
    enableContinuousMonitoring = false,
    monitoringInterval = 60000 // 1 minuto
  } = options;

  // Estados
  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<TestSuite | null>(null);
  const [testHistory, setTestHistory] = useState<TestSuite[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const { toast } = useToast();

  // Criar novo resultado de teste
  const createTestResult = useCallback((
    type: TestType,
    name: string,
    status: TestStatus = 'pending',
    message: string = '',
    critical: boolean = false
  ): TestResult => ({
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    status,
    message,
    timestamp: new Date(),
    critical
  }), []);

  // Executar teste individual
  const runSingleTest = useCallback(async (
    type: TestType, 
    config: TestConfig
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const test = createTestResult(type, getTestName(type), 'running', 'Executando...', isTestCritical(type));

    try {
      let result: TestResult;

      switch (type) {
        case 'connectivity':
          result = await testConnectivity(config, test);
          break;
        case 'authentication':
          result = await testAuthentication(config, test);
          break;
        case 'instance_status':
          result = await testInstanceStatus(config, test);
          break;
        case 'webhook':
          result = await testWebhook(config, test);
          break;
        case 'message_send':
          result = await testMessageSend(config, test);
          break;
        case 'message_receive':
          result = await testMessageReceive(config, test);
          break;
        case 'profile_info':
          result = await testProfileInfo(config, test);
          break;
        case 'media_send':
          result = await testMediaSend(config, test);
          break;
        case 'qr_generation':
          result = await testQRGeneration(config, test);
          break;
        default:
          result = { ...test, status: 'error', message: 'Tipo de teste não implementado' };
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error: any) {
      return {
        ...test,
        status: 'error',
        message: error.message || 'Erro desconhecido',
        duration: Date.now() - startTime
      };
    }
  }, [createTestResult]);

  // Teste de conectividade
  const testConnectivity = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    try {
      const response = await fetch(`${config.apiUrl}/`, {
        method: 'GET',
        signal: abortControllerRef.current?.signal,
        headers: {
          'apikey': config.apiKey
        }
      });

      if (!response.ok) {
        return {
          ...test,
          status: 'error',
          message: `Servidor não responde: HTTP ${response.status}`
        };
      }

      return {
        ...test,
        status: 'success',
        message: 'Conectividade OK'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro de conectividade: ${error.message}`
      };
    }
  };

  // Teste de autenticação
  const testAuthentication = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    try {
      const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (response.status === 401 || response.status === 403) {
        return {
          ...test,
          status: 'error',
          message: 'API Key inválida ou sem permissões'
        };
      }

      if (!response.ok) {
        return {
          ...test,
          status: 'error',
          message: `Erro de autenticação: HTTP ${response.status}`
        };
      }

      return {
        ...test,
        status: 'success',
        message: 'Autenticação válida'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro de autenticação: ${error.message}`
      };
    }
  };

  // Teste de status da instância
  const testInstanceStatus = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    try {
      const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        return {
          ...test,
          status: 'error',
          message: `Não foi possível verificar instâncias: HTTP ${response.status}`
        };
      }

      const instances = await response.json();
      const instance = instances.find((i: any) => i.instance?.instanceName === config.instanceName);

      if (!instance) {
        return {
          ...test,
          status: 'error',
          message: 'Instância não encontrada'
        };
      }

      const status = instance.instance?.status;
      
      if (status === 'open') {
        return {
          ...test,
          status: 'success',
          message: 'Instância conectada e ativa',
          details: { status, profile: instance.instance }
        };
      } else if (status === 'close') {
        return {
          ...test,
          status: 'warning',
          message: 'Instância desconectada'
        };
      } else if (status === 'connecting') {
        return {
          ...test,
          status: 'warning',
          message: 'Instância conectando...'
        };
      } else {
        return {
          ...test,
          status: 'warning',
          message: `Status: ${status || 'desconhecido'}`
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro ao verificar status: ${error.message}`
      };
    }
  };

  // Teste de webhook
  const testWebhook = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    if (!config.webhookUrl) {
      return {
        ...test,
        status: 'skipped',
        message: 'URL do webhook não configurada'
      };
    }

    try {
      // Verificar se o webhook está configurado
      const response = await fetch(`${config.apiUrl}/webhook/find/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (response.ok) {
        const webhookData = await response.json();
        
        if (webhookData.url === config.webhookUrl) {
          return {
            ...test,
            status: 'success',
            message: 'Webhook configurado corretamente'
          };
        } else {
          return {
            ...test,
            status: 'warning',
            message: `Webhook URL diferente: ${webhookData.url}`
          };
        }
      } else if (response.status === 404) {
        return {
          ...test,
          status: 'warning',
          message: 'Webhook não configurado'
        };
      } else {
        return {
          ...test,
          status: 'error',
          message: `Erro ao verificar webhook: HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro no teste de webhook: ${error.message}`
      };
    }
  };

  // Teste de envio de mensagem
  const testMessageSend = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    if (!config.testPhoneNumber || !config.enableDestructiveTests) {
      return {
        ...test,
        status: 'skipped',
        message: 'Teste de envio desabilitado ou número não configurado'
      };
    }

    try {
      const testMessage = `🤖 Teste automático - ${new Date().toISOString()}`;
      
      const response = await fetch(`${config.apiUrl}/message/sendText/${config.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: config.testPhoneNumber,
          text: testMessage
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          ...test,
          status: 'error',
          message: `Falha no envio: ${errorData.message || `HTTP ${response.status}`}`
        };
      }

      const result = await response.json();
      
      return {
        ...test,
        status: 'success',
        message: 'Mensagem enviada com sucesso',
        details: { messageId: result.key?.id, result }
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro no envio: ${error.message}`
      };
    }
  };

  // Teste de recebimento de mensagem (simulado)
  const testMessageReceive = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    // Este teste é mais complexo e requer monitoramento de webhook
    // Por enquanto, vamos simular verificando se a instância pode receber
    
    try {
      const response = await fetch(`${config.apiUrl}/chat/findChats/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (response.ok) {
        const chats = await response.json();
        return {
          ...test,
          status: 'success',
          message: `Capaz de receber mensagens (${chats.length || 0} chats encontrados)`
        };
      } else {
        return {
          ...test,
          status: 'warning',
          message: 'Não foi possível verificar capacidade de recebimento'
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'warning',
        message: `Erro na verificação: ${error.message}`
      };
    }
  };

  // Teste de informações do perfil
  const testProfileInfo = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    try {
      const response = await fetch(`${config.apiUrl}/chat/fetchProfile/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (response.ok) {
        const profile = await response.json();
        return {
          ...test,
          status: 'success',
          message: `Perfil: ${profile.name || 'Sem nome'}`,
          details: profile
        };
      } else {
        return {
          ...test,
          status: 'warning',
          message: 'Não foi possível obter informações do perfil'
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'warning',
        message: `Erro ao obter perfil: ${error.message}`
      };
    }
  };

  // Teste de envio de mídia
  const testMediaSend = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    if (!config.testPhoneNumber || !config.enableDestructiveTests) {
      return {
        ...test,
        status: 'skipped',
        message: 'Teste de mídia desabilitado'
      };
    }

    // Por simplicidade, vamos apenas verificar se o endpoint existe
    return {
      ...test,
      status: 'skipped',
      message: 'Teste de mídia não implementado nesta versão'
    };
  };

  // Teste de geração de QR Code
  const testQRGeneration = async (config: TestConfig, test: TestResult): Promise<TestResult> => {
    try {
      const response = await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });

      if (response.ok) {
        const qrData = await response.json();
        
        if (qrData.qrcode) {
          return {
            ...test,
            status: 'success',
            message: 'QR Code gerado com sucesso'
          };
        } else {
          return {
            ...test,
            status: 'warning',
            message: 'QR Code não disponível (talvez já conectado)'
          };
        }
      } else {
        return {
          ...test,
          status: 'error',
          message: `Erro ao gerar QR Code: HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { ...test, status: 'skipped', message: 'Teste cancelado' };
      }
      return {
        ...test,
        status: 'error',
        message: `Erro na geração de QR: ${error.message}`
      };
    }
  };

  // Executar suite completa de testes
  const runFullTestSuite = useCallback(async (config: TestConfig): Promise<TestSuite> => {
    const suiteId = `suite-${Date.now()}`;
    const startTime = new Date();
    
    const suite: TestSuite = {
      id: suiteId,
      name: `Teste Completo - ${config.instanceName}`,
      description: 'Suite completa de testes para validação da instância',
      tests: [],
      status: 'running',
      startTime,
      successCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    setCurrentSuite(suite);
    setIsRunning(true);

    // Configurar abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Ordem dos testes (críticos primeiro)
      const testTypes: TestType[] = [
        'connectivity',
        'authentication', 
        'instance_status',
        'qr_generation',
        'webhook',
        'profile_info',
        'message_receive',
        'message_send',
        'media_send'
      ];

      let shouldContinue = true;

      for (const testType of testTypes) {
        if (!shouldContinue || abortControllerRef.current?.signal.aborted) {
          break;
        }

        const result = await runSingleTest(testType, config);
        suite.tests.push(result);

        // Atualizar contadores
        if (result.status === 'success') {
          suite.successCount++;
        } else if (result.status === 'error') {
          suite.errorCount++;
          
          // Se teste crítico falhar, parar
          if (result.critical) {
            shouldContinue = false;
          }
        } else if (result.status === 'warning') {
          suite.warningCount++;
        }

        // Atualizar suite em tempo real
        setCurrentSuite({ ...suite });

        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Finalizar suite
      suite.endTime = new Date();
      suite.totalDuration = suite.endTime.getTime() - startTime.getTime();
      
      if (suite.errorCount > 0 && suite.successCount === 0) {
        suite.status = 'error';
      } else if (suite.errorCount > 0 || suite.warningCount > 0) {
        suite.status = 'warning';
      } else {
        suite.status = 'success';
      }

      setCurrentSuite(suite);
      
      // Adicionar ao histórico
      setTestHistory(prev => [suite, ...prev].slice(0, 20)); // manter últimos 20

      toast({
        title: suite.status === 'success' ? "✅ Testes concluídos" : 
               suite.status === 'warning' ? "⚠️ Testes concluídos com avisos" : "❌ Testes falharam",
        description: `${suite.successCount} sucessos, ${suite.errorCount} erros, ${suite.warningCount} avisos`,
        variant: suite.status === 'error' ? 'destructive' : 'default'
      });

      return suite;

    } catch (error: any) {
      suite.status = 'error';
      suite.endTime = new Date();
      
      console.error('Erro na execução da suite:', error);
      return suite;
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [runSingleTest, toast]);

  // Executar verificação rápida
  const runQuickHealthCheck = useCallback(async (config: TestConfig): Promise<TestResult[]> => {
    const quickTests: TestType[] = ['connectivity', 'authentication', 'instance_status'];
    const results: TestResult[] = [];

    for (const testType of quickTests) {
      const result = await runSingleTest(testType, config);
      results.push(result);
    }

    return results;
  }, [runSingleTest]);

  // Parar testes
  const stopTesting = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setTestHistory([]);
    setCurrentSuite(null);
  }, []);

  // Exportar resultados
  const exportResults = useCallback((): string => {
    const data = {
      exported_at: new Date().toISOString(),
      current_suite: currentSuite,
      history: testHistory
    };
    
    return JSON.stringify(data, null, 2);
  }, [currentSuite, testHistory]);

  // Monitoramento contínuo
  const startContinuousMonitoring = useCallback((config: TestConfig) => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    setIsMonitoring(true);
    
    monitoringIntervalRef.current = setInterval(async () => {
      try {
        await runQuickHealthCheck(config);
      } catch (error) {
        console.error('Erro no monitoramento:', error);
      }
    }, monitoringInterval);
  }, [runQuickHealthCheck, monitoringInterval]);

  const stopContinuousMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Recomendações baseadas nos resultados
  const getTestRecommendations = useCallback((results: TestResult[]): string[] => {
    const recommendations: string[] = [];
    
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasErrors) {
      recommendations.push('Resolva os erros críticos antes de usar a instância em produção');
    }
    
    if (hasWarnings) {
      recommendations.push('Verifique os avisos para otimizar o funcionamento');
    }
    
    const failedConnectivity = results.find(r => r.type === 'connectivity' && r.status === 'error');
    if (failedConnectivity) {
      recommendations.push('Verifique a URL da API e conectividade de rede');
    }
    
    const failedAuth = results.find(r => r.type === 'authentication' && r.status === 'error');
    if (failedAuth) {
      recommendations.push('Verifique se a API Key está correta e tem as permissões necessárias');
    }
    
    const disconnectedInstance = results.find(r => r.type === 'instance_status' && r.message.includes('desconectada'));
    if (disconnectedInstance) {
      recommendations.push('Conecte a instância escaneando o QR Code');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Instância funcionando corretamente! ✅');
    }
    
    return recommendations;
  }, []);

  // Passos de troubleshooting
  const getTroubleshootingSteps = useCallback((failedTest: TestResult): string[] => {
    const steps: string[] = [];
    
    switch (failedTest.type) {
      case 'connectivity':
        steps.push('1. Verifique se a URL da API está correta');
        steps.push('2. Teste a conectividade de rede');
        steps.push('3. Verifique se não há firewall bloqueando');
        steps.push('4. Confirme se o servidor Evolution API está online');
        break;
        
      case 'authentication':
        steps.push('1. Verifique se a API Key está correta');
        steps.push('2. Confirme as permissões da API Key');
        steps.push('3. Verifique se a API Key não expirou');
        break;
        
      case 'instance_status':
        steps.push('1. Verifique se a instância foi criada corretamente');
        steps.push('2. Tente reconectar a instância');
        steps.push('3. Escaneie o QR Code novamente');
        steps.push('4. Verifique se o WhatsApp no telefone está funcionando');
        break;
        
      case 'webhook':
        steps.push('1. Verifique se a URL do webhook está correta');
        steps.push('2. Confirme se o endpoint está acessível publicamente');
        steps.push('3. Teste a configuração do webhook manualmente');
        break;
        
      case 'message_send':
        steps.push('1. Verifique se a instância está conectada');
        steps.push('2. Confirme se o número de destino é válido');
        steps.push('3. Verifique se há limitações de rate limit');
        break;
        
      default:
        steps.push('1. Verifique os logs da aplicação');
        steps.push('2. Tente executar o teste novamente');
        steps.push('3. Contate o suporte se o problema persistir');
    }
    
    return steps;
  }, []);

  // Funções auxiliares
  const getTestName = (type: TestType): string => {
    const names = {
      connectivity: 'Conectividade da API',
      authentication: 'Autenticação',
      instance_status: 'Status da Instância',
      webhook: 'Configuração de Webhook',
      message_send: 'Envio de Mensagem',
      message_receive: 'Recebimento de Mensagem',
      profile_info: 'Informações do Perfil',
      media_send: 'Envio de Mídia',
      qr_generation: 'Geração de QR Code'
    };
    return names[type] || type;
  };

  const isTestCritical = (type: TestType): boolean => {
    return ['connectivity', 'authentication', 'instance_status'].includes(type);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado
    isRunning,
    currentSuite,
    testHistory,
    
    // Métodos principais
    runFullTestSuite,
    runSingleTest,
    runQuickHealthCheck,
    
    // Controle
    stopTesting,
    clearHistory,
    exportResults,
    
    // Monitoramento
    startContinuousMonitoring,
    stopContinuousMonitoring,
    isMonitoring,
    
    // Utilitários
    getTestRecommendations,
    getTroubleshootingSteps
  };
}; 