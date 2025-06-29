# Script simples de deploy para EasyPanel v2.0
Write-Host "Gerando pacote de deploy EasyPanel v2.0..." -ForegroundColor Green

$zipName = "bkcrm-websocket-unified-v2.zip"

# Verificar arquivos essenciais
$requiredFiles = @(
    "webhook-evolution-websocket.js",
    "package.json", 
    "Dockerfile",
    "webhook.env"
)

Write-Host "Verificando arquivos essenciais..." -ForegroundColor Yellow
$allFilesFound = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  ERRO: $file - ARQUIVO FALTANDO!" -ForegroundColor Red
        $allFilesFound = $false
    }
}

if (-not $allFilesFound) {
    Write-Host "Erro: Arquivos essenciais estao faltando!" -ForegroundColor Red
    exit 1
}

# Remover ZIP anterior se existir
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "Removido ZIP anterior" -ForegroundColor Gray
}

# Criar ZIP com arquivos essenciais
Write-Host "Criando pacote ZIP..." -ForegroundColor Yellow

$filesToZip = @(
    "webhook-evolution-websocket.js",
    "package.json",
    "Dockerfile", 
    "webhook.env"
)

# Adicionar package-lock.json se existir
if (Test-Path "package-lock.json") {
    $filesToZip += "package-lock.json"
    Write-Host "  Incluindo package-lock.json" -ForegroundColor Green
}

# Criar ZIP
Compress-Archive -Path $filesToZip -DestinationPath $zipName -Force

# Verificar tamanho do ZIP
$zipSize = [math]::Round((Get-Item $zipName).Length / 1KB, 2)
Write-Host "Pacote criado: $zipName ($zipSize KB)" -ForegroundColor Green

# Exibir instruções finais
Write-Host ""
Write-Host "PACOTE DE DEPLOY PRONTO!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Arquivo: $zipName" -ForegroundColor White
Write-Host "Tamanho: $zipSize KB" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Faca upload do ZIP no EasyPanel" -ForegroundColor White
Write-Host "2. Configure as variaveis de ambiente:" -ForegroundColor White
Write-Host "   PORT=4000" -ForegroundColor Gray
Write-Host "   SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co" -ForegroundColor Gray
Write-Host "   SUPABASE_ANON_KEY=[sua_key]" -ForegroundColor Gray
Write-Host "   EVOLUTION_API_URL=https://evochat.devsible.com.br/" -ForegroundColor Gray
Write-Host "   EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11" -ForegroundColor Gray
Write-Host "   NODE_ENV=production" -ForegroundColor Gray
Write-Host "3. Configure dominio: ws.bkcrm.devsible.com.br" -ForegroundColor White
Write-Host "4. Faca deploy e aguarde container inicializar" -ForegroundColor White
Write-Host "5. Teste: https://ws.bkcrm.devsible.com.br/webhook/health" -ForegroundColor White
Write-Host ""
Write-Host "ENDPOINTS DISPONIVEIS:" -ForegroundColor Yellow
Write-Host "  POST /webhook/evolution (webhook principal)" -ForegroundColor Gray
Write-Host "  POST /connection-update (resolve erro 404)" -ForegroundColor Gray
Write-Host "  GET /webhook/health (health check)" -ForegroundColor Gray
Write-Host "  GET /webhook/ws-stats (estatisticas)" -ForegroundColor Gray
Write-Host "  WebSocket: ws://ws.bkcrm.devsible.com.br" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan 