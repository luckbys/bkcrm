import { useState, useEffect, useCallback, useRef } from 'react';
import { evolutionApi } from '@/services/evolutionApi';
import { useToast } from '@/hooks/use-toast';

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code' | 'error' | 'reconnecting';
  error: string | null;
  qrCode: string | null;
  lastConnected: Date | null;
  connectionAttempts: number;
  isHealthy: boolean;
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    messagesProcessed: number;
  };
}

export interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  healthCheckInterval?: number;
  qrCodeRefreshInterval?: number;
}

const DEFAULT_OPTIONS: ConnectionOptions = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 5000,
  healthCheckInterval: 30000,
  qrCodeRefreshInterval: 45000
};

export const useEnhancedEvolutionConnection = (
  instanceName: string,
  options: ConnectionOptions = {}
) => {
  const { toast } = useToast();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Estado principal da conexão
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    error: null,
    qrCode: null,
    lastConnected: null,
    connectionAttempts: 0,
    isHealthy: false,
    metrics: {
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
      messagesProcessed: 0
    }
  });

  // Estados de controle
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionHistory, setConnectionHistory] = useState<any[]>([]);

  // Refs para controle de intervalos
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrCodeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função para adicionar ao histórico
  const addToHistory = useCallback((type: string, message: string, details?: any) => {
    const entry = {
      id: Date.now(),
      type,
      message,
      details,
      timestamp: new Date(),
      instanceName
    };

    setConnectionHistory(prev => [entry, ...prev.slice(0, 99)]); // Manter últimos 100

    console.log(`📝 [${instanceName}] ${type}: ${message}`, details || '');
  }, [instanceName]);

  // Função para atualizar métricas
  const updateMetrics = useCallback((updates: Partial<ConnectionState['metrics']>) => {
    setState(prev => ({
      ...prev,
      metrics: { ...prev.metrics, ...updates }
    }));
  }, []);

  // Função para conectar instância
  const connectInstance = useCallback(async (): Promise<void> => {
    if (isConnecting) {
      console.log(`⚠️ [${instanceName}] Conexão já em andamento, ignorando tentativa duplicada`);
      return;
    }

    setIsConnecting(true);
    abortControllerRef.current = new AbortController();

    try {
      console.log(`🔌 [${instanceName}] Iniciando processo de conexão...`);
      
      setState(prev => ({ 
        ...prev, 
        status: 'connecting', 
        error: null,
        connectionAttempts: prev.connectionAttempts + 1
      }));

      addToHistory('connect_start', 'Iniciando conexão');

      // Etapa 1: Verificar se a instância existe
      const startTime = Date.now();
      let instanceStatus;
      
      try {
        instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
        const responseTime = Date.now() - startTime;
        updateMetrics({ responseTime });
        
        addToHistory('instance_check', 'Instância verificada', { status: instanceStatus.status, responseTime });
      } catch (error: any) {
        console.log(`📱 [${instanceName}] Instância não existe, criando...`);
        addToHistory('instance_create_start', 'Criando nova instância');
        
        // Criar instância se não existir
        await evolutionApi.createInstance({
          instanceName,
          qrcode: true,
          webhook: `${window.location.origin}/api/webhook/evolution`
        });
        
        addToHistory('instance_created', 'Instância criada com sucesso');
        
        // Aguardar um pouco para a instância inicializar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar novamente
        instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
      }

      // Etapa 2: Verificar status da conexão
      if (instanceStatus.status === 'open') {
        // Já conectado
        setState(prev => ({ 
          ...prev, 
          status: 'connected', 
          lastConnected: new Date(),
          isHealthy: true,
          error: null
        }));
        
        addToHistory('connect_success', 'Conexão estabelecida com sucesso');
        setReconnectAttempts(0);
        startHealthCheck();
        startMetricsMonitoring();
        
        toast({
          title: "Conectado com Sucesso",
          description: `Instância ${instanceName} está online`,
          duration: 3000
        });
        
      } else if (instanceStatus.status === 'close' || !instanceStatus.status) {
        // Precisa conectar via QR Code
        setState(prev => ({ ...prev, status: 'qr_code' }));
        addToHistory('qr_code_required', 'QR Code necessário para conexão');
        
        await generateQRCode();
        
      } else {
        throw new Error(`Status da instância não reconhecido: ${instanceStatus.status}`);
      }

    } catch (error: any) {
      console.error(`❌ [${instanceName}] Erro na conexão:`, error);
      
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message,
        isHealthy: false
      }));
      
      addToHistory('connect_error', 'Erro na conexão', { error: error.message });
      
      // Tentar reconectar se habilitado
      if (opts.autoReconnect && reconnectAttempts < (opts.maxReconnectAttempts || 10)) {
        scheduleReconnect();
      }
      
      toast({
        title: "Erro na Conexão",
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
      
    } finally {
      setIsConnecting(false);
      abortControllerRef.current = null;
    }
  }, [instanceName, isConnecting, reconnectAttempts, opts, toast, addToHistory, updateMetrics]);

  // Função para desconectar instância
  const disconnectInstance = useCallback(async (): Promise<void> => {
    try {
      console.log(`🔌 [${instanceName}] Desconectando instância...`);
      
      // Cancelar operações em andamento
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Parar monitoramento
      stopHealthCheck();
      stopMetricsMonitoring();
      stopQRCodeRefresh();
      stopReconnect();
      
      // Realizar logout da instância na Evolution API
      try {
        const response = await fetch(`/api/evolution/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          addToHistory('logout_success', 'Logout realizado com sucesso');
        }
      } catch (error) {
        console.warn(`⚠️ [${instanceName}] Erro no logout:`, error);
      }
      
      setState(prev => ({ 
        ...prev, 
        status: 'disconnected', 
        qrCode: null,
        error: null,
        isHealthy: false
      }));
      
      setReconnectAttempts(0);
      addToHistory('disconnect', 'Instância desconectada');
      
      toast({
        title: "Desconectado",
        description: `Instância ${instanceName} foi desconectada`,
        duration: 3000
      });
      
    } catch (error: any) {
      console.error(`❌ [${instanceName}] Erro na desconexão:`, error);
      
      toast({
        title: "Erro na Desconexão",
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
    }
  }, [instanceName, toast, addToHistory]);

  // Função para gerar QR Code
  const generateQRCode = useCallback(async (): Promise<void> => {
    try {
      console.log(`📱 [${instanceName}] Gerando QR Code...`);
      
      const qrCode = await evolutionApi.getInstanceQRCode(instanceName);
      
      if (qrCode) {
        setState(prev => ({ ...prev, qrCode }));
        addToHistory('qr_code_generated', 'QR Code gerado com sucesso');
        
        // Programar atualização automática
        startQRCodeRefresh();
        
        toast({
          title: "QR Code Gerado",
          description: "Escaneie o QR Code no WhatsApp para conectar",
          duration: 5000
        });
      } else {
        throw new Error('QR Code não foi gerado');
      }
      
    } catch (error: any) {
      console.error(`❌ [${instanceName}] Erro ao gerar QR Code:`, error);
      
      setState(prev => ({ 
        ...prev, 
        error: `Erro ao gerar QR Code: ${error.message}` 
      }));
      
      addToHistory('qr_code_error', 'Erro ao gerar QR Code', { error: error.message });
    }
  }, [instanceName, toast, addToHistory]);

  // Função para verificar estado da conexão
  const checkConnectionState = useCallback(async (): Promise<void> => {
    try {
      const startTime = Date.now();
      const instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
      const responseTime = Date.now() - startTime;
      
      updateMetrics({ responseTime });
      
      const isConnected = instanceStatus.status === 'open';
      const currentStatus = state.status;
      
      if (isConnected && (currentStatus === 'qr_code' || currentStatus === 'connecting')) {
        // Conexão estabelecida
        setState(prev => ({ 
          ...prev, 
          status: 'connected', 
          lastConnected: new Date(),
          isHealthy: true,
          error: null,
          qrCode: null
        }));
        
        setReconnectAttempts(0);
        stopQRCodeRefresh();
        startMetricsMonitoring();
        
        addToHistory('connection_established', 'Conexão estabelecida via QR Code');
        
        toast({
          title: "Conectado!",
          description: "WhatsApp conectado com sucesso",
          duration: 3000
        });
        
      } else if (!isConnected && currentStatus === 'connected') {
        // Conexão perdida
        setState(prev => ({ 
          ...prev, 
          status: 'disconnected',
          isHealthy: false,
          error: 'Conexão perdida'
        }));
        
        addToHistory('connection_lost', 'Conexão perdida');
        
        if (opts.autoReconnect) {
          scheduleReconnect();
        }
        
        toast({
          title: "Conexão Perdida",
          description: "Tentando reconectar automaticamente...",
          variant: "destructive",
          duration: 5000
        });
      }
      
    } catch (error: any) {
      console.error(`❌ [${instanceName}] Erro ao verificar conexão:`, error);
      
      updateMetrics({ errorRate: state.metrics.errorRate + 1 });
      
      if (state.status === 'connected') {
        setState(prev => ({ 
          ...prev, 
          isHealthy: false,
          error: 'Erro na verificação de saúde'
        }));
      }
    }
  }, [instanceName, state.status, state.metrics.errorRate, opts.autoReconnect, toast, addToHistory, updateMetrics]);

  // Função para agendar reconexão
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= (opts.maxReconnectAttempts || 10)) {
      console.log(`❌ [${instanceName}] Máximo de tentativas de reconexão atingido`);
      
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: 'Máximo de tentativas de reconexão atingido'
      }));
      
      addToHistory('reconnect_failed', 'Máximo de tentativas atingido');
      return;
    }

    const delay = Math.min(
      (opts.reconnectDelay || 5000) * Math.pow(2, reconnectAttempts), 
      60000 // Max 60 segundos
    );

    console.log(`🔄 [${instanceName}] Reagendando reconexão em ${delay / 1000}s (tentativa ${reconnectAttempts + 1})`);
    
    setState(prev => ({ ...prev, status: 'reconnecting' }));
    addToHistory('reconnect_scheduled', `Reconexão agendada para ${delay / 1000}s`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connectInstance();
    }, delay);
  }, [instanceName, reconnectAttempts, opts, connectInstance, addToHistory]);

  // Função para iniciar verificação de saúde
  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    setIsMonitoring(true);
    
    healthCheckIntervalRef.current = setInterval(() => {
      if (state.status === 'connected' || state.status === 'qr_code') {
        checkConnectionState();
      }
    }, opts.healthCheckInterval || 30000);
  }, [state.status, opts.healthCheckInterval, checkConnectionState]);

  // Função para parar verificação de saúde
  const stopHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Função para iniciar atualização do QR Code
  const startQRCodeRefresh = useCallback(() => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
    }

    qrCodeIntervalRef.current = setInterval(() => {
      if (state.status === 'qr_code') {
        generateQRCode();
      }
    }, opts.qrCodeRefreshInterval || 45000);
  }, [state.status, opts.qrCodeRefreshInterval, generateQRCode]);

  // Função para parar atualização do QR Code
  const stopQRCodeRefresh = useCallback(() => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
      qrCodeIntervalRef.current = null;
    }
  }, []);

  // Função para iniciar monitoramento de métricas
  const startMetricsMonitoring = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    const startTime = Date.now();
    
    metricsIntervalRef.current = setInterval(() => {
      if (state.status === 'connected') {
        updateMetrics({ 
          uptime: Date.now() - startTime,
          messagesProcessed: state.metrics.messagesProcessed + Math.floor(Math.random() * 3) // Simulação
        });
      }
    }, 10000); // Atualizar a cada 10 segundos
  }, [state.status, state.metrics.messagesProcessed, updateMetrics]);

  // Função para parar monitoramento de métricas
  const stopMetricsMonitoring = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  }, []);

  // Função para parar reconexão
  const stopReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setReconnectAttempts(0);
  }, []);

  // Função para monitorar conexão (polling manual)
  const monitorConnection = useCallback(async (): Promise<void> => {
    await checkConnectionState();
  }, [checkConnectionState]);

  // Função para resetar estado
  const resetConnection = useCallback(() => {
    stopHealthCheck();
    stopMetricsMonitoring();
    stopQRCodeRefresh();
    stopReconnect();
    
    setState({
      status: 'disconnected',
      error: null,
      qrCode: null,
      lastConnected: null,
      connectionAttempts: 0,
      isHealthy: false,
      metrics: {
        responseTime: 0,
        errorRate: 0,
        uptime: 0,
        messagesProcessed: 0
      }
    });
    
    setReconnectAttempts(0);
    setConnectionHistory([]);
    
    addToHistory('reset', 'Estado da conexão resetado');
  }, [addToHistory]);

  // Função para executar diagnósticos
  const runDiagnostics = useCallback(async () => {
    const diagnostics = [];
    
    try {
      // Teste 1: Health check da API
      const startTime = Date.now();
      const health = await evolutionApi.checkHealth();
      const apiResponseTime = Date.now() - startTime;
      
      diagnostics.push({
        test: 'API Health Check',
        status: health.status === 'ok' ? 'success' : 'error',
        message: `API ${health.status} - ${apiResponseTime}ms`,
        details: health
      });
      
      // Teste 2: Status da instância
      try {
        const instanceStatus = await evolutionApi.getInstanceStatus(instanceName);
        diagnostics.push({
          test: 'Instance Status',
          status: instanceStatus.status === 'open' ? 'success' : 'warning',
          message: `Status: ${instanceStatus.status}`,
          details: instanceStatus
        });
      } catch (error: any) {
        diagnostics.push({
          test: 'Instance Status',
          status: 'error',
          message: `Erro: ${error.message}`,
          details: error
        });
      }
      
      // Teste 3: Webhook configuration
      try {
        const webhook = await evolutionApi.getInstanceWebhook(instanceName);
        diagnostics.push({
          test: 'Webhook Configuration',
          status: webhook.enabled ? 'success' : 'warning',
          message: webhook.enabled ? 'Webhook ativo' : 'Webhook inativo',
          details: webhook
        });
      } catch (error: any) {
        diagnostics.push({
          test: 'Webhook Configuration',
          status: 'error',
          message: 'Webhook não configurado',
          details: error
        });
      }
      
    } catch (error: any) {
      diagnostics.push({
        test: 'Diagnostics',
        status: 'error',
        message: `Erro geral: ${error.message}`,
        details: error
      });
    }
    
    addToHistory('diagnostics', 'Diagnósticos executados', diagnostics);
    
    return diagnostics;
  }, [instanceName, addToHistory]);

  // Efeito para inicializar
  useEffect(() => {
    console.log(`🚀 [${instanceName}] Hook inicializado`);
    
    // Verificar estado inicial
    checkConnectionState();
    
    return () => {
      console.log(`🛑 [${instanceName}] Hook desmontado, limpando recursos`);
      
      // Cancelar operações
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Limpar intervalos
      stopHealthCheck();
      stopMetricsMonitoring();
      stopQRCodeRefresh();
      stopReconnect();
    };
  }, [instanceName]);

  // Efeito para iniciar monitoramento quando conectado
  useEffect(() => {
    if (state.status === 'connected') {
      startHealthCheck();
    } else if (state.status === 'qr_code') {
      startHealthCheck(); // Verificar se conectou via QR Code
    }
  }, [state.status, startHealthCheck]);

  return {
    // Estado
    state,
    isConnecting,
    isMonitoring,
    reconnectAttempts,
    connectionHistory,
    
    // Ações
    connectInstance,
    disconnectInstance,
    generateQRCode,
    checkConnectionState,
    monitorConnection,
    resetConnection,
    runDiagnostics,
    
    // Controles
    startHealthCheck,
    stopHealthCheck,
    scheduleReconnect,
    stopReconnect
  };
};

export default useEnhancedEvolutionConnection; 