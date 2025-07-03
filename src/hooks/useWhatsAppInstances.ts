import { useState, useEffect, useCallback } from 'react';
import { evolutionAPI } from '../services/evolutionAPI';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import {
  DepartmentWhatsAppConfig,
  WhatsAppInstance,
  CreateInstanceData,
  QRCodeResponse
} from '../types/whatsapp.types';

interface UseWhatsAppInstancesReturn {
  instances: DepartmentWhatsAppConfig[];
  loading: boolean;
  error: string | null;
  createInstance: (departmentId: string, config?: Partial<CreateInstanceData>) => Promise<DepartmentWhatsAppConfig>;
  deleteInstance: (instanceId: string) => Promise<void>;
  connectInstance: (instanceName: string) => Promise<void>;
  disconnectInstance: (instanceName: string) => Promise<void>;
  getQRCode: (instanceName: string) => Promise<QRCodeResponse>;
  updateInstanceConfig: (instanceId: string, config: Partial<DepartmentWhatsAppConfig>) => Promise<void>;
  checkInstanceHealth: (instanceName: string) => Promise<{ isHealthy: boolean; status: string }>;
  refreshInstances: () => Promise<void>;
  syncInstancesStatus: () => Promise<void>;
}

export const useWhatsAppInstances = (): UseWhatsAppInstancesReturn => {
  const [instances, setInstances] = useState<DepartmentWhatsAppConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar instâncias do banco de dados
  const loadInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(`Erro ao carregar instâncias: ${supabaseError.message}`);
      }

      const instances: DepartmentWhatsAppConfig[] = (data || []).map(item => ({
        id: item.id,
        instance_id: item.instance_id,
        departmentId: item.department_id,
        instanceName: item.instance_name,
        integration: item.integration || 'WHATSAPP-BAILEYS',
        status: item.status || 'inactive',
        phoneNumber: item.phone_number,
        profileName: item.profile_name,
        profilePictureUrl: item.profile_picture_url,
        lastConnection: item.last_connection,
        autoReply: item.auto_reply || false,
        businessHours: item.business_hours || {
          enabled: false,
          days: [1, 2, 3, 4, 5],
          timezone: 'America/Sao_Paulo'
        },
        welcomeMessage: item.welcome_message,
        awayMessage: item.away_message,
        webhookUrl: item.webhook_url,
        settings: item.settings || {
          reject_call: false,
          groups_ignore: false,
          always_online: true,
          read_messages: true,
          read_status: false,
          sync_full_history: false
        },
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setInstances(instances);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar instâncias WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova instância
  const createInstance = useCallback(async (
    departmentId: string,
    config: Partial<CreateInstanceData> = {}
  ): Promise<DepartmentWhatsAppConfig> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar informações do departamento
      const { data: department } = await supabase
        .from('departments')
        .select('name')
        .eq('id', departmentId)
        .single();

      if (!department) {
        throw new Error('Departamento não encontrado');
      }

      // Criar instância via Evolution API
      const whatsappConfig = await evolutionAPI.createDepartmentInstance(
        departmentId,
        department.name,
        config
      );

      // Gerar UUID para a chave primária
      const uuid = generateUUID();

      // Salvar no banco de dados
      const { data: savedInstance, error: saveError } = await supabase
        .from('whatsapp_instances')
        .insert({
          id: uuid, // UUID como chave primária
          instance_id: whatsappConfig.id, // ID da Evolution API
          department_id: whatsappConfig.departmentId,
          instance_name: whatsappConfig.instanceName,
          integration: whatsappConfig.integration,
          status: whatsappConfig.status,
          auto_reply: whatsappConfig.autoReply,
          business_hours: whatsappConfig.businessHours,
          welcome_message: whatsappConfig.welcomeMessage,
          away_message: whatsappConfig.awayMessage,
          webhook_url: whatsappConfig.webhookUrl,
          settings: whatsappConfig.settings,
          created_at: whatsappConfig.createdAt,
          updated_at: whatsappConfig.updatedAt
        })
        .select()
        .single();

      if (saveError) {
        // Se falhou ao salvar, tentar deletar a instância criada na Evolution API
        try {
          await evolutionAPI.deleteInstance(whatsappConfig.instanceName);
        } catch (cleanupError) {
          console.error('Erro ao limpar instância após falha:', cleanupError);
        }
        throw new Error(`Erro ao salvar instância: ${saveError.message}`);
      }

      // Atualizar estado local
      await loadInstances();

      return {
        ...whatsappConfig,
        id: uuid,
        instance_id: whatsappConfig.id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInstances]);

  // Deletar instância
  const deleteInstance = useCallback(async (instanceId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar instância no banco
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('id', instanceId)
        .single();

      if (instance) {
        // Deletar da Evolution API
        try {
          await evolutionAPI.deleteInstance(instance.instance_name);
        } catch (apiError) {
          console.warn('Instância pode não existir na Evolution API:', apiError);
        }
      }

      // Deletar do banco de dados
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (deleteError) {
        throw new Error(`Erro ao deletar instância: ${deleteError.message}`);
      }

      // Atualizar estado local
      await loadInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar instância';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInstances]);

  // Conectar instância
  const connectInstance = useCallback(async (instanceName: string): Promise<void> => {
    try {
      setError(null);
      await evolutionAPI.connectInstance(instanceName);
      
      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      await loadInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar instância';
      setError(errorMessage);
      throw err;
    }
  }, [loadInstances]);

  // Desconectar instância
  const disconnectInstance = useCallback(async (instanceName: string): Promise<void> => {
    try {
      setError(null);
      await evolutionAPI.logoutInstance(instanceName);
      
      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      await loadInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desconectar instância';
      setError(errorMessage);
      throw err;
    }
  }, [loadInstances]);

  // Obter QR Code
  const getQRCode = useCallback(async (instanceName: string): Promise<QRCodeResponse> => {
    try {
      setError(null);
      return await evolutionAPI.getQRCode(instanceName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter QR Code';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Sincronizar status de todas as instâncias com a Evolution API
  const syncInstancesStatus = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Buscar todas as instâncias do banco
      const { data: dbInstances } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, status, last_connection')
        .not('instance_name', 'is', null);

      if (!dbInstances || dbInstances.length === 0) return;

      // Verificar status de cada instância na Evolution API
      const statusUpdates = await Promise.allSettled(
        dbInstances.map(async (instance) => {
          try {
            const health = await evolutionAPI.checkInstanceHealth(instance.instance_name);
            const apiStatus = health.isHealthy && health.status === 'open' ? 'active' : 
                            health.status === 'connecting' ? 'connecting' :
                            health.status === 'qrcode' ? 'qrcode' : 'inactive';
            
            // Atualizar no banco se o status mudou
            if (instance.status !== apiStatus) {
              await supabase
                .from('whatsapp_instances')
                .update({ 
                  status: apiStatus,
                  last_connection: apiStatus === 'active' ? new Date().toISOString() : instance.last_connection,
                  updated_at: new Date().toISOString()
                })
                .eq('id', instance.id);
              
              console.log(`📱 Status atualizado: ${instance.instance_name} -> ${apiStatus}`);
            }
            
            return { instanceName: instance.instance_name, status: apiStatus };
          } catch (err) {
            console.warn(`⚠️ Erro ao verificar instância ${instance.instance_name}:`, err);
            return { instanceName: instance.instance_name, status: 'error' };
          }
        })
      );

      // Recarregar instâncias após sincronização
      await loadInstances();
      
      console.log('🔄 Sincronização de status concluída:', statusUpdates);
    } catch (err) {
      console.error('Erro na sincronização de status:', err);
      setError('Erro ao sincronizar status das instâncias');
    }
  }, [loadInstances]);

  // Atualizar configurações da instância
  const updateInstanceConfig = useCallback(async (
    instanceId: string,
    config: Partial<DepartmentWhatsAppConfig>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (config.autoReply !== undefined) updateData.auto_reply = config.autoReply;
      if (config.businessHours) updateData.business_hours = config.businessHours;
      if (config.welcomeMessage !== undefined) updateData.welcome_message = config.welcomeMessage;
      if (config.awayMessage !== undefined) updateData.away_message = config.awayMessage;
      if (config.webhookUrl !== undefined) updateData.webhook_url = config.webhookUrl;
      if (config.settings) updateData.settings = config.settings;
      if (config.status) updateData.status = config.status;
      if (config.phoneNumber) updateData.phone_number = config.phoneNumber;
      if (config.profileName) updateData.profile_name = config.profileName;
      if (config.profilePictureUrl) updateData.profile_picture_url = config.profilePictureUrl;

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId);

      if (updateError) {
        throw new Error(`Erro ao atualizar instância: ${updateError.message}`);
      }

      await loadInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar instância';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInstances]);

  // Verificar saúde da instância
  const checkInstanceHealth = useCallback(async (instanceName: string) => {
    try {
      setError(null);
      return await evolutionAPI.checkInstanceHealth(instanceName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar instância';
      setError(errorMessage);
      return { isHealthy: false, status: 'error' };
    }
  }, []);

  // Atualizar instâncias
  const refreshInstances = useCallback(async (): Promise<void> => {
    await loadInstances();
  }, [loadInstances]);

  // Carregar instâncias na inicialização
  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // Sincronizar status automaticamente a cada 30 segundos quando há instâncias
  useEffect(() => {
    if (instances.length === 0) return;

    const interval = setInterval(() => {
      syncInstancesStatus();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [instances.length, syncInstancesStatus]);

  return {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
    getQRCode,
    updateInstanceConfig,
    checkInstanceHealth,
    refreshInstances,
    syncInstancesStatus
  };
}; 