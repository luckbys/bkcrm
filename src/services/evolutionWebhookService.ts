import { evolutionApi } from './evolutionApi';

export const getInstanceWebhook = async (instanceName: string) => {
  try {
    const response = await evolutionApi.getInstanceWebhook(instanceName);
    return { success: true, webhook: response };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
};

export const setInstanceWebhook = async (instanceName: string, webhookData: { url: string; enabled: boolean; events: string[] }) => {
  try {
    await evolutionApi.setInstanceWebhook(instanceName, webhookData);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
};

export const removeInstanceWebhook = async (instanceName: string) => {
  try {
    await evolutionApi.removeInstanceWebhook(instanceName);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
};

export const testInstanceWebhook = async (instanceName: string) => {
  try {
    await evolutionApi.testInstanceWebhook(instanceName);
    return { success: true, message: 'Webhook test sent successfully.' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
};

export const validateWebhookUrl = (url: string) => {
  if (!url) {
    return { valid: false, error: 'URL is required.' };
  }
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
};

export const generateSuggestedWebhookUrl = () => {
  return `${window.location.origin}/api/webhook/evolution`;
};

export const getRecommendedEvents = () => {
  return [
    'messages.upsert', 
    'messages.update', 
    'connection.update', 
    'qrcode.updated'
  ];
};

export const getValidEvolutionEvents = () => {
  return [
    'APPLICATION_STARTUP',
    'QRCODE_UPDATED',
    'CONNECTION_UPDATE',
    'STATUS_INSTANCE',
    'MESSAGES_SET',
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'MESSAGES_DELETE',
    'SEND_MESSAGE',
    'CONTACTS_SET',
    'CONTACTS_UPSERT',
    'CONTACTS_UPDATE',
    'PRESENCE_UPDATE',
    'CHATS_SET',
    'CHATS_UPSERT',
    'CHATS_UPDATE',
    'CHATS_DELETE',
    'GROUPS_UPSERT',
    'GROUP_UPDATE',
    'GROUP_PARTICIPANTS_UPDATE',
    'NEW_JWT_TOKEN',
    'TYPEBOT_START',
    'TYPEBOT_CHANGE_STATUS',
    'CHAMA_AI_ACTION',
    'CHAMA_AI_TRANSCRIPTION',
    'WEBHOOK_SEND',
    'WEBHOOK_RECEIVE',
    'WEBHOOK_TESTED',
    'WEBHOOK_DELIVERED',
    'WEBHOOK_FAILED',
    'INSTANCE_CREATED',
    'INSTANCE_DELETED',
    'INSTANCE_CONNECTED',
    'INSTANCE_DISCONNECTED',
    'MEDIA_UPLOAD'
  ];
};

export const getEventDescription = (event: string): string => {
  const descriptions: Record<string, string> = {
    'APPLICATION_STARTUP': 'Aplicação iniciada - Disparado quando a aplicação Evolution API é iniciada',
    'QRCODE_UPDATED': 'QR Code atualizado - Novo QR Code gerado para conexão',
    'CONNECTION_UPDATE': 'Status de conexão - Mudanças no status de conexão da instância',
    'STATUS_INSTANCE': 'Status da instância - Informações sobre o status atual da instância',
    'MESSAGES_SET': 'Mensagens definidas - Conjunto inicial de mensagens carregadas',
    'MESSAGES_UPSERT': 'Mensagens inseridas/atualizadas - Novas mensagens recebidas ou atualizadas',
    'MESSAGES_UPDATE': 'Mensagens atualizadas - Mensagens existentes foram modificadas',
    'MESSAGES_DELETE': 'Mensagens deletadas - Mensagens foram removidas',
    'SEND_MESSAGE': 'Mensagem enviada - Confirmação de envio de mensagem',
    'CONTACTS_SET': 'Contatos definidos - Conjunto inicial de contatos carregados',
    'CONTACTS_UPSERT': 'Contatos inseridos/atualizados - Novos contatos ou atualizações',
    'CONTACTS_UPDATE': 'Contatos atualizados - Informações de contatos modificadas',
    'PRESENCE_UPDATE': 'Presença atualizada - Status online/offline de contatos',
    'CHATS_SET': 'Chats definidos - Conjunto inicial de chats carregados',
    'CHATS_UPSERT': 'Chats inseridos/atualizados - Novos chats ou atualizações',
    'CHATS_UPDATE': 'Chats atualizados - Informações de chats modificadas',
    'CHATS_DELETE': 'Chats deletados - Chats foram removidos',
    'GROUPS_UPSERT': 'Grupos inseridos/atualizados - Novos grupos ou atualizações',
    'GROUP_UPDATE': 'Grupos atualizados - Informações de grupos modificadas',
    'GROUP_PARTICIPANTS_UPDATE': 'Participantes do grupo atualizados - Mudanças nos membros do grupo',
    'NEW_JWT_TOKEN': 'Novo token JWT - Token de autenticação renovado',
    'TYPEBOT_START': 'Typebot iniciado - Integração com Typebot iniciada',
    'TYPEBOT_CHANGE_STATUS': 'Status do Typebot alterado - Mudanças no status do Typebot',
    'CHAMA_AI_ACTION': 'Ação do Chama AI - Ações processadas pelo Chama AI',
    'CHAMA_AI_TRANSCRIPTION': 'Transcrição do Chama AI - Transcrições de áudio processadas',
    'WEBHOOK_SEND': 'Webhook enviado - Webhook foi enviado com sucesso',
    'WEBHOOK_RECEIVE': 'Webhook recebido - Webhook foi recebido e processado',
    'WEBHOOK_TESTED': 'Webhook testado - Teste de webhook executado',
    'WEBHOOK_DELIVERED': 'Webhook entregue - Webhook foi entregue com sucesso',
    'WEBHOOK_FAILED': 'Webhook falhou - Falha na entrega do webhook',
    'INSTANCE_CREATED': 'Instância criada - Nova instância foi criada',
    'INSTANCE_DELETED': 'Instância deletada - Instância foi removida',
    'INSTANCE_CONNECTED': 'Instância conectada - Instância estabeleceu conexão',
    'INSTANCE_DISCONNECTED': 'Instância desconectada - Instância perdeu conexão',
    'MEDIA_UPLOAD': 'Upload de mídia - Arquivo de mídia foi enviado'
  };

  return descriptions[event] || `Evento ${event} - Descrição não disponível`;
};