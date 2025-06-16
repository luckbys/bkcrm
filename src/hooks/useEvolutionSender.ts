import { useState } from 'react';
import { useToast } from './use-toast';

interface SendMessageData {
  phone: string;
  text: string;
  instance?: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording' | 'paused';
    linkPreview?: boolean;
  };
}

interface ReplyMessageData extends SendMessageData {
  quotedMessage: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
    text?: string;
    conversation?: string;
  };
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

const WEBHOOK_BASE_URL = 'https://bkcrm.devsible.com.br'; // Produção
// const WEBHOOK_BASE_URL = 'http://localhost:4000'; // Local

export function useEvolutionSender() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Enviar mensagem de texto simples
   */
  const sendMessage = async (data: SendMessageData): Promise<SendMessageResponse> => {
    setIsLoading(true);
    
    try {
      console.log('📤 [HOOK] Enviando mensagem:', {
        phone: data.phone,
        text: data.text.substring(0, 50) + '...',
        instance: data.instance
      });

      const response = await fetch(`${WEBHOOK_BASE_URL}/webhook/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: data.phone,
          text: data.text,
          instance: data.instance || 'atendimento-ao-cliente-sac1',
          options: {
            delay: 1000,
            presence: 'composing',
            linkPreview: true,
            ...data.options
          }
        })
      });

      const result: SendMessageResponse = await response.json();

      if (result.success) {
        console.log('✅ [HOOK] Mensagem enviada com sucesso:', result.messageId);
        
        toast({
          title: "Mensagem enviada! 📤",
          description: `Mensagem entregue ao WhatsApp com sucesso.`,
          duration: 3000
        });
      } else {
        console.error('❌ [HOOK] Erro ao enviar mensagem:', result.error);
        
        toast({
          title: "Erro ao enviar mensagem ❌",
          description: result.error || 'Erro desconhecido',
          variant: "destructive",
          duration: 5000
        });
      }

      return result;

    } catch (error) {
      console.error('❌ [HOOK] Erro na requisição:', error);
      
      const errorResult: SendMessageResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
        timestamp: new Date().toISOString()
      };

      toast({
        title: "Falha na comunicação ⚠️",
        description: "Não foi possível conectar com o servidor",
        variant: "destructive",
        duration: 5000
      });

      return errorResult;

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Responder a uma mensagem específica
   */
  const replyToMessage = async (data: ReplyMessageData): Promise<SendMessageResponse> => {
    setIsLoading(true);
    
    try {
      console.log('💬 [HOOK] Respondendo mensagem:', {
        phone: data.phone,
        text: data.text.substring(0, 50) + '...',
        quotedMessageId: data.quotedMessage.id
      });

      const response = await fetch(`${WEBHOOK_BASE_URL}/webhook/reply-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: data.phone,
          text: data.text,
          instance: data.instance || 'atendimento-ao-cliente-sac1',
          quotedMessage: data.quotedMessage,
          options: {
            delay: 1000,
            presence: 'composing',
            linkPreview: true,
            ...data.options
          }
        })
      });

      const result: SendMessageResponse = await response.json();

      if (result.success) {
        console.log('✅ [HOOK] Resposta enviada com sucesso:', result.messageId);
        
        toast({
          title: "Resposta enviada! 💬",
          description: `Resposta entregue ao WhatsApp com sucesso.`,
          duration: 3000
        });
      } else {
        console.error('❌ [HOOK] Erro ao enviar resposta:', result.error);
        
        toast({
          title: "Erro ao enviar resposta ❌",
          description: result.error || 'Erro desconhecido',
          variant: "destructive",
          duration: 5000
        });
      }

      return result;

    } catch (error) {
      console.error('❌ [HOOK] Erro na requisição de resposta:', error);
      
      const errorResult: SendMessageResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
        timestamp: new Date().toISOString()
      };

      toast({
        title: "Falha na comunicação ⚠️",
        description: "Não foi possível conectar com o servidor",
        variant: "destructive",
        duration: 5000
      });

      return errorResult;

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Enviar múltiplas mensagens em sequência
   */
  const sendMultipleMessages = async (messages: SendMessageData[]): Promise<SendMessageResponse[]> => {
    const results: SendMessageResponse[] = [];
    
    for (const message of messages) {
      const result = await sendMessage(message);
      results.push(result);
      
      // Delay entre mensagens para evitar spam
      if (messages.indexOf(message) < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  };

  /**
   * Verificar se o servidor está disponível
   */
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${WEBHOOK_BASE_URL}/webhook/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('🏥 [HOOK] Health check:', {
        status: result.status,
        features: result.features
      });

      return result.status === 'healthy' && result.features?.sending === true;

    } catch (error) {
      console.error('❌ [HOOK] Servidor indisponível:', error);
      return false;
    }
  };

  /**
   * Formatar número para envio
   */
  const formatPhoneForSending = (phone: string): string => {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adicionar +55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  };

  /**
   * Validar dados da mensagem antes do envio
   */
  const validateMessageData = (data: SendMessageData): { valid: boolean; error?: string } => {
    if (!data.phone || data.phone.trim() === '') {
      return { valid: false, error: 'Número de telefone é obrigatório' };
    }

    if (!data.text || data.text.trim() === '') {
      return { valid: false, error: 'Texto da mensagem é obrigatório' };
    }

    if (data.text.length > 4096) {
      return { valid: false, error: 'Mensagem muito longa (máximo 4096 caracteres)' };
    }

    const phoneRegex = /^\d{10,15}$/;
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return { valid: false, error: 'Formato de telefone inválido' };
    }

    return { valid: true };
  };

  return {
    sendMessage,
    replyToMessage,
    sendMultipleMessages,
    checkServerHealth,
    formatPhoneForSending,
    validateMessageData,
    isLoading
  };
}

// Tipos para export
export type { SendMessageData, ReplyMessageData, SendMessageResponse };

console.log('✅ Hook useEvolutionSender carregado');
console.log('🛠️ Métodos disponíveis:');
console.log('   - sendMessage(data)');
console.log('   - replyToMessage(data)');
console.log('   - sendMultipleMessages(messages)');
console.log('   - checkServerHealth()');
console.log('   - formatPhoneForSending(phone)');
console.log('   - validateMessageData(data)'); 