// 🔧 Atualizar Webhook de Produção com Credenciais Corretas
// Este script corrige as credenciais do Supabase no webhook de produção

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Credenciais corretas do Supabase
const CREDENCIAIS_CORRETAS = {
  SUPABASE_URL: 'https://ajlgjjjvuglwgfnyqqvb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU'
};

async function atualizarWebhookProducao() {
  console.log('🔧 ATUALIZANDO WEBHOOK DE PRODUÇÃO');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. Ler o arquivo webhook atual
    console.log('1️⃣ Lendo arquivo webhook atual...');
    const webhookPath = path.join(__dirname, 'webhook-evolution-complete.js');
    
    if (!fs.existsSync(webhookPath)) {
      throw new Error('Arquivo webhook-evolution-complete.js não encontrado');
    }

    let webhookContent = fs.readFileSync(webhookPath, 'utf8');
    console.log('✅ Arquivo webhook carregado');

    // 2. Fazer backup
    const backupPath = `${webhookPath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, webhookContent);
    console.log(`💾 Backup criado: ${path.basename(backupPath)}`);

    // 3. Atualizar credenciais no código
    console.log('');
    console.log('2️⃣ Atualizando credenciais do Supabase...');

    // Atualizar URL do Supabase
    webhookContent = webhookContent.replace(
      /const supabaseUrl = process\.env\.SUPABASE_URL \|\| '[^']*'/g,
      `const supabaseUrl = process.env.SUPABASE_URL || '${CREDENCIAIS_CORRETAS.SUPABASE_URL}'`
    );

    // Atualizar chave anon
    webhookContent = webhookContent.replace(
      /const supabaseAnonKey = process\.env\.SUPABASE_ANON_KEY \|\| '[^']*'/g,
      `const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '${CREDENCIAIS_CORRETAS.SUPABASE_ANON_KEY}'`
    );

    // Atualizar service role key
    webhookContent = webhookContent.replace(
      /const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| '[^']*'/g,
      `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '${CREDENCIAIS_CORRETAS.SUPABASE_SERVICE_ROLE_KEY}'`
    );

    // 4. Corrigir validação de telefone e conteúdo
    console.log('3️⃣ Corrigindo validação de telefone e conteúdo...');

    // Melhorar validação de telefone
    const validacaoTelefoneNova = `
  // Validação melhorada de telefone
  function validarTelefone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remover caracteres especiais
    const phoneClean = phone.replace(/[^0-9]/g, '');
    
    // Aceitar telefones com 10-15 dígitos
    return phoneClean.length >= 10 && phoneClean.length <= 15;
  }

  // Validação melhorada de conteúdo
  function validarConteudo(content) {
    if (!content) return false;
    if (typeof content !== 'string') return false;
    
    // Aceitar qualquer conteúdo não vazio
    return content.trim().length > 0;
  }`;

    // Substituir validações antigas
    webhookContent = webhookContent.replace(
      /\/\/ Validação.*?function validarConteudo.*?}/gs,
      validacaoTelefoneNova
    );

    // Atualizar uso das validações
    webhookContent = webhookContent.replace(
      /if \(!phone \|\| !content\) {[\s\S]*?return;[\s\S]*?}/g,
      `if (!validarTelefone(phone) || !validarConteudo(content)) {
        console.log('⚠️ Telefone ou conteúdo inválido:', { phone, content: content?.substring(0, 50) });
        return;
      }`
    );

    // 5. Salvar arquivo atualizado
    fs.writeFileSync(webhookPath, webhookContent);
    console.log('✅ Credenciais atualizadas no arquivo webhook');
    console.log('✅ Validações corrigidas');

    // 6. Criar arquivo de configuração para produção
    console.log('');
    console.log('4️⃣ Criando arquivo de configuração para produção...');
    
    const configProducao = `# Configuração para Deploy em Produção
# Copie estas variáveis para o seu servidor de produção

WEBHOOK_PORT=4000
NODE_ENV=production
BASE_URL=https://bkcrm.devsible.com.br

# Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# Supabase - CREDENCIAIS CORRETAS
SUPABASE_URL=${CREDENCIAIS_CORRETAS.SUPABASE_URL}
SUPABASE_ANON_KEY=${CREDENCIAIS_CORRETAS.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${CREDENCIAIS_CORRETAS.SUPABASE_SERVICE_ROLE_KEY}

# Segurança
WEBHOOK_SECRET=evolution_webhook_secret_2024
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,https://press-evolution-api.jhkbgs.easypanel.host`;

    fs.writeFileSync('webhook-producao.env', configProducao);
    console.log('✅ Arquivo webhook-producao.env criado');

    console.log('');
    console.log('🎯 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Fazer upload do webhook-evolution-complete.js atualizado para o servidor');
    console.log('2. Atualizar as variáveis de ambiente no EasyPanel com webhook-producao.env');
    console.log('3. Reiniciar o webhook no servidor de produção');
    console.log('4. Testar novamente com mensagem real');
    console.log('');
    console.log('🔧 COMANDOS PARA TESTAR:');
    console.log('node corrigir-webhook-producao.js  # Testar novamente');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao atualizar webhook:', error.message);
  }
}

// Executar atualização
atualizarWebhookProducao().catch(console.error); 