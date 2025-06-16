const axios = require('axios');
require('dotenv').config();

/**
 * Serviço para envio de mensagens via Evolution API
 * Baseado na documentação: https://doc.evolution-api.com/v1/api-reference/message-controller/send-text
 */
class EvolutionMessageSender {
  constructor() {
    this.baseURL = process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host/';
    this.apiKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    this.defaultInstance = process.env.EVOLUTION_DEFAULT_INSTANCE || 'atendimento-ao-cliente-sac1';
    
    // Configurar axios com defaults
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey
      },
      timeout: 30000 // 30 segundos
    });

    console.log('🚀 Evolution Message Sender iniciado');
    console.log(`📡 Base URL: ${this.baseURL}`);
    console.log(`🔑 API Key: ${this.apiKey ? '***configurada***' : '❌ não configurada'}`);
  }

  /**
   * Enviar mensagem de texto via Evolution API
   * @param {Object} messageData - Dados da mensagem
   * @param {string} messageData.phone - Número do destinatário (5511999999999)
   * @param {string} messageData.text - Texto da mensagem
   * @param {string} messageData.instance - Nome da instância Evolution
   * @param {Object} messageData.options - Opções adicionais
   * @returns {Promise<Object>} Resposta da API
   */
  async sendTextMessage(messageData) {
    try {
      const { phone, text, instance = this.defaultInstance, options = {} } = messageData;

      if (!phone || !text) {
        throw new Error('Telefone e texto são obrigatórios');
      }

      // Formatar número para o padrão WhatsApp
      const formattedPhone = this.formatPhoneNumber(phone);
      
      console.log('📤 Enviando mensagem via Evolution API:', {
        instance,
        phone: formattedPhone,
        text: text.substring(0, 50) + '...',
        hasOptions: Object.keys(options).length > 0
      });

      // Payload conforme documentação
      const payload = {
        number: formattedPhone,
        options: {
          delay: options.delay || 1000, // 1 segundo de delay padrão
          presence: options.presence || 'composing', // Mostrar "digitando..."
          linkPreview: options.linkPreview !== false, // True por padrão
          ...options
        },
        textMessage: {
          text: text
        }
      };

      // Fazer requisição para a Evolution API
      const response = await this.api.post(`/message/sendText/${instance}`, payload);

      console.log('✅ Mensagem enviada com sucesso:', {
        messageId: response.data.key?.id,
        status: response.data.status,
        timestamp: response.data.messageTimestamp
      });

      return {
        success: true,
        data: response.data,
        messageId: response.data.key?.id,
        status: response.data.status
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Enviar mensagem com citação (reply)
   * @param {Object} messageData - Dados da mensagem
   * @param {Object} quotedMessage - Mensagem para citar
   */
  async sendReplyMessage(messageData, quotedMessage) {
    const options = {
      ...messageData.options,
      quoted: {
        key: {
          remoteJid: quotedMessage.remoteJid,
          fromMe: quotedMessage.fromMe || false,
          id: quotedMessage.id,
          participant: quotedMessage.participant
        },
        message: {
          conversation: quotedMessage.text || quotedMessage.conversation
        }
      }
    };

    return this.sendTextMessage({
      ...messageData,
      options
    });
  }

  /**
   * Enviar mensagem com menções
   * @param {Object} messageData - Dados da mensagem
   * @param {Array} mentions - Lista de números para mencionar
   */
  async sendMentionMessage(messageData, mentions = []) {
    const options = {
      ...messageData.options,
      mentions: {
        everyOne: mentions.includes('@everyone'),
        mentioned: mentions.filter(m => m !== '@everyone')
      }
    };

    return this.sendTextMessage({
      ...messageData,
      options
    });
  }

  /**
   * Formatar número de telefone para o padrão WhatsApp
   * @param {string} phone - Número de telefone
   * @returns {string} Número formatado
   */
  formatPhoneNumber(phone) {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adicionar +55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      cleaned = '55' + cleaned;
    }
    
    // Adicionar sufixo @s.whatsapp.net se necessário
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@s.whatsapp.net';
    }
    
    return cleaned;
  }

  /**
   * Verificar status da instância
   * @param {string} instanceName - Nome da instância
   */
  async checkInstanceStatus(instanceName = this.defaultInstance) {
    try {
      const response = await this.api.get(`/instance/connectionState/${instanceName}`);
      
      console.log(`📊 Status da instância ${instanceName}:`, response.data);
      
      return {
        success: true,
        data: response.data,
        isConnected: response.data.state === 'open'
      };
    } catch (error) {
      console.error(`❌ Erro ao verificar status da instância ${instanceName}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        isConnected: false
      };
    }
  }

  /**
   * Listar todas as instâncias
   */
  async listInstances() {
    try {
      const response = await this.api.get('/instance/fetchInstances');
      
      console.log('📋 Instâncias disponíveis:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao listar instâncias:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instância global do serviço
const evolutionSender = new EvolutionMessageSender();

/**
 * Função principal para envio de mensagens
 * Pode ser usada tanto no webhook quanto em outros serviços
 */
async function sendWhatsAppMessage(messageData) {
  return await evolutionSender.sendTextMessage(messageData);
}

/**
 * Função para responder a uma mensagem específica
 */
async function replyToWhatsAppMessage(messageData, originalMessage) {
  return await evolutionSender.sendReplyMessage(messageData, originalMessage);
}

/**
 * Função para verificar se a instância está conectada
 */
async function checkWhatsAppConnection(instanceName) {
  return await evolutionSender.checkInstanceStatus(instanceName);
}

// Exports para uso em outros módulos
module.exports = {
  EvolutionMessageSender,
  evolutionSender,
  sendWhatsAppMessage,
  replyToWhatsAppMessage,
  checkWhatsAppConnection
};

// Funções globais para desenvolvimento/debug
if (typeof window !== 'undefined') {
  window.sendWhatsAppMessage = sendWhatsAppMessage;
  window.replyToWhatsAppMessage = replyToWhatsAppMessage;
  window.checkWhatsAppConnection = checkWhatsAppConnection;
} else {
  // Funções globais para Node.js
  global.sendWhatsAppMessage = sendWhatsAppMessage;
  global.replyToWhatsAppMessage = replyToWhatsAppMessage;
  global.checkWhatsAppConnection = checkWhatsAppConnection;
}

console.log('✅ Evolution Message Sender carregado');
console.log('🛠️ Funções disponíveis:');
console.log('   - sendWhatsAppMessage(data)');
console.log('   - replyToWhatsAppMessage(data, original)');
console.log('   - checkWhatsAppConnection(instance)'); 