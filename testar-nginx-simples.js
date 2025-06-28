// Script simples para testar configuracao nginx
const fs = require('fs');

console.log('Testando configuracao nginx...\n');

// Verificar se arquivo existe
if (!fs.existsSync('nginx.frontend.conf')) {
    console.log('ERRO: nginx.frontend.conf nao encontrado!');
    process.exit(1);
}

// Ler e verificar conteudo
try {
    const content = fs.readFileSync('nginx.frontend.conf', 'utf8');
    
    // Verificacoes essenciais
    const checks = [
        { pattern: /server\s*{/, msg: 'Bloco server encontrado' },
        { pattern: /listen\s+80;/, msg: 'Porta 80 configurada' },
        { pattern: /root\s+\/usr\/share\/nginx\/html;/, msg: 'Root directory ok' },
        { pattern: /try_files\s+\$uri\s+\$uri\/\s+\/index\.html;/, msg: 'SPA routing ok' },
        { pattern: /location\s+\/health/, msg: 'Health check ok' },
        { pattern: /gzip\s+on;/, msg: 'Gzip habilitado' }
    ];
    
    let allGood = true;
    
    checks.forEach(check => {
        if (check.pattern.test(content)) {
            console.log(`   OK: ${check.msg}`);
        } else {
            console.log(`   ERRO: ${check.msg} - NAO ENCONTRADO`);
            allGood = false;
        }
    });
    
    // Verificar se ha caracteres problematicos
    if (content.includes('\ufffd') || content.includes('\u0000')) {
        console.log('   ERRO: Caracteres invalidos encontrados');
        allGood = false;
    } else {
        console.log('   OK: Sem caracteres invalidos');
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allGood) {
        console.log('CONFIGURACAO NGINX CORRIGIDA!');
        console.log('\nProximos passos:');
        console.log('1. Commit alteracoes');
        console.log('2. Push para repositorio');
        console.log('3. Redeploy no EasyPanel');
        console.log('\nArquivos alterados:');
        console.log('   - nginx.frontend.conf (criado)');
        console.log('   - Dockerfile.frontend (atualizado)');
    } else {
        console.log('PROBLEMAS ENCONTRADOS!');
        console.log('Corrija os erros antes do deploy');
    }
    
    console.log('='.repeat(50));
    
} catch (error) {
    console.log('ERRO:', error.message);
    process.exit(1);
} 