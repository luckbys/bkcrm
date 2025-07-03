import { useState, useEffect, useCallback } from 'react';

interface UseLoadingProgressOptions {
  duration?: number;
  steps?: number;
  initialProgress?: number;
  autoComplete?: boolean;
}

interface UseLoadingProgressReturn {
  progress: number;
  isLoading: boolean;
  startLoading: () => void;
  completeLoading: () => void;
  resetLoading: () => void;
  setProgress: (progress: number) => void;
}

export const useLoadingProgress = ({
  duration = 2000,
  steps = 100,
  initialProgress = 0,
  autoComplete = true
}: UseLoadingProgressOptions = {}): UseLoadingProgressReturn => {
  const [progress, setProgress] = useState(initialProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    
    if (autoComplete) {
      const stepDuration = duration / steps;
      const stepIncrement = 100 / steps;
      
      const id = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + stepIncrement;
          if (newProgress >= 100) {
            clearInterval(id);
            setIsLoading(false);
            return 100;
          }
          return newProgress;
        });
      }, stepDuration);
      
      setIntervalId(id);
    }
  }, [duration, steps, autoComplete]);

  const completeLoading = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setProgress(100);
    setIsLoading(false);
  }, [intervalId]);

  const resetLoading = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setProgress(initialProgress);
    setIsLoading(false);
  }, [intervalId, initialProgress]);

  const setProgressManually = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    progress,
    isLoading,
    startLoading,
    completeLoading,
    resetLoading,
    setProgress: setProgressManually
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