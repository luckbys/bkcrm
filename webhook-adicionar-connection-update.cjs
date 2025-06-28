// CORRECAO WEBHOOK - Adicionar rota /connection-update faltante
// A Evolution API esta tentando acessar /connection-update mas so existe /webhook/evolution/connection-update

console.log('Aplicando correcao - rota /connection-update');

const fs = require('fs');

function adicionarRotaConnectionUpdate() {
  const webhookFile = 'webhook-evolution-websocket.cjs';
  
  if (!fs.existsSync(webhookFile)) {
    console.log('ERRO: Arquivo webhook-evolution-websocket.cjs nao encontrado');
    return false;
  }

  let content = fs.readFileSync(webhookFile, 'utf8');
  
  // Verificar se a rota ja existe
  if (content.includes("app.post('/connection-update'")) {
    console.log('OK: Rota /connection-update ja existe');
    return true;
  }

  // Codigo da nova rota
  const novaRota = `
// === ROTA COMPATIBILIDADE: /connection-update ===
// Evolution API envia connection.update diretamente para /connection-update
app.post('/connection-update', async (req, res) => {
  try {
    const { instance, data } = req.body;
    console.log(\`📱 [CONNECTION] Status update: \${instance} - \${data?.state || 'unknown'}\`);
    
    // Log do evento de conexao
    console.log('📊 [CONNECTION] Dados:', {
      instance: instance,
      state: data?.state,
      statusReason: data?.statusReason,
      profileName: data?.profileName,
      timestamp: new Date().toISOString()
    });

    // Broadcast via WebSocket para clientes conectados
    if (io) {
      io.emit('connection-update', {
        instance,
        state: data?.state,
        statusReason: data?.statusReason,
        profileName: data?.profileName,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      received: true,
      processed: true,
      instance: instance,
      state: data?.state,
      endpoint: '/connection-update (compatibilidade)'
    });
    
  } catch (error) {
    console.error('❌ [CONNECTION] Erro ao processar:', error);
    res.status(500).json({
      received: true,
      processed: false,
      error: error.message,
      endpoint: '/connection-update (compatibilidade)'
    });
  }
});
`;

  // Encontrar local para inserir (antes da linha que inicia o servidor)
  const insertionPoint = content.indexOf('// === INICIALIZAÇÃO DO SERVIDOR ===');
  
  if (insertionPoint === -1) {
    // Fallback: inserir antes do app.listen
    const listenIndex = content.indexOf('app.listen(');
    if (listenIndex === -1) {
      console.log('ERRO: Nao foi possivel encontrar local para inserir a rota');
      return false;
    }
    
    const beforeListen = content.substring(0, listenIndex);
    const afterListen = content.substring(listenIndex);
    content = beforeListen + novaRota + '\n' + afterListen;
  } else {
    const beforeInsertion = content.substring(0, insertionPoint);
    const afterInsertion = content.substring(insertionPoint);
    content = beforeInsertion + novaRota + '\n' + afterInsertion;
  }

  // Salvar arquivo modificado
  try {
    fs.writeFileSync(webhookFile, content, 'utf8');
    console.log('OK: Rota /connection-update adicionada com sucesso');
    return true;
  } catch (error) {
    console.log('ERRO: Falha ao salvar arquivo:', error.message);
    return false;
  }
}

// Executar correcao
const sucesso = adicionarRotaConnectionUpdate();

if (sucesso) {
  console.log('✅ Correcao aplicada com sucesso!');
  console.log('🔄 Reinicie o servidor webhook para aplicar as mudancas');
  console.log('📋 Comando: npm run webhook');
} else {
  console.log('❌ Falha ao aplicar correcao');
} 