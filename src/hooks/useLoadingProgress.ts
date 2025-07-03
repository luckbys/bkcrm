import { useState, useEffect, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

export type LoadingStage = 
  | 'idle'
  | 'creating-instance'
  | 'connecting'
  | 'generating-qr'
  | 'waiting-scan'
  | 'verifying'
  | 'connected'
  | 'error';

const stageMessages: Record<LoadingStage, string> = {
  idle: 'Aguardando...',
  'creating-instance': 'Criando instância WhatsApp...',
  connecting: 'Estabelecendo conexão...',
  'generating-qr': 'Gerando QR Code...',
  'waiting-scan': 'Aguardando leitura do QR Code...',
  verifying: 'Verificando conexão...',
  connected: 'Conectado com sucesso!',
  error: 'Erro na conexão'
};

const stageProgress: Record<LoadingStage, number> = {
  idle: 0,
  'creating-instance': 20,
  connecting: 40,
  'generating-qr': 60,
  'waiting-scan': 80,
  verifying: 95,
  connected: 100,
  error: 0
};

export const useLoadingProgress = () => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: 'Aguardando...',
    error: null
  });

  const [currentStage, setCurrentStage] = useState<LoadingStage>('idle');

  // Atualizar estado baseado no stage atual
  useEffect(() => {
    setState(prev => ({
      ...prev,
      progress: stageProgress[currentStage],
      stage: stageMessages[currentStage],
      isLoading: currentStage !== 'idle' && currentStage !== 'connected' && currentStage !== 'error'
    }));
  }, [currentStage]);

  const setStage = useCallback((stage: LoadingStage, error?: string) => {
    setCurrentStage(stage);
    if (error) {
      setState(prev => ({ ...prev, error }));
    } else {
      setState(prev => ({ ...prev, error: null }));
    }
  }, []);

  const startLoading = useCallback((initialStage: LoadingStage = 'creating-instance') => {
    setCurrentStage(initialStage);
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const stopLoading = useCallback(() => {
    setCurrentStage('idle');
  }, []);

  const setError = useCallback((error: string) => {
    setCurrentStage('error');
    setState(prev => ({ ...prev, error }));
  }, []);

  const resetProgress = useCallback(() => {
    setCurrentStage('idle');
    setState({
      isLoading: false,
      progress: 0,
      stage: stageMessages.idle,
      error: null
    });
  }, []);

  // Simular progresso automático entre stages
  const simulateProgress = useCallback(async (stages: LoadingStage[], delayMs = 1000) => {
    for (const stage of stages) {
      setStage(stage);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }, [setStage]);

  return {
    ...state,
    currentStage,
    setStage,
    startLoading,
    stopLoading,
    setError,
    resetProgress,
    simulateProgress,
    isIdle: currentStage === 'idle',
    isConnected: currentStage === 'connected',
    hasError: currentStage === 'error'
  };
};

// Hook especializado para loading de departamentos
export const useDepartmentsLoading = () => {
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

  const startDepartmentsLoading = useCallback(() => {
    setLoadingState('loading');
    setProgress(0);
    
    // Simular progresso realista para carregamento de departamentos
    const steps = [
      { progress: 20, delay: 200 },   // Conectando ao banco
      { progress: 40, delay: 400 },   // Buscando departamentos
      { progress: 60, delay: 300 },   // Carregando estatísticas
      { progress: 80, delay: 300 },   // Processando dados
      { progress: 95, delay: 200 },   // Finalizando
      { progress: 100, delay: 100 }   // Completo
    ];

    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setProgress(step.progress);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        setLoadingState('complete');
      }
    }, 100);

    // Cleanup
    return () => clearInterval(progressInterval);
  }, []);

  const resetDepartmentsLoading = useCallback(() => {
    setLoadingState('idle');
    setProgress(0);
  }, []);

  return {
    progress,
    isLoading: loadingState === 'loading',
    isComplete: loadingState === 'complete',
    startLoading: startDepartmentsLoading,
    resetLoading: resetDepartmentsLoading
  };
}; 