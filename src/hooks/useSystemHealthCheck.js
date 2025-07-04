import { useState, useEffect } from 'react';
import { evolutionApi } from '../services/evolutionApi';
export const useSystemHealthCheck = () => {
    const [health, setHealth] = useState({
        evolution: 'checking',
        lastCheck: null,
    });
    const [stats, setStats] = useState({});
    const checkHealth = async () => {
        try {
            setHealth(prev => ({ ...prev, evolution: 'checking' }));
            // Verificar Evolution API
            const evolutionStats = await evolutionApi.getStats();
            setHealth({
                evolution: evolutionStats ? 'connected' : 'disconnected',
                lastCheck: new Date(),
            });
            setStats({
                evolution: {
                    totalInstances: evolutionStats?.totalInstances || 0,
                    connectedInstances: evolutionStats?.connectedInstances || 0,
                    activeConnections: evolutionStats?.activeConnections || 0,
                },
            });
        }
        catch (error) {
            console.error('❌ [HealthCheck] Erro:', error);
            setHealth({
                evolution: 'disconnected',
                lastCheck: new Date(),
            });
        }
    };
    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const refresh = async () => {
        setHealth(prev => ({ ...prev, evolution: 'checking' }));
        await checkHealth();
    };
    const isHealthy = health.evolution === 'connected';
    const hasWarnings = health.evolution !== 'connected';
    const isChecking = health.evolution === 'checking';
    return {
        health,
        stats,
        isHealthy,
        hasWarnings,
        isChecking,
        refresh,
    };
};
