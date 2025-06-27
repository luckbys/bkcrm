// 🔗 CLIENTE WEBSOCKET EVOLUTION API + INTEGRAÇÃO BKCRM
// Conecta com WebSocket da Evolution API e repassa eventos para sistema BKCRM

const { io } = require('socket.io-client');
const fetch = require('node-fetch');

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evochat.devsible.com.br';
const EVOLUTION_WS_URL = EVOLUTION_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

// URL do WebSocket BKCRM local
const BKCRM_WS_URL = 'http://localhost:4000';

console.log('🔗 INICIANDO CLIENTE WEBSOCKET EVOLUTION API...');
console.log(`📡 Evolution WS URL: ${EVOLUTION_WS_URL}`);
console.log(`🏠 BKCRM WS URL: ${BKCRM_WS_URL}`);

class EvolutionWebSocketClient {
  constructor() {
    this.evolutionSocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.lastHeartbeat = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Inicializando cliente WebSocket Evolution API...');
    
    try {
      // Verificar se a instância está conectada
      await this.checkInstanceConnection();
      
      // Conectar ao WebSocket da Evolution API
      await this.connectToEvolution();
      
      // Configurar heartbeat
      this.setupHeartbeat();
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.scheduleReconnect();
    }
  }

  async checkInstanceConnection() {
    console.log('🔍 Verificando conexão da instância Evolution API...');
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Instância ${INSTANCE_NAME}: ${data.state}`);
      
      if (data.state !== 'open') {
        console.log('⚠️  Instância não está conectada ao WhatsApp');
        console.log('💡 Acesse o painel da Evolution API e conecte a instância');
      }
      
      return data.state === 'open';
    } catch (error) {
      console.error('❌ Erro ao verificar instância:', error.message);
      throw error;
    }
  }

  async connectToEvolution() {
    console.log('🔌 Conectando ao WebSocket da Evolution API...');
    
    // URL do WebSocket conforme documentação
    // Modo tradicional: wss://api.seusite.com/nome_instancia
    const wsUrl = `${EVOLUTION_WS_URL}/${INSTANCE_NAME}`;
    
    console.log(`📡 Conectando em: ${wsUrl}`);
    
    this.evolutionSocket = io(wsUrl, {
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000,
      extraHeaders: {
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
        'apikey': EVOLUTION_API_KEY
      }
    });

    // Event listeners
    this.evolutionSocket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket da Evolution API');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
    });

    this.evolutionSocket.on('disconnect', (reason) => {
      console.log(`❌ Desconectado da Evolution API: ${reason}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.evolutionSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Evolution API:', error.message);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    // === EVENTOS DE MENSAGENS ===
    // Baseado na documentação da Evolution API
    this.evolutionSocket.on('messages.upsert', (data) => {
      console.log('📨 Nova mensagem recebida da Evolution API');
      this.handleIncomingMessage(data);
    });

    this.evolutionSocket.on('messages.update', (data) => {
      console.log('📝 Mensagem atualizada na Evolution API');
      this.handleMessageUpdate(data);
    });

    this.evolutionSocket.on('connection.update', (data) => {
      console.log('🔄 Atualização de conexão Evolution API:', data);
    });

    // === EVENTOS DE STATUS ===
    this.evolutionSocket.on('qrcode.updated', (data) => {
      console.log('📱 QR Code atualizado');
      console.log('💡 Escaneie o QR Code no WhatsApp para conectar');
    });

    this.evolutionSocket.on('connection.update', (data) => {
      console.log('🔗 Status da conexão:', data);
      if (data.state === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!');
      }
    });

    // Eventos genéricos
    this.evolutionSocket.onAny((eventName, data) => {
      console.log(`📡 Evento Evolution API: ${eventName}`, {
        timestamp: new Date().toISOString(),
        hasData: !!data
      });
    });
  }

  async handleIncomingMessage(data) {
    try {
      console.log('📥 Processando mensagem da Evolution API...');
      
      // Extrair informações da mensagem
      const messageInfo = this.extractMessageInfo(data);
      
      if (!messageInfo) {
        console.log('⚠️  Mensagem ignorada (não é texto ou não tem conteúdo)');
        return;
      }

      console.log('📋 Informações da mensagem:', {
        from: messageInfo.from,
        content: messageInfo.content.substring(0, 50) + '...',
        isFromMe: messageInfo.isFromMe,
        timestamp: messageInfo.timestamp
      });

      // Se for mensagem enviada por nós, ignorar
      if (messageInfo.isFromMe) {
        console.log('📤 Mensagem enviada por nós - ignorando');
        return;
      }

      // Enviar para o webhook BKCRM
      await this.forwardToBKCRM(messageInfo);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  extractMessageInfo(data) {
    try {
      // Estrutura típica da Evolution API
      const messages = data.messages || [data];
      const message = messages[0];
      
      if (!message) return null;

      // Extrair informações básicas
      const messageKey = message.key || {};
      const messageInfo = message.message || {};
      
      // Verificar se tem conteúdo de texto
      const textContent = messageInfo.conversation || 
                         messageInfo.extendedTextMessage?.text || 
                         messageInfo.imageMessage?.caption ||
                         messageInfo.documentMessage?.caption ||
                         null;

      if (!textContent) return null;

      return {
        id: messageKey.id,
        from: messageKey.remoteJid,
        fromPhone: messageKey.remoteJid?.split('@')[0],
        content: textContent,
        isFromMe: messageKey.fromMe || false,
        timestamp: message.messageTimestamp || Date.now(),
        instanceName: INSTANCE_NAME,
        messageType: Object.keys(messageInfo)[0] || 'text'
      };

    } catch (error) {
      console.error('❌ Erro ao extrair informações da mensagem:', error);
      return null;
    }
  }

  async forwardToBKCRM(messageInfo) {
    try {
      console.log('🔄 Encaminhando mensagem para BKCRM...');
      
      // Payload no formato esperado pelo webhook BKCRM
      const payload = {
        event: 'messages.upsert',
        instance: messageInfo.instanceName,
        data: {
          key: {
            id: messageInfo.id,
            remoteJid: messageInfo.from,
            fromMe: messageInfo.isFromMe
          },
          message: {
            conversation: messageInfo.content
          },
          messageTimestamp: messageInfo.timestamp,
          pushName: messageInfo.pushName || 'Cliente WhatsApp'
        }
      };

      // Enviar para o webhook BKCRM
      const response = await fetch(`${BKCRM_WS_URL}/webhook/evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Mensagem encaminhada para BKCRM:', {
          success: result.success,
          ticketId: result.ticketId,
          messageId: result.messageId
        });
      } else {
        console.error('❌ Erro ao encaminhar para BKCRM:', response.status);
      }

    } catch (error) {
      console.error('❌ Erro ao encaminhar mensagem:', error);
    }
  }

  async handleMessageUpdate(data) {
    console.log('📝 Mensagem atualizada (lida, entregue, etc.)');
    // Implementar se necessário
  }

  setupHeartbeat() {
    setInterval(() => {
      if (this.isConnected) {
        this.lastHeartbeat = Date.now();
        // Enviar ping se necessário
        this.evolutionSocket?.emit('ping');
      }
    }, 30000); // A cada 30 segundos
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay/1000}s...`);
    
    setTimeout(() => {
      this.init();
    }, delay);
  }

  // Método para enviar mensagens via Evolution API
  async sendMessage(phone, text, options = {}) {
    try {
      console.log(`📤 Enviando mensagem via Evolution API para ${phone}`);
      
      const payload = {
        number: phone,
        text: text,
        options: {
          delay: options.delay || 1000,
          presence: options.presence || 'composing',
          linkPreview: options.linkPreview !== false,
          ...options
        }
      };

      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Mensagem enviada via Evolution API:', result.key?.id);
        return { success: true, messageId: result.key?.id, data: result };
      } else {
        console.error('❌ Erro ao enviar via Evolution API:', result);
        return { success: false, error: result };
      }

    } catch (error) {
      console.error('❌ Erro interno ao enviar mensagem:', error);
      return { success: false, error: error.message };
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      instance: INSTANCE_NAME,
      evolutionUrl: EVOLUTION_WS_URL
    };
  }

  disconnect() {
    console.log('🔌 Desconectando cliente Evolution WebSocket...');
    if (this.evolutionSocket) {
      this.evolutionSocket.disconnect();
    }
  }
}

// Inicializar cliente
const evolutionClient = new EvolutionWebSocketClient();

// Exportar para uso em outros módulos
module.exports = evolutionClient;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando cliente Evolution WebSocket...');
  evolutionClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Encerrando cliente Evolution WebSocket...');
  evolutionClient.disconnect();
  process.exit(0);
}); 