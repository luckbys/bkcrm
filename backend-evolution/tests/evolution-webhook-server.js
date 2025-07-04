import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Endpoint principal para receber webhooks da Evolution API
app.post('/webhook/evolution', (req, res) => {
  try {
    const payload = req.body;
    console.log('🔔 Webhook recebido da Evolution API:', JSON.stringify(payload, null, 2));

    // Processar diferentes tipos de eventos
    if (payload.event) {
      switch (payload.event) {
        case 'MESSAGES_UPSERT':
          console.log('📨 Nova mensagem recebida:', payload.data);
          processNewMessage(payload);
          break;
        
        case 'QRCODE_UPDATED':
          console.log('📱 QR Code atualizado para instância:', payload.instance);
          break;
        
        case 'CONNECTION_UPDATE':
          console.log('🔗 Status de conexão atualizado:', payload.data);
          break;
        
        default:
          console.log('📋 Evento não processado:', payload.event);
      }
    }

    // Processar resposta de ticket específica
    if (payload.ticketId && payload.response) {
      console.log(`🎫 Resposta recebida para ticket ${payload.ticketId}: ${payload.response}`);
      processTicketResponse(payload);
    }

    // Sempre responder 200 para evitar retries
    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      event: payload.event || 'unknown'
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para processar novas mensagens
function processNewMessage(payload) {
  try {
    const message = payload.data;
    console.log('📝 Processando mensagem:', {
      from: message.key?.remoteJid,
      text: message.message?.conversation || message.message?.extendedTextMessage?.text,
      timestamp: message.messageTimestamp
    });

    // Aqui você pode:
    // 1. Salvar a mensagem no banco
    // 2. Criar um ticket automaticamente
    // 3. Enviar para o CRM
    // 4. Processar com IA/chatbot

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

// Função para processar respostas de tickets
function processTicketResponse(payload) {
  try {
    console.log('🎫 Processando resposta do ticket:', {
      ticketId: payload.ticketId,
      response: payload.response,
      sender: payload.sender,
      confidence: payload.confidence
    });

    // Aqui você pode:
    // 1. Atualizar o ticket no banco
    // 2. Enviar resposta via Evolution API
    // 3. Notificar agentes
    // 4. Atualizar status do atendimento

  } catch (error) {
    console.error('❌ Erro ao processar resposta do ticket:', error);
  }
}

// Endpoint de teste
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor Evolution Webhook rodando!',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/webhook/evolution',
      health: '/health',
      test: '/test'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Endpoint de teste para simular webhook
app.post('/test', (req, res) => {
  console.log('🧪 Teste de webhook:', req.body);
  res.json({ message: 'Teste recebido com sucesso!' });
});

// Tratamento de erros global
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Evolution Webhook Server rodando na porta ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/evolution`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test`);
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
}); 