// 🔍 DIAGNOSTICO COMPLETO - Webhook Evolution API
// Verifica estado do webhook e identifica problemas

const fetch = require('node-fetch');
const { execSync } = require('child_process');

console.log('🔍 DIAGNOSTICO COMPLETO - Webhook Evolution API\n');

async function verificarHealthCheck() {
  try {
    console.log('1️⃣ Verificando health check...');
    
    const response = await fetch('http://localhost:4000/webhook/health', {
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Webhook ATIVO');
      console.log('   📊 Status:', data.status);
      console.log('   🔗 WebSocket Connections:', data.websocket?.connections || 0);
      console.log('   🎫 Active Tickets:', data.websocket?.activeTickets || 0);
      return true;
    } else {
      console.log('   ❌ Health check falhou:', response.status);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Webhook NAO ATIVO:', error.message);
    return false;
  }
}

async function testarRotaMessagesUpsert() {
  try {
    console.log('\n2️⃣ Testando rota /messages-upsert...');
    
    const testPayload = {
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          remoteJid: '5511999998888@s.whatsapp.net',
          fromMe: false,
          id: 'DIAG_TEST_' + Date.now()
        },
        message: {
          conversation: 'Teste de diagnóstico - mensagem automatica'
        },
        pushName: 'Cliente Diagnostico',
        messageTimestamp: Math.floor(Date.now() / 1000)
      }
    };

    const response = await fetch('http://localhost:4000/messages-upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 10000
    });

    const result = await response.json();
    
    console.log('   📥 Status:', response.status);
    console.log('   📦 Received:', result.received);
    console.log('   ⚙️ Processed:', result.processed);
    console.log('   🎫 Ticket ID:', result.ticketId);
    console.log('   📋 Message:', result.message);
    
    if (response.ok && result.processed) {
      console.log('   ✅ ROTA FUNCIONANDO');
      return true;
    } else {
      console.log('   ❌ ROTA COM PROBLEMAS');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ ERRO na rota:', error.message);
    return false;
  }
}

function verificarProcessosNode() {
  try {
    console.log('\n3️⃣ Verificando processos Node.js...');
    
    // Windows PowerShell command para listar processos node
    const processes = execSync('Get-Process node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize', { 
      encoding: 'utf8', 
      shell: 'powershell.exe' 
    });
    
    if (processes.trim()) {
      console.log('   📋 Processos Node.js ativos:');
      console.log(processes);
    } else {
      console.log('   ❌ Nenhum processo Node.js encontrado');
    }
  } catch (error) {
    console.log('   ⚠️ Erro ao verificar processos:', error.message);
  }
}

function verificarPorta4000() {
  try {
    console.log('\n4️⃣ Verificando se porta 4000 esta em uso...');
    
    const result = execSync('netstat -ano | findstr :4000', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.trim()) {
      console.log('   ✅ Porta 4000 EM USO');
      console.log('   📋 Detalhes:');
      console.log(result);
    } else {
      console.log('   ❌ Porta 4000 LIVRE (webhook nao esta rodando)');
    }
  } catch (error) {
    console.log('   ❌ Porta 4000 LIVRE (webhook nao esta rodando)');
  }
}

async function executarDiagnosticoCompleto() {
  console.log('=========================================');
  console.log('🏥 INICIANDO DIAGNOSTICO COMPLETO');
  console.log('=========================================');
  
  const healthOk = await verificarHealthCheck();
  const rotaOk = await testarRotaMessagesUpsert();
  
  verificarPorta4000();
  verificarProcessosNode();
  
  console.log('\n=========================================');
  console.log('📋 RESUMO DO DIAGNOSTICO');
  console.log('=========================================');
  
  console.log('Webhook Health Check:', healthOk ? '✅ OK' : '❌ FALHOU');
  console.log('Rota /messages-upsert:', rotaOk ? '✅ OK' : '❌ FALHOU');
  
  if (!healthOk) {
    console.log('\n🚨 PROBLEMA IDENTIFICADO: Webhook nao esta rodando');
    console.log('💡 SOLUCAO:');
    console.log('   1. Abra novo terminal');
    console.log('   2. Execute: npm start');
    console.log('   3. Aguarde mensagem "Sistema WebSocket ativo"');
    console.log('   4. Execute este diagnostico novamente');
  } else if (!rotaOk) {
    console.log('\n🚨 PROBLEMA IDENTIFICADO: Rota /messages-upsert com problemas');
    console.log('💡 SOLUCAO:');
    console.log('   1. Reinicie o webhook (Ctrl+C no terminal do webhook)');
    console.log('   2. Execute: npm start');
    console.log('   3. Teste novamente');
  } else {
    console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
    console.log('✅ Webhook ativo e processando mensagens');
    console.log('🔄 Agora mensagens do WhatsApp devem criar tickets automaticamente');
  }
}

// Executar diagnostico
executarDiagnosticoCompleto(); 