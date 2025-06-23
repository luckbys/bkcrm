const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOY PRODUÇÃO CORRIGIDO');
console.log('=============================');

// 1. Verificar arquivo local corrigido
const localFile = path.join(__dirname, 'backend', 'webhooks', 'webhook-evolution-websocket.js');
const productionFile = path.join(__dirname, 'deploy-webhook', 'webhook-evolution-complete-corrigido.cjs');

console.log('1. 📁 Verificando arquivos...');
console.log('   Local:', localFile);
console.log('   Produção:', productionFile);

if (!fs.existsSync(localFile)) {
  console.log('❌ Arquivo local não encontrado');
  process.exit(1);
}

// 2. Ler e verificar correções
console.log('\n2. 📖 Verificando correções...');
const localContent = fs.readFileSync(localFile, 'utf8');

const hasCorrections = localContent.includes('[PRODUÇÃO]') && 
                      localContent.includes('CORREÇÃO: Processar MESSAGES_UPSERT') &&
                      localContent.includes('broadcastToTicket');

if (!hasCorrections) {
  console.log('❌ Correções não encontradas no arquivo local');
  console.log('💡 Execute a correção primeiro');
  process.exit(1);
}

console.log('✅ Correções encontradas no arquivo local');

// 3. Copiar para produção
console.log('\n3. 📋 Copiando para produção...');
try {
  // Converter para CommonJS se necessário
  let productionContent = localContent;
  
  // Substituir imports ES6 por require se necessário
  if (productionContent.includes('import')) {
    productionContent = productionContent
      .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, "const $1 = require('$2')")
      .replace(/import\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, "const {$1} = require('$2')");
  }
  
  fs.writeFileSync(productionFile, productionContent);
  console.log('✅ Arquivo copiado para produção');
  
} catch (error) {
  console.log('❌ Erro ao copiar:', error.message);
  process.exit(1);
}

// 4. Criar script de teste para produção
console.log('\n4. 🧪 Criando script de teste para produção...');

const testScript = `
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarProducaoCorrigido() {
  console.log('🧪 TESTANDO PRODUÇÃO CORRIGIDO');
  console.log('==============================');
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_CORRIGIDO_' + Date.now()
      },
      message: {
        conversation: '🧪 Teste produção corrigido: ' + new Date().toLocaleString()
      },
      messageTimestamp: Date.now(),
      pushName: 'Cliente Teste Corrigido'
    }
  };

  try {
    const response = await fetch('https://bkcrm.devsible.com.br/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log('📊 Resultado:');
    console.log('   Status:', response.status);
    console.log('   Processado:', data.processed);
    console.log('   Ticket ID:', data.ticketId);
    console.log('   WebSocket:', data.websocket);
    console.log('   Mensagem:', data.message);
    
    if (data.processed === true) {
      console.log('\\n✅ SUCESSO: Produção corrigida!');
      console.log('🎉 Agora as mensagens devem aparecer instantaneamente!');
    } else {
      console.log('\\n❌ Ainda não funcionando');
      console.log('💡 Verificar se o deploy foi aplicado');
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testarProducaoCorrigido();
`;

fs.writeFileSync('teste-producao-corrigido.js', testScript);
console.log('✅ Script de teste criado: teste-producao-corrigido.js');

// 5. Instruções de deploy
console.log('\n5. 📋 INSTRUÇÕES DE DEPLOY:');
console.log('============================');
console.log('');
console.log('🔧 PARA APLICAR EM PRODUÇÃO:');
console.log('');
console.log('1. Acesse o EasyPanel VPS');
console.log('2. Vá para o projeto bkcrm');
console.log('3. Encontre o container do webhook');
console.log('4. Faça upload do arquivo:');
console.log(`   ${productionFile}`);
console.log('');
console.log('5. Reinicie o container do webhook');
console.log('6. Execute o teste:');
console.log('   node teste-producao-corrigido.js');
console.log('');
console.log('🎯 RESULTADO ESPERADO:');
console.log('- processed: true');
console.log('- Ticket ID gerado');
console.log('- WebSocket: true');
console.log('- Mensagens aparecem instantaneamente');
console.log('');
console.log('✅ DEPLOY PREPARADO!');
console.log('Aguarde o deploy em produção para testar.'); 