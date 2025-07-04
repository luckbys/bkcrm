#!/usr/bin/env pwsh

Write-Host "🔧 Reiniciando Webhook - Limpeza Completa" -ForegroundColor Yellow

# Parar todos os processos Node.js
Write-Host "⏹️ Parando todos os processos Node.js..." -ForegroundColor Red
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Processos Node.js parados" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Nenhum processo Node.js estava rodando" -ForegroundColor Yellow
}

# Aguardar um momento
Start-Sleep -Seconds 2

# Verificar se a porta 4000 está livre
Write-Host "🔍 Verificando porta 4000..." -ForegroundColor Cyan
$portUsage = netstat -an | findstr "4000"
if ($portUsage) {
    Write-Host "⚠️ Porta 4000 ainda em uso:" -ForegroundColor Yellow
    Write-Host $portUsage
    Write-Host "⏳ Aguardando liberação da porta..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Navegar para o diretório correto se necessário
$currentDir = Get-Location
if ($currentDir.Path -notlike "*bkcrm*") {
    Write-Host "📁 Navegando para diretório do projeto..." -ForegroundColor Cyan
    cd "C:\Users\jarvi\OneDrive\Imagens\projeto 1\bkcrm"
}

# Verificar se o arquivo do webhook existe
$webhookFile = "backend/webhooks/webhook-evolution-complete-corrigido.js"
if (Test-Path $webhookFile) {
    Write-Host "✅ Arquivo webhook encontrado: $webhookFile" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo webhook não encontrado: $webhookFile" -ForegroundColor Red
    Write-Host "📁 Conteúdo do diretório atual:" -ForegroundColor Yellow
    ls
    return
}

# Iniciar o webhook corrigido
Write-Host "🚀 Iniciando webhook corrigido..." -ForegroundColor Green
Write-Host "📝 Executando: node $webhookFile" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

# Iniciar o webhook
node $webhookFile 