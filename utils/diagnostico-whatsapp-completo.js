// 🔍 DIAGNÓSTICO COMPLETO - WHATSAPP BKCRM
// Análise completa dos problemas de envio e recebimento de mensagens

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO WHATSAPP...\n');

// === 1. VERIFICAR WEBHOOK WEBSOCKET ===
async function verificarWebhookWebSocket() {
  console.log('📡 1. VERIFICANDO WEBHOOK WEBSOCKET...');
  
  try {
    const healthResponse = await fetch('http://localhost:4000/webhook/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Webhook WebSocket: FUNCIONANDO');
      console.log(`   - Status: ${healthResponse.status}`);
      console.log(`   - Endpoints: ${healthData.endpoints?.length || 0} disponíveis`);
      console.log(`   - WebSocket: ${healthData.websocket?.enabled ? 'ATIVO' : 'INATIVO'}`);
      console.log(`   - Conexões: ${healthData.websocket?.connections || 0}`);
      return true;
    } else {
      console.log('❌ Webhook WebSocket: FALHOU');
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook WebSocket: NÃO CONECTA');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 2. VERIFICAR INSTÂNCIA EVOLUTION API ===
async function verificarInstanciaEvolution() {
  console.log('\n🔌 2. VERIFICANDO INSTÂNCIA EVOLUTION API...');
  
  try {
    const instanceResponse = await fetch('http://localhost:4000/webhook/check-instance/atendimento-ao-cliente-suporte');
    const instanceData = await instanceResponse.json();
    
    if (instanceResponse.ok) {
      console.log('✅ Instância Evolution: ENCONTRADA');
      console.log(`   - Nome: ${instanceData.instance}`);
      console.log(`   - Estado: ${instanceData.state || 'NÃO INFORMADO'}`);
      console.log(`   - Timestamp: ${instanceData.timestamp}`);
      
      if (!instanceData.state) {
        console.log('⚠️  AVISO: Estado da instância não retornado - possível problema na Evolution API');
      }
      
      return instanceData.state === 'open';
    } else {
      console.log('❌ Instância Evolution: ERRO');
      console.log(`   - Status: ${instanceResponse.status}`);
      console.log(`   - Erro: ${instanceData.error || 'Desconhecido'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Instância Evolution: FALHA NA CONEXÃO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 3. TESTAR ENVIO DE MENSAGEM ===
async function testarEnvioMensagem() {
  console.log('\n📤 3. TESTANDO ENVIO DE MENSAGEM...');
  
  try {
    const testPayload = {
      phone: '5511999999999', // Número de teste
      text: `🧪 Teste diagnóstico - ${new Date().toLocaleString()}`,
      instance: 'atendimento-ao-cliente-suporte',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: false
      }
    };
    
    console.log(`   - Enviando para: ${testPayload.phone}`);
    console.log(`   - Instância: ${testPayload.instance}`);
    
    const sendResponse = await fetch('http://localhost:4000/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const sendData = await sendResponse.json();
    
    if (sendResponse.ok && sendData.success) {
      console.log('✅ Envio de Mensagem: SUCESSO');
      console.log(`   - Message ID: ${sendData.messageId}`);
      console.log(`   - Status: ${sendData.status}`);
      return true;
    } else {
      console.log('❌ Envio de Mensagem: FALHOU');
      console.log(`   - Status HTTP: ${sendResponse.status}`);
      console.log(`   - Erro: ${sendData.error || 'Desconhecido'}`);
      
      if (sendData.details) {
        console.log('   - Detalhes do erro:');
        console.log(`     * Evolution Status: ${sendData.evolutionStatus || 'N/A'}`);
        if (sendData.details.response?.message) {
          console.log(`     * Mensagem: ${JSON.stringify(sendData.details.response.message)}`);
        }
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Envio de Mensagem: ERRO INTERNO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 4. VERIFICAR CONFIGURAÇÃO EVOLUTION API ===
async function verificarConfiguracaoEvolution() {
  console.log('\n⚙️  4. VERIFICANDO CONFIGURAÇÃO EVOLUTION API...');
  
  // Verificar se as variáveis de ambiente estão corretas
  const config = {
    url: process.env.EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host',
    key: process.env.EVOLUTION_API_KEY ? '***DEFINIDA***' : 'NÃO DEFINIDA'
  };
  
  console.log(`   - URL: ${config.url}`);
  console.log(`   - API Key: ${config.key}`);
  
  // Testar conectividade direta com Evolution API
  try {
    const directResponse = await fetch(`${config.url}/instance/connectionState/atendimento-ao-cliente-suporte`, {
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY
      }
    });
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log('✅ Conexão Direta Evolution: FUNCIONANDO');
      console.log(`   - Estado: ${directData.state}`);
      return directData.state === 'open';
    } else {
      console.log('❌ Conexão Direta Evolution: FALHOU');
      console.log(`   - Status: ${directResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Conexão Direta Evolution: ERRO');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 5. VERIFICAR FRONTEND ===
async function verificarFrontend() {
  console.log('\n🖥️  5. VERIFICANDO FRONTEND...');
  
  // Verificar se o frontend está tentando usar os endpoints corretos
  console.log('   - Verificando configuração do useEvolutionSender...');
  
  // Simular chamada do frontend
  try {
    const frontendTest = await fetch('http://localhost:4000/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '5511888888888',
        text: 'Teste do frontend',
        instance: 'atendimento-ao-cliente-suporte'
      })
    });
    
    const frontendData = await frontendTest.json();
    
    console.log(`   - Endpoint acessível: ${frontendTest.status === 200 || frontendTest.status === 400 ? 'SIM' : 'NÃO'}`);
    console.log(`   - Resposta: ${frontendData.success ? 'SUCESSO' : 'ERRO'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Frontend: ERRO DE CONECTIVIDADE');
    console.log(`   - Erro: ${error.message}`);
    return false;
  }
}

// === 6. ANÁLISE DE LOGS ===
function analisarLogs() {
  console.log('\n📋 6. ANÁLISE DE LOGS E RECOMENDAÇÕES...');
  
  console.log('\n🔍 POSSÍVEIS CAUSAS DOS PROBLEMAS:');
  console.log('   1. Instância Evolution API desconectada do WhatsApp');
  console.log('   2. Número de teste inválido ou não existe no WhatsApp');
  console.log('   3. API Key da Evolution API expirada ou inválida');
  console.log('   4. Firewall bloqueando conexões');
  console.log('   5. Evolution API em manutenção');
  
  console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
  console.log('   1. Reconectar instância WhatsApp na Evolution API');
  console.log('   2. Usar número real de WhatsApp para teste');
  console.log('   3. Verificar/renovar API Key');
  console.log('   4. Verificar logs da Evolution API');
  console.log('   5. Testar com instância diferente');
}

// === EXECUTAR DIAGNÓSTICO COMPLETO ===
async function executarDiagnosticoCompleto() {
  console.log('🚀 EXECUTANDO DIAGNÓSTICO COMPLETO...\n');
  
  const resultados = {
    webhook: false,
    instancia: false,
    envio: false,
    configuracao: false,
    frontend: false
  };
  
  resultados.webhook = await verificarWebhookWebSocket();
  resultados.instancia = await verificarInstanciaEvolution();
  resultados.envio = await testarEnvioMensagem();
  resultados.configuracao = await verificarConfiguracaoEvolution();
  resultados.frontend = await verificarFrontend();
  
  analisarLogs();
  
  console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
  console.log('═══════════════════════════════════════');
  console.log(`Webhook WebSocket:     ${resultados.webhook ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Instância Evolution:   ${resultados.instancia ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Envio de Mensagem:     ${resultados.envio ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Configuração API:      ${resultados.configuracao ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Frontend:              ${resultados.frontend ? '✅ OK' : '❌ FALHA'}`);
  console.log('═══════════════════════════════════════');
  
  const totalOk = Object.values(resultados).filter(Boolean).length;
  const totalTestes = Object.keys(resultados).length;
  
  console.log(`\n🎯 RESULTADO GERAL: ${totalOk}/${totalTestes} testes passaram`);
  
  if (totalOk === totalTestes) {
    console.log('🎉 SISTEMA TOTALMENTE FUNCIONAL!');
  } else if (totalOk >= 3) {
    console.log('⚠️  SISTEMA PARCIALMENTE FUNCIONAL - Verificar falhas');
  } else {
    console.log('🚨 SISTEMA COM PROBLEMAS CRÍTICOS - Correção necessária');
  }
  
  return resultados;
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  // Node.js
  executarDiagnosticoCompleto().catch(console.error);
} else {
  // Browser
  window.diagnosticarWhatsApp = executarDiagnosticoCompleto;
  console.log('💡 Execute: diagnosticarWhatsApp() para iniciar o diagnóstico');
}

module.exports = { executarDiagnosticoCompleto }; 