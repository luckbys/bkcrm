// ================================================================
// SCRIPT DE DIAGNÓSTICO SUPABASE
// ================================================================
// Execute com: node check-supabase-config.js

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO SUPABASE - BKCRM');
console.log('================================');
console.log('');

// Verificar se arquivo .env existe
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('📁 Arquivo .env:', envExists ? '✅ Existe' : '❌ Não encontrado');

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar variáveis necessárias
    const hasUrl = envContent.includes('VITE_SUPABASE_URL');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
    
    console.log('🔗 VITE_SUPABASE_URL:', hasUrl ? '✅ Configurada' : '❌ Faltando');
    console.log('🔑 VITE_SUPABASE_ANON_KEY:', hasKey ? '✅ Configurada' : '❌ Faltando');
    
    if (hasUrl && hasKey) {
      console.log('');
      console.log('✅ Configuração básica parece correta!');
      console.log('');
      console.log('🔄 Se ainda houver erro:');
      console.log('1. Pare o servidor (Ctrl+C)');
      console.log('2. Execute: npm run dev');
      console.log('3. Verifique se as chaves são válidas no Supabase Dashboard');
    } else {
      console.log('');
      console.log('❌ Configuração incompleta!');
      console.log('');
      console.log('🔧 Para corrigir:');
      console.log('1. Abra o arquivo .env');
      console.log('2. Adicione as variáveis faltando');
      console.log('3. Use o template do arquivo CORRECAO_SUPABASE_API_KEY.md');
    }
    
  } catch (error) {
    console.log('❌ Erro ao ler .env:', error.message);
  }
} else {
  console.log('');
  console.log('🚨 PROBLEMA ENCONTRADO: Arquivo .env não existe!');
  console.log('');
  console.log('🔧 Para resolver:');
  console.log('1. Crie um arquivo .env na raiz do projeto');
  console.log('2. Use este template:');
  console.log('');
  console.log('# Configurações Supabase');
  console.log('VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui');
  console.log('VITE_ENABLE_REALTIME=true');
  console.log('');
  console.log('3. Substitua "sua_chave_publica_aqui" pela chave real do Supabase');
  console.log('4. Reinicie o servidor: npm run dev');
}

console.log('');
console.log('📋 Próximos passos:');
console.log('1. Consulte: CORRECAO_SUPABASE_API_KEY.md');
console.log('2. Se necessário, execute os scripts SQL de correção');
console.log('3. Teste o login após configurar');
console.log('');
console.log('🆘 Se ainda tiver problemas, verifique:');
console.log('- Chaves corretas no Supabase Dashboard');
console.log('- Arquivo .env na raiz (mesmo nível que package.json)');
console.log('- Servidor reiniciado após mudanças no .env'); 