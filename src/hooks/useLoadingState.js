import { useState, useCallback } from 'react';
export const useLoadingState = (options = {}) => {
    const { initialState = {}, retryAttempts = 3, loadingTimeout = 10000 } = options;
    const [loadingState, setLoadingState] = useState({
        isLoading: false,
        error: null,
        progress: 0,
        stage: undefined,
        ...initialState
    });
    const [retryCount, setRetryCount] = useState(0);
    // Inicia o carregamento
    const startLoading = useCallback((stage) => {
        setLoadingState({
            isLoading: true,
            error: null,
            progress: 0,
            stage
        });
    }, []);
    // Atualiza o progresso
    const updateProgress = useCallback((progress, stage) => {
        setLoadingState(prev => ({
            ...prev,
            progress: Math.max(0, Math.min(100, progress)),
            stage: stage || prev.stage
        }));
    }, []);
    // Finaliza com sucesso
    const finishLoading = useCallback(() => {
        setLoadingState({
            isLoading: false,
            error: null,
            progress: 100,
            stage: undefined
        });
        setRetryCount(0);
    }, []);
    // Finaliza com erro
    const setError = useCallback((error) => {
        setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            error,
            stage: undefined
        }));
    }, []);
    // Retry logic
    const retry = useCallback(() => {
        if (retryCount < retryAttempts) {
            setRetryCount(prev => prev + 1);
            setLoadingState({
                isLoading: false,
                error: null,
                progress: 0,
                stage: undefined
            });
            return true;
        }
        return false;
    }, [retryCount, retryAttempts]);
    // Reset completo
    const reset = useCallback(() => {
        setLoadingState({
            isLoading: false,
            error: null,
            progress: 0,
            stage: undefined
        });
        setRetryCount(0);
    }, []);
    // Simula carregamento com etapas
    const simulateLoading = useCallback(async (stages) => {
        startLoading();
        try {
            for (const { stage, duration, progress } of stages) {
                updateProgress(progress, stage);
                await new Promise(resolve => setTimeout(resolve, duration));
            }
            finishLoading();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Erro desconhecido');
        }
    }, [startLoading, updateProgress, finishLoading, setError]);
    return {
        loadingState,
        retryCount,
        actions: {
            startLoading,
            updateProgress,
            finishLoading,
            setError,
            retry,
            reset,
            simulateLoading
        },
        computed: {
            canRetry: retryCount < retryAttempts,
            isRetrying: retryCount > 0,
            hasError: !!loadingState.error,
            isComplete: !loadingState.isLoading && loadingState.progress === 100 && !loadingState.error
        }
    };
};
