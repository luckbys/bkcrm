import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';

// Carregar configurações de produção
dotenv.config({ path: './webhook.env' });

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;
const BASE_URL = process.env.BASE_URL || 'https://bkcrm.devsible.com.br';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default_secret';

// Configuração de CORS para produção
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://bkcrm.devsible.com.br', 'https://press-evolution-api.jhkbgs.easypanel.host'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS bloqueou origem: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging para produção
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`📥 [${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  next();
});

// Middleware de verificação de assinatura (segurança)
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  
  if (!signature && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Webhook sem assinatura rejeitado');
    return res.status(401).json({ error: 'Assinatura necessária' });
  }
  
  if (signature) {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== `sha256=${expectedSignature}`) {
      console.warn('❌ Assinatura inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }
  }
  
  next();
}

// Endpoint principal para receber webhooks da Evolution API
app.post('/webhook/evolution', verifyWebhookSignature, async (req, res) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [${timestamp}] Webhook Evolution API:`, {
      event: payload.event,
      instance: payload.instance,
      dataKeys: Object.keys(payload.data || {})
    });

    // Processar diferentes tipos de eventos
    if (payload.event) {
      switch (payload.event) {
        case 'MESSAGES_UPSERT':
          await processNewMessage(payload);
          break;
        
        case 'QRCODE_UPDATED':
          await processQRCodeUpdate(payload);
          break;
        
        case 'CONNECTION_UPDATE':
          await processConnectionUpdate(payload);
          break;
        
        case 'SEND_MESSAGE':
          await processSentMessage(payload);
          break;
        
        default:
          console.log(`📋 Evento não processado: ${payload.event}`);
      }
    }

    // Processar resposta de ticket específica
    if (payload.ticketId && payload.response) {
      await processTicketResponse(payload);
    }

    // Resposta de sucesso
    res.status(200).json({ 
      received: true, 
      timestamp,
      event: payload.event || 'unknown',
      instance: payload.instance,
      processed: true
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Função para processar novas mensagens
async function processNewMessage(payload) {
  try {
    const message = payload.data;
    const messageInfo = {
      from: message.key?.remoteJid,
      text: message.message?.conversation || message.message?.extendedTextMessage?.text,
      timestamp: message.messageTimestamp,
      instance: payload.instance
    };
    
    console.log('📨 Nova mensagem:', messageInfo);

    // Aqui você pode integrar com seu CRM:
    // 1. Salvar no Supabase
    // 2. Criar ticket automaticamente
    // 3. Notificar agentes
    // 4. Enviar para n8n/automação
    
    // Exemplo de integração com o CRM
    await notifyCRM('new_message', messageInfo);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

// Função para processar atualizações de QR Code
async function processQRCodeUpdate(payload) {
  try {
    console.log(`📱 QR Code atualizado - Instância: ${payload.instance}`);
    
    // Notificar o frontend sobre novo QR Code
    await notifyCRM('qr_code_updated', {
      instance: payload.instance,
      qrcode: payload.data.qrcode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar QR Code:', error);
  }
}

// Função para processar atualizações de conexão
async function processConnectionUpdate(payload) {
  try {
    const connectionInfo = {
      instance: payload.instance,
      state: payload.data.state,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔗 Status de conexão:', connectionInfo);
    
    // Notificar o CRM sobre mudança de status
    await notifyCRM('connection_update', connectionInfo);

  } catch (error) {
    console.error('❌ Erro ao processar conexão:', error);
  }
}

// Função para processar mensagens enviadas
async function processSentMessage(payload) {
  try {
    console.log('📤 Mensagem enviada:', {
      instance: payload.instance,
      to: payload.data.key?.remoteJid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar mensagem enviada:', error);
  }
}

// Função para processar respostas de tickets
async function processTicketResponse(payload) {
  try {
    const ticketInfo = {
      ticketId: payload.ticketId,
      response: payload.response,
      sender: payload.sender,
      confidence: payload.confidence,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎫 Resposta do ticket:', ticketInfo);
    
    // Integrar com o CRM para atualizar o ticket
    await notifyCRM('ticket_response', ticketInfo);

  } catch (error) {
    console.error('❌ Erro ao processar resposta do ticket:', error);
  }
}

// Função para notificar o CRM (integração)
async function notifyCRM(eventType, data) {
  try {
    // Aqui você pode:
    // 1. Fazer POST para seu CRM
    // 2. Salvar no banco de dados
    // 3. Enviar via WebSocket
    // 4. Integrar com Supabase Realtime
    
    console.log(`🔔 Notificando CRM: ${eventType}`, data);
    
    // Exemplo de integração com o frontend
    if (global.io) {
      global.io.emit(eventType, data);
    }

  } catch (error) {
    console.error('❌ Erro ao notificar CRM:', error);
  }
}

// Endpoint de status/health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Evolution Webhook Server',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      webhook: `${BASE_URL}/webhook/evolution`,
      health: `${BASE_URL}/health`,
      test: `${BASE_URL}/test`
    }
  });
});

// Health check detalhado
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Evolution Webhook Server',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Endpoint de teste
app.post('/test', (req, res) => {
  console.log('🧪 Teste de webhook:', req.body);
  res.json({ 
    message: 'Teste recebido com sucesso!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Evolution Webhook Server (PRODUÇÃO) rodando na porta ${PORT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📡 Webhook URL: ${BASE_URL}/webhook/evolution`);
  console.log(`🏥 Health check: ${BASE_URL}/health`);
  console.log(`🧪 Teste: ${BASE_URL}/test`);
  console.log(`🔒 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento gracioso de encerramento
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
}); 