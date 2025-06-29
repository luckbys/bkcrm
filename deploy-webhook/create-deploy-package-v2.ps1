# ==========================================
# 🚀 SCRIPT DE DEPLOY EASYPANEL V2.0
# ==========================================
# Gera pacote completo para deploy do Servidor Webhook + WebSocket Unificado

Write-Host "🚀 Gerando pacote de deploy EasyPanel v2.0..." -ForegroundColor Green

# Definir diretórios
$projectRoot = ".."
$deployDir = "."
$zipName = "bkcrm-websocket-unified-v2.zip"

# Verificar arquivos essenciais
$requiredFiles = @(
    "webhook-evolution-websocket.js",
    "package.json", 
    "Dockerfile",
    "webhook.env"
)

Write-Host "📋 Verificando arquivos essenciais..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - ARQUIVO FALTANDO!" -ForegroundColor Red
        exit 1
    }
}

# Criar arquivo temporário com versão e timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$versionInfo = @"
# BKCRM WebSocket + Webhook Unified Server v2.0
# Deploy gerado em: $timestamp
# Funcionalidades:
# - Webhook Evolution API completo
# - WebSocket Server em tempo real  
# - Processamento de mensagens unificado
# - Endpoint /connection-update (resolve erro 404)
# - Health check e estatísticas
# - Integração Supabase completa
"@

$versionInfo | Out-File -FilePath "VERSION.txt" -Encoding UTF8

# Criar conteúdo do easypanel config
$easypanelContent = @{
    name = "bkcrm-websocket-unified"
    type = "app"
    settings = @{
        source = @{
            type = "docker"
        }
        build = @{
            dockerfile = "./Dockerfile"
        }
        deploy = @{
            replicas = 1
            strategy = "recreate"
            restartPolicy = "always"
        }
        domains = @(
            @{
                host = "websocket.bkcrm.devsible.com.br"
                port = 4000
                https = $true
            }
        )
        env = @(
            @{
                name = "PORT"
                value = "4000"
            }
            @{
                name = "NODE_ENV"
                value = "production"
            }
        )
        mounts = @()
        healthCheck = @{
            command = @("curl", "-f", "http://localhost:4000/webhook/health")
            interval = 30
            timeout = 10
            retries = 3
            startPeriod = 10
        }
    }
}

# Converter para JSON e salvar
$easypanelContent | ConvertTo-Json -Depth 10 | Out-File -FilePath "easypanel-config.json" -Encoding UTF8

# Remover ZIP anterior se existir
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "🗑️ Removido ZIP anterior" -ForegroundColor Gray
}

# Criar ZIP com arquivos essenciais
Write-Host "📦 Criando pacote ZIP..." -ForegroundColor Yellow

$filesToZip = @(
    "webhook-evolution-websocket.js",
    "package.json",
    "Dockerfile", 
    "webhook.env",
    "VERSION.txt",
    "easypanel-config.json"
)

# Adicionar package-lock.json se existir (para builds mais rápidos)
if (Test-Path "package-lock.json") {
    $filesToZip += "package-lock.json"
    Write-Host "   ✅ Incluindo package-lock.json para build otimizado" -ForegroundColor Green
}

# Criar ZIP
Compress-Archive -Path $filesToZip -DestinationPath $zipName -Force

# Verificar tamanho do ZIP
$zipSize = [math]::Round((Get-Item $zipName).Length / 1KB, 2)
Write-Host "📦 Pacote criado: $zipName ($zipSize KB)" -ForegroundColor Green

# Limpar arquivos temporários
Remove-Item "VERSION.txt" -Force
Remove-Item "easypanel-config.json" -Force

# Exibir instruções finais
Write-Host ""
Write-Host "🎉 PACOTE DE DEPLOY PRONTO!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "📁 Arquivo: $zipName" -ForegroundColor White
Write-Host "📊 Tamanho: $zipSize KB" -ForegroundColor White
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. 🔄 Faça upload do ZIP no EasyPanel" -ForegroundColor White
Write-Host "2. ⚙️ Configure as variáveis de ambiente do webhook.env" -ForegroundColor White
Write-Host "3. 🌐 Configure domínio: ws.bkcrm.devsible.com.br" -ForegroundColor White
Write-Host "4. 🚀 Faça deploy e aguarde container inicializar" -ForegroundColor White
Write-Host "5. ✅ Teste: https://websocket.bkcrm.devsible.com.br/webhook/health" -ForegroundColor White
Write-Host ""
Write-Host "⚡ ENDPOINTS DISPONÍVEIS:" -ForegroundColor Yellow
Write-Host "   📥 POST /webhook/evolution (webhook principal)" -ForegroundColor Gray
Write-Host "   🔗 POST /connection-update (resolve erro 404)" -ForegroundColor Gray
Write-Host "   🏥 GET /webhook/health (health check)" -ForegroundColor Gray
Write-Host "   📊 GET /webhook/ws-stats (estatísticas)" -ForegroundColor Gray
Write-Host "   🔌 WebSocket: ws://dominio:4000" -ForegroundColor Gray
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan 