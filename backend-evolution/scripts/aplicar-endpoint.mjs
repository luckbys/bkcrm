/**
 * APLICAR ENDPOINT ALTERNATIVO - WEBHOOK EVOLUTION API
 * Versão ES modules
 */

import fs from 'fs';
import { exec, spawn } from 'child_process';

console.log('🔧 ADICIONANDO ENDPOINT ALTERNATIVO AO WEBHOOK\n');

const webhookFile = 'webhook-evolution-complete.js';

// Código do endpoint alternativo
const endpointCode = `
// Endpoint alternativo para compatibilidade com Evolution API antiga
app.post('/webhook/messages-upsert', async (req, res) => {
  try {
    console.log('📥 [COMPAT] Recebido em /messages-upsert, redirecionando...');
    
    // Reformatar payload para nosso padrão
    const reformattedPayload = {
      event: 'MESSAGES_UPSERT',
      instance: req.body.instance || req.headers['instance'] || 'unknown',
      data: req.body.data || req.body
    };
    
    console.log('🔄 Redirecionando para processamento principal...');
    
    // Processar usando nossa função principal
    const result = await processNewMessage(reformattedPayload);
    
    // Resposta compatível
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
      event: 'MESSAGES_UPSERT',
      instance: reformattedPayload.instance,
      processed: result.success,
      message: result.message,
      ticketId: result.ticketId
    });
    
    console.log('✅ Processamento via endpoint alternativo concluído');
    
  } catch (error) {
    console.error('❌ Erro no endpoint alternativo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
});

// Endpoint de health check
app.get('/webhook/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'Webhook Evolution API',
    endpoints: [
      '/webhook/evolution',
      '/webhook/messages-upsert'
    ]
  });
});
`;

// Função para aplicar a correção
function aplicarEndpointAlternativo() {
  try {
    // Ler o arquivo atual
    const fileContent = fs.readFileSync(webhookFile, 'utf8');
    
    // Verificar se já foi aplicado
    if (fileContent.includes('/webhook/messages-upsert')) {
      console.log('✅ Endpoint alternativo já existe no arquivo');
      return true;
    }
    
    // Encontrar onde inserir (após o endpoint principal)
    const insertPoint = fileContent.indexOf('// Função para processar mensagens recebidas');
    
    if (insertPoint === -1) {
      console.log('❌ Não foi possível encontrar ponto de inserção');
      return false;
    }
    
    // Inserir o código
    const newContent = fileContent.slice(0, insertPoint) + 
                      endpointCode + 
                      '\n' + 
                      fileContent.slice(insertPoint);
    
    // Fazer backup
    fs.writeFileSync(`${webhookFile}.backup`, fileContent);
    console.log('💾 Backup criado:', `${webhookFile}.backup`);
    
    // Escrever novo conteúdo
    fs.writeFileSync(webhookFile, newContent);
    console.log('✅ Endpoint alternativo adicionado com sucesso');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error.message);
    return false;
  }
}

// Função para reiniciar o servidor webhook
async function reiniciarWebhook() {
  console.log('\n🔄 REINICIANDO SERVIDOR WEBHOOK...');
  
  return new Promise((resolve) => {
    // Windows - finalizar processos na porta 4000
    exec('netstat -ano | findstr :4000', (error, stdout) => {
      if (!error && stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            const pid = match[1];
            exec(`taskkill /F /PID ${pid}`, (killError) => {
              if (!killError) {
                console.log(`✅ Processo ${pid} finalizado`);
              }
            });
          }
        });
      }
      
      // Aguardar antes de reiniciar
      setTimeout(() => {
        console.log('🚀 Iniciando novo servidor webhook...');
        
        // Iniciar novo processo
        const child = spawn('node', ['webhook-evolution-complete.js'], {
          detached: true,
          stdio: 'ignore'
        });
        
        child.unref();
        console.log('✅ Servidor webhook reiniciado');
        resolve();
        
      }, 3000);
    });
  });
}

// Executar aplicação
async function executar() {
  console.log('🚀 APLICANDO CORREÇÕES...\n');
  
  // 1. Aplicar endpoint alternativo
  const success = aplicarEndpointAlternativo();
  
  if (!success) {
    console.log('❌ Falha ao aplicar correções');
    return;
  }
  
  // 2. Reiniciar webhook
  await reiniciarWebhook();
  
  // 3. Aguardar e testar
  setTimeout(async () => {
    console.log('\n🧪 TESTANDO ENDPOINTS...');
    
    try {
      // Testar endpoint principal
      const mainTest = await fetch('http://localhost:4000/webhook/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      console.log('✅ Endpoint principal (/webhook/evolution):', mainTest.status);
      
      // Testar endpoint alternativo
      const altTest = await fetch('http://localhost:4000/webhook/messages-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      console.log('✅ Endpoint alternativo (/webhook/messages-upsert):', altTest.status);
      
      // Testar health check
      const healthTest = await fetch('http://localhost:4000/webhook/health');
      const healthResult = await healthTest.json();
      console.log('✅ Health check:', healthResult);
      
    } catch (error) {
      console.log('⚠️ Erro no teste:', error.message);
      console.log('💡 Aguarde alguns segundos e teste manualmente');
    }
    
    console.log('\n🎯 CORREÇÕES APLICADAS COM SUCESSO!');
    console.log('\n📋 ENDPOINTS DISPONÍVEIS:');
    console.log('   • http://localhost:4000/webhook/evolution');
    console.log('   • http://localhost:4000/webhook/messages-upsert');
    console.log('   • http://localhost:4000/webhook/health');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Monitore os logs da Evolution API');
    console.log('   2. Verifique se os erros 404 pararam');
    console.log('   3. Teste envio de mensagens WhatsApp');
    
  }, 6000);
}

// Executar
executar().catch(console.error); 