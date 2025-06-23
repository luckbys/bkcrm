const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOY WEBHOOK PRODUÇÃO CORRIGIDO');
console.log('=====================================');

// 1. Verificar arquivo local
const localFile = path.join(__dirname, 'backend', 'webhooks', 'webhook-evolution-websocket.js');
const productionFile = path.join(__dirname, 'deploy-webhook', 'webhook-evolution-complete-corrigido.cjs');

console.log('1. 📁 Verificando arquivos...');
console.log('   Local:', localFile);
console.log('   Produção:', productionFile);

if (!fs.existsSync(localFile)) {
  console.log('❌ Arquivo local não encontrado');
  process.exit(1);
}

// 2. Ler arquivo local corrigido
console.log('\n2. 📖 Lendo arquivo local corrigido...');
const localContent = fs.readFileSync(localFile, 'utf8');

// 3. Verificar se tem as correções
const hasCorrections = localContent.includes('[PRODUÇÃO]') && 
                      localContent.includes('CORREÇÃO: Processar MESSAGES_UPSERT');

if (!hasCorrections) {
  console.log('❌ Correções não encontradas no arquivo local');
  console.log('💡 Execute a correção primeiro');
  process.exit(1);
}

console.log('✅ Correções encontradas no arquivo local');

// 4. Copiar para produção
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

// 5. Instruções de deploy
console.log('\n4. 📋 INSTRUÇÕES DE DEPLOY:');
console.log('================================');
console.log('');
console.log('🔧 Para aplicar as correções em produção:');
console.log('');
console.log('1. Acesse o EasyPanel VPS');
console.log('2. Vá para o projeto bkcrm');
console.log('3. Encontre o container do webhook');
console.log('4. Faça upload do arquivo:');
console.log(`   ${productionFile}`);
console.log('');
console.log('5. Reinicie o container do webhook');
console.log('6. Verifique os logs para confirmar');
console.log('');
console.log('🧪 Para testar após deploy:');
console.log('   node teste-webhook-producao.js');
console.log('');
console.log('✅ DEPLOY PREPARADO!');
console.log('Aguarde o deploy em produção para testar.'); 