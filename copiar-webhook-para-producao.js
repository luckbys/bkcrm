const fs = require('fs');
const path = require('path');

console.log('📋 COPIANDO WEBHOOK PARA PRODUÇÃO');
console.log('==================================');

// Caminho do arquivo local
const arquivoLocal = path.join(__dirname, 'backend', 'webhooks', 'webhook-evolution-websocket.js');

try {
  // Ler o arquivo local
  console.log('📖 Lendo arquivo local...');
  const conteudo = fs.readFileSync(arquivoLocal, 'utf8');
  
  console.log('✅ Arquivo lido com sucesso!');
  console.log(`📊 Tamanho: ${conteudo.length} caracteres`);
  console.log(`📄 Linhas: ${conteudo.split('\n').length}`);
  
  console.log('\n📋 INSTRUÇÕES PARA SOBRESCREVER:');
  console.log('==================================');
  console.log('');
  console.log('1. Acesse o EasyPanel VPS');
  console.log('2. Vá para o projeto bkcrm');
  console.log('3. Encontre o container bkcrm-websocket');
  console.log('4. Clique em "Files" ou "File Manager"');
  console.log('5. Navegue até /code/');
  console.log('6. Encontre webhook-evolution-websocket.js');
  console.log('7. Clique com botão direito → "Edit"');
  console.log('8. Selecione todo o conteúdo (Ctrl+A)');
  console.log('9. Cole o conteúdo abaixo:');
  console.log('');
  console.log('🔽 COLE O CONTEÚDO ABAIXO NO EASYPANEL 🔽');
  console.log('==========================================');
  console.log('');
  console.log(conteudo);
  console.log('');
  console.log('==========================================');
  console.log('🔼 FIM DO CONTEÚDO 🔼');
  console.log('');
  console.log('10. Salve o arquivo (Ctrl+S)');
  console.log('11. Volte para o container');
  console.log('12. Clique em "Restart" ou "Reiniciar"');
  console.log('');
  console.log('🎯 PRONTO! Webhook atualizado em produção!');
  
} catch (error) {
  console.log('❌ Erro ao ler arquivo:', error.message);
  console.log('💡 Verifique se o arquivo existe em: backend/webhooks/webhook-evolution-websocket.js');
} 