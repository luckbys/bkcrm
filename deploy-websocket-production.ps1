#!/usr/bin/env powershell

# 🚀 Deploy WebSocket Produção - BKCRM
# URL WebSocket: https://websocket.bkcrm.devsible.com.br/
# Data: $(Get-Date)

Write-Host "🚀 BKCRM - Deploy WebSocket Produção" -ForegroundColor Green
Write-Host "📡 URL WebSocket: https://websocket.bkcrm.devsible.com.br/" -ForegroundColor Yellow
Write-Host "⚡ Iniciando deploy..." -ForegroundColor White

# 1. Verificar se npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não encontrado! Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# 2. Verificar arquivos necessários
$requiredFiles = @(
    "package.json",
    "src/stores/chatStore.ts",
    "src/hooks/useWebSocketMessages.ts",
    "deployment/env.production"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Arquivo necessário não encontrado: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Arquivos verificados" -ForegroundColor Green

# 3. Aplicar configurações de produção
Write-Host "🔧 Aplicando configurações de produção..." -ForegroundColor Yellow

# Copiar arquivo de ambiente
Copy-Item "deployment/env.production" ".env" -Force
Write-Host "✅ Arquivo .env atualizado" -ForegroundColor Green

# 4. Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install --production=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar dependências" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# 5. Build da aplicação
Write-Host "🏗️ Fazendo build da aplicação..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha no build da aplicação" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído" -ForegroundColor Green

# 6. Verificar se dist foi criado
if (-not (Test-Path "dist")) {
    Write-Host "❌ Pasta dist não foi criada" -ForegroundColor Red
    exit 1
}

# 7. Criar package de deploy
Write-Host "📦 Criando package de deploy..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageName = "bkcrm-websocket-production-$timestamp.zip"

# Criar zip com arquivos necessários
Compress-Archive -Path "dist/*", "deployment/nginx-websocket-production.conf", "deploy-webhook/easypanel-websocket.json" -DestinationPath $packageName -Force
Write-Host "✅ Package criado: $packageName" -ForegroundColor Green

# 8. Verificar configurações WebSocket
Write-Host "🔍 Verificando configurações WebSocket..." -ForegroundColor Yellow

$chatStoreContent = Get-Content "src/stores/chatStore.ts" -Raw
if ($chatStoreContent -match "websocket\.bkcrm\.devsible\.com\.br") {
    Write-Host "✅ URL WebSocket correta no chatStore.ts" -ForegroundColor Green
} else {
    Write-Host "⚠️ Verificar URL WebSocket no chatStore.ts" -ForegroundColor Yellow
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "websocket\.bkcrm\.devsible\.com\.br") {
    Write-Host "✅ URL WebSocket correta no .env" -ForegroundColor Green
} else {
    Write-Host "⚠️ Verificar URL WebSocket no .env" -ForegroundColor Yellow
}

# 9. Informações de deploy
Write-Host "`n🎯 INFORMAÇÕES DE DEPLOY" -ForegroundColor Cyan
Write-Host "📦 Package: $packageName" -ForegroundColor White
Write-Host "📡 WebSocket URL: https://websocket.bkcrm.devsible.com.br/" -ForegroundColor White
Write-Host "🌐 Frontend URL: https://bkcrm.devsible.com.br/" -ForegroundColor White

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Fazer upload do $packageName para o servidor" -ForegroundColor White
Write-Host "2. Extrair arquivos no diretório web" -ForegroundColor White
Write-Host "3. Configurar nginx com deployment/nginx-websocket-production.conf" -ForegroundColor White
Write-Host "4. Reiniciar nginx: sudo systemctl reload nginx" -ForegroundColor White
Write-Host "5. Testar conexão: curl https://websocket.bkcrm.devsible.com.br/health" -ForegroundColor White

Write-Host "`n✅ Deploy preparado com sucesso!" -ForegroundColor Green
Write-Host "🚀 URL WebSocket: https://websocket.bkcrm.devsible.com.br/" -ForegroundColor Yellow

# 10. Testar configurações (opcional)
$testConfig = Read-Host "`n🧪 Executar teste de configuração? (s/n)"
if ($testConfig -eq "s" -or $testConfig -eq "S") {
    Write-Host "🧪 Testando configurações..." -ForegroundColor Yellow
    
    # Verificar se URL está no chatStore
    if (Select-String -Path "src/stores/chatStore.ts" -Pattern "websocket\.bkcrm\.devsible\.com\.br" -Quiet) {
        Write-Host "✅ chatStore.ts configurado corretamente" -ForegroundColor Green
    } else {
        Write-Host "❌ chatStore.ts precisa de correção" -ForegroundColor Red
    }
    
    # Verificar se URL está no useWebSocketMessages
    if (Select-String -Path "src/hooks/useWebSocketMessages.ts" -Pattern "websocket\.bkcrm\.devsible\.com\.br" -Quiet) {
        Write-Host "✅ useWebSocketMessages.ts configurado corretamente" -ForegroundColor Green
    } else {
        Write-Host "❌ useWebSocketMessages.ts precisa de correção" -ForegroundColor Red
    }
    
    Write-Host "✅ Testes concluídos" -ForegroundColor Green
}

Write-Host "`n🎉 Deploy WebSocket produção finalizado!" -ForegroundColor Green
Write-Host "📡 Acesse: https://websocket.bkcrm.devsible.com.br/" -ForegroundColor Yellow 