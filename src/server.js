import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from 'dotenv';
import { WhatsAppMessageProcessor } from './services/whatsapp/messageProcessor.js';
import { logger } from './utils/logger.js';

// Carregar variáveis de ambiente
config({ path: './webhook.env' });

// Configurações
const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;
const BASE_URL = process.env.BASE_URL || 'https://bkcrm.devsible.com.br';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`📥 [${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Rota principal do webhook
app.post('/webhook/evolution', async (req, res) => {
  try {
    const result = await WhatsAppMessageProcessor.processMessage(req.body);
    res.json(result);
  } catch (error) {
    logger.error('❌ Erro no processamento do webhook:', error);
    res.status(500).json({
      success: false,
      message: `Erro no processamento: ${error.message}`
    });
  }
});

// Health check
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info('🚀 Evolution Webhook Integration CORRIGIDO rodando na porta', PORT);
  logger.info(`🌐 Base URL: ${BASE_URL}`);
  logger.info(`📡 Webhook URL: ${BASE_URL}/webhook/evolution`);
  logger.info(`🏥 Health check: ${BASE_URL}/health`);
}); 