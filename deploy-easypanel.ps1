# 🚀 Deploy do Servidor Webhook Evolution API - EasyPanel (PowerShell)
# Este script configura o servidor webhook no EasyPanel

Write-Host "🚀 Iniciando deploy do servidor webhook no EasyPanel..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "webhook-evolution-complete.js")) {
    Write-Host "❌ Erro: arquivo webhook-evolution-complete.js não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script no diretório raiz do projeto" -ForegroundColor Yellow
    exit 1
}

# Verificar se o arquivo de configuração existe
if (-not (Test-Path "webhook.env")) {
    Write-Host "❌ Erro: arquivo webhook.env não encontrado!" -ForegroundColor Red
    Write-Host "Configure as variáveis de ambiente primeiro" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivos necessários encontrados" -ForegroundColor Green

# Criar docker-compose para EasyPanel
if (-not (Test-Path "docker-compose.webhook.yml")) {
    Write-Host "📝 Criando docker-compose.webhook.yml..." -ForegroundColor Blue
    
    $dockerCompose = @"
version: '3.8'

services:
  evolution-webhook:
    build:
      context: .
      dockerfile: Dockerfile.webhook
    container_name: evolution-webhook
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - webhook.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.evolution-webhook.rule=Host(\`bkcrm.devsible.com.br\`) && PathPrefix(\`/webhook\`)"
      - "traefik.http.services.evolution-webhook.loadbalancer.server.port=4000"
      - "traefik.http.routers.evolution-webhook.tls.certresolver=letsencrypt"
"@
    
    $dockerCompose | Out-File -FilePath "docker-compose.webhook.yml" -Encoding utf8
    Write-Host "✅ docker-compose.webhook.yml criado" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Arquivos de deploy criados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Fazer upload dos arquivos para o seu VPS/EasyPanel" -ForegroundColor White
Write-Host "2. No EasyPanel, criar nova aplicação" -ForegroundColor White
Write-Host "3. Configurar variáveis de ambiente" -ForegroundColor White
Write-Host "4. Fazer deploy" -ForegroundColor White
Write-Host ""
Write-Host "📁 Arquivos necessários para upload:" -ForegroundColor Yellow
Write-Host "  - webhook-evolution-complete.js" -ForegroundColor White
Write-Host "  - Dockerfile.webhook" -ForegroundColor White
Write-Host "  - webhook.env" -ForegroundColor White
Write-Host "  - package.json" -ForegroundColor White
Write-Host "  - docker-compose.webhook.yml" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URL final: https://bkcrm.devsible.com.br/webhook/evolution" -ForegroundColor Cyan 