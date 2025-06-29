// Script para testar endpoint /connection-update
const https = require('https');
const http = require('http');

// Teste local primeiro
async function testLocal() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      instance: "test-instance",
      data: {
        state: "open",
        statusReason: 200
      }
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/connection-update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log('✅ Local Status:', res.statusCode);
        console.log('📄 Local Response:', responseData);
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro local:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Teste produção
async function testProduction() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      instance: "test-instance",
      data: {
        state: "open",
        statusReason: 200
      }
    });

    const options = {
      hostname: 'websocket.bkcrm.devsible.com.br',
      port: 443,
      path: '/connection-update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log('✅ Produção Status:', res.statusCode);
        console.log('📄 Produção Response:', responseData);
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro produção:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testando endpoint /connection-update...\n');
  
  try {
    console.log('📍 Teste LOCAL (localhost:4000):');
    await testLocal();
  } catch (error) {
    console.error('❌ Teste local falhou:', error.message);
  }

  console.log('\n📍 Teste PRODUÇÃO (websocket.bkcrm.devsible.com.br):');
  try {
    await testProduction();
  } catch (error) {
    console.error('❌ Teste produção falhou:', error.message);
  }

  console.log('\n🎯 Teste concluído!');
}

runTests(); 