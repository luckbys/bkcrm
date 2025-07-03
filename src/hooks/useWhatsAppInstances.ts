import { useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { useToast } from './use-toast';
import { 
  WhatsAppInstance, 
  WhatsAppSettings,
  CreateInstanceParams,
  QRCodeResponse,
  UseWhatsAppInstancesReturn
} from '../types/whatsapp.types';

export function useWhatsAppInstances(): UseWhatsAppInstancesReturn {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todas as instâncias
  const refreshInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<WhatsAppInstance[]>('/whatsapp/instances');
      setInstances(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Falha ao carregar instâncias do WhatsApp";
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
  const createInstance = useCallback(async (departmentId: string, params: CreateInstanceParams): Promise<WhatsAppInstance> => {
    try {
      const response = await api.post<WhatsAppInstance>('/whatsapp/instances', {
        departmentId,
        ...params
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      throw new Error(error.response?.data?.message || 'Falha ao criar instância');
    }
  }, []);

  // Conectar instância (gerar QR)
  const connectInstance = useCallback(async (instanceName: string): Promise<void> => {
    try {
      await api.post(`/whatsapp/instances/${instanceName}/connect`);
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      throw new Error(error.response?.data?.message || 'Falha ao conectar instância');
    }
  }, []);

  // Buscar QR Code
  const getQRCode = useCallback(async (instanceName: string): Promise<QRCodeResponse> => {
    try {
      const response = await api.get<QRCodeResponse>(`/whatsapp/instances/${instanceName}/qr`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar QR Code:', error);
      throw new Error(error.response?.data?.message || 'Falha ao gerar QR Code');
    }
  }, []);

  // Atualizar configurações
  const updateSettings = useCallback(async (instanceName: string, settings: Partial<WhatsAppSettings>): Promise<void> => {
    try {
      await api.put(`/whatsapp/instances/${instanceName}/settings`, settings);
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      throw new Error(error.response?.data?.message || 'Falha ao atualizar configurações');
    }
  }, []);

  // Deletar instância
  const deleteInstance = useCallback(async (instanceId: string): Promise<void> => {
    try {
      await api.delete(`/whatsapp/instances/${instanceId}`);
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      throw new Error(error.response?.data?.message || 'Falha ao remover instância');
    }
  }, []);

  // Buscar instância por departamento
  const getInstanceByDepartment = useCallback((departmentId: string): WhatsAppInstance | undefined => {
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
    getInstanceByDepartment
  };
} 