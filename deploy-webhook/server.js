require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;
const EVO_API_URL = process.env.EVOLUTION_API_URL;
const EVO_API_KEY = process.env.EVOLUTION_API_KEY;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Recebe webhooks da Evolution API
app.post('/webhook/evolution', (req, res) => {
  const event = req.body;
  console.log('📥 Webhook Evolution recebido:', event);
  io.emit('evolution-event', event);
  res.json({ status: 'received' });
});

// Envia mensagem via Evolution API
app.post('/send-message', async (req, res) => {
  const { number, text } = req.body;
  try {
    const response = await axios.post(
      `${EVO_API_URL}/message/send`,
      { number, text },
      { headers: { apikey: EVO_API_KEY } }
    );
    res.json({ status: 'sent', data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// WebSocket para clientes
io.on('connection', (socket) => {
  console.log('🔗 Cliente conectado:', socket.id);

  socket.on('send-message', async (data) => {
    try {
      const response = await axios.post(
        `${EVO_API_URL}/message/send`,
        { number: data.number, text: data.text },
        { headers: { apikey: EVO_API_KEY } }
      );
      socket.emit('message-status', { status: 'sent', data: response.data });
    } catch (err) {
      socket.emit('message-status', { status: 'error', error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 