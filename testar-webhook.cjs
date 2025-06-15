/**
 * TESTE - CRIAÇÃO AUTOMÁTICA DE TICKETS
 * Script para testar se o webhook está criando tickets corretamente
 */

const https = require('http');

async function testarWebhook() {
  console.log('🧪 TESTANDO CRIAÇÃO AUTOMÁTICA DE TICKETS\n');
  
  const payload = {
    event: "MESSAGES_UPSERT",
    instance: "atendimento-ao-cliente-sac1",
    data: {
      key: {
        remoteJid: "5511999999999@s.whatsapp.net",
        fromMe: false,
        id: "test123"
      },
      message: {
        conversation: "Olá, preciso de ajuda com meu pedido"
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: "João Silva"
    }
  };
  
  const postData = JSON.stringify(payload);
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/webhook/evolution',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    console.log('📡 Enviando teste para webhook...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Resposta do webhook:', response);
          
          if (response.processed && response.ticketId) {
            console.log('🎫 Ticket criado com sucesso:', response.ticketId);
            console.log('✅ TESTE PASSOU - Criação automática funcionando!');
          } else {
            console.log('⚠️ Webhook processou mas pode não ter criado ticket');
            console.log('📋 Detalhes:', response);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Erro ao processar resposta:', error);
          console.log('📄 Resposta bruta:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testarHealthCheck() {
  console.log('🏥 Testando health check...');
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/webhook/health',
    method: 'GET'
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health check OK:', response);
          resolve(response);
        } catch (error) {
          console.error('❌ Erro no health check:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro no health check:', error);
      reject(error);
    });
    
    req.end();
  });
}

async function executarTestes() {
  try {
    // 1. Testar health check
    await testarHealthCheck();
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Testar criação de ticket
    await testarWebhook();
    
    console.log('\n🎉 TESTES CONCLUÍDOS!');
    console.log('\n💡 PRÓXIMO PASSO:');
    console.log('   Envie uma mensagem WhatsApp real para testar');
    console.log('   Verifique se o ticket aparece no CRM automaticamente');
    
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('   1. Verifique se o servidor webhook está rodando: netstat -ano | findstr :4000');
    console.log('   2. Reinicie o servidor: node webhook-evolution-complete.js');
    console.log('   3. Verifique os logs do servidor para erros');
  }
}

// Executar testes
executarTestes(); 