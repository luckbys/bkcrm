const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurar Express
const app = express();
const router = express.Router();
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Configurações
const PORT = 4000;
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const BASE_URL = 'https://bkcrm.devsible.com.br';

// Configurar Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NTk2MDAsImV4cCI6MjAyNTIzNTYwMH0.ZT_LyxjHKJOJHBGxoqZZFqKQJQTJGKOGxXKGPKOXpxo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para processar mensagem
async function processMessage(payload) {
  const ticketId = crypto.randomUUID();
  const messageData = payload.data;
  const senderPhone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || 'unknown';
  const messageContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '[Mídia]';
  
  const { error } = await supabase
    .from('messages')
    .insert([{
      ticket_id: ticketId,
      content: messageContent,
      sender_type: 'customer',
      message_type: 'text',
      metadata: {
        whatsapp_data: {
          messageId: messageData.key?.id,
          senderPhone,
          instanceName: payload.instance
        },
        enhanced: true
      }
    }]);

  if (error) {
    throw error;
  }

  return ticketId;
}

// Rotas do webhook
router.post('/evolution/messages-upsert', async (req, res) => {
  try {
    console.log('📥 Recebido webhook messages-upsert');
    
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || 'unknown',
      data: req.body.data || req.body
    };

    const ticketId = await processMessage(payload);

    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      processed: true,
      ticketId
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evolution', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📥 Recebido webhook evolution:', payload.event);

    if (payload.event === 'MESSAGES_UPSERT') {
      const ticketId = await processMessage(payload);
      res.status(200).json({
        received: true,
        processed: true,
        ticketId
      });
    } else {
      res.status(200).json({
        received: true,
        processed: false,
        message: 'Evento não suportado'
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-corrigido'
  });
});

// Montar router no path /webhook
app.use('/webhook', router);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Webhook rodando na porta ${PORT}`);
  console.log('📋 Endpoints:');
  console.log('   POST /webhook/evolution');
  console.log('   POST /webhook/evolution/messages-upsert');
  console.log('   GET  /webhook/health');
}); 