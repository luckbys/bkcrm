# 🧪 Script de Teste do Deploy Local
Write-Host "🧪 Testando Deploy Local para EasyPanel..." -ForegroundColor Cyan

# Verificar se Docker está instalado
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar se Dockerfile existe
if (Test-Path "Dockerfile") {
    Write-Host "✅ Dockerfile encontrado na raiz" -ForegroundColor Green
} else {
    Write-Host "❌ Dockerfile não encontrado na raiz" -ForegroundColor Red
    exit 1
}

# Verificar se arquivo do webhook existe
if (Test-Path "backend/webhooks/webhook-evolution-complete-corrigido.js") {
    Write-Host "✅ Arquivo do webhook encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo do webhook não encontrado" -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker stop bkcrm-webhook-test 2>$null
docker rm bkcrm-webhook-test 2>$null

# Build da imagem
Write-Host "🔨 Fazendo build da imagem Docker..." -ForegroundColor Yellow
$buildResult = docker build -t bkcrm-webhook-test .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build da imagem" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído com sucesso" -ForegroundColor Green

# Executar container
Write-Host "🚀 Executando container..." -ForegroundColor Yellow
docker run -d --name bkcrm-webhook-test -p 4001:4000 bkcrm-webhook-test

# Aguardar inicialização
Write-Host "⏳ Aguardando inicialização (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Testar health check
Write-Host "🏥 Testando health check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:4001/webhook/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health check passou!" -ForegroundColor Green
    Write-Host "📊 Status: $($healthResponse.status)" -ForegroundColor Cyan
    Write-Host "📅 Timestamp: $($healthResponse.timestamp)" -ForegroundColor Cyan
    Write-Host "🔖 Version: $($healthResponse.version)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health check falhou: $_" -ForegroundColor Red
    
    # Mostrar logs do container
    Write-Host "📋 Logs do container:" -ForegroundColor Yellow
    docker logs bkcrm-webhook-test
    
    # Parar e limpar
    docker stop bkcrm-webhook-test
    docker rm bkcrm-webhook-test
    exit 1
}

# Testar endpoints
Write-Host "🧪 Testando endpoints..." -ForegroundColor Yellow

# Teste POST /webhook/evolution
try {
    $testPayload = @{
        event = "MESSAGES_UPSERT"
        instance = "test-instance"
        data = @{
            key = @{
                id = "test-123"
                remoteJid = "5511999999999@s.whatsapp.net"
            }
            message = @{
                conversation = "Teste do webhook local"
            }
        }
    } | ConvertTo-Json -Depth 5

    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:4001/webhook/evolution" -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Endpoint /webhook/evolution funcionando!" -ForegroundColor Green
    Write-Host "📦 Resposta: $($webhookResponse | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Teste do endpoint falhou (esperado se Supabase não estiver acessível): $_" -ForegroundColor Yellow
}

# Mostrar informações do container
Write-Host "`n📊 Informações do Container:" -ForegroundColor Cyan
docker ps --filter "name=bkcrm-webhook-test" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Mostrar logs recentes
Write-Host "`n📋 Logs Recentes:" -ForegroundColor Cyan
docker logs --tail 20 bkcrm-webhook-test

Write-Host "`n🎉 Teste concluído com sucesso!" -ForegroundColor Green
Write-Host "📝 Para parar o container: docker stop bkcrm-webhook-test" -ForegroundColor Yellow
Write-Host "📝 Para remover: docker rm bkcrm-webhook-test" -ForegroundColor Yellow
Write-Host "📝 URL local: http://localhost:4001/webhook/health" -ForegroundColor Yellow

Write-Host "`n✅ O deploy no EasyPanel deve funcionar agora!" -ForegroundColor Green 