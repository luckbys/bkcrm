#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE CORREÇÃO - NOME DA INSTÂNCIA EVOLUTION API
 * 
 * Este script corrige automaticamente o nome da instância da Evolution API
 * em todos os arquivos do projeto, alterando de:
 * 'atendimento-ao-cliente-suporte' (❌ NÃO EXISTE)
 * para:
 * 'atendimento-ao-cliente-suporte' (✅ EXISTE E ESTÁ CONECTADA)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO AUTOMÁTICA - NOME DA INSTÂNCIA EVOLUTION API');
console.log('=' .repeat(60));

// Configurações
const INSTANCIA_INCORRETA = 'atendimento-ao-cliente-suporte';
const INSTANCIA_CORRETA = 'atendimento-ao-cliente-suporte';

// Diretórios e arquivos para verificar
const DIRETORIOS_PARA_VERIFICAR = [
  'backend/tests',
  'backend/webhooks', 
  'backend/scripts',
  'src',
  'docs'
];

// Extensões de arquivo para processar
const EXTENSOES_VALIDAS = ['.js', '.ts', '.tsx', '.json', '.md', '.sql'];

let arquivosCorrigidos = 0;
let ocorrenciasCorrigidas = 0;

/**
 * Processar um arquivo específico
 */
function processarArquivo(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    
    // Verificar se contém a instância incorreta
    if (conteudo.includes(INSTANCIA_INCORRETA)) {
      console.log(`📝 Corrigindo: ${caminhoArquivo}`);
      
      // Contar ocorrências
      const ocorrencias = (conteudo.match(new RegExp(INSTANCIA_INCORRETA, 'g')) || []).length;
      
      // Substituir todas as ocorrências
      const conteudoCorrigido = conteudo.replace(
        new RegExp(INSTANCIA_INCORRETA, 'g'), 
        INSTANCIA_CORRETA
      );
      
      // Escrever arquivo corrigido
      fs.writeFileSync(caminhoArquivo, conteudoCorrigido, 'utf8');
      
      console.log(`   ✅ ${ocorrencias} ocorrência(s) corrigida(s)`);
      
      arquivosCorrigidos++;
      ocorrenciasCorrigidas += ocorrencias;
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${caminhoArquivo}:`, error.message);
    return false;
  }
}

/**
 * Processar diretório recursivamente
 */
function processarDiretorio(caminhoDiretorio) {
  try {
    const itens = fs.readdirSync(caminhoDiretorio);
    
    for (const item of itens) {
      const caminhoCompleto = path.join(caminhoDiretorio, item);
      const stats = fs.statSync(caminhoCompleto);
      
      if (stats.isDirectory()) {
        // Processar subdiretório recursivamente
        processarDiretorio(caminhoCompleto);
      } else if (stats.isFile()) {
        // Verificar se é um arquivo válido para processar
        const extensao = path.extname(caminhoCompleto);
        if (EXTENSOES_VALIDAS.includes(extensao)) {
          processarArquivo(caminhoCompleto);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${caminhoDiretorio}:`, error.message);
  }
}

/**
 * Função principal
 */
function executarCorrecao() {
  console.log('🔍 Verificando instâncias Evolution API...');
  console.log(`   ❌ Instância incorreta: ${INSTANCIA_INCORRETA}`);
  console.log(`   ✅ Instância correta: ${INSTANCIA_CORRETA}`);
  console.log('');
  
  console.log('📂 Processando diretórios...');
  
  // Processar cada diretório
  for (const diretorio of DIRETORIOS_PARA_VERIFICAR) {
    if (fs.existsSync(diretorio)) {
      console.log(`\n📁 Processando: ${diretorio}`);
      processarDiretorio(diretorio);
    } else {
      console.log(`⚠️ Diretório não encontrado: ${diretorio}`);
    }
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE CORREÇÃO');
  console.log('='.repeat(60));
  console.log(`📄 Arquivos corrigidos: ${arquivosCorrigidos}`);
  console.log(`🔄 Ocorrências corrigidas: ${ocorrenciasCorrigidas}`);
  
  if (arquivosCorrigidos > 0) {
    console.log('\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Reiniciar o webhook (se estiver rodando)');
    console.log('2. Reiniciar o frontend (se estiver rodando)');
    console.log('3. Testar envio de mensagem');
    console.log('');
    console.log('🧪 Comando de teste:');
    console.log('curl -X POST http://localhost:4000/webhook/send-message \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"phone":"5512981022013","text":"Teste após correção","instance":"atendimento-ao-cliente-suporte"}\'');
  } else {
    console.log('\n📌 Nenhuma correção necessária - todos os arquivos já estão corretos!');
  }
  
  console.log('\n🎯 Instância Evolution API configurada corretamente!');
}

// Executar correção
if (require.main === module) {
  executarCorrecao();
}

module.exports = {
  executarCorrecao,
  processarArquivo,
  INSTANCIA_INCORRETA,
  INSTANCIA_CORRETA
}; 