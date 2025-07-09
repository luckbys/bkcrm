import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EVOLUTION_CONFIG, EvolutionEndpoints, DEFAULT_INSTANCE_CONFIG, type EvolutionResponse } from '../config/evolution';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'creating' | 'qr-ready' | 'connected' | 'error';
  qrCode: string | null;
  error: string | null;
  timeLeft: number;
  profileInfo: {
    phone: string;
    name: string;
  } | null;
}

export const useEvolutionConnection = (instanceName: string) => {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    qrCode: null,
    error: null,
    timeLeft: 0,
    profileInfo: null
  });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  const createInstance = useCallback(async () => {
    if (!instanceName) return false;

    try {
      console.log('🔧 Criando instância:', instanceName);
      
      const response = await fetch(
        EvolutionEndpoints.createInstance(),
        {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_CONFIG.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: instanceName,
            token: EVOLUTION_CONFIG.apiKey,
            ...DEFAULT_INSTANCE_CONFIG
          }),
          signal: AbortSignal.timeout(EVOLUTION_CONFIG.timeout),
        }
      );

      const data = await response.json();
      console.log('📋 Resposta da criação:', data);

      if (response.ok) {
        console.log('✅ Instância criada com sucesso');
        return true;
      } else {
        // Se a instância já existe, isso é OK
        if (data.message?.includes('already exists') || data.message?.includes('já existe')) {
          console.log('ℹ️ Instância já existe, continuando...');
          return true;
        }
        throw new Error(data.message || 'Erro ao criar instância');
      }
    } catch (err) {
      console.error('❌ Erro ao criar instância:', err);
      // Se for erro de instância já existente, continuar
      if (err instanceof Error && err.message.includes('already exists')) {
        return true;
      }
      throw err;
    }
  }, [instanceName]);

  const connectInstance = useCallback(async () => {
    if (!instanceName) return;

    setState(prev => ({ ...prev, status: 'connecting', error: null }));

    try {
      // Primeiro, tentar criar a instância
      setState(prev => ({ ...prev, status: 'creating' }));
      await createInstance();

      // Depois, conectar à instância
      setState(prev => ({ ...prev, status: 'connecting' }));
      console.log('🔌 Conectando instância:', instanceName);
      
      const response = await fetch(
        EvolutionEndpoints.connect(instanceName),
        {
          method: 'GET',
          headers: {
            'apikey': EVOLUTION_CONFIG.apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(EVOLUTION_CONFIG.timeout),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data: EvolutionResponse = await response.json();
      console.log('✅ Resposta da conexão:', data);

      if (data.base64) {
        setState(prev => ({
          ...prev,
          status: 'qr-ready',
          qrCode: data.base64,
          timeLeft: EVOLUTION_CONFIG.qrCodeTimeout / 1000,
        }));

        startTimer();
        startStatusCheck();
        
        toast({
          title: "QR Code gerado!",
          description: "Escaneie o código com seu WhatsApp para conectar",
        });
      } else if (data.instance?.state === 'open') {
        setState(prev => ({
          ...prev,
          status: 'connected',
          profileInfo: {
            phone: data.instance?.owner || 'Não informado',
            name: data.instance?.profileName || 'WhatsApp Business'
          }
        }));
        
        toast({
          title: "Já conectado!",
          description: "Esta instância já está conectada ao WhatsApp",
        });
      } else {
        throw new Error(data.message || 'Resposta inválida da API');
      }
    } catch (err) {
      console.error('❌ Erro na conexão:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      }));

      toast({
        title: "Erro na conexão",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [instanceName, createInstance, toast]);

  const checkStatus = useCallback(async () => {
    if (!instanceName || state.status === 'connected') return;

    try {
      const response = await fetch(
        EvolutionEndpoints.fetchInstances(),
        {
          method: 'GET',
          headers: {
            'apikey': EVOLUTION_CONFIG.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const instances = await response.json();
        const instance = instances.find((inst: any) => inst.instanceName === instanceName);
        
        if (instance?.instance?.state === 'open') {
          setState(prev => ({
            ...prev,
            status: 'connected',
            profileInfo: {
              phone: instance.instance.owner || 'Não informado',
              name: instance.instance.profileName || 'WhatsApp Business'
            }
          }));
          
          stopTimer();
          stopStatusCheck();
          
          toast({
            title: "Conectado com sucesso!",
            description: `A instância ${instanceName} foi conectada ao WhatsApp`,
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro ao verificar status:', err);
    }
  }, [instanceName, state.status, toast]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.timeLeft <= 1) {
          stopTimer();
          stopStatusCheck();
          return {
            ...prev,
            status: 'error',
            error: 'QR Code expirado. Tente novamente.',
            timeLeft: 0
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    timerRef.current = interval;
  }, []);

  const startStatusCheck = useCallback(() => {
    if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    
    const interval = setInterval(checkStatus, EVOLUTION_CONFIG.statusCheckInterval);
    statusCheckRef.current = interval;
  }, [checkStatus]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStatusCheck = useCallback(() => {
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!instanceName) return;

    try {
      await fetch(EvolutionEndpoints.logoutInstance(instanceName), {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_CONFIG.apiKey,
          'Content-Type': 'application/json',
        }
      });

      setState({
        status: 'disconnected',
        qrCode: null,
        error: null,
        timeLeft: 0,
        profileInfo: null
      });

      stopTimer();
      stopStatusCheck();

      toast({
        title: "Desconectado",
        description: `A instância ${instanceName} foi desconectada`,
      });
    } catch (err) {
      console.error('❌ Erro ao desconectar:', err);
      toast({
        title: "Erro ao desconectar",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [instanceName, toast]);

  const refreshQRCode = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'disconnected',
      qrCode: null,
      error: null,
      timeLeft: 0
    }));
    
    stopTimer();
    stopStatusCheck();
    
    // Reconectar após um pequeno delay
    setTimeout(() => {
      connectInstance();
    }, 500);
  }, [connectInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopStatusCheck();
    };
  }, [stopTimer, stopStatusCheck]);

  return {
    ...state,
    connectInstance,
    disconnect,
    refreshQRCode,
    isConnecting: state.status === 'connecting' || state.status === 'creating',
    isConnected: state.status === 'connected',
    hasQRCode: state.status === 'qr-ready' && !!state.qrCode,
    hasError: state.status === 'error'
  };
};
