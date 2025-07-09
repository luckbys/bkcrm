import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import * as webhookService from '@/services/evolutionWebhookService';

export const useEvolutionWebhook = (instanceName: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: webhook, isLoading, isError } = useQuery({
    queryKey: ['evolutionWebhook', instanceName],
    queryFn: async () => {
      const result = await webhookService.getInstanceWebhook(instanceName);
      if (result.success) {
        return result.webhook;
      }
      return null;
    },
    enabled: !!instanceName,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolutionWebhook', instanceName] });
    },
    onError: (error: Error) => {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive",
      });
    },
  };

  const saveWebhook = useMutation(
    async (webhookData: { url: string; enabled: boolean; events: string[] }) => {
      const validation = webhookService.validateWebhookUrl(webhookData.url);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const result = await webhookService.setInstanceWebhook(instanceName, webhookData);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
    },
    {
      ...mutationOptions,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['evolutionWebhook', instanceName] });
        toast({
          title: "Webhook Saved",
          description: "The webhook configuration has been successfully saved.",
        });
      },
    }
  );

  const removeWebhook = useMutation(
    async () => {
      const result = await webhookService.removeInstanceWebhook(instanceName);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
    },
    {
      ...mutationOptions,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['evolutionWebhook', instanceName] });
        toast({
          title: "Webhook Removed",
          description: "The webhook configuration has been successfully removed.",
        });
      },
    }
  );

  const testWebhook = useMutation(
    async () => {
      const result = await webhookService.testInstanceWebhook(instanceName);
      if (result.success) {
        toast({
          title: "Webhook Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Webhook Test Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    }
  );

  return {
    webhook,
    isLoadingWebhook: isLoading,
    isErrorWebhook: isError,
    saveWebhook: saveWebhook.mutateAsync,
    removeWebhook: removeWebhook.mutateAsync,
    testWebhook: testWebhook.mutateAsync,
    generateSuggestedWebhookUrl: webhookService.generateSuggestedWebhookUrl,
    getRecommendedEvents: webhookService.getRecommendedEvents,
  };
};