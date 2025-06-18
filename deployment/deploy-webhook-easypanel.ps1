Write-Host "🚀 Iniciando deploy do webhook no EasyPanel..."

# Verificar se os arquivos necessários existem
if (-not (Test-Path "webhook-evolution-complete-corrigido.cjs")) {
    Write-Host "❌ Erro: arquivo webhook-evolution-complete-corrigido.cjs não encontrado"
    exit 1
}

if (-not (Test-Path "Dockerfile.webhook")) {
    Write-Host "❌ Erro: arquivo Dockerfile.webhook não encontrado"
    exit 1
}

if (-not (Test-Path "webhook.env")) {
    Write-Host "❌ Erro: arquivo webhook.env não encontrado"
    exit 1
}

# Criar diretório temporário para deploy
$DEPLOY_DIR = "deploy-webhook-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $DEPLOY_DIR | Out-Null

Write-Host "📁 Copiando arquivos para pasta de deploy..."

# Copiar arquivos necessários
Copy-Item "webhook-evolution-complete-corrigido.cjs" -Destination "$DEPLOY_DIR/"
Copy-Item "Dockerfile.webhook" -Destination "$DEPLOY_DIR/Dockerfile"
Copy-Item "webhook.env" -Destination "$DEPLOY_DIR/.env"
Copy-Item "package.json" -Destination "$DEPLOY_DIR/"
Copy-Item "package-lock.json" -Destination "$DEPLOY_DIR/"

# Gerar arquivo de configuração do EasyPanel
$easypanelConfig = @{
    name = "evolution-webhook"
    type = "app"
    source = @{
        type = "dockerfile"
        dockerfile = "Dockerfile"
    }
    domains = @(
        @{
            host = "bkcrm.devsible.com.br"
            path = "/webhook"
            port = 4000
            https = $true
        }
    )
    healthcheck = @{
        path = "/health"
        port = 4000
        interval = 30
        timeout = 10
        retries = 3
    }
} | ConvertTo-Json -Depth 10

Set-Content -Path "$DEPLOY_DIR/easypanel.json" -Value $easypanelConfig

Write-Host "✅ Arquivos preparados em $DEPLOY_DIR"
Write-Host ""
Write-Host "📝 Instruções:"
Write-Host "1. Faça upload da pasta $DEPLOY_DIR para o EasyPanel"
Write-Host "2. No EasyPanel, vá em Apps > evolution-webhook"
Write-Host "3. Clique em Deploy para atualizar"
Write-Host "4. Aguarde o health check ficar verde"
Write-Host ""
Write-Host "🔍 Para verificar logs:"
Write-Host "1. No EasyPanel, vá em Apps > evolution-webhook > Logs"
Write-Host "2. Verifique se não há erros"
Write-Host ""
Write-Host "✨ Deploy preparado com sucesso!" 