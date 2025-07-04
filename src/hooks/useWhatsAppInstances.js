import { useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { useToast } from './use-toast';
import { evolutionApi } from '../services/evolutionApi';

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
            
            // Tentar buscar do backend primeiro, se falhar, buscar da Evolution API
            try {
                const response = await api.get('/whatsapp/instances');
                setInstances(response.data);
            } catch (backendError) {
                console.log('Backend indisponível, buscando da Evolution API...');
                // Buscar diretamente da Evolution API
                const evolutionInstances = await evolutionApi.fetchInstances();
                setInstances(evolutionInstances || []);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Falha ao carregar instâncias do WhatsApp";
            console.error('Erro ao buscar instâncias:', error);
            setError(errorMsg);
            toast({
                title: "Erro ao buscar instâncias",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
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
        } catch (error) {
            console.error('Erro ao criar instância:', error);
            throw new Error(error.response?.data?.message || 'Falha ao criar instância');
        }
    }, []);

    // Criar nova instância Evolution API
    const createInstanceEvolutionAPI = useCallback(async (instanceData) => {
        try {
            const instanceName = instanceData.instanceName || `whatsapp-dep-${instanceData.departmentId || 'default'}`;
            
            console.log('🚀 Criando instância:', instanceName);
            
            // Verificar se já existe
            const exists = await evolutionApi.instanceExists(instanceName);
            if (exists) {
                throw new Error(`Instância ${instanceName} já existe`);
            }

            // Criar instância na Evolution API
            const response = await evolutionApi.createInstance({
                instanceName: instanceName,
                token: instanceData.token || '',
                qrcode: true,
                webhook: instanceData.webhook || 'https://webhook.bkcrm.devsible.com.br/webhook/evolution'
            });

            console.log('✅ Instância criada:', response);

            // Salvar no banco de dados local se possível
            try {
                await api.post('/whatsapp/instances', {
                    instanceName: instanceName,
                    departmentId: instanceData.departmentId,
                    status: 'created',
                    evolutionData: response
                });
            } catch (dbError) {
                console.warn('⚠️ Não foi possível salvar no banco local:', dbError.message);
            }

            return response;
        } catch (error) {
            console.error('❌ Erro ao criar instância Evolution:', error);
            throw new Error(error.message || 'Falha ao criar instância na Evolution API');
        }
    }, []);

    // Conectar instância (gerar QR)
    const connectInstance = useCallback(async (instanceName) => {
        try {
            // Tentar via backend primeiro
            try {
                await api.post(`/whatsapp/instances/${instanceName}/connect`);
            } catch (backendError) {
                console.log('Backend indisponível, conectando via Evolution API...');
                // Se backend falhar, tentar diretamente na Evolution API
                await evolutionApi.getInstanceStatus(instanceName);
            }
        } catch (error) {
            console.error('Erro ao conectar instância:', error);
            throw new Error(error.response?.data?.message || error.message || 'Falha ao conectar instância');
        }
    }, []);

    // Buscar QR Code
    const getQRCode = useCallback(async (instanceName) => {
        try {
            // Tentar via backend primeiro
            try {
                const response = await api.get(`/whatsapp/instances/${instanceName}/qr`);
                return response.data;
            } catch (backendError) {
                console.log('Backend indisponível, buscando QR via Evolution API...');
                // Se backend falhar, buscar diretamente da Evolution API
                const qrResponse = await evolutionApi.getInstanceQRCode(instanceName);
                return qrResponse;
            }
        } catch (error) {
            console.error('Erro ao buscar QR Code:', error);
            throw new Error(error.response?.data?.message || error.message || 'Falha ao gerar QR Code');
        }
    }, []);

    // Atualizar configurações
    const updateSettings = useCallback(async (instanceName, settings) => {
        try {
            await api.put(`/whatsapp/instances/${instanceName}/settings`, settings);
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            throw new Error(error.response?.data?.message || 'Falha ao atualizar configurações');
        }
    }, []);

    // Deletar instância
    const deleteInstance = useCallback(async (instanceId) => {
        try {
            // Tentar via backend primeiro
            try {
                await api.delete(`/whatsapp/instances/${instanceId}`);
            } catch (backendError) {
                console.log('Backend indisponível, deletando via Evolution API...');
                // Se backend falhar, deletar diretamente da Evolution API
                await evolutionApi.deleteInstance(instanceId);
            }
        } catch (error) {
            console.error('Erro ao deletar instância:', error);
            throw new Error(error.response?.data?.message || error.message || 'Falha ao remover instância');
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
