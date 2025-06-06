import { EvolutionAPIService, GlobalWhatsAppManager } from './evolution-api';

// Configurações da Evolution API para produção
export const EVOLUTION_CONFIG = {
  SERVER_URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
  AUTHENTICATION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
  GLOBAL_WEBHOOK_URL: 'https://press-n8n.jhkbgs.easypanel.host/webhook-test/recebe',
  WEBHOOK_ENABLED: true,
  WEBHOOK_EVENTS: [
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'CONNECTION_UPDATE',
    'QRCODE_UPDATED',
    'SEND_MESSAGE'
  ]
} as const;

// Instância global do serviço Evolution API
export const evolutionAPIService = new EvolutionAPIService(
  EVOLUTION_CONFIG.SERVER_URL,
  EVOLUTION_CONFIG.AUTHENTICATION_API_KEY
);

// Gerenciador global de WhatsApp (simplificado)
export const globalWhatsAppManager = new GlobalWhatsAppManager(evolutionAPIService);

export default {
  evolutionAPIService,
  globalWhatsAppManager,
  EVOLUTION_CONFIG,
}; 