#!/usr/bin/env node

/**
 * SCRIPT DE TESTE - DOCKERFILE.FRONTEND
 * 
 * Testa se o Dockerfile.frontend está correto e funcional
 */

const fs = require('fs');
const path = require('path');

console.log(`
🐳 ===================================
   TESTE DOCKERFILE.FRONTEND
===================================
`);

// ========================================
// 1. VERIFICAR ARQUIVOS NECESSÁRIOS
// ========================================

function verificarArquivos() {
  console.log('📁 1. VERIFICANDO ARQUIVOS NECESSÁRIOS...\n');
  
  const arquivosNecessarios = [
    'Dockerfile.frontend',
    'nginx.deploy.conf',
    'package.json',
    'package-lock.json'
  ];
  
  const arquivosOpcionais = [
    'nginx.frontend.conf', // arquivo antigo
    '.dockerignore',
    'src/config/index.ts',
    'src/services/database/index.ts',
    'src/services/whatsapp/index.ts'
  ];
  
  let todosOk = true;
  
  // Verificar arquivos obrigatórios
  arquivosNecessarios.forEach(arquivo => {
    if (fs.existsSync(arquivo)) {
      console.log(`✅ ${arquivo} - ENCONTRADO`);
    } else {
      console.log(`❌ ${arquivo} - AUSENTE (OBRIGATÓRIO)`);
      todosOk = false;
    }
  });
  
  console.log('');
  
  // Verificar arquivos opcionais
  arquivosOpcionais.forEach(arquivo => {
    if (fs.existsSync(arquivo)) {
      console.log(`ℹ️  ${arquivo} - encontrado (opcional)`);
    } else {
      console.log(`⚠️  ${arquivo} - ausente (será criado durante build)`);
    }
  });
  
  return todosOk;
}

// ========================================
// 2. VERIFICAR CONTEÚDO DOCKERFILE
// ========================================

function verificarDockerfile() {
  console.log('\n🐳 2. VERIFICANDO DOCKERFILE.FRONTEND...\n');
  
  try {
    const dockerfile = fs.readFileSync('Dockerfile.frontend', 'utf8');
    
    const verificacoes = [
      {
        nome: 'Multi-stage build',
        regex: /FROM node:18-alpine AS build/,
        obrigatorio: true
      },
      {
        nome: 'Instala curl para health check',
        regex: /RUN apk add.*curl/,
        obrigatorio: true
      },
      {
        nome: 'npm ci para dependências',
        regex: /RUN npm ci/,
        obrigatorio: true
      },
      {
        nome: 'npm run build',
        regex: /RUN npm run build/,
        obrigatorio: true
      },
      {
        nome: 'Nginx alpine',
        regex: /FROM nginx:alpine/,
        obrigatorio: true
      },
      {
        nome: 'Configuração nginx correta',
        regex: /COPY nginx\.deploy\.conf/,
        obrigatorio: true
      },
      {
        nome: 'Health check configurado',
        regex: /HEALTHCHECK.*curl.*\/health/,
        obrigatorio: true
      },
      {
        nome: 'Expõe porta 80',
        regex: /EXPOSE 80/,
        obrigatorio: true
      }
    ];
    
    let passou = true;
    
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(dockerfile)) {
        console.log(`✅ ${verificacao.nome}`);
      } else {
        console.log(`${verificacao.obrigatorio ? '❌' : '⚠️'} ${verificacao.nome} ${verificacao.obrigatorio ? '(OBRIGATÓRIO)' : '(opcional)'}`);
        if (verificacao.obrigatorio) passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log(`❌ Erro ao ler Dockerfile: ${error.message}`);
    return false;
  }
}

// ========================================
// 3. VERIFICAR NGINX.DEPLOY.CONF
// ========================================

function verificarNginxConf() {
  console.log('\n🌐 3. VERIFICANDO NGINX.DEPLOY.CONF...\n');
  
  try {
    const nginxConf = fs.readFileSync('nginx.deploy.conf', 'utf8');
    
    const verificacoes = [
      {
        nome: 'Bloco server configurado',
        regex: /server\s*{/,
        obrigatorio: true
      },
      {
        nome: 'SPA routing (try_files)',
        regex: /try_files.*index\.html/,
        obrigatorio: true
      },
      {
        nome: 'Cache para assets estáticos',
        regex: /location.*\.(js|css).*expires/,
        obrigatorio: true
      },
      {
        nome: 'Health check endpoint',
        regex: /location \/health/,
        obrigatorio: true
      },
      {
        nome: 'Headers de segurança',
        regex: /X-Frame-Options|X-XSS-Protection/,
        obrigatorio: true
      },
      {
        nome: 'WebSocket proxy',
        regex: /location \/ws\//,
        obrigatorio: false
      },
      {
        nome: 'Configuração de logs',
        regex: /access_log|error_log/,
        obrigatorio: false
      }
    ];
    
    let passou = true;
    
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(nginxConf)) {
        console.log(`✅ ${verificacao.nome}`);
      } else {
        console.log(`${verificacao.obrigatorio ? '❌' : '⚠️'} ${verificacao.nome} ${verificacao.obrigatorio ? '(OBRIGATÓRIO)' : '(opcional)'}`);
        if (verificacao.obrigatorio) passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log(`❌ Erro ao ler nginx.deploy.conf: ${error.message}`);
    return false;
  }
}

// ========================================
// 4. GERAR COMANDOS DE BUILD
// ========================================

function gerarComandos() {
  console.log('\n🚀 4. COMANDOS PARA BUILD E TESTE:\n');
  
  console.log(`
📋 COMANDOS DOCKER:

# Build da imagem
docker build -f Dockerfile.frontend -t bkcrm-frontend:latest .

# Executar container
docker run -d --name bkcrm-frontend-test -p 8080:80 bkcrm-frontend:latest

# Testar health check
curl http://localhost:8080/health

# Testar aplicação
curl http://localhost:8080/

# Ver logs
docker logs bkcrm-frontend-test

# Parar e remover
docker stop bkcrm-frontend-test
docker rm bkcrm-frontend-test

🐳 BUILD OTIMIZADO (com cache):

# Build com cache
docker build -f Dockerfile.frontend --target build -t bkcrm-build:latest .
docker build -f Dockerfile.frontend -t bkcrm-frontend:latest .

📊 ANÁLISE DA IMAGEM:

# Tamanho da imagem
docker images bkcrm-frontend:latest

# Layers da imagem  
docker history bkcrm-frontend:latest

# Inspecionar imagem
docker inspect bkcrm-frontend:latest
`);
}

// ========================================
// 5. INSTRUÇÕES DE CORREÇÃO
// ========================================

function exibirInstrucoes() {
  console.log(`
🛠️ 5. INSTRUÇÕES DE CORREÇÃO:

📁 ESTRUTURA DE ARQUIVOS NECESSÁRIA:
   bkcrm/
   ├── Dockerfile.frontend      ✅ Corrigido
   ├── nginx.deploy.conf        ✅ Criado  
   ├── package.json             ✅ Existente
   ├── package-lock.json        ✅ Existente
   ├── src/                     ✅ Existente
   └── public/                  ✅ Existente

⚡ MELHORIAS APLICADAS:
   1. ✅ Multi-stage build para menor tamanho final
   2. ✅ curl instalado para health check funcional  
   3. ✅ Configuração nginx como arquivo separado
   4. ✅ Cache otimizado para assets estáticos
   5. ✅ Criação segura de diretórios/arquivos
   6. ✅ Logs organizados e health check endpoint
   7. ✅ Proxy WebSocket para chat em tempo real

🔧 PROBLEMAS CORRIGIDOS:
   ❌ nginx.frontend.conf tinha estrutura completa (events + http)
   ✅ nginx.deploy.conf tem apenas bloco server
   
   ❌ Health check sem curl instalado
   ✅ curl instalado na imagem final
   
   ❌ Arquivos sempre sobrescritos
   ✅ Criação condicional de arquivos placeholder

🎯 RESULTADO ESPERADO:
   - ✅ Build Docker sem erros
   - ✅ Nginx servindo SPA corretamente  
   - ✅ Health check funcionando
   - ✅ Assets com cache otimizado
   - ✅ Logs organizados
`);
}

// ========================================
// 6. EXECUÇÃO PRINCIPAL
// ========================================

async function executarTeste() {
  try {
    const arquivosOk = verificarArquivos();
    const dockerfileOk = verificarDockerfile();
    const nginxOk = verificarNginxConf();
    
    console.log('\n' + '='.repeat(50));
    
    if (arquivosOk && dockerfileOk && nginxOk) {
      console.log('🎉 TESTE PASSOU! Dockerfile.frontend está correto e pronto para uso.');
      console.log('✅ Todos os arquivos necessários estão presentes');
      console.log('✅ Dockerfile tem todas as configurações obrigatórias');
      console.log('✅ nginx.deploy.conf está corretamente configurado');
    } else {
      console.log('⚠️ TESTE FALHOU! Verifique os problemas acima.');
      if (!arquivosOk) console.log('❌ Arquivos obrigatórios ausentes');
      if (!dockerfileOk) console.log('❌ Dockerfile com problemas');
      if (!nginxOk) console.log('❌ nginx.deploy.conf com problemas');
    }
    
    gerarComandos();
    exibirInstrucoes();
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  executarTeste();
}

module.exports = {
  verificarArquivos,
  verificarDockerfile,
  verificarNginxConf,
  executarTeste
}; 