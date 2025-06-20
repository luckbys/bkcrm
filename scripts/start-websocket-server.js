#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 [SCRIPT] Iniciando servidor WebSocket...');

// Verificar se o diretório existe
const webhooksDir = path.join(__dirname, '..', 'backend', 'webhooks');
const serverFile = path.join(webhooksDir, 'webhook-evolution-websocket.js');

if (!fs.existsSync(serverFile)) {
  console.error('❌ [SCRIPT] Arquivo do servidor não encontrado:', serverFile);
  console.log('💡 [SCRIPT] Certifique-se de que o arquivo foi criado corretamente');
  process.exit(1);
}

// Verificar se as dependências estão instaladas
const packageJsonPath = path.join(webhooksDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('📦 [SCRIPT] Instalando dependências...');
  
  const npmInstall = spawn('npm', ['install'], {
    cwd: webhooksDir,
    stdio: 'inherit',
    shell: true
  });

  npmInstall.on('close', (code) => {
    if (code === 0) {
      console.log('✅ [SCRIPT] Dependências instaladas com sucesso');
      startServer();
    } else {
      console.error('❌ [SCRIPT] Erro ao instalar dependências');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔗 [SCRIPT] Iniciando servidor WebSocket...');
  
  const serverProcess = spawn('node', ['webhook-evolution-websocket.js'], {
    cwd: webhooksDir,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('close', (code) => {
    console.log(`🔗 [SCRIPT] Servidor finalizado com código: ${code}`);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ [SCRIPT] Erro ao iniciar servidor:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 [SCRIPT] Finalizando servidor...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 [SCRIPT] Finalizando servidor...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
} 