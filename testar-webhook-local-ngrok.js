// 🚀 Testar Webhook Local com Ngrok
// Alternativa rápida para testar enquanto não consegue acessar EasyPanel

import { spawn } from 'child_process';

async function configurarWebhookLocal() {
  console.log('🚀 CONFIGURANDO WEBHOOK LOCAL COM NGROK');
  console.log('='.repeat(50));
  console.log('');

  console.log('📋 PASSOS PARA CONFIGURAR:');
  console.log('');
  
  console.log('1️⃣ **INSTALAR NGROK (se não tiver):**');
  console.log('   npm install -g ngrok');
  console.log('   # ou baixar de: https://ngrok.com/download');
  console.log('');

  console.log('2️⃣ **INICIAR WEBHOOK LOCAL:**');
  console.log('   # Em um terminal, execute:');
  console.log('   node webhook-evolution-complete.js');
  console.log('');

  console.log('3️⃣ **EXPOR WEBHOOK COM NGROK:**');
  console.log('   # Em outro terminal, execute:');
  console.log('   ngrok http 4000');
  console.log('');

  console.log('4️⃣ **COPIAR URL DO NGROK:**');
  console.log('   # Ngrok vai mostrar algo como:');
  console.log('   # https://abc123.ngrok.io -> http://localhost:4000');
  console.log('   # COPIE a URL https://abc123.ngrok.io');
  console.log('');

  console.log('5️⃣ **CONFIGURAR EVOLUTION API:**');
  console.log('   # Execute este comando substituindo a URL:');
  console.log('   # node configurar-webhook-ngrok.js https://abc123.ngrok.io');
  console.log('');

  console.log('🎯 **RESULTADO:**');
  console.log('✅ Webhook local funcionando com credenciais corretas');
  console.log('✅ Ngrok expondo publicamente');
  console.log('✅ Evolution API enviando para seu computador');
  console.log('✅ Mensagens sendo salvas no banco corretamente');
  console.log('');

  console.log('📞 **TESTE:**');
  console.log('Envie mensagem WhatsApp para: 5512981022013');
  console.log('A mensagem deve aparecer no seu CRM local!');
  console.log('');

  console.log('⚡ **VANTAGENS DESTA SOLUÇÃO:**');
  console.log('• Funciona imediatamente');
  console.log('• Usa credenciais corretas do Supabase');
  console.log('• Não precisa acessar EasyPanel agora');
  console.log('• Permite testar e validar funcionamento');
  console.log('');

  console.log('🔧 **COMANDOS PRONTOS:**');
  console.log('');
  console.log('# Terminal 1 - Webhook');
  console.log('node webhook-evolution-complete.js');
  console.log('');
  console.log('# Terminal 2 - Ngrok');
  console.log('ngrok http 4000');
  console.log('');
  console.log('# Terminal 3 - Configurar Evolution (após copiar URL ngrok)');
  console.log('node configurar-webhook-ngrok.js https://SUA_URL_NGROK.ngrok.io');
}

// Executar configuração
configurarWebhookLocal().catch(console.error); 