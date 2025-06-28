#!/usr/bin/env node

// Script de Verificacao - Deploy Frontend EasyPanel
// Verifica se todos os arquivos necessarios estao presentes

const fs = require('fs');
const path = require('path');

console.log('Verificando preparacao para deploy frontend...\n');

// Arquivos obrigatorios para deploy
const requiredFiles = [
    'package.json',
    'Dockerfile.frontend',
    'nginx.deploy.conf',
    'index.html',
    'vite.config.ts',
    'src/main.tsx'
];

// Variaveis de ambiente necessarias
const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_EVOLUTION_API_URL',
    'VITE_EVOLUTION_API_KEY'
];

let allGood = true;

console.log('Verificando arquivos obrigatorios...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   OK: ${file}`);
    } else {
        console.log(`   ERRO: ${file} - ARQUIVO AUSENTE!`);
        allGood = false;
    }
});

console.log('\nVerificando package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
        console.log('   OK: Script "build" encontrado');
    } else {
        console.log('   ERRO: Script "build" nao encontrado no package.json');
        allGood = false;
    }
    
    const requiredDeps = ['react', 'vite', '@vitejs/plugin-react'];
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            console.log(`   OK: ${dep}`);
        } else {
            console.log(`   ERRO: ${dep} - DEPENDENCIA AUSENTE`);
            allGood = false;
        }
    });
} catch (error) {
    console.log('   ERRO ao ler package.json:', error.message);
    allGood = false;
}

console.log('\nVerificando Dockerfile.frontend...');
try {
    const dockerfile = fs.readFileSync('Dockerfile.frontend', 'utf8');
    
    if (dockerfile.includes('FROM node:18-alpine AS build')) {
        console.log('   OK: Multi-stage build configurado');
    } else {
        console.log('   AVISO: Dockerfile pode nao estar otimizado');
    }
    
    if (dockerfile.includes('nginx.deploy.conf')) {
        console.log('   OK: Configuracao nginx referenciada');
    } else {
        console.log('   ERRO: Configuracao nginx nao referenciada');
        allGood = false;
    }
} catch (error) {
    console.log('   ERRO ao ler Dockerfile.frontend:', error.message);
    allGood = false;
}

console.log('\nVerificando configuracao nginx...');
try {
    const nginx = fs.readFileSync('nginx.deploy.conf', 'utf8');
    
    if (nginx.includes('try_files $uri $uri/ /index.html')) {
        console.log('   OK: SPA routing configurado');
    } else {
        console.log('   AVISO: SPA routing pode nao estar configurado');
    }
    
    if (nginx.includes('/health')) {
        console.log('   OK: Health check endpoint configurado');
    } else {
        console.log('   AVISO: Health check endpoint nao encontrado');
    }
} catch (error) {
    console.log('   ERRO ao ler nginx.deploy.conf:', error.message);
    allGood = false;
}

console.log('\n' + '='.repeat(60));

if (allGood) {
    console.log('PROJETO PRONTO PARA DEPLOY!\n');
    
    console.log('PROXIMOS PASSOS NO EASYPANEL:\n');
    console.log('1. Criar novo App (nao Static Site)');
    console.log('2. Source: Git Repository');
    console.log('3. Dockerfile Path: Dockerfile.frontend');
    console.log('4. Port: 80');
    console.log('5. Domain: bkcrm.devsible.com.br');
    console.log('6. Configurar variaveis de ambiente:');
    requiredEnvVars.forEach(envVar => {
        console.log(`     ${envVar}=valor_correto`);
    });
    console.log('7. Deploy!');
    
    console.log('\nURLs apos deploy:');
    console.log('   Frontend: https://bkcrm.devsible.com.br');
    console.log('   Health:   https://bkcrm.devsible.com.br/health');
    
} else {
    console.log('PROBLEMAS ENCONTRADOS!');
    console.log('   Corrija os itens marcados com ERRO antes do deploy');
}

console.log('\nSe precisar de ajuda:');
console.log('   1. Verifique logs do EasyPanel durante build');
console.log('   2. Confirme se todas as variaveis de ambiente estao configuradas');
console.log('   3. Teste build local: npm run build');

console.log('\n' + '='.repeat(60)); 