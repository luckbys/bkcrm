
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { evolutionApi, EvolutionInstanceStatus } from '@/services/evolutionApi';
import { useToast } from '@/components/ui/use-toast';

export interface DepartmentInstance {
  id: string;
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  departmentId: string;
  departmentName: string;
  phone?: string;
  connected: boolean;
  lastUpdate: Date;
  qrCode?: string;
  isDefault: boolean;
  createdBy?: string;
}

const fetchDepartmentInstances = async (departmentId: string): Promise<DepartmentInstance[]> => {
  if (!departmentId) return [];

  const { data: dbInstances, error } = await supabase
    .from('evolution_instances')
    .select('*')
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading instances from db:', error);
    throw error;
  }

  const instancesWithStatus = await Promise.all(
    (dbInstances || []).map(async (instance) => {
      let evolutionStatus: 'open' | 'close' | 'connecting' | 'unknown' = 'close';
      let isConnected = false;
      let phone: string | undefined;

      try {
        const statusPromise = evolutionApi.getInstanceStatus(instance.instance_name);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );
        
        const status = await Promise.race([statusPromise, timeoutPromise]) as EvolutionInstanceStatus;
        
        if (status?.instance?.state) {
          evolutionStatus = status.instance.state;
          isConnected = status.instance.state === 'open';
          phone = status.instance.owner?.replace('@s.whatsapp.net', '');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.warn(`Could not get Evolution API status for ${instance.instance_name}:`, errorMessage);
        evolutionStatus = 'unknown';
      }

      return {
        id: instance.id,
        instanceName: instance.instance_name,
        status: evolutionStatus,
        departmentId: instance.department_id,
        departmentName: instance.department_name,
        phone: instance.phone || phone,
        connected: isConnected,
        lastUpdate: new Date(instance.updated_at),
        isDefault: instance.is_default || false,
        createdBy: instance.created_by,
      };
    })
  );

  return instancesWithStatus;
};

export const useEvolutionInstances = (departmentId: string, departmentName: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: instances = [], isLoading, isError, refetch } = useQuery<DepartmentInstance[]>({
    queryKey: ['evolutionInstances', departmentId],
    queryFn: () => fetchDepartmentInstances(departmentId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 45000, // 45 seconds
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolutionInstances', departmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive",
      });
    },
  };

  const createInstance = useMutation(
    async ({ instanceName, isDefault }: { instanceName: string; isDefault: boolean }) => {
      const finalInstanceName = `${departmentName.toLowerCase().replace(/\s+/g, '-')}-${instanceName.toLowerCase().replace(/\s+/g, '-')}`;
      
      const exists = await evolutionApi.instanceExists(finalInstanceName);
      if (exists) {
        throw new Error('Instance already exists');
      }

      await evolutionApi.createInstance({
        instanceName: finalInstanceName,
        qrcode: true,
      });

      const { error } = await supabase.from('evolution_instances').insert({
        instance_name: finalInstanceName,
        department_id: departmentId,
        department_name: departmentName,
        is_active: true,
        is_default: isDefault,
        created_by: 'system',
      });

      if (error) throw error;

      return finalInstanceName;
    },
    {
      ...mutationOptions,
      onSuccess: (instanceName) => {
        queryClient.invalidateQueries({ queryKey: ['evolutionInstances', departmentId] });
        toast({
          title: "Instance Created",
          description: `Instance ${instanceName} created successfully.`,
        });
      },
    }
  );

  const deleteInstance = useMutation(
    async (instanceName: string) => {
      await evolutionApi.deleteInstance(instanceName);
      const { error } = await supabase
        .from('evolution_instances')
        .update({ is_active: false })
        .eq('instance_name', instanceName);
      if (error) throw error;
    },
    {
      ...mutationOptions,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['evolutionInstances', departmentId] });
        toast({
          title: "Instance Deleted",
          description: "The instance has been successfully deleted.",
        });
      },
    }
  );

  const setAsDefaultInstance = useMutation(
    async (instanceName: string) => {
      await supabase
        .from('evolution_instances')
        .update({ is_default: false })
        .eq('department_id', departmentId);
        
      await supabase
        .from('evolution_instances')
        .update({ is_default: true })
        .eq('instance_name', instanceName)
        .eq('department_id', departmentId);
    },
    {
      ...mutationOptions,
      onSuccess: (_, instanceName) => {
        queryClient.setQueryData(['evolutionInstances', departmentId], (oldData: DepartmentInstance[] | undefined) => 
          oldData?.map(instance => ({
            ...instance,
            isDefault: instance.instanceName === instanceName,
          })) || []
        );
        toast({
          title: "Default Instance Set",
          description: `Instance ${instanceName} is now the default for this department.`,
        });
      },
    }
  );

  return {
    instances,
    isLoading,
    isError,
    refetchInstances: refetch,
    createInstance: createInstance.mutateAsync,
    deleteInstance: deleteInstance.mutateAsync,
    setAsDefaultInstance: setAsDefaultInstance.mutateAsync,
  };
};
