# Script de Deploy do Servidor WebSocket BKCRM - PowerShell
# Versão: 1.0.0

param(
    [switch]$Clean,
    [switch]$Logs
)

Write-Host "🚀 Iniciando deploy do Servidor WebSocket BKCRM..." -ForegroundColor Cyan

# Funções para output colorido
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    # Verificar se Docker está instalado
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker não está instalado. Por favor, instale o Docker Desktop primeiro."
        exit 1
    }

    # Verificar se Docker Compose está disponível
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    }

    # Verificar se arquivo webhook.env existe
    if (!(Test-Path "webhook.env")) {
        Write-Warning "Arquivo webhook.env não encontrado. Criando arquivo de exemplo..."
        
        $envContent = @"
# Configurações do Servidor WebSocket
NODE_ENV=production
PORT=4000
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
"@
        
        $envContent | Out-File -FilePath "webhook.env" -Encoding UTF8
        Write-Warning "Por favor, configure o arquivo webhook.env com suas credenciais."
    }

    # Parar containers existentes
    Write-Status "Parando containers existentes..."
    docker-compose down --remove-orphans 2>$null

    # Limpar imagens antigas (se solicitado)
    if ($Clean) {
        Write-Status "Limpando imagens antigas..."
        docker system prune -f
        docker image prune -f
    }

    # Build da nova imagem
    Write-Status "Construindo nova imagem Docker..."
    docker-compose build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao construir a imagem Docker"
    }

    # Iniciar o serviço
    Write-Status "Iniciando servidor WebSocket..."
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao iniciar o container"
    }

    # Aguardar o serviço ficar pronto
    Write-Status "Aguardando servidor ficar pronto..."
    Start-Sleep -Seconds 10

    # Verificar se o serviço está rodando
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Servidor WebSocket está rodando com sucesso!"
            Write-Success "🌐 URL: http://localhost:4000"
            Write-Success "❤️  Health Check: http://localhost:4000/health"
        }
    }
    catch {
        Write-Error "❌ Falha ao conectar com o servidor. Verificando logs..."
        docker-compose logs
        exit 1
    }

    # Mostrar logs em tempo real (se solicitado)
    if ($Logs) {
        Write-Status "Mostrando logs em tempo real (Ctrl+C para sair)..."
        docker-compose logs -f
    }

    Write-Success "🎉 Deploy concluído com sucesso!"
    Write-Status "Para ver os logs: docker-compose logs -f"
    Write-Status "Para parar o servidor: docker-compose down"
}
catch {
    Write-Error "Erro durante o deploy: $($_.Exception.Message)"
    Write-Status "Verificando logs do container..."
    docker-compose logs
    exit 1
} 