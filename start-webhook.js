#!/usr/bin/env node

/**
 * 🚀 Script para iniciar o Webhook Evolution API + WebSocket
 * 
 * Este script resolve o problema de ES modules vs CommonJS
 * executando o webhook com a extensão .cjs
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Webhook Evolution API + WebSocket...');
console.log('📂 Diretório:', __dirname);

// Verificar se o arquivo webhook existe
const webhookFile = path.join(__dirname, 'webhook-evolution-websocket.cjs');

console.log('📄 Arquivo webhook:', webhookFile);

// Iniciar o webhook
const webhook = spawn('node', [webhookFile], {
  stdio: 'inherit',
  cwd: __dirname
});

webhook.on('error', (error) => {
  console.error('❌ Erro ao iniciar webhook:', error);
  process.exit(1);
});

webhook.on('exit', (code) => {
  console.log(`⛔ Webhook finalizado com código: ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⛔ Recebido SIGTERM, parando webhook...');
  webhook.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⛔ Recebido SIGINT, parando webhook...');
  webhook.kill('SIGINT');
});

console.log('✅ Webhook iniciado! Health check: http://localhost:4000/webhook/health');
console.log('📡 WebSocket: ws://localhost:4000');
console.log('🎯 Webhook URL: http://localhost:4000/webhook/evolution'); 