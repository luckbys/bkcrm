import { useState, useEffect, useCallback } from 'react';

interface SystemHealth {
  websocket: 'connected' | 'disconnected' | 'checking';
  evolution: 'connected' | 'disconnected' | 'checking';
  lastCheck: Date | null;
  errors: string[];
}

interface HealthCheckResponse {
  status: string;
  websocket?: {
    enabled: boolean;
    connections: number;
  };
  evolution?: {
    connected: boolean;
    instances: number;
  };
}

export const useSystemHealthCheck = (interval = 30000) => {
  const [health, setHealth] = useState<SystemHealth>({
    websocket: 'checking',
    evolution: 'checking',
    lastCheck: null,
    errors: []
  });

  const checkHealth = useCallback(async () => {
    try {
      // Detectar URL base automaticamente
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:4000'
        : 'https://websocket.bkcrm.devsible.com.br';

      // Implementar timeout manual para fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/webhook/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: HealthCheckResponse = await response.json();
        
        setHealth(prev => ({
          websocket: data.websocket?.enabled ? 'connected' : 'disconnected',
          evolution: data.evolution?.connected ? 'connected' : 'disconnected',
          lastCheck: new Date(),
          errors: []
        }));

        console.log('✅ [HEALTH] Sistema saudável:', {
          websocket: data.websocket?.connections || 0,
          evolution: data.evolution?.instances || 0
        });

      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      console.warn('⚠️ [HEALTH] Falha no health check:', error.message);
      
      setHealth(prev => ({
        ...prev,
        websocket: 'disconnected',
        evolution: 'disconnected',
        lastCheck: new Date(),
        errors: [...prev.errors.slice(-4), error.message] // Manter últimos 5 erros
      }));
    }
  }, []);

  // Health check automático
  useEffect(() => {
    // Check inicial
    checkHealth();

    // Check periódico
    const healthInterval = setInterval(checkHealth, interval);

    return () => {
      clearInterval(healthInterval);
    };
  }, [checkHealth, interval]);

  // Health check manual
  const forceCheck = useCallback(() => {
    setHealth(prev => ({
      ...prev,
      websocket: 'checking',
      evolution: 'checking'
    }));
    checkHealth();
  }, [checkHealth]);

  // Status geral do sistema
  const isHealthy = health.websocket === 'connected' && health.evolution === 'connected';
  const hasWarnings = health.websocket !== 'connected' || health.evolution !== 'connected';
  const isChecking = health.websocket === 'checking' || health.evolution === 'checking';

  return {
    health,
    isHealthy,
    hasWarnings,
    isChecking,
    forceCheck,
    // Métodos de utilidade
    getStatusColor: (status: string) => {
      switch (status) {
        case 'connected': return 'text-green-500';
        case 'disconnected': return 'text-red-500';
        case 'checking': return 'text-yellow-500';
        default: return 'text-gray-500';
      }
    },
    getStatusIcon: (status: string) => {
      switch (status) {
        case 'connected': return '✅';
        case 'disconnected': return '❌';
        case 'checking': return '🔄';
        default: return '❓';
      }
    },
    // Estatísticas
    getHealthStats: () => ({
      uptime: health.lastCheck ? Date.now() - health.lastCheck.getTime() : 0,
      errorCount: health.errors.length,
      lastError: health.errors[health.errors.length - 1] || null
    })
  };
}; 