import { useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { useToast } from './use-toast';
import { createEvolutionInstance } from '../utils/evolutionApi';
export function useWhatsAppInstances() {
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    // Buscar todas as instâncias
    const refreshInstances = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/whatsapp/instances');
            setInstances(response.data);
        }
        catch (error) {
            const errorMsg = error.response?.data?.message || "Falha ao carregar instâncias do WhatsApp";
            console.error('Erro ao buscar instâncias:', error);
            setError(errorMsg);
            toast({
                title: "Erro ao buscar instâncias",
                description: errorMsg,
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    // Criar nova instância
    const createInstance = useCallback(async (departmentId, params) => {
        try {
            const response = await api.post('/whatsapp/instances', {
                departmentId,
                ...params
            });
            return response.data;
        }
        catch (error) {
            console.error('Erro ao criar instância:', error);
            throw new Error(error.response?.data?.message || 'Falha ao criar instância');
        }
    }, []);
    // Criar nova instância Evolution API
    const createInstanceEvolutionAPI = useCallback(async (instanceData) => {
        const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
        if (!apiKey)
            throw new Error('API Key não configurada');
        return createEvolutionInstance(instanceData, apiKey);
    }, []);
    // Conectar instância (gerar QR)
    const connectInstance = useCallback(async (instanceName) => {
        try {
            await api.post(`/whatsapp/instances/${instanceName}/connect`);
        }
        catch (error) {
            console.error('Erro ao conectar instância:', error);
            throw new Error(error.response?.data?.message || 'Falha ao conectar instância');
        }
    }, []);
    // Buscar QR Code
    const getQRCode = useCallback(async (instanceName) => {
        try {
            const response = await api.get(`/whatsapp/instances/${instanceName}/qr`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar QR Code:', error);
            throw new Error(error.response?.data?.message || 'Falha ao gerar QR Code');
        }
    }, []);
    // Atualizar configurações
    const updateSettings = useCallback(async (instanceName, settings) => {
        try {
            await api.put(`/whatsapp/instances/${instanceName}/settings`, settings);
        }
        catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            throw new Error(error.response?.data?.message || 'Falha ao atualizar configurações');
        }
    }, []);
    // Deletar instância
    const deleteInstance = useCallback(async (instanceId) => {
        try {
            await api.delete(`/whatsapp/instances/${instanceId}`);
        }
        catch (error) {
            console.error('Erro ao deletar instância:', error);
            throw new Error(error.response?.data?.message || 'Falha ao remover instância');
        }
    }, []);
    // Buscar instância por departamento
    const getInstanceByDepartment = useCallback((departmentId) => {
        return instances.find(instance => instance.departmentId === departmentId);
    }, [instances]);
    return {
        instances,
        loading,
        error,
        refreshInstances,
        createInstance,
        connectInstance,
        getQRCode,
        updateSettings,
        deleteInstance,
        getInstanceByDepartment,
        createInstanceEvolutionAPI
    };
}
