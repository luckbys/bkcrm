#!/bin/bash

# Script de Deploy do Servidor WebSocket BKCRM
# Versão: 1.0.0

set -e

echo "🚀 Iniciando deploy do Servidor WebSocket BKCRM..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se arquivo webhook.env existe
if [ ! -f "webhook.env" ]; then
    print_warning "Arquivo webhook.env não encontrado. Criando arquivo de exemplo..."
    cat > webhook.env << EOF
# Configurações do Servidor WebSocket
NODE_ENV=production
PORT=4000
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
EOF
    print_warning "Por favor, configure o arquivo webhook.env com suas credenciais."
fi

# Parar containers existentes
print_status "Parando containers existentes..."
docker-compose down --remove-orphans || true

# Limpar imagens antigas (opcional)
if [ "$1" = "--clean" ]; then
    print_status "Limpando imagens antigas..."
    docker system prune -f
    docker image prune -f
fi

# Build da nova imagem
print_status "Construindo nova imagem Docker..."
docker-compose build --no-cache

# Iniciar o serviço
print_status "Iniciando servidor WebSocket..."
docker-compose up -d

# Aguardar o serviço ficar pronto
print_status "Aguardando servidor ficar pronto..."
sleep 10

# Verificar se o serviço está rodando
if curl -f http://localhost:4000/health &> /dev/null; then
    print_success "✅ Servidor WebSocket está rodando com sucesso!"
    print_success "🌐 URL: http://localhost:4000"
    print_success "❤️  Health Check: http://localhost:4000/health"
else
    print_error "❌ Falha ao iniciar o servidor. Verificando logs..."
    docker-compose logs
    exit 1
fi

# Mostrar logs em tempo real (opcional)
if [ "$1" = "--logs" ]; then
    print_status "Mostrando logs em tempo real (Ctrl+C para sair)..."
    docker-compose logs -f
fi

print_success "🎉 Deploy concluído com sucesso!"
print_status "Para ver os logs: docker-compose logs -f"
print_status "Para parar o servidor: docker-compose down" 