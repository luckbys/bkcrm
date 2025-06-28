// 🔧 CORRECAO WEBHOOK - Adicionar rota /messages-upsert faltante
// Este arquivo adiciona a rota necessária para processar mensagens do WhatsApp

console.log('🔧 Aplicando correção para webhook - rota /messages-upsert');

// Função para adicionar a rota faltante ao arquivo webhook-evolution-websocket.js
const fs = require('fs');
const path = require('path');

function corrigirWebhook() {
  const webhookFile = 'webhook-evolution-websocket.cjs';
  
  if (!fs.existsSync(webhookFile)) {
    console.log('❌ Arquivo webhook-evolution-websocket.js não encontrado');
    return false;
  }

  let content = fs.readFileSync(webhookFile, 'utf8');
  
  // Verificar se a rota já existe
  if (content.includes("app.post('/messages-upsert'")) {
    console.log('✅ Rota /messages-upsert já existe');
    return true;
  }

  // Código da rota que precisa ser adicionada
  const novaRota = `
// === ROTA COMPATIBILIDADE - /messages-upsert ===
// Rota para capturar mensagens enviadas diretamente para /messages-upsert
app.post('/messages-upsert', async (req, res) => {
  try {
    console.log('📥 [COMPAT] /messages-upsert recebido - processando como MESSAGES_UPSERT');
    
    const payload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || 'atendimento-ao-cliente-suporte',
      data: req.body.data || req.body
    };

    console.log('🔄 [COMPAT] Payload estruturado:', {
      event: payload.event,
      instance: payload.instance,
      hasData: !!payload.data
    });

    const result = await processMessage(payload);
    
    console.log('✅ [COMPAT] Resultado processamento:', {
      success: result.success,
      ticketId: result.ticketId,
      messageId: result.messageId
    });

    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      processed: result.success,
      message: result.message || 'Mensagem processada',
      ticketId: result.ticketId,
      endpoint: '/messages-upsert (compatibilidade)'
    });
    
  } catch (error) {
    console.error('❌ [COMPAT] Erro ao processar /messages-upsert:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message,
      endpoint: '/messages-upsert'
    });
  }
});

`;

  // Encontrar onde inserir a nova rota (antes do health check)
  const insertPoint = content.indexOf("// Endpoint de health check");
  
  if (insertPoint === -1) {
    console.log('❌ Ponto de inserção não encontrado');
    return false;
  }

  // Inserir a nova rota
  const novoConteudo = content.slice(0, insertPoint) + novaRota + content.slice(insertPoint);
  
  // Fazer backup
  fs.writeFileSync(`${webhookFile}.backup`, content);
  console.log('💾 Backup criado: webhook-evolution-websocket.js.backup');
  
  // Escrever arquivo corrigido
  fs.writeFileSync(webhookFile, novoConteudo);
  console.log('✅ Rota /messages-upsert adicionada com sucesso');
  
  return true;
}

// Executar correção
if (corrigirWebhook()) {
  console.log('🎉 Correção aplicada com sucesso!');
  console.log('🔄 Reinicie o servidor webhook para aplicar as mudanças');
  console.log('📋 Comando: npm start');
} else {
  console.log('❌ Falha ao aplicar correção');
} 